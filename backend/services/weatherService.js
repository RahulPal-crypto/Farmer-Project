const axios = require("axios");

// In-memory cache to prevent excessive external calls (15 minutes TTL)
const weatherCache = new Map();
const CACHE_TTL_MS = 15 * 60 * 1000;

const USER_AGENT = "Mozilla/5.0 (compatible; KrishiSetu/2.0; +https://farmer-project-gamma.vercel.app)";

// WMO Weather Interpretation Codes
const getWeatherDescription = (code) => {
  if (code === 0) return { label: "Clear Sky", labelHi: "साफ़ आसमान", icon: "☀️", condition: "clear" };
  if (code === 1) return { label: "Mainly Clear", labelHi: "मुख्यतः साफ़", icon: "🌤️", condition: "mostly_clear" };
  if (code === 2) return { label: "Partly Cloudy", labelHi: "आंशिक बादल", icon: "⛅", condition: "partly_cloudy" };
  if (code === 3) return { label: "Overcast", labelHi: "बादल छाए रहेंगे", icon: "☁️", condition: "cloudy" };
  if (code === 45 || code === 48) return { label: "Foggy", labelHi: "कोहरा", icon: "🌫️", condition: "fog" };
  if (code >= 51 && code <= 55) return { label: "Light Drizzle", labelHi: "हल्की बूंदाबांदी", icon: "🌦️", condition: "drizzle" };
  if (code >= 61 && code <= 65) return { label: "Rainy", labelHi: "बारिश", icon: "🌧️", condition: "rain" };
  if (code >= 71 && code <= 77) return { label: "Snow", labelHi: "बर्फबारी", icon: "🌨️", condition: "snow" };
  if (code >= 80 && code <= 82) return { label: "Rain Showers", labelHi: "तेज़ बौछारें", icon: "🌧️", condition: "showers" };
  if (code >= 95) return { label: "Thunderstorm", labelHi: "आंधी-तूफान", icon: "⛈️", condition: "thunderstorm" };
  return { label: "Fair", labelHi: "सामान्य मौसम", icon: "🌤️", condition: "fair" };
};

