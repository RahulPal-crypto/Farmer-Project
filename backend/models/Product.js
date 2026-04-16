const mongoose = require("mongoose");

const productSchema = new mongoose.Schema(
  {
    farmer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    name: {
      type: String,
      required: [true, "Product name is required"],
      trim: true,
    },
    price: {
      type: Number,
      required: [true, "Product price is required"],
      min: 0,
    },
    quantity: {
      type: Number,
      required: [true, "Product quantity is required"],
      min: 0,
    },
    category: {
      type: String,
      required: [true, "Category is required"],
      trim: true,
      index: true,
    },
    image: {
      type: String,
      default: "",
      trim: true,
    },
    location: {
      type: {
        type: String,
        enum: ["Point"],
        default: "Point",
      },
      coordinates: {
        type: [Number],
        required: [true, "Location coordinates are required"],
        validate: {
          validator(value) {
            return Array.isArray(value) && value.length === 2;
          },
          message: "Coordinates must contain longitude and latitude",
        },
      },
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Supports nearby product searches with geospatial queries.
productSchema.index({ location: "2dsphere" });
productSchema.index({ category: 1, price: 1, createdAt: -1 });

module.exports = mongoose.model("Product", productSchema);
