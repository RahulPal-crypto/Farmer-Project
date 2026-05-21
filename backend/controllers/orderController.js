const mongoose = require("mongoose");

const Order = require("../models/Order");
const Product = require("../models/Product");
const Review = require("../models/Review");
const asyncHandler = require("../middleware/asyncHandler");
const { createNotification } = require("../utils/notificationHelper");
const { emitToUser } = require("../socket");

const createError = (statusCode, message) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
};

const createOrderFromItems = async ({ items, customerId, paymentStatus = "pending", paymentMethod = "cod", paymentId = null }) => {
  if (!Array.isArray(items) || items.length === 0) {
    throw createError(400, "Order items are required");
  }

  const normalizedItems = [];
  let totalPrice = 0;
  let farmerId = null;
  const productsToUpdate = [];

  for (const item of items) {
    if (!item.productId || !item.quantity) {
      throw createError(400, "Each item must include productId and quantity");
    }

    if (!mongoose.Types.ObjectId.isValid(item.productId)) {
      throw createError(400, "Invalid product id found in order items");
    }

    const product = await Product.findById(item.productId);

    if (!product) {
      throw createError(404, "One of the selected products was not found");
    }

    const requestedQuantity = Number(item.quantity);

    if (Number.isNaN(requestedQuantity) || requestedQuantity <= 0) {
      throw createError(400, "Item quantity must be a positive number");
    }

    if (product.quantity < requestedQuantity) {
      throw createError(400, `Insufficient quantity for product: ${product.name}`);
    }

    if (!farmerId) {
      farmerId = product.farmer.toString();
    } else if (farmerId !== product.farmer.toString()) {
      throw createError(400, "All ordered products must belong to the same farmer");
    }

    normalizedItems.push({
      product: product._id,
      name: product.name,
      quantity: requestedQuantity,
      price: product.price,
    });

    productsToUpdate.push({ product, requestedQuantity });
    totalPrice += product.price * requestedQuantity;
  }

  for (const entry of productsToUpdate) {
    entry.product.quantity -= entry.requestedQuantity;
    await entry.product.save();
  }

  const order = await Order.create({
    customer: customerId,
    farmer: farmerId,
    items: normalizedItems,
    totalPrice,
    status: "pending",
    paymentStatus,
    paymentMethod,
    payment: paymentId,
  });

  return {
    order,
    farmerId,
    itemCount: normalizedItems.length,
  };
};

const createOrder = asyncHandler(async (req, res) => {
  const { order, farmerId, itemCount } = await createOrderFromItems({
    items: req.body.items,
    customerId: req.user._id,
  });

  const farmerNotification = await createNotification({
    user: farmerId,
    type: "order",
    title: "New order placed",
    message: `You received a new order with ${itemCount} item(s).`,
    metadata: {
      orderId: order._id,
      customerId: req.user._id,
    },
  });

  emitToUser(farmerId, "notification:new", farmerNotification);

  res.status(201).json({
    message: "Order created successfully",
    order,
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

  order.status = status;
  await order.save();

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
    .populate("farmer", "storeName email phone")
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
    .populate("customer", "storeName email phone")
    .sort({ createdAt: -1 });

  res.json({
    total: orders.length,
    orders,
  });
});

module.exports = {
  createOrder,
  createOrderFromItems,
  getMyOrders,
  getReceivedOrders,
  updateOrderStatus,
};
