const mongoose = require("mongoose");

const ChatMessage = require("../models/ChatMessage");
const Order = require("../models/Order");
const asyncHandler = require("../middleware/asyncHandler");

const getChatHistory = asyncHandler(async (req, res) => {
  const { orderId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(orderId)) {
    res.status(400);
    throw new Error("Invalid order id");
  }

  const order = await Order.findById(orderId);

  if (!order) {
    res.status(404);
    throw new Error("Order not found");
  }

  const isParticipant =
    order.customer.toString() === req.user._id.toString() ||
    order.farmer.toString() === req.user._id.toString() ||
    req.user.role === "admin";

  if (!isParticipant) {
    res.status(403);
    throw new Error("You cannot access this chat");
  }

  const messages = await ChatMessage.find({ order: orderId })
    .populate("sender", "storeName role")
    .populate("receiver", "storeName role")
    .sort({ createdAt: 1 });

  res.json({
    orderId,
    count: messages.length,
    messages,
  });
});

module.exports = {
  getChatHistory,
};
