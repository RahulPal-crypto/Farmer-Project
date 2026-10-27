#!/usr/bin/env node
require("dotenv").config({ path: require("path").join(__dirname, "..", ".env") });
const connectDB = require("../config/db");
const { seedDefaultMarketPrices } = require("../services/marketPriceFetcher");

(async () => {
  try {
    await connectDB();
    console.log("Seeding benchmark APMC market prices...");
    const result = await seedDefaultMarketPrices({ force: true, days: 30 });
    console.log(`Successfully seeded ${result.count || 0} benchmark price records across 30 days.`);
    process.exit(0);
  } catch (err) {
    console.error("Failed to seed market prices:", err?.message || err);
    process.exit(1);
  }
})();