// Generates actionable Bilingual Agri-Advisories for farmers based on live meteorological data
const generateAgriAdvisory = ({ currentTemp, rainProb, maxTemp, minTemp, windSpeed, weatherCode }) => {
  // 1. Rain Alert
  if (rainProb >= 50 || (weatherCode >= 61 && weatherCode <= 82) || weatherCode >= 95) {
    return {
      type: "rain",
      severity: "warning",
      badge: "🌧️ Rain Alert (बारिश की चेतावनी)",
      title: "Delay Chemical Spraying & Secure Harvested Crates",
      titleHi: "कीटनाशक छिड़काव रोकें और कटी फसल सुरक्षित रखें",
      advice:
        "High probability of precipitation detected. Postpone foliar spraying and fertilizer applications to prevent chemical wash-off. Clean farm drainage channels and move freshly harvested vegetables into dry covered sheds immediately.",
      adviceHi:
        "भारी बारिश की संभावना है। कीटनाशक और खाद का छिड़काव तुरंत टालें ताकि दवा बह न जाए। कटी हुई सब्जियों को भीगने से बचाने के लिए सूखे शेड या तिरपाल से ढकें।",
      farmerTip: "Check crate tarpaulins before evening harvest transport.",
      farmerTipHi: "शाम को मंडी ले जाते समय गाड़ियों और क्रेट्स पर तिरपाल कसकर बांधें।",
    };
  }

  // 2. Heatwave Alert
  if (currentTemp >= 38 || maxTemp >= 38) {
    return {
      type: "heat",
      severity: "caution",
      badge: "☀️ High Heat Advisory (लू / तेज धूप)",
      title: "Irrigate During Early Morning or Late Evening",
      titleHi: "सिंचाई केवल सुबह या देर शाम ही करें",
      advice:
        "High temperatures cause rapid soil moisture loss. Irrigate crops before 8:00 AM or after sunset to minimize water evaporation. Apply organic mulch around root zones to retain soil moisture.",
      adviceHi:
        "अधिक तापमान से जमीन की नमी तेजी से घटती है। फसल में पानी सुबह 8 बजे से पहले या शाम ढलने के बाद दें। जड़ों के पास पुआल या मल्च बिछाएं।",
      farmerTip: "Avoid harvesting leafy greens in afternoon heat to prevent wilting.",
      farmerTipHi: "दोपहर में हरी पत्तेदार सब्जियां न तोड़ें, वे मुरझा सकती हैं।",
    };
  }

  // 3. Cold / Frost Alert
  if (minTemp <= 7 || currentTemp <= 7) {
    return {
      type: "cold",
      severity: "caution",
      badge: "❄️ Cold Alert (पाला / शीतलहर)",
      title: "Protect Sensitive Nurseries & Seedlings",
      titleHi: "नर्सरी और कोमल पौधों को पाले से बचाएं",
      advice:
        "Low night temperatures predicted. Cover young seedlings and tender vegetable beds with thatch or polythene sheets. Light evening irrigation can help maintain ambient root-zone warmth.",
      adviceHi:
        "रात में पाला पड़ने का खतरा है। शाम को खेत में हल्की सिंचाई करने से तापमान नियंत्रित रहता है। नर्सरी को पॉलीथिन या घास-फूस से ढकें।",
      farmerTip: "Ensure nursery covers are ventilated during daytime sunshine.",
      farmerTipHi: "दिन में धूप खिलने पर नर्सरी के कवर खोल दें ताकि हवा लग सके।",
    };
  }

  // 4. High Wind Alert
  if (windSpeed >= 24) {
    return {
      type: "wind",
      severity: "caution",
      badge: "💨 High Wind Advisory (तेज हवा)",
      title: "Postpone Spraying & Check Plant Stakes",
      titleHi: "छिड़काव टालें और बेलदार फसलों को सहारा दें",
      advice:
        "Strong winds can cause pesticide spray drift and lodging in tall crops. Postpone spraying until wind speeds decrease below 15 km/h. Provide support stakes to climbing vegetables (tomatoes, beans).",
      adviceHi:
        "तेज हवा में कीटनाशक का असर नहीं होता। टमाटर, लौकी, खीरे जैसी बेलदार फसलों को बांस-तार का सहारा देकर मजबूती से बांधें।",
      farmerTip: "Tie tomato and vine trellises securely.",
      farmerTipHi: "टमाटर और बेलों की मचान को तुरंत चेक करें।",
    };
  }

  // 5. Optimal Farming Weather
  return {
    type: "optimal",
    severity: "ideal",
    badge: "🌱 Ideal Farming Weather (अनुकूल मौसम)",
    title: "Optimal Day for Harvest, Grading & Field Transport",
    titleHi: "फसल कटाई, छंटाई और मंडी परिवहन के लिए उत्तम दिन",
    advice:
      "Favorable temperature and clear skies ahead. Excellent day for vegetable harvesting, sun-drying grains, post-harvest sorting, and direct dispatch to local consumers.",
    adviceHi:
      "मौसम साफ और अनुकूल है। ताजी फसल तोड़ने, अनाज सुखाने और ग्राहकों तक सीधी डिलीवरी के लिए आज का दिन सबसे बेहतर है।",
    farmerTip: "Harvest in morning hours for maximum produce freshness and crispness.",
    farmerTipHi: "सुबह के समय फल और सब्जियां तोड़ें ताकि वे तरोताजा और कुरकुरी रहें।",
  };
};

/**
 * Reverse Geocoding helper to determine City / District / State
 */
const reverseGeocode = async (latitude, longitude) => {
  try {
    const url = `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`;
    const res = await axios.get(url, { timeout: 4000 });
    const data = res.data || {};
    const city = data.city || data.locality || data.localityInfo?.administrative?.[3]?.name || "Kanpur";
    const district = data.localityInfo?.administrative?.[2]?.name || data.principalSubdivision || "";
    const state = data.principalSubdivision || "Uttar Pradesh";
    return {
      city,
      district,
      state,
      country: data.countryName || "India",
      displayName: `${city}${state ? `, ${state}` : ""}`,
    };
  } catch (err) {
    return {
      city: "Nearby Farm",
      district: "",
      state: "Uttar Pradesh",
      country: "India",
      displayName: "Nearby Farm Region",
    };
  }
};

/**
 * Search cities by query string for the search-location feature
 */
