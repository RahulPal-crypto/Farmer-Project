const mongoose = require("mongoose");

const Order = require("../models/Order");
const Review = require("../models/Review");
const User = require("../models/User");
const asyncHandler = require("../middleware/asyncHandler");
const { createNotification } = require("../utils/notificationHelper");
const { emitToUser } = require("../socket");

const updateFarmerRating = async (farmerId) => {
  const stats = await Review.aggregate([
    { $match: { farmer: new mongoose.Types.ObjectId(farmerId) } },
    {
      $group: {
        _id: "$farmer",
        averageRating: { $avg: "$rating" },
        reviewCount: { $sum: 1 },
      },
    },
  ]);

  const ratingStats = stats[0] || { averageRating: 0, reviewCount: 0 };

  await User.findByIdAndUpdate(farmerId, {
    averageRating: Number(ratingStats.averageRating.toFixed(1)),
    reviewCount: ratingStats.reviewCount,
  });
};

const addReview = asyncHandler(async (req, res) => {
  const { orderId, rating, comment = "" } = req.body;

  if (!orderId || !rating) {
    res.status(400);
    throw new Error("orderId and rating are required");
  }

  if (!mongoose.Types.ObjectId.isValid(orderId)) {
    res.status(400);
    throw new Error("Invalid order id");
  }

  const numericRating = Number(rating);

  if (Number.isNaN(numericRating) || numericRating < 1 || numericRating > 5) {
    res.status(400);
    throw new Error("Rating must be between 1 and 5");
  }

  const order = await Order.findById(orderId);

  if (!order) {
    res.status(404);
    throw new Error("Order not found");
  }

  if (order.customer.toString() !== req.user._id.toString()) {
    res.status(403);
    throw new Error("You can only review your own delivered orders");
  }

  if (order.status !== "delivered") {
    res.status(400);
    throw new Error("Review can only be added after delivery");
  }

  const review = await Review.create({
    customer: req.user._id,
    farmer: order.farmer,
    order: order._id,
    rating: numericRating,
    comment,
  });

  await updateFarmerRating(order.farmer);

  const notification = await createNotification({
    user: order.farmer,
    type: "review",
    title: "New review received",
    message: `A customer rated your farm ${numericRating}/5.`,
    metadata: {
      orderId: order._id,
      reviewId: review._id,
    },
  });

  emitToUser(order.farmer, "notification:new", notification);

  res.status(201).json({
    message: "Review added successfully",
    review,
  });
});

const getFarmerReviews = asyncHandler(async (req, res) => {
  const { farmerId } = req.params;
  const page = Math.max(Number(req.query.page) || 1, 1);
  const limit = Math.min(Math.max(Number(req.query.limit) || 10, 1), 50);
  const skip = (page - 1) * limit;

  if (!mongoose.Types.ObjectId.isValid(farmerId)) {
    res.status(400);
    throw new Error("Invalid farmer id");
  }

  const [reviews, total] = await Promise.all([
    Review.find({ farmer: farmerId })
      .populate("customer", "storeName")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    Review.countDocuments({ farmer: farmerId }),
  ]);

  res.json({
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit),
    reviews,
  });
});

module.exports = {
  addReview,
  getFarmerReviews,
};
