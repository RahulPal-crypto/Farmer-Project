const axios = require("axios");
const MarketPrice = require("../models/MarketPrice");

const DEFAULT_UNIT = process.env.MARKET_DEFAULT_UNIT || "kg";

const normalizeNumber = (val) => {
  if (val === null || val === undefined) return null;
  if (typeof val === "number") return val;
  const cleaned = String(val).replace(/,/g, "").trim();
  const num = Number(cleaned);
  return Number.isFinite(num) ? num : null;
};

const mapCommodityKey = (name = "", category = "") => {
  const combined = `${name} ${category}`.toLowerCase();
  if (/tomato|tamatar/i.test(combined)) return "tomato";
  if (/potato|aloo|aalu|batata/i.test(combined)) return "potato";
  if (/onion|pyaz|pyaaz|kanda/i.test(combined)) return "onion";
  if (/wheat|gehu|gehun|atta|grain|flour/i.test(combined)) return "wheat";
  if (/rice|chawal|paddy|dhan|basmati/i.test(combined)) return "rice";
  if (/maize|corn|makka|makki|barley|jowar|bajra/i.test(combined)) return "maize";
  if (/carrot|gajar/i.test(combined)) return "carrot";
  if (/garlic|lehsun|lahsun/i.test(combined)) return "garlic";
  if (/ginger|adrak/i.test(combined)) return "ginger";
  if (/apple|seb/i.test(combined)) return "apple";
  if (/banana|kela/i.test(combined)) return "banana";
  if (/cauliflower|gobhi|phool gobhi/i.test(combined)) return "cauliflower";
  return null;
};

// Baseline benchmark data for essential commodities across Indian APMCs
const BENCHMARK_COMMODITIES = [
  {
    commodityKey: "tomato",
    commodityName: "Tomato (Tamatar)",
    unit: "kg",
    baseModal: 26,
    baseMin: 20,
    baseMax: 34,
    markets: ["Pune APMC", "Nashik Mandi", "Azadpur Mandi", "Kolar APMC"],
  },
  {
    commodityKey: "potato",
    commodityName: "Potato (Aloo)",
    unit: "kg",
    baseModal: 24,
    baseMin: 18,
    baseMax: 30,
    markets: ["Agra Mandi", "Farrukhabad APMC", "Pune APMC", "Kolkata APMC"],
  },
  {
    commodityKey: "onion",
    commodityName: "Onion (Pyaaz)",
    unit: "kg",
    baseModal: 30,
    baseMin: 22,
    baseMax: 38,
    markets: ["Lasalgaon Mandi", "Nashik APMC", "Pune APMC", "Azadpur Mandi"],
  },
  {
    commodityKey: "wheat",
    commodityName: "Wheat (Gehun / Grain)",
    unit: "kg",
    baseModal: 28,
    baseMin: 24,
    baseMax: 34,
    markets: ["Khanna APMC", "Indore Mandi", "Kota Mandi", "Bhopal APMC"],
  },
  {
    commodityKey: "rice",
    commodityName: "Rice (Chawal / Paddy)",
    unit: "kg",
    baseModal: 42,
    baseMin: 34,
    baseMax: 52,
    markets: ["Karnal Mandi", "Burdwan APMC", "Thanjavur APMC", "Raipur Mandi"],
  },
  {
    commodityKey: "maize",
    commodityName: "Maize / Corn / Barley (Makka)",
    unit: "kg",
    baseModal: 22,
    baseMin: 18,
    baseMax: 27,
    markets: ["Nizamabad APMC", "Davanagere Mandi", "Chhindwara APMC", "Bahraich Mandi"],
  },
  {
    commodityKey: "carrot",
    commodityName: "Carrot (Gajar)",
    unit: "kg",
    baseModal: 28,
    baseMin: 20,
    baseMax: 36,
    markets: ["Ooty APMC", "Kolar Mandi", "Hapur APMC", "Pune APMC"],
  },
  {
    commodityKey: "garlic",
    commodityName: "Garlic (Lehsun)",
    unit: "kg",
    baseModal: 130,
    baseMin: 100,
    baseMax: 160,
    markets: ["Mandsaur Mandi", "Neemuch APMC", "Kota APMC", "Gondal Mandi"],
  },
  {
    commodityKey: "ginger",
    commodityName: "Ginger (Adrak)",
    unit: "kg",
    baseModal: 85,
    baseMin: 65,
    baseMax: 115,
    markets: ["Wayanad Mandi", "Shimoga APMC", "Kochi APMC", "Azadpur Mandi"],
  },
  {
    commodityKey: "apple",
    commodityName: "Apple (Seb)",
    unit: "kg",
    baseModal: 110,
    baseMin: 80,
    baseMax: 145,
    markets: ["Shimla APMC", "Sopore Mandi", "Azadpur Mandi", "Chandigarh APMC"],
  },
  {
    commodityKey: "banana",
    commodityName: "Banana (Kela)",
    unit: "kg",
    baseModal: 35,
    baseMin: 25,
    baseMax: 45,
    markets: ["Jalgaon Mandi", "Theni APMC", "Hajipur APMC", "Surat Mandi"],
  },
  {
    commodityKey: "cauliflower",
    commodityName: "Cauliflower (Gobhi)",
    unit: "kg",
    baseModal: 25,
    baseMin: 18,
    baseMax: 35,
    markets: ["Azadpur Mandi", "Pune APMC", "Kolkata APMC", "Ranchi Mandi"],
  },
];

/**
 * Seeds or backfills realistic benchmark market rates for the past N days.
 * Ensures that price comparison badges and historical trend charts display rich data out-of-the-box.
 */
