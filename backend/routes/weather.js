const express = require("express");
const router = express.Router();
const { getWeather, searchWeatherCities } = require("../controllers/weatherController");

// Public route: search Indian towns/cities for weather
router.get("/search", searchWeatherCities);

// Public route: get live weather & 7-day forecast by coordinates
router.get("/", getWeather);

module.exports = router;
