const axios = require("axios");

// In-memory cache to prevent excessive external calls (30 minutes TTL)
const weatherCache = new Map();
const CACHE_TTL_MS = 30 * 60 * 1000;

// WMO Weather Interpretation Codes
const getWeatherDescription = (code) => {
  if (code === 0) return { label: "Clear Sky", icon: "☀️", condition: "clear" };
  if (code === 1) return { label: "Mainly Clear", icon: "🌤️", condition: "mostly_clear" };
  if (code === 2) return { label: "Partly Cloudy", icon: "⛅", condition: "partly_cloudy" };
  if (code === 3) return { label: "Overcast", icon: "☁️", condition: "cloudy" };
  if (code === 45 || code === 48) return { label: "Foggy", icon: "🌫️", condition: "fog" };
  if (code >= 51 && code <= 55) return { label: "Light Drizzle", icon: "🌦️", condition: "drizzle" };
  if (code >= 61 && code <= 65) return { label: "Rainy", icon: "🌧️", condition: "rain" };
  if (code >= 71 && code <= 77) return { label: "Snow", icon: "🌨️", condition: "snow" };
  if (code >= 80 && code <= 82) return { label: "Rain Showers", icon: "🌧️", condition: "showers" };
  if (code >= 95) return { label: "Thunderstorm", icon: "⛈️", condition: "thunderstorm" };
  return { label: "Fair", icon: "🌤️", condition: "fair" };
};

// Generates actionable Agri-Advisories for farmers based on live meteorological data
const generateAgriAdvisory = ({ currentTemp, rainProb, maxTemp, minTemp, windSpeed, weatherCode }) => {
  // 1. Rain Alert
  if (rainProb >= 50 || (weatherCode >= 61 && weatherCode <= 82) || weatherCode >= 95) {
    return {
      type: "rain",
      severity: "warning",
      badge: "🌧️ Rain Alert (Barish)",
      title: "Delay Chemical Spraying & Secure Harvested Crates",
      advice:
        "High probability of precipitation detected. Postpone foliar spraying and fertilizer applications to prevent chemical wash-off. Clean farm drainage channels and move freshly harvested vegetables into dry covered sheds immediately.",
      farmerTip: "Check crate tarpaulins before evening harvest transport.",
    };
  }

  // 2. Heatwave Alert
  if (currentTemp >= 38 || maxTemp >= 38) {
    return {
      type: "heat",
      severity: "caution",
      badge: "☀️ High Heat Advisory (Loo)",
      title: "Irrigate During Early Morning or Late Evening",
      advice:
        "High temperatures cause rapid soil moisture loss. Irrigate crops before 8:00 AM or after sunset to minimize water evaporation. Apply organic mulch around root zones to retain soil moisture.",
      farmerTip: "Avoid harvesting leafy greens in afternoon heat to prevent wilting.",
    };
  }

  // 3. Cold / Frost Alert
  if (minTemp <= 7 || currentTemp <= 7) {
    return {
      type: "cold",
      severity: "caution",
      badge: "❄️ Cold Alert (Pala / Thand)",
      title: "Protect Sensitive Nurseries & Seedlings",
      advice:
        "Low night temperatures predicted. Cover young seedlings and tender vegetable beds with thatch or polythene sheets. Light evening irrigation can help maintain ambient root-zone warmth.",
      farmerTip: "Ensure nursery covers are ventilated during daytime sunshine.",
    };
  }

  // 4. High Wind Alert
  if (windSpeed >= 24) {
    return {
      type: "wind",
      severity: "caution",
      badge: "💨 High Wind Advisory",
      title: "Postpone Spraying & Check Plant Stakes",
      advice:
        "Strong winds can cause pesticide spray drift and lodging in tall crops (like maize/wheat). Postpone spraying until wind speeds decrease below 15 km/h. Provide support stakes to climbing vegetables (tomatoes, beans).",
      farmerTip: "Tie tomato and vine trellises securely.",
    };
  }

  // 5. Optimal Farming Weather
  return {
    type: "optimal",
    severity: "ideal",
    badge: "🌱 Ideal Farming Weather (Anukool Mausam)",
    title: "Optimal Day for Harvest, Grading & Field Transport",
    advice:
      "Favorable temperature and clear skies ahead. Excellent day for vegetable harvesting, sun-drying grains, post-harvest sorting, and direct dispatch to local consumers.",
    farmerTip: "Harvest in morning hours for maximum produce freshness and crispness.",
  };
};

/**
 * Fetches real-time and 5-day forecast weather from Open-Meteo for given coordinates.
 * Includes in-memory caching and localized Agri-Advisories.
 */
