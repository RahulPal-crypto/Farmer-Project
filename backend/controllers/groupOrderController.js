const mongoose = require("mongoose");

const GroupOrder = require("../models/GroupOrder");
const Order = require("../models/Order");
const Product = require("../models/Product");
const asyncHandler = require("../middleware/asyncHandler");
const { createNotification } = require("../utils/notificationHelper");
const { emitToUser } = require("../socket");

const finalizeGroupOrder = async (groupOrderDocument) => {
  const groupOrder = await GroupOrder.findById(groupOrderDocument._id).populate("product");

  if (!groupOrder || groupOrder.status === "completed") {
    return groupOrder;
  }

  const product = await Product.findById(groupOrder.product._id);

  if (!product) {
    throw new Error("Group order product not found");
  }

  if (product.quantity < groupOrder.totalJoinedQuantity) {
    throw new Error("Insufficient product quantity to complete this group order");
  }

  const discountedUnitPrice =
    product.price - product.price * (groupOrder.discountPercent / 100);

  for (const participant of groupOrder.participants) {
    await Order.create({
      customer: participant.customer,
      farmer: groupOrder.farmer,
      items: [
        {
          product: product._id,
          name: product.name,
          quantity: participant.quantity,
          price: product.price,
        },
      ],
      totalPrice: product.price * participant.quantity,
      discountedTotalPrice: Number((discountedUnitPrice * participant.quantity).toFixed(2)),
      status: "pending",
      source: "group-buy",
      groupOrder: groupOrder._id,
    });

    const notification = await createNotification({
      user: participant.customer,
      type: "group-order",
      title: "Group order threshold reached",
      message: `Your group order for ${product.name} has reached the discount threshold.`,
      metadata: {
        groupOrderId: groupOrder._id,
        productId: product._id,
      },
    });

    emitToUser(participant.customer, "notification:new", notification);
  }

  product.quantity -= groupOrder.totalJoinedQuantity;
  await product.save();

  groupOrder.status = "completed";
  await groupOrder.save();

  const farmerNotification = await createNotification({
    user: groupOrder.farmer,
    type: "group-order",
    title: "Group order completed",
    message: `A group order for ${product.name} reached its threshold and has been converted into orders.`,
    metadata: {
      groupOrderId: groupOrder._id,
      productId: product._id,
    },
  });

  emitToUser(groupOrder.farmer, "notification:new", farmerNotification);

  return groupOrder;
};

const createGroupOrder = asyncHandler(async (req, res) => {
  const { productId, targetQuantity, discountPercent, closesAt, quantity = 1 } = req.body;

  if (!productId || !targetQuantity || !discountPercent || !closesAt) {
    res.status(400);
    throw new Error("productId, targetQuantity, discountPercent, and closesAt are required");
  }

  if (!mongoose.Types.ObjectId.isValid(productId)) {
    res.status(400);
    throw new Error("Invalid product id");
  }

  const product = await Product.findById(productId);

  if (!product || !product.isActive) {
    res.status(404);
    throw new Error("Product not found");
  }

  const requestedQuantity = Number(quantity);
  const parsedTargetQuantity = Number(targetQuantity);
  const parsedDiscountPercent = Number(discountPercent);
  const closingDate = new Date(closesAt);

  if (Number.isNaN(requestedQuantity) || requestedQuantity < 1) {
    res.status(400);
    throw new Error("Initial quantity must be at least 1");
  }

  if (Number.isNaN(parsedTargetQuantity) || parsedTargetQuantity < 2) {
    res.status(400);
    throw new Error("Target quantity must be at least 2");
  }

  if (Number.isNaN(parsedDiscountPercent) || parsedDiscountPercent <= 0 || parsedDiscountPercent > 100) {
    res.status(400);
    throw new Error("Discount percent must be between 1 and 100");
  }

  if (Number.isNaN(closingDate.getTime()) || closingDate <= new Date()) {
    res.status(400);
    throw new Error("closesAt must be a future date");
  }

  const groupOrder = await GroupOrder.create({
    product: product._id,
    farmer: product.farmer,
    targetQuantity: parsedTargetQuantity,
    discountPercent: parsedDiscountPercent,
    closesAt: closingDate,
    participants: [
      {
        customer: req.user._id,
        quantity: requestedQuantity,
      },
    ],
    totalJoinedQuantity: requestedQuantity,
    status: requestedQuantity >= parsedTargetQuantity ? "threshold-met" : "open",
  });

  if (groupOrder.status === "threshold-met") {
    await finalizeGroupOrder(groupOrder);
  }

  res.status(201).json({
    message: "Group order created successfully",
    groupOrder,
  });
});

const joinGroupOrder = asyncHandler(async (req, res) => {
  const { groupOrderId } = req.params;
  const { quantity } = req.body;

  if (!mongoose.Types.ObjectId.isValid(groupOrderId)) {
    res.status(400);
    throw new Error("Invalid group order id");
  }

  const requestedQuantity = Number(quantity);

  if (Number.isNaN(requestedQuantity) || requestedQuantity < 1) {
    res.status(400);
    throw new Error("Quantity must be at least 1");
  }

  const groupOrder = await GroupOrder.findById(groupOrderId).populate("product");

  if (!groupOrder) {
    res.status(404);
    throw new Error("Group order not found");
  }

  if (groupOrder.status !== "open" && groupOrder.status !== "threshold-met") {
    res.status(400);
    throw new Error("This group order is no longer joinable");
  }

  if (groupOrder.closesAt <= new Date()) {
    res.status(400);
    throw new Error("This group order has already closed");
  }

  const existingParticipant = groupOrder.participants.find(
    (participant) => participant.customer.toString() === req.user._id.toString()
  );

  if (existingParticipant) {
    existingParticipant.quantity += requestedQuantity;
  } else {
    groupOrder.participants.push({
      customer: req.user._id,
      quantity: requestedQuantity,
    });
  }

  groupOrder.totalJoinedQuantity += requestedQuantity;

  if (groupOrder.totalJoinedQuantity >= groupOrder.targetQuantity) {
    groupOrder.status = "threshold-met";
  }

  await groupOrder.save();

  if (groupOrder.status === "threshold-met") {
    await finalizeGroupOrder(groupOrder);
  }

  res.json({
    message: "Joined group order successfully",
    groupOrder,
  });
});

const listGroupOrders = asyncHandler(async (req, res) => {
  const groupOrders = await GroupOrder.find({ status: { $in: ["open", "threshold-met"] } })
    .populate("product", "name price image category")
    .populate("farmer", "storeName")
    .sort({ createdAt: -1 });

  res.json({
    total: groupOrders.length,
    groupOrders,
  });
});

module.exports = {
  createGroupOrder,
  joinGroupOrder,
  listGroupOrders,
};
