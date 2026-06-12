#!/usr/bin/env node
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const connectDB = require('../config/db');
const { fetchAndStoreToday } = require('../services/marketPriceFetcher');

(async () => {
  try {
    await connectDB();
    console.log('Running market price fetch...');
    const results = await fetchAndStoreToday();
    console.log(`Fetched and stored ${results.length} records`);
    process.exit(0);
  } catch (err) {
    console.error('Failed to fetch market prices:', err?.message || err);
    process.exit(2);
  }
})();
