const Notification = require("../models/Notification");
const asyncHandler = require("../middleware/asyncHandler");

const getNotifications = asyncHandler(async (req, res) => {
  const page = Math.max(Number(req.query.page) || 1, 1);
  const limit = Math.min(Math.max(Number(req.query.limit) || 10, 1), 100);
  const skip = (page - 1) * limit;

  const [notifications, total] = await Promise.all([
    Notification.find({ user: req.user._id }).sort({ createdAt: -1 }).skip(skip).limit(limit),
    Notification.countDocuments({ user: req.user._id }),
  ]);

  res.json({
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit),
    notifications,
  });
});

const markNotificationRead = asyncHandler(async (req, res) => {
  const notification = await Notification.findOne({
    _id: req.params.id,
    user: req.user._id,
  });

  if (!notification) {
    res.status(404);
    throw new Error("Notification not found");
  }

  notification.isRead = true;
  await notification.save();

  res.json({
    message: "Notification marked as read",
    notification,
  });
});

module.exports = {
  getNotifications,
  markNotificationRead,
};
