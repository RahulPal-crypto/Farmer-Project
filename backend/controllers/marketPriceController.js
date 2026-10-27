const asyncHandler = require("../middleware/asyncHandler");
const MarketPrice = require("../models/MarketPrice");

const getCurrent = asyncHandler(async (req, res) => {
  const { commodityKey } = req.params;
  if (!commodityKey) return res.status(400).json({ message: "commodityKey is required" });

  // aggregate modal price across markets for the most recent date
  const doc = await MarketPrice.aggregate([
    { $match: { commodityKey } },
    { $sort: { date: -1 } },
    {
      $group: {
        _id: "$date",
        modalAvg: { $avg: "$modalPrice" },
        minPrice: { $min: "$minPrice" },
        maxPrice: { $max: "$maxPrice" },
        date: { $first: "$date" },
        unit: { $first: "$unit" },
        commodityName: { $first: "$commodityName" },
      },
    },
    { $sort: { _id: -1 } },
    { $limit: 1 },
  ]);

  if (!doc || doc.length === 0) return res.status(404).json({ message: "No market price found" });

  const d = doc[0];
  res.json({
    commodityKey,
    commodityName: d.commodityName,
    date: d.date,
    modalPrice: d.modalAvg ? Number(d.modalAvg.toFixed(2)) : null,
    minPrice: d.minPrice,
    maxPrice: d.maxPrice,
    unit: d.unit || "kg",
  });
});

const getHistory = asyncHandler(async (req, res) => {
  const { commodityKey } = req.params;
  const days = Number(req.query.days) || 30;
  if (!commodityKey) return res.status(400).json({ message: "commodityKey is required" });

  const since = new Date();
  since.setDate(since.getDate() - days + 1);

  const rows = await MarketPrice.aggregate([
    { $match: { commodityKey, date: { $gte: since } } },
    {
      $group: {
        _id: "$date",
        modalAvg: { $avg: "$modalPrice" },
        date: { $first: "$date" },
      },
    },
    { $sort: { _id: 1 } },
  ]);

  const history = rows.map((r) => ({ date: r.date, modalPrice: r.modalAvg ? Number(r.modalAvg.toFixed(2)) : null }));
  res.json({ commodityKey, history });
});

const getAll = asyncHandler(async (req, res) => {
  // get latest date's price per commodityKey
  const rows = await MarketPrice.aggregate([
    { $sort: { date: -1 } },
    {
      $group: {
        _id: { commodityKey: "$commodityKey", date: "$date" },
        commodityKey: { $first: "$commodityKey" },
        commodityName: { $first: "$commodityName" },
        modalPrice: { $avg: "$modalPrice" },
        minPrice: { $min: "$minPrice" },
        maxPrice: { $max: "$maxPrice" },
        date: { $first: "$date" },
        unit: { $first: "$unit" },
      },
    },
    { $sort: { date: -1 } },
    {
      $group: {
        _id: "$commodityKey",
        commodityKey: { $first: "$commodityKey" },
        commodityName: { $first: "$commodityName" },
        modalPrice: { $first: "$modalPrice" },
        minPrice: { $first: "$minPrice" },
        maxPrice: { $first: "$maxPrice" },
        date: { $first: "$date" },
        unit: { $first: "$unit" },
      },
    },
  ]);

  const data = rows.map((r) => ({
    ...r,
    modalPrice: r.modalPrice ? Number(r.modalPrice.toFixed(2)) : null,
  }));

  res.json({ data });
});

module.exports = { getCurrent, getHistory, getAll };