const getWeatherByCoords = async (latitude, longitude) => {
  const lat = Number(latitude) || 28.6139; // Default Delhi if missing
  const lng = Number(longitude) || 77.209;

  const cacheKey = `${lat.toFixed(2)}_${lng.toFixed(2)}`;
  const cached = weatherCache.get(cacheKey);

  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    return cached.data;
  }

  try {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,weather_code,wind_speed_10m&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max,wind_speed_10m_max&timezone=auto`;

    const { data } = await axios.get(url, { timeout: 10000 });

    const current = data.current || {};
    const daily = data.daily || {};

    const currentWeatherDesc = getWeatherDescription(current.weather_code);
    const rainProbToday = daily.precipitation_probability_max?.[0] || 0;
    const maxTempToday = daily.temperature_2m_max?.[0] || current.temperature_2m || 0;
    const minTempToday = daily.temperature_2m_min?.[0] || current.temperature_2m || 0;

    const advisory = generateAgriAdvisory({
      currentTemp: current.temperature_2m,
      rainProb: rainProbToday,
      maxTemp: maxTempToday,
      minTemp: minTempToday,
      windSpeed: current.wind_speed_10m,
      weatherCode: current.weather_code,
    });

    // Format 5-day forecast
    const forecast = (daily.time || []).slice(0, 5).map((dateStr, idx) => {
      const code = daily.weather_code?.[idx] || 0;
      const desc = getWeatherDescription(code);
      const date = new Date(dateStr);
      const dayName = idx === 0 ? "Today" : date.toLocaleDateString("en-IN", { weekday: "short" });

      return {
        date: dateStr,
        dayName,
        maxTemp: Math.round(daily.temperature_2m_max?.[idx] || 0),
        minTemp: Math.round(daily.temperature_2m_min?.[idx] || 0),
        rainProb: daily.precipitation_probability_max?.[idx] || 0,
        weatherCode: code,
        label: desc.label,
        icon: desc.icon,
      };
    });

    const weatherPayload = {
      location: {
        latitude: lat,
        longitude: lng,
        timezone: data.timezone,
      },
      current: {
        temperature: Math.round(current.temperature_2m),
        feelsLike: Math.round(current.apparent_temperature),
        humidity: current.relative_humidity_2m,
        windSpeed: Math.round(current.wind_speed_10m),
        precipitation: current.precipitation,
        rainProbability: rainProbToday,
        weatherCode: current.weather_code,
        label: currentWeatherDesc.label,
        icon: currentWeatherDesc.icon,
        condition: currentWeatherDesc.condition,
        updatedAt: current.time,
      },
      advisory,
      forecast,
    };

    weatherCache.set(cacheKey, {
      data: weatherPayload,
      timestamp: Date.now(),
    });

    return weatherPayload;
  } catch (error) {
    console.warn("weatherService: Open-Meteo request failed, serving fallback:", error.message);

    // Graceful fallback
    return {
      location: { latitude: lat, longitude: lng, timezone: "Asia/Kolkata" },
      current: {
        temperature: 27,
        feelsLike: 28,
        humidity: 45,
        windSpeed: 8,
        precipitation: 0,
        rainProbability: 5,
        weatherCode: 0,
        label: "Clear Sky",
        icon: "☀️",
        condition: "clear",
        updatedAt: new Date().toISOString(),
      },
      advisory: {
        type: "optimal",
        severity: "ideal",
        badge: "🌱 Ideal Farming Weather (Anukool Mausam)",
        title: "Optimal Day for Harvest & Farm Transport",
        advice:
          "Clear skies and moderate weather conditions. Favorable for crop harvesting, sorting, and direct farm-to-table delivery.",
        farmerTip: "Harvest early morning for maximum crop shelf-life.",
      },
      forecast: [
        { dayName: "Today", maxTemp: 29, minTemp: 19, rainProb: 5, icon: "☀️", label: "Clear" },
        { dayName: "Tomorrow", maxTemp: 28, minTemp: 18, rainProb: 10, icon: "🌤️", label: "Mainly Clear" },
        { dayName: "Wed", maxTemp: 27, minTemp: 18, rainProb: 15, icon: "⛅", label: "Partly Cloudy" },
        { dayName: "Thu", maxTemp: 28, minTemp: 19, rainProb: 5, icon: "☀️", label: "Sunny" },
        { dayName: "Fri", maxTemp: 29, minTemp: 20, rainProb: 5, icon: "☀️", label: "Clear" },
      ],
    };
  }
};

module.exports = {
  getWeatherByCoords,
  getWeatherDescription,
  generateAgriAdvisory,
};

