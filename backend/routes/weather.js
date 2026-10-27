const express = require("express");
const router = express.Router();
const { getWeather } = require("../controllers/weatherController");

// Public route: accessible by both customers and farmers (coordinates via query params)
router.get("/", getWeather);

module.exports = router;

