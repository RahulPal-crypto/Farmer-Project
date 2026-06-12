const mongoose = require("mongoose");

const marketPriceSchema = new mongoose.Schema(
  {
    commodityKey: { type: String, required: true, index: true },
    commodityName: { type: String },
    market: { type: String },
    minPrice: { type: Number },
    maxPrice: { type: Number },
    modalPrice: { type: Number },
    unit: { type: String },
    date: { type: Date, required: true, index: true },
    source: { type: String },
  },
  {
    timestamps: true,
  }
);

// Avoid duplicate entries for same commodity/market/date
marketPriceSchema.index({ commodityKey: 1, market: 1, date: 1 }, { unique: true });

module.exports = mongoose.model("MarketPrice", marketPriceSchema);
