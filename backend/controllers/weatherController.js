const asyncHandler = require("../middleware/asyncHandler");
const { getWeatherByCoords, searchCities } = require("../services/weatherService");

const getWeather = asyncHandler(async (req, res) => {
  let { latitude, longitude } = req.query;

  if (!latitude && req.user?.location?.coordinates) {
    longitude = req.user.location.coordinates[0];
    latitude = req.user.location.coordinates[1];
  }

  const weather = await getWeatherByCoords(latitude, longitude);
  res.json(weather);
});

const searchWeatherCities = asyncHandler(async (req, res) => {
  const { q } = req.query;
  const cities = await searchCities(q || "");
  res.json({
    total: cities.length,
    cities,
  });
});

module.exports = {
  getWeather,
  searchWeatherCities,
};
