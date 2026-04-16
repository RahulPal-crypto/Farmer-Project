const mongoose = require("mongoose");

const orderItemSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    quantity: {
      type: Number,
      required: true,
      min: 1,
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema(
  {
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    farmer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    items: {
      type: [orderItemSchema],
      validate: {
        validator(value) {
          return Array.isArray(value) && value.length > 0;
        },
        message: "Order must contain at least one item",
      },
      required: true,
    },
    totalPrice: {
      type: Number,
      required: true,
      min: 0,
    },
    discountedTotalPrice: {
      type: Number,
      default: null,
      min: 0,
    },
    status: {
      type: String,
      enum: ["pending", "accepted", "rejected", "delivered"],
      default: "pending",
    },
    source: {
      type: String,
      enum: ["direct", "group-buy"],
      default: "direct",
    },
    groupOrder: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "GroupOrder",
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Order", orderSchema);
