const mongoose = require("mongoose");

const Order = require("../models/Order");
const Product = require("../models/Product");
const User = require("../models/User");
const asyncHandler = require("../middleware/asyncHandler");

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

module.exports = {
  getAllUsers,
  adminDeleteProduct,
  monitorOrders,
};
