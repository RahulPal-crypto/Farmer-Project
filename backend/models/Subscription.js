const mongoose = require("mongoose");

const subscriptionSchema = new mongoose.Schema(
  {
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    farmer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      default: null,
    },
    planName: {
      type: String,
      required: [true, "Plan name is required"],
      trim: true,
    },
    frequency: {
      type: String,
      enum: ["daily", "weekly", "biweekly", "monthly"],
      default: "weekly",
    },
    preferredDay: {
      type: String,
      default: "Monday",
      trim: true,
    },
    quantity: {
      type: Number,
      required: true,
      default: 1,
      min: 1,
    },
    pricePerDelivery: {
      type: Number,
      required: [true, "Price per delivery is required"],
      min: 0,
    },
    deliveryAddress: {
      street: { type: String, trim: true },
      city: { type: String, trim: true },
      pincode: { type: String, trim: true },
      notes: { type: String, trim: true },
    },
    status: {
      type: String,
      enum: ["active", "paused", "cancelled"],
      default: "active",
      index: true,
    },
    startDate: {
      type: Date,
      default: Date.now,
    },
    nextDeliveryDate: {
      type: Date,
      default: () => {
        const next = new Date();
        next.setDate(next.getDate() + 7);
        return next;
      },
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Subscription", subscriptionSchema);

