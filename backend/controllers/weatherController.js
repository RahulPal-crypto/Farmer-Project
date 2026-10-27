const asyncHandler = require("../middleware/asyncHandler");
const { getWeatherByCoords } = require("../services/weatherService");

const getWeather = asyncHandler(async (req, res) => {
  let { latitude, longitude } = req.query;

  if (!latitude && req.user?.location?.coordinates) {
    longitude = req.user.location.coordinates[0];
    latitude = req.user.location.coordinates[1];
  }

  const weather = await getWeatherByCoords(latitude, longitude);
  res.json(weather);
});

module.exports = {
  getWeather,
};

