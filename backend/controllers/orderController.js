const mongoose = require("mongoose");

const Order = require("../models/Order");
const Product = require("../models/Product");
const Review = require("../models/Review");
const User = require("../models/User");
const asyncHandler = require("../middleware/asyncHandler");
const { createNotification } = require("../utils/notificationHelper");
const { emitToUser } = require("../socket");
const {
  sendFarmerOrderAlert,
  sendCustomerOrderPlacedAlert,
  sendCustomerOrderStatusAlert,
} = require("../services/whatsappService");
const {
  sendCustomerOrderPlacedEmail,
  sendFarmerNewOrderEmail,
  sendCustomerOrderStatusEmail,
} = require("../services/emailService");

const createError = (statusCode, message) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
};

const createOrdersFromItems = async ({
  items,
  customerId,
  paymentStatus = "pending",
  paymentMethod = "cod",
  paymentId = null,
  deliveryAddress = {},
}) => {
  if (!Array.isArray(items) || items.length === 0) {
    throw createError(400, "Order items are required");
  }

  // Validate all items first
  const validatedEntries = [];
  for (const item of items) {
    if (!item.productId || !item.quantity) {
      throw createError(400, "Each item must include productId and quantity");
    }

    if (!mongoose.Types.ObjectId.isValid(item.productId)) {
      throw createError(400, "Invalid product id found in order items");
    }

    const product = await Product.findById(item.productId);

    if (!product || !product.isActive) {
      throw createError(404, "One of the selected products was not found or is inactive");
    }

    const requestedQuantity = Number(item.quantity);

    if (Number.isNaN(requestedQuantity) || requestedQuantity <= 0) {
      throw createError(400, "Item quantity must be a positive number");
    }

    if (product.quantity < requestedQuantity) {
      throw createError(400, `Insufficient quantity for product: ${product.name}`);
    }

    validatedEntries.push({
      product,
      farmerId: product.farmer.toString(),
      requestedQuantity,
    });
  }

  // Atomically decrement stock with automatic rollback
  const successfullyDeducted = [];
  try {
    for (const entry of validatedEntries) {
      const updated = await Product.findOneAndUpdate(
        { _id: entry.product._id, quantity: { $gte: entry.requestedQuantity } },
        { $inc: { quantity: -entry.requestedQuantity } },
        { new: true }
      );

      if (!updated) {
        throw createError(400, `Insufficient stock for product: ${entry.product.name}`);
      }

      successfullyDeducted.push({ productId: entry.product._id, quantity: entry.requestedQuantity });
    }
  } catch (deductError) {
    // Rollback any successfully decremented items
    for (const item of successfullyDeducted) {
      await Product.findByIdAndUpdate(item.productId, { $inc: { quantity: item.quantity } });
    }
    throw deductError;
  }

  // Group items by farmer for seamless multi-vendor order placement
  const farmerGroups = new Map();
  for (const entry of validatedEntries) {
    if (!farmerGroups.has(entry.farmerId)) {
      farmerGroups.set(entry.farmerId, []);
    }
    farmerGroups.get(entry.farmerId).push({
      product: entry.product._id,
      name: entry.product.name,
      quantity: entry.requestedQuantity,
      price: entry.product.price,
    });
  }

  const createdOrders = [];
  for (const [farmerId, farmerItems] of farmerGroups.entries()) {
    const totalPrice = farmerItems.reduce((sum, item) => sum + item.price * item.quantity, 0);

    const order = await Order.create({
      customer: customerId,
      farmer: farmerId,
      items: farmerItems,
      totalPrice,
      deliveryAddress: {
        street: deliveryAddress.street || "",
        city: deliveryAddress.city || "",
        pincode: deliveryAddress.pincode || "",
        notes: deliveryAddress.notes || "",
        contactPhone: deliveryAddress.contactPhone || "",
        whatsappPhone: deliveryAddress.whatsappPhone || "",
        deliverySlot: deliveryAddress.deliverySlot || "Standard Any-Time (Within 24 Hours)",
      },
      status: "pending",
      paymentStatus,
      paymentMethod,
      payment: paymentId,
    });

    createdOrders.push(order);
  }

  return {
    orders: createdOrders,
    order: createdOrders[0],
    farmerId: createdOrders[0]?.farmer?.toString(),
    itemCount: validatedEntries.length,
  };
};

// Alias for backward compatibility
const createOrderFromItems = createOrdersFromItems;

