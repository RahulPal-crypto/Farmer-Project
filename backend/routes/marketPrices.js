const express = require("express");
const router = express.Router();
const { getCurrent, getHistory, getAll } = require("../controllers/marketPriceController");

router.get("/current/:commodityKey", getCurrent);
router.get("/history/:commodityKey", getHistory);
router.get("/all", getAll);

module.exports = router;
