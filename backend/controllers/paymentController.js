const crypto = require("crypto");

const Razorpay = require("razorpay");

const Payment = require("../models/Payment");
const Product = require("../models/Product");
const asyncHandler = require("../middleware/asyncHandler");
const { createOrderFromItems } = require("./orderController");
const { createNotification } = require("../utils/notificationHelper");
const { emitToUser } = require("../socket");

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
  let farmerId = null;
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

    if (!farmerId) {
      farmerId = product.farmer.toString();
    } else if (farmerId !== product.farmer.toString()) {
      throw createError(400, "All paid products must belong to the same farmer");
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

  if (payment.status === "paid" && payment.order) {
    const existingOrder = await payment.populate("order");
    res.json({
      message: "Payment already verified",
      order: existingOrder.order,
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

  const { order, farmerId, itemCount } = await createOrderFromItems({
    items: payment.items,
    customerId: req.user._id,
    paymentStatus: "paid",
    paymentMethod: "razorpay",
    paymentId: payment._id,
  });

  payment.status = "paid";
  payment.razorpayPaymentId = razorpay_payment_id;
  payment.razorpaySignature = razorpay_signature;
  payment.order = order._id;
  await payment.save();

  const farmerNotification = await createNotification({
    user: farmerId,
    type: "order",
    title: "Paid order placed",
    message: `You received a paid order with ${itemCount} item(s).`,
    metadata: {
      orderId: order._id,
      customerId: req.user._id,
      paymentId: payment._id,
    },
  });

  emitToUser(farmerId, "notification:new", farmerNotification);

  res.json({
    message: "Payment verified and order created successfully",
    order,
  });
});

module.exports = {
  createRazorpayOrder,
  verifyRazorpayPayment,
};
