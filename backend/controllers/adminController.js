const mongoose = require("mongoose");

const Order = require("../models/Order");
const Product = require("../models/Product");
const User = require("../models/User");
const asyncHandler = require("../middleware/asyncHandler");
const { sendCustomerOrderPlacedEmail } = require("../services/emailService");

const getAllUsers = asyncHandler(async (req, res) => {
  const users = await User.find().select("-password").sort({ createdAt: -1 });

  res.json({
    total: users.length,
    users,
  });
});

const adminDeleteProduct = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    res.status(400);
    throw new Error("Invalid product id");
  }

  const product = await Product.findById(id);

  if (!product) {
    res.status(404);
    throw new Error("Product not found");
  }

  await product.deleteOne();

  res.json({
    message: "Product deleted by admin",
  });
});

const monitorOrders = asyncHandler(async (req, res) => {
  const orders = await Order.find()
    .populate("customer", "storeName email role")
    .populate("farmer", "storeName email role")
    .populate("groupOrder", "targetQuantity discountPercent status")
    .sort({ createdAt: -1 });

  res.json({
    total: orders.length,
    orders,
  });
});

const getFarmerVerifications = asyncHandler(async (req, res) => {
  const farmers = await User.find({ role: "farmer" })
    .select("storeName email phone location isVerifiedFarmer verificationStatus verificationDocuments verificationNotes createdAt")
    .sort({ updatedAt: -1 });

  res.json({
    total: farmers.length,
    farmers,
  });
});

const reviewFarmerVerification = asyncHandler(async (req, res) => {
  const { farmerId } = req.params;
  const { decision, notes } = req.body;

  if (!["approve", "reject"].includes(decision)) {
    res.status(400);
    throw new Error("Decision must be either 'approve' or 'reject'");
  }

  const farmer = await User.findById(farmerId);
  if (!farmer || farmer.role !== "farmer") {
    res.status(404);
    throw new Error("Farmer user not found");
  }

  if (decision === "approve") {
    farmer.isVerifiedFarmer = true;
    farmer.verificationStatus = "verified";
  } else {
    farmer.isVerifiedFarmer = false;
    farmer.verificationStatus = "rejected";
  }

  if (notes) {
    farmer.verificationNotes = notes;
  }

  await farmer.save();

  res.json({
    message: `Farmer verification ${decision === "approve" ? "approved" : "rejected"} successfully`,
    farmer: {
      id: farmer._id,
      storeName: farmer.storeName,
      isVerifiedFarmer: farmer.isVerifiedFarmer,
      verificationStatus: farmer.verificationStatus,
      verificationNotes: farmer.verificationNotes,
    },
  });
});

const updateUserRole = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { role } = req.body;

  if (!["customer", "farmer", "admin"].includes(role)) {
    res.status(400);
    throw new Error("Invalid role specified. Must be customer, farmer, or admin");
  }

  const user = await User.findById(id);
  if (!user) {
    res.status(404);
    throw new Error("User not found");
  }

  user.role = role;
  await user.save();

  res.json({
    message: `User role updated to ${role} successfully`,
    user: {
      _id: user._id,
      storeName: user.storeName,
      email: user.email,
      role: user.role,
    },
  });
});

const toggleUserStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const user = await User.findById(id);
  if (!user) {
    res.status(404);
    throw new Error("User not found");
  }

  if (user._id.toString() === req.user._id.toString()) {
    res.status(400);
    throw new Error("Admin cannot suspend their own account");
  }

  user.isActive = user.isActive === false ? true : false;
  await user.save();

  res.json({
    message: `User ${user.storeName} ${user.isActive ? "reactivated" : "suspended"} successfully`,
    user: {
      _id: user._id,
      storeName: user.storeName,
      isActive: user.isActive,
    },
  });
});

const triggerMandiSync = asyncHandler(async (req, res) => {
  const { fetchAndStoreToday, mapCommodityKey } = require("../services/marketPriceFetcher");
  const results = await fetchAndStoreToday();

  // Also auto-map any products that don't have commodityKey set
  const products = await Product.find({});
  let autoMappedCount = 0;
  for (const product of products) {
    if (!product.commodityKey) {
      const key = mapCommodityKey(product.name, product.category);
      if (key) {
        product.commodityKey = key;
        await product.save();
        autoMappedCount++;
      }
    }
  }

  const count = results?.count !== undefined ? results.count : (Array.isArray(results) ? results.length : 0);

  res.json({
    message: "Government Mandi benchmark prices synced successfully",
    count,
    autoMappedCount,
    timestamp: new Date(),
  });
});

const getPlatformAnalytics = asyncHandler(async (req, res) => {
  const [totalUsers, totalOrders, totalProducts, usersByRole, deliveredOrders] = await Promise.all([
    User.countDocuments(),
    Order.countDocuments(),
    Product.countDocuments(),
    User.aggregate([{ $group: { _id: "$role", count: { $sum: 1 } } }]),
    Order.find({ status: "delivered" }).select("totalPrice discountedTotalPrice"),
  ]);

  const totalDeliveredRevenue = deliveredOrders.reduce(
    (sum, o) => sum + Number(o.discountedTotalPrice || o.totalPrice || 0),
    0
  );

  res.json({
    totalUsers,
    totalOrders,
    totalProducts,
    totalDeliveredRevenue,
    usersByRole: usersByRole.reduce((acc, curr) => ({ ...acc, [curr._id]: curr.count }), {}),
  });
});

const sendTestEmail = asyncHandler(async (req, res) => {
  const targetEmail = req.body.to || req.user.email;
  const mockOrder = {
    _id: "6ae1d2ff27652ebf0468ced3",
    items: [{ name: "Organic Tomatoes", quantity: 2, unit: "kg", price: 40 }],
    totalPrice: 80,
    paymentMethod: "cod",
    deliveryAddress: { street: "Krishi Marg", city: "Kanpur", pincode: "208001" },
  };
  const mockCustomer = { name: "Test Customer", email: targetEmail };
  const mockFarmer = { storeName: "KrishiSetu Partner Farm", phone: "9876543210" };

  const result = await sendCustomerOrderPlacedEmail({
    customer: mockCustomer,
    order: mockOrder,
    farmer: mockFarmer,
  });

  res.json({
    message: result?.success ? "Test email dispatched successfully!" : "Failed to dispatch test email",
    provider: process.env.BREVO_API_KEY ? "Brevo HTTPS API (Port 443)" : "Nodemailer SMTP",
    target: targetEmail,
    result,
  });
});

module.exports = {
  getAllUsers,
  adminDeleteProduct,
  monitorOrders,
  getFarmerVerifications,
  reviewFarmerVerification,
  updateUserRole,
  toggleUserStatus,
  triggerMandiSync,
  getPlatformAnalytics,
  sendTestEmail,
};
