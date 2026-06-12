const cron = require("node-cron");
const { fetchAndStoreToday } = require("../services/marketPriceFetcher");

const startMarketPriceCron = (schedule) => {
  const cronSchedule = schedule || process.env.MARKET_CRON_SCHEDULE || "30 0 * * *"; // default daily at 00:30
  console.log(`Starting market price cron: schedule=${cronSchedule}`);

  cron.schedule(cronSchedule, async () => {
    console.log("marketPriceCron: running fetch job");
    try {
      const results = await fetchAndStoreToday();
      console.log(`marketPriceCron: stored ${results.length} records`);
    } catch (err) {
      console.error("marketPriceCron: failed", err?.message || err);
    }
  });
};

module.exports = { startMarketPriceCron };