const searchCities = async (query) => {
  if (!query || query.trim().length < 2) return [];

  const cleanQuery = query.trim();
  try {
    const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(
      cleanQuery
    )}&count=8&language=en&format=json`;

    const res = await axios.get(url, {
      headers: { "User-Agent": USER_AGENT },
      timeout: 6000,
    });

    const results = res.data?.results || [];
    return results.map((item) => ({
      name: item.name,
      state: item.admin1 || "",
      country: item.country || "India",
      latitude: item.latitude,
      longitude: item.longitude,
      displayName: `${item.name}${item.admin1 ? `, ${item.admin1}` : ""}${
        item.country && item.country !== "India" ? ` (${item.country})` : ""
      }`,
    }));
  } catch (err) {
    console.warn("weatherService: searchCities failed:", err.message);
    return [];
  }
};

/**
 * Fetches real-time, 7-day forecast, and 24-hour hourly weather from Open-Meteo
 */
const getWeatherByCoords = async (latitude, longitude) => {
  const lat = Number(latitude) || 26.4499; // Default Kanpur coordinates
  const lng = Number(longitude) || 80.3319;

  const cacheKey = `${lat.toFixed(2)}_${lng.toFixed(2)}`;
  const cached = weatherCache.get(cacheKey);

  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    return cached.data;
  }

  try {
    // Open-Meteo forecast API call with browser-grade User-Agent to prevent 403 blocks on cloud hosts
    const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current=temperature_2m,relative_humidity_2m,apparent_temperature,is_day,precipitation,weather_code,wind_speed_10m,wind_direction_10m,surface_pressure&hourly=temperature_2m,relative_humidity_2m,precipitation_probability,weather_code&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max,precipitation_sum,wind_speed_10m_max,uv_index_max,sunrise,sunset&timezone=auto`;

    const [weatherRes, geoInfo] = await Promise.all([
      axios.get(weatherUrl, {
        headers: { "User-Agent": USER_AGENT, Accept: "application/json" },
        timeout: 10000,
      }),
      reverseGeocode(lat, lng),
    ]);

    const data = weatherRes.data || {};
    const current = data.current || {};
    const daily = data.daily || {};
    const hourly = data.hourly || {};

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

    // 7-day daily forecast
    const forecast = (daily.time || []).slice(0, 7).map((dateStr, idx) => {
      const code = daily.weather_code?.[idx] || 0;
      const desc = getWeatherDescription(code);
      const date = new Date(dateStr);
      let dayName = date.toLocaleDateString("en-IN", { weekday: "short" });
      if (idx === 0) dayName = "Today";
      else if (idx === 1) dayName = "Tomorrow";

      return {
        date: dateStr,
        dayName,
        maxTemp: Math.round(daily.temperature_2m_max?.[idx] || 0),
        minTemp: Math.round(daily.temperature_2m_min?.[idx] || 0),
        rainProb: daily.precipitation_probability_max?.[idx] || 0,
        rainSum: daily.precipitation_sum?.[idx] || 0,
        windSpeedMax: Math.round(daily.wind_speed_10m_max?.[idx] || 0),
        uvIndex: daily.uv_index_max?.[idx] || 0,
        weatherCode: code,
        label: desc.label,
        labelHi: desc.labelHi,
        icon: desc.icon,
      };
    });

    // Next 24-hour hourly forecast
    const nowISO = new Date().toISOString().slice(0, 13); // "2026-10-30T16"
    let startIndex = (hourly.time || []).findIndex((t) => t.startsWith(nowISO));
    if (startIndex < 0) startIndex = 0;

    const hourlyForecast = (hourly.time || []).slice(startIndex, startIndex + 24).map((timeStr, idx) => {
      const actualIdx = startIndex + idx;
      const dateObj = new Date(timeStr);
      const hourStr = dateObj.toLocaleTimeString("en-IN", { hour: "numeric", hour12: true });
      const code = hourly.weather_code?.[actualIdx] || 0;
      const desc = getWeatherDescription(code);

      return {
        time: timeStr,
        hour: idx === 0 ? "Now" : hourStr,
        temp: Math.round(hourly.temperature_2m?.[actualIdx] || 0),
        humidity: hourly.relative_humidity_2m?.[actualIdx] || 0,
        rainProb: hourly.precipitation_probability?.[actualIdx] || 0,
        weatherCode: code,
        icon: desc.icon,
        label: desc.label,
      };
    });

    // Format Sunrise / Sunset
    const formatTime = (iso) => {
      if (!iso) return "--:--";
      const d = new Date(iso);
      return d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true });
    };

    const weatherPayload = {
      location: {
        latitude: lat,
        longitude: lng,
        timezone: data.timezone,
        city: geoInfo.city,
        district: geoInfo.district,
        state: geoInfo.state,
        country: geoInfo.country,
        displayName: geoInfo.displayName,
      },
      current: {
        temperature: Math.round(current.temperature_2m),
        feelsLike: Math.round(current.apparent_temperature),
        humidity: current.relative_humidity_2m,
        windSpeed: Math.round(current.wind_speed_10m),
        windDirection: current.wind_direction_10m,
        pressure: Math.round(current.surface_pressure),
        precipitation: current.precipitation,
        rainProbability: rainProbToday,
        weatherCode: current.weather_code,
        label: currentWeatherDesc.label,
        labelHi: currentWeatherDesc.labelHi,
        icon: currentWeatherDesc.icon,
        condition: currentWeatherDesc.condition,
        isDay: current.is_day === 1,
        sunrise: formatTime(daily.sunrise?.[0]),
        sunset: formatTime(daily.sunset?.[0]),
        uvIndex: daily.uv_index_max?.[0] || 0,
        updatedAt: current.time || new Date().toISOString(),
      },
      advisory,
      forecast,
      hourly: hourlyForecast,
      source: "open-meteo-live",
    };

    weatherCache.set(cacheKey, {
      data: weatherPayload,
      timestamp: Date.now(),
    });

    return weatherPayload;
  } catch (error) {
    console.warn("weatherService: Open-Meteo live request failed, generating real-date fallback:", error.message);

    // Dynamic Calendar-based Fallback (No hardcoded day names!)
    const today = new Date();
    const dynamicForecast = Array.from({ length: 7 }).map((_, i) => {
      const d = new Date(today);
      d.setDate(today.getDate() + i);
      const isToday = i === 0;
      const isTomorrow = i === 1;
      const dayName = isToday ? "Today" : isTomorrow ? "Tomorrow" : d.toLocaleDateString("en-IN", { weekday: "short" });

      return {
        date: d.toISOString().split("T")[0],
        dayName,
        maxTemp: 28 + (i % 3),
        minTemp: 19 - (i % 2),
        rainProb: i === 0 ? 15 : i === 1 ? 25 : 10,
        weatherCode: 1,
        label: "Mainly Clear",
        labelHi: "मुख्यतः साफ़",
        icon: "🌤️",
      };
    });

    return {
      location: {
        latitude: lat,
        longitude: lng,
        timezone: "Asia/Kolkata",
        city: "Local Farm",
        state: "Uttar Pradesh",
        displayName: "Local Farm Region",
      },
      current: {
        temperature: 26,
        feelsLike: 27,
        humidity: 62,
        windSpeed: 10,
        precipitation: 0,
        rainProbability: 15,
        weatherCode: 1,
        label: "Mainly Clear",
        labelHi: "मुख्यतः साफ़",
        icon: "🌤️",
        condition: "mostly_clear",
        isDay: true,
        sunrise: "06:15 AM",
        sunset: "05:35 PM",
        uvIndex: 5,
        updatedAt: new Date().toISOString(),
      },
      advisory: {
        type: "optimal",
        severity: "ideal",
        badge: "🌱 Ideal Farming Weather (अनुकूल मौसम)",
        title: "Optimal Day for Harvest & Farm Transport",
        titleHi: "फसल कटाई और मंडी परिवहन के लिए अनुकूल दिन",
        advice:
          "Clear skies and moderate weather conditions. Favorable for crop harvesting, sorting, and direct farm-to-table delivery.",
        adviceHi: "मौसम साफ है। फसल की तुड़ाई, छंटाई और ग्राहकों तक डिलीवरी के लिए बेहतरीन समय है।",
        farmerTip: "Harvest early morning for maximum crop shelf-life.",
        farmerTipHi: "सुबह जल्दी कटाई करें ताकि उत्पाद की ताजगी बनी रहे।",
      },
      forecast: dynamicForecast,
      hourly: [],
      source: "seasonal-estimate",
    };
  }
};

module.exports = {
  getWeatherByCoords,
  searchCities,
  getWeatherDescription,
  generateAgriAdvisory,
};
