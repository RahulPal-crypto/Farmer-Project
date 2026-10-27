const Subscription = require("../models/Subscription");
const User = require("../models/User");
const asyncHandler = require("../middleware/asyncHandler");
const { createNotification } = require("../utils/notificationHelper");
const { emitToUser } = require("../socket");

const createSubscription = asyncHandler(async (req, res) => {
  const {
    farmerId,
    planName,
    frequency = "weekly",
    preferredDay = "Monday",
    quantity = 1,
    pricePerDelivery,
    deliveryAddress = {},
  } = req.body;

  if (!planName || !pricePerDelivery) {
    res.status(400);
    throw new Error("Plan name and price per delivery are required");
  }

  let targetFarmerId = farmerId;
  if (!targetFarmerId) {
    // Find an active farmer if none specified
    const defaultFarmer = await User.findOne({ role: "farmer" });
    if (!defaultFarmer) {
      res.status(400);
      throw new Error("No farm available to fulfill recurring subscription");
    }
    targetFarmerId = defaultFarmer._id;
  }

  // Calculate next delivery date
  const nextDate = new Date();
  if (frequency === "daily") {
    nextDate.setDate(nextDate.getDate() + 1);
  } else if (frequency === "biweekly") {
    nextDate.setDate(nextDate.getDate() + 14);
  } else if (frequency === "monthly") {
    nextDate.setDate(nextDate.getDate() + 30);
  } else {
    // default weekly
    nextDate.setDate(nextDate.getDate() + 7);
  }

  const subscription = await Subscription.create({
    customer: req.user._id,
    farmer: targetFarmerId,
    planName,
    frequency,
    preferredDay,
    quantity: Number(quantity) || 1,
    pricePerDelivery: Number(pricePerDelivery),
    deliveryAddress: {
      street: deliveryAddress.street || "",
      city: deliveryAddress.city || "",
      pincode: deliveryAddress.pincode || "",
      notes: deliveryAddress.notes || "",
    },
    status: "active",
    nextDeliveryDate: nextDate,
  });

  const notification = await createNotification({
    user: targetFarmerId,
    type: "order",
    title: "New Farm Box Subscriber! 📦",
    message: `${req.user.storeName || "A customer"} subscribed to your ${planName} (${frequency}).`,
    metadata: {
      subscriptionId: subscription._id,
      customerId: req.user._id,
    },
  });

  emitToUser(targetFarmerId, "notification:new", notification);

  res.status(201).json({
    message: "Subscription created successfully",
    subscription,
  });
});

const getMySubscriptions = asyncHandler(async (req, res) => {
  const subscriptions = await Subscription.find({ customer: req.user._id })
    .populate("farmer", "storeName phone email isVerifiedFarmer averageRating")
    .sort({ createdAt: -1 });

  res.json({
    total: subscriptions.length,
    subscriptions,
  });
});

const getFarmerSubscriptions = asyncHandler(async (req, res) => {
  const subscriptions = await Subscription.find({ farmer: req.user._id })
    .populate("customer", "storeName phone email")
    .sort({ createdAt: -1 });

  res.json({
    total: subscriptions.length,
    subscriptions,
  });
});

const updateSubscriptionStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  if (!["active", "paused", "cancelled"].includes(status)) {
    res.status(400);
    throw new Error("Invalid status. Must be active, paused, or cancelled.");
  }

  const subscription = await Subscription.findById(id);
  if (!subscription) {
    res.status(404);
    throw new Error("Subscription not found");
  }

  const isCustomer = subscription.customer.toString() === req.user._id.toString();
  const isFarmer = subscription.farmer.toString() === req.user._id.toString();
  const isAdmin = req.user.role === "admin";

  if (!isCustomer && !isFarmer && !isAdmin) {
    res.status(403);
    throw new Error("You are not authorized to update this subscription");
  }

  subscription.status = status;
  await subscription.save();

  res.json({
    message: `Subscription successfully ${status}`,
    subscription,
  });
});

module.exports = {
  createSubscription,
  getMySubscriptions,
  getFarmerSubscriptions,
  updateSubscriptionStatus,
};