const createOrder = asyncHandler(async (req, res) => {
  const { orders } = await createOrdersFromItems({
    items: req.body.items,
    customerId: req.user._id,
    deliveryAddress: req.body.deliveryAddress || {},
    paymentMethod: "cod",
  });

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
      title: "New order placed",
      message: `You received a new order with ${order.items.length} item(s).`,
      metadata: {
        orderId: order._id,
        customerId: req.user._id,
      },
    });

    emitToUser(order.farmer, "notification:new", farmerNotification);
  }

  await Order.populate(orders, { path: "farmer", select: "storeName phone whatsappPhone email" });

  res.status(201).json({
    message:
      orders.length > 1
        ? `${orders.length} orders created successfully (split by farm)`
        : "Order created successfully",
    orders,
    order: orders[0],
  });
});

const updateOrderStatus = asyncHandler(async (req, res) => {
  const { orderId, status } = req.body;

  if (!orderId || !status) {
    res.status(400);
    throw new Error("orderId and status are required");
  }

  if (!mongoose.Types.ObjectId.isValid(orderId)) {
    res.status(400);
    throw new Error("Invalid order id");
  }

  if (!["accepted", "rejected", "delivered"].includes(status)) {
    res.status(400);
    throw new Error("Status must be accepted, rejected, or delivered");
  }

  const order = await Order.findById(orderId);

  if (!order) {
    res.status(404);
    throw new Error("Order not found");
  }

  if (order.farmer.toString() !== req.user._id.toString()) {
    res.status(403);
    throw new Error("You can only update orders assigned to your farm");
  }

  if (order.status === "delivered") {
    res.status(400);
    throw new Error("Delivered orders cannot be modified");
  }

  if (order.status === "rejected") {
    res.status(400);
    throw new Error("Rejected orders cannot be modified");
  }

  // Restore inventory if farmer rejects the order
  if (status === "rejected" && order.status !== "rejected") {
    for (const item of order.items) {
      await Product.findByIdAndUpdate(item.product, {
        $inc: { quantity: item.quantity },
      });
    }
  }

  order.status = status;
  await order.save();

  // Send automated WhatsApp / SMS notification to customer about their order status update
  const customerUser = await User.findById(order.customer).select("storeName phone whatsappPhone email");
  const farmerUser = await User.findById(order.farmer).select("storeName phone whatsappPhone email");

  sendCustomerOrderStatusAlert({
    customer: customerUser,
    order,
    farmer: farmerUser,
    status,
  }).catch((err) => {
    console.warn("Failed to dispatch WhatsApp status alert to customer:", err?.message || err);
  });

  // Automated background Email alert to Customer about live order status update
  sendCustomerOrderStatusEmail({
    customer: customerUser,
    order,
    farmer: farmerUser,
    status,
  }).catch((err) => {
    console.warn("Failed to dispatch automated status update email to customer:", err?.message || err);
  });

  const customerNotification = await createNotification({
    user: order.customer,
    type: "status",
    title: "Order status updated",
    message: `Your order status is now ${status}.`,
    metadata: {
      orderId: order._id,
      status,
    },
  });

  emitToUser(order.customer, "notification:new", customerNotification);

  res.json({
    message: "Order status updated successfully",
    order,
  });
});

const getMyOrders = asyncHandler(async (req, res) => {
  const orders = await Order.find({ customer: req.user._id })
    .populate("farmer", "storeName email phone location isVerifiedFarmer")
    .sort({ createdAt: -1 });
  const reviewedOrders = await Review.find({ customer: req.user._id }).select("order");
  const reviewedOrderIds = new Set(reviewedOrders.map((review) => review.order.toString()));
  const ordersWithReviewState = orders.map((order) => {
    const orderObject = order.toObject();
    orderObject.hasReview = reviewedOrderIds.has(order._id.toString());
    return orderObject;
  });

  res.json({
    total: ordersWithReviewState.length,
    orders: ordersWithReviewState,
  });
});

const getReceivedOrders = asyncHandler(async (req, res) => {
  const orders = await Order.find({ farmer: req.user._id })
    .populate("customer", "storeName email phone location")
    .sort({ createdAt: -1 });

  res.json({
    total: orders.length,
    orders,
  });
});

module.exports = {
  createOrder,
  createOrderFromItems,
  createOrdersFromItems,
  getMyOrders,
  getReceivedOrders,
  updateOrderStatus,
};
