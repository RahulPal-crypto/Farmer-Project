/**
 * One-time script to map existing products to commodity keys based on name.
 * Run with: node scripts/mapProductCommodities.js
 */
const mongoose = require("mongoose");
const Product = require("../models/Product");

const MONGO = process.env.MONGO_URI || "";

const map = (name) => {
  if (!name) return null;
  const k = name.toLowerCase();
  if (k.includes("tomato")) return "tomato";
  if (k.includes("potato")) return "potato";
  if (k.includes("onion")) return "onion";
  if (k.includes("wheat")) return "wheat";
  if (k.includes("rice") || k.includes("paddy")) return "rice";
  return null;
};

const run = async () => {
  if (!MONGO) {
    console.error("MONGO_URI not set in environment. Abort.");
    process.exit(1);
  }

  await mongoose.connect(MONGO);
  console.log("Connected to Mongo");
  console.log("DB:", mongoose.connection.db.databaseName);

  const products = await Product.find({});
  console.log(`Found ${products.length} products from DB`);
  let updated = 0;
  for (const p of products) {
    const key = map(p.name || "");
    console.log(`Product: "${p.name}" -> mapped: ${key} (current: ${p.commodityKey})`);
    if (key && p.commodityKey !== key) {
      p.commodityKey = key;
      await p.save();
      updated++;
      console.log(`  updated to ${key}`);
    }
  }

  console.log(`Updated ${updated} products`);
  process.exit(0);
};

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
