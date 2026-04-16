const mongoose = require("mongoose");

const Order = require("../models/Order");
const Product = require("../models/Product");
const asyncHandler = require("../middleware/asyncHandler");
const { createNotification } = require("../utils/notificationHelper");
const { emitToUser } = require("../socket");

const createOrder = asyncHandler(async (req, res) => {
  const { items } = req.body;

  if (!Array.isArray(items) || items.length === 0) {
    res.status(400);
    throw new Error("Order items are required");
  }

  const normalizedItems = [];
  let totalPrice = 0;
  let farmerId = null;
  const productsToUpdate = [];

  for (const item of items) {
    if (!item.productId || !item.quantity) {
      res.status(400);
      throw new Error("Each item must include productId and quantity");
    }

    if (!mongoose.Types.ObjectId.isValid(item.productId)) {
      res.status(400);
      throw new Error("Invalid product id found in order items");
    }

    const product = await Product.findById(item.productId);

    if (!product) {
      res.status(404);
      throw new Error("One of the selected products was not found");
    }

    const requestedQuantity = Number(item.quantity);

    if (Number.isNaN(requestedQuantity) || requestedQuantity <= 0) {
      res.status(400);
      throw new Error("Item quantity must be a positive number");
    }

    if (product.quantity < requestedQuantity) {
      res.status(400);
      throw new Error(`Insufficient quantity for product: ${product.name}`);
    }

    if (!farmerId) {
      farmerId = product.farmer.toString();
    } else if (farmerId !== product.farmer.toString()) {
      res.status(400);
      throw new Error("All ordered products must belong to the same farmer");
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
    customer: req.user._id,
    farmer: farmerId,
    items: normalizedItems,
    totalPrice,
    status: "pending",
  });

  const farmerNotification = await createNotification({
    user: farmerId,
    type: "order",
    title: "New order placed",
    message: `You received a new order with ${normalizedItems.length} item(s).`,
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

  res.json({
    total: orders.length,
    orders,
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
  getMyOrders,
  getReceivedOrders,
  updateOrderStatus,
};
