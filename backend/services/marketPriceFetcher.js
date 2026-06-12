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

const mapCommodityKey = (name) => {
  if (!name) return null;
  const key = String(name).toLowerCase();
  if (key.includes("tomato")) return "tomato";
  if (key.includes("potato")) return "potato";
  if (key.includes("onion")) return "onion";
  if (key.includes("wheat")) return "wheat";
  if (key.includes("rice") || key.includes("paddy")) return "rice";
  return null;
};

const fetchFromApi = async () => {
  let url = process.env.MARKET_API_URL;
  if (!url) throw new Error("MARKET_API_URL not configured");

  // Ensure the request returns JSON and has a reasonable limit by default.
  try {
    const u = new URL(url);
    const params = u.searchParams;
    if (!params.get('format')) params.set('format', 'json');
    if (!params.get('limit')) params.set('limit', '500');
    // Add api-key as query param if present and not already provided
    if (process.env.MARKET_API_KEY && !params.get('api-key') && !params.get('api_key')) {
      params.set('api-key', process.env.MARKET_API_KEY);
    }
    url = u.toString();
  } catch (err) {
    // ignore URL parsing errors and use raw url
  }

  const headers = {};
  // Keep header-based API key for APIs that expect it
  if (process.env.MARKET_API_KEY) headers['api-key'] = process.env.MARKET_API_KEY;

  const res = await axios.get(url, { headers, timeout: 20000 });
  return res.data;
};

// Expects data in array form; normalizes and upserts per-market records
const fetchAndStoreToday = async () => {
  const raw = await fetchFromApi();

  // data.gov.in sometimes returns an object with 'records' or a plain array
  const rows = Array.isArray(raw) ? raw : raw.records || raw.result || [];
  if (!Array.isArray(rows)) throw new Error("Unexpected data format from MARKET_API_URL");

  const results = [];

  for (const r of rows) {
    try {
      // attempt to read common field names
      const commodityName = r.commodity || r.Commodity || r.commodity_name || r.commodityName || r.commodity_name_en || r.item || r.Item;
      const market = r.market || r.Market || r.source || r.market_name || r.market_name_en || r.MarketName || r.market;
      const minPrice = normalizeNumber(r.min_price || r.minPrice || r.MIN || r.min);
      const maxPrice = normalizeNumber(r.max_price || r.maxPrice || r.MAX || r.max);
      const modalPrice = normalizeNumber(r.modal_price || r.modalPrice || r.modal || r.modal_price_value || r.avg_price);
      const unit = r.unit || r.Unit || DEFAULT_UNIT;
      const dateValue = r.date || r.recorded_at || r.traded_date || r.RecordDate || r.created_at;
      const date = dateValue ? new Date(dateValue) : new Date();

      const commodityKey = mapCommodityKey(commodityName);
      if (!commodityKey) continue; // skip unmapped commodities

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

      // upsert using unique index
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

  return results;
};

module.exports = {
  fetchAndStoreToday,
  mapCommodityKey,
};