const seedDefaultMarketPrices = async ({ force = false, days = 14 } = {}) => {
  const existingCount = await MarketPrice.countDocuments();
  if (existingCount > 0 && !force) {
    return { count: existingCount, seeded: false };
  }

  const results = [];
  const now = new Date();

  for (let dayOffset = days - 1; dayOffset >= 0; dayOffset--) {
    const targetDate = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - dayOffset));

    for (const commodity of BENCHMARK_COMMODITIES) {
      for (let i = 0; i < commodity.markets.length; i++) {
        const marketName = commodity.markets[i];

        // Add subtle realistic deterministic daily variance (-8% to +8%)
        const varianceSeed = ((dayOffset * 7 + i * 13) % 17) - 8;
        const varianceFactor = 1 + varianceSeed / 100;

        const modalPrice = Number((commodity.baseModal * varianceFactor).toFixed(2));
        const minPrice = Number((commodity.baseMin * varianceFactor).toFixed(2));
        const maxPrice = Number((commodity.baseMax * varianceFactor).toFixed(2));

        const doc = {
          commodityKey: commodity.commodityKey,
          commodityName: commodity.commodityName,
          market: marketName,
          minPrice,
          maxPrice,
          modalPrice,
          unit: commodity.unit || DEFAULT_UNIT,
          date: targetDate,
          source: "Benchmark APMC Seeder",
        };

        await MarketPrice.findOneAndUpdate(
          { commodityKey: doc.commodityKey, market: doc.market, date: doc.date },
          { $set: doc },
          { upsert: true, setDefaultsOnInsert: true }
        );

        results.push(doc);
      }
    }
  }

  return { count: results.length, seeded: true };
};

const fetchFromApi = async () => {
  let url = process.env.MARKET_API_URL;
  if (!url) throw new Error("MARKET_API_URL not configured");

  try {
    const u = new URL(url);
    const params = u.searchParams;
    if (!params.get("format")) params.set("format", "json");
    if (!params.get("limit")) params.set("limit", "500");
    if (process.env.MARKET_API_KEY && !params.get("api-key") && !params.get("api_key")) {
      params.set("api-key", process.env.MARKET_API_KEY);
    }
    url = u.toString();
  } catch (err) {
    // ignore URL parsing errors and use raw url
  }

  const headers = {};
  if (process.env.MARKET_API_KEY) headers["api-key"] = process.env.MARKET_API_KEY;

  const res = await axios.get(url, { headers, timeout: 20000 });
  return res.data;
};

// Expects data in array form; normalizes and upserts per-market records.
// Automatically falls back to benchmark seeding if API is unconfigured or unavailable.
const fetchAndStoreToday = async () => {
  if (process.env.MARKET_API_URL) {
    try {
      const raw = await fetchFromApi();
      const rows = Array.isArray(raw) ? raw : raw.records || raw.result || [];

      if (Array.isArray(rows) && rows.length > 0) {
        const results = [];

        for (const r of rows) {
          try {
            const commodityName =
              r.commodity ||
              r.Commodity ||
              r.commodity_name ||
              r.commodityName ||
              r.commodity_name_en ||
              r.item ||
              r.Item;
            const market =
              r.market ||
              r.Market ||
              r.source ||
              r.market_name ||
              r.market_name_en ||
              r.MarketName;
            let minPrice = normalizeNumber(r.min_price || r.minPrice || r.MIN || r.min);
            let maxPrice = normalizeNumber(r.max_price || r.maxPrice || r.MAX || r.max);
            let modalPrice = normalizeNumber(
              r.modal_price || r.modalPrice || r.modal || r.modal_price_value || r.avg_price
            );
            let unit = r.unit || r.Unit || DEFAULT_UNIT;
            const dateValue = r.date || r.recorded_at || r.traded_date || r.RecordDate || r.created_at;
            const date = dateValue ? new Date(dateValue) : new Date();

            const commodityKey = mapCommodityKey(commodityName);
            if (!commodityKey) continue;

            // In Indian Mandi / Agmarknet, prices are published in Rs. / Quintal (1 Quintal = 100 kg)
            // Automatically convert to Rs. / kg for retail consumer marketplace
            if (/quintal|qtl/i.test(unit) || (modalPrice && modalPrice > 500)) {
              if (modalPrice) modalPrice = Number((modalPrice / 100).toFixed(2));
              if (minPrice) minPrice = Number((minPrice / 100).toFixed(2));
              if (maxPrice) maxPrice = Number((maxPrice / 100).toFixed(2));
              unit = "kg";
            }

            const doc = {
              commodityKey,
              commodityName: commodityName || commodityKey,
              market: market || "",
              minPrice,
              maxPrice,
              modalPrice,
              unit,
              date: new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate())),
              source: process.env.MARKET_API_URL,
            };

            await MarketPrice.findOneAndUpdate(
              { commodityKey: doc.commodityKey, market: doc.market || "", date: doc.date },
              { $set: doc },
              { upsert: true, setDefaultsOnInsert: true }
            );

            results.push(doc);
          } catch (err) {
            console.error("marketPriceFetcher: failed to process row", err?.message || err);
          }
        }

        if (results.length > 0) {
          return results;
        }
      }
    } catch (apiError) {
      console.warn("marketPriceFetcher: External Mandi API unreachable, using benchmark rates:", apiError.message || apiError);
    }
  }

  // Graceful fallback to seeding/updating today's rates
  const benchmarkResult = await seedDefaultMarketPrices({ force: true, days: 1 });
  return benchmarkResult;
};

module.exports = {
  fetchAndStoreToday,
  mapCommodityKey,
  seedDefaultMarketPrices,
  BENCHMARK_COMMODITIES,
};
