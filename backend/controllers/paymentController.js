const crypto = require("crypto");

const Razorpay = require("razorpay");

const Payment = require("../models/Payment");
const Product = require("../models/Product");
const User = require("../models/User");
const asyncHandler = require("../middleware/asyncHandler");
const { createOrderFromItems } = require("./orderController");
const { createNotification } = require("../utils/notificationHelper");
const { emitToUser } = require("../socket");
const {
  sendFarmerOrderAlert,
  sendCustomerOrderPlacedAlert,
} = require("../services/whatsappService");
const {
  sendCustomerOrderPlacedEmail,
  sendFarmerNewOrderEmail,
} = require("../services/emailService");

const createError = (statusCode, message) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
};

const getRazorpayClient = () => {
  if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
    throw createError(500, "Razorpay keys are not configured");
  }

  return new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
  });
};

const calculateCartTotal = async (items) => {
  if (!Array.isArray(items) || items.length === 0) {
    throw createError(400, "Payment items are required");
  }

  let total = 0;
  const normalizedItems = [];

  for (const item of items) {
    const product = await Product.findById(item.productId);
    const quantity = Number(item.quantity);

    if (!product || !product.isActive) {
      throw createError(404, "One of the selected products was not found");
    }

    if (Number.isNaN(quantity) || quantity <= 0) {
      throw createError(400, "Item quantity must be a positive number");
    }

    if (product.quantity < quantity) {
      throw createError(400, `Insufficient quantity for product: ${product.name}`);
    }

    normalizedItems.push({
      productId: product._id,
      quantity,
    });
    total += product.price * quantity;
  }

  return {
    amountInPaise: Math.round(total * 100),
    normalizedItems,
  };
};

const createRazorpayOrder = asyncHandler(async (req, res) => {
  const { amountInPaise, normalizedItems } = await calculateCartTotal(req.body.items);
  const razorpay = getRazorpayClient();

  const razorpayOrder = await razorpay.orders.create({
    amount: amountInPaise,
    currency: "INR",
    receipt: `fm_${Date.now()}`,
    notes: {
      customerId: req.user._id.toString(),
    },
  });

  const payment = await Payment.create({
    customer: req.user._id,
    razorpayOrderId: razorpayOrder.id,
    amount: amountInPaise,
    currency: razorpayOrder.currency,
    items: normalizedItems,
    deliveryAddress: req.body.deliveryAddress || {},
    status: "created",
  });

  res.status(201).json({
    keyId: process.env.RAZORPAY_KEY_ID,
    paymentId: payment._id,
    razorpayOrderId: razorpayOrder.id,
    amount: razorpayOrder.amount,
    currency: razorpayOrder.currency,
  });
});

const verifyRazorpayPayment = asyncHandler(async (req, res) => {
  if (!process.env.RAZORPAY_KEY_SECRET) {
    throw createError(500, "Razorpay keys are not configured");
  }

  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
    throw createError(400, "Razorpay payment details are required");
  }

  const payment = await Payment.findOne({
    customer: req.user._id,
    razorpayOrderId: razorpay_order_id,
  });

  if (!payment) {
    throw createError(404, "Payment record not found");
  }

  if (payment.status === "paid" && (payment.order || (payment.orders && payment.orders.length > 0))) {
    const existingOrder = await payment.populate("order");
    res.json({
      message: "Payment already verified",
      order: existingOrder.order,
      orders: existingOrder.orders,
    });
    return;
  }

  const expectedSignature = crypto
    .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
    .update(`${razorpay_order_id}|${razorpay_payment_id}`)
    .digest("hex");

  if (expectedSignature !== razorpay_signature) {
    payment.status = "failed";
    await payment.save();
    throw createError(400, "Payment verification failed");
  }

  let orderResult;
  try {
    orderResult = await createOrderFromItems({
      items: payment.items,
      customerId: req.user._id,
      paymentStatus: "paid",
      paymentMethod: "razorpay",
      paymentId: payment._id,
      deliveryAddress: payment.deliveryAddress || req.body.deliveryAddress || {},
    });
  } catch (orderErr) {
    payment.status = "failed";
    payment.razorpayPaymentId = razorpay_payment_id;
    payment.razorpaySignature = razorpay_signature;
    await payment.save();
    throw createError(
      400,
      `Payment received (${razorpay_payment_id}) but order creation failed: ${orderErr.message}. Marked for refund.`
    );
  }

  const { orders } = orderResult;
  payment.status = "paid";
  payment.razorpayPaymentId = razorpay_payment_id;
  payment.razorpaySignature = razorpay_signature;
  payment.order = orders[0]?._id || null;
  payment.orders = orders.map((o) => o._id);
  await payment.save();

  const customer = await User.findById(req.user._id).select("storeName phone whatsappPhone email");

  for (const order of orders) {
    const farmer = await User.findById(order.farmer).select("storeName phone whatsappPhone email");

    // 1. Send WhatsApp / SMS order notification to the farmer
    sendFarmerOrderAlert({ farmer, customer, order }).catch((err) => {
      console.warn("Failed to dispatch WhatsApp alert to farmer:", err?.message || err);
    });

    // 2. Send automated WhatsApp / SMS confirmation to the customer
    sendCustomerOrderPlacedAlert({ customer, order, farmer }).catch((err) => {
      console.warn("Failed to dispatch WhatsApp order confirmation to customer:", err?.message || err);
    });

    // 3. Send automated background email confirmation to Customer
    sendCustomerOrderPlacedEmail({ customer, order, farmer }).catch((err) => {
      console.warn("Failed to dispatch automated order email to customer:", err?.message || err);
    });

    // 4. Send automated background email alert to Farmer
    sendFarmerNewOrderEmail({ farmer, customer, order }).catch((err) => {
      console.warn("Failed to dispatch automated new order email to farmer:", err?.message || err);
    });

    const farmerNotification = await createNotification({
      user: order.farmer,
      type: "order",
      title: "Paid order placed",
      message: `You received a paid order with ${order.items.length} item(s).`,
      metadata: {
        orderId: order._id,
        customerId: req.user._id,
        paymentId: payment._id,
      },
    });

    emitToUser(order.farmer, "notification:new", farmerNotification);
    emitToUser(order.farmer, "order:new", {
      _id: order._id,
      customer: {
        storeName: req.user.storeName,
        phone: req.user.phone,
        email: req.user.email,
      },
      items: order.items,
      totalPrice: order.totalPrice,
      deliveryAddress: order.deliveryAddress,
      status: order.status,
      paymentMethod: "razorpay",
      createdAt: order.createdAt,
    });
  }

  const Order = require("../models/Order");
  await Order.populate(orders, { path: "farmer", select: "storeName phone whatsappPhone email" });

  res.json({
    message: "Payment verified and order created successfully",
    orders,
    order: orders[0],
  });
});

module.exports = {
  createRazorpayOrder,
  verifyRazorpayPayment,
};
