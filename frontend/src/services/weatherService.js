import api from "./api";
import axios from "axios";

const WMO_CODES = {
  0: { label: "Clear Sky", labelHi: "साफ़ आसमान", icon: "☀️", condition: "clear" },
  1: { label: "Mainly Clear", labelHi: "मुख्यतः साफ़", icon: "🌤️", condition: "mostly_clear" },
  2: { label: "Partly Cloudy", labelHi: "आंशिक बादल", icon: "⛅", condition: "partly_cloudy" },
  3: { label: "Overcast", labelHi: "बादल छाए रहेंगे", icon: "☁️", condition: "cloudy" },
  45: { label: "Foggy", labelHi: "कोहरा", icon: "🌫️", condition: "fog" },
  48: { label: "Foggy", labelHi: "कोहरा", icon: "🌫️", condition: "fog" },
  51: { label: "Light Drizzle", labelHi: "हल्की बूंदाबांदी", icon: "🌦️", condition: "drizzle" },
  53: { label: "Moderate Drizzle", labelHi: "बूंदाबांदी", icon: "🌦️", condition: "drizzle" },
  55: { label: "Dense Drizzle", labelHi: "घनी बूंदाबांदी", icon: "🌦️", condition: "drizzle" },
  61: { label: "Light Rain", labelHi: "हल्की बारिश", icon: "🌧️", condition: "rain" },
  63: { label: "Moderate Rain", labelHi: "बारिश", icon: "🌧️", condition: "rain" },
  65: { label: "Heavy Rain", labelHi: "भारी बारिश", icon: "🌧️", condition: "rain" },
  71: { label: "Snow", labelHi: "बर्फबारी", icon: "🌨️", condition: "snow" },
  80: { label: "Rain Showers", labelHi: "तेज़ बौछारें", icon: "🌧️", condition: "showers" },
  81: { label: "Rain Showers", labelHi: "तेज़ बौछारें", icon: "🌧️", condition: "showers" },
  82: { label: "Violent Showers", labelHi: "तूफानी बारिश", icon: "⛈️", condition: "showers" },
  95: { label: "Thunderstorm", labelHi: "आंधी-तूफान", icon: "⛈️", condition: "thunderstorm" },
};

const getWeatherDescription = (code) => {
  return WMO_CODES[code] || { label: "Fair", labelHi: "सामान्य मौसम", icon: "🌤️", condition: "fair" };
};

const generateClientAgriAdvisory = ({ currentTemp, rainProb, maxTemp, minTemp, windSpeed, weatherCode }) => {
  if (rainProb >= 50 || (weatherCode >= 61 && weatherCode <= 82) || weatherCode >= 95) {
    return {
      type: "rain",
      severity: "warning",
      badge: "🌧️ Rain Alert (बारिश की चेतावनी)",
      title: "Delay Chemical Spraying & Secure Harvested Crates",
      titleHi: "कीटनाशक छिड़काव रोकें और कटी फसल सुरक्षित रखें",
      advice:
        "High probability of precipitation detected. Postpone foliar spraying and fertilizer applications to prevent chemical wash-off. Move freshly harvested vegetables into dry covered sheds immediately.",
      adviceHi:
        "बारिश की प्रबल संभावना है। कीटनाशक व खाद का छिड़काव रोकें और कटी हुई सब्जियों को भीगने से बचाने हेतु सूखे शेड में रखें।",
      farmerTip: "Check crate tarpaulins before evening harvest transport.",
      farmerTipHi: "मंडी ले जाते समय क्रेट्स पर तिरपाल ठीक से ढकें।",
    };
  }
  if (currentTemp >= 38 || maxTemp >= 38) {
    return {
      type: "heat",
      severity: "caution",
      badge: "☀️ High Heat Advisory (लू / तेज धूप)",
      title: "Irrigate During Early Morning or Late Evening",
      titleHi: "सिंचाई केवल सुबह या देर शाम ही करें",
      advice:
        "High temperatures cause rapid soil moisture loss. Irrigate crops before 8:00 AM or after sunset to minimize evaporation.",
      adviceHi:
        "अधिक तापमान से जमीन की नमी घटती है। खेत में पानी सुबह जल्दी या शाम को लगाएं।",
      farmerTip: "Avoid harvesting leafy greens in afternoon heat.",
      farmerTipHi: "दोपहर की तेज धूप में पत्तेदार सब्जियां न तोड़ें।",
    };
  }
  return {
    type: "optimal",
    severity: "ideal",
    badge: "🌱 Ideal Farming Weather (अनुकूल मौसम)",
    title: "Optimal Day for Harvest, Grading & Field Transport",
    titleHi: "फसल कटाई, छंटाई और सीधी डिलीवरी के लिए उत्तम दिन",
    advice:
      "Favorable temperature and clear skies ahead. Excellent day for vegetable harvesting and direct dispatch to local consumers.",
    adviceHi:
      "मौसम साफ और अनुकूल है। ताजी फसल तोड़ने और ग्राहकों तक सीधी डिलीवरी के लिए उत्तम दिन है।",
    farmerTip: "Harvest in morning hours for maximum produce freshness.",
    farmerTipHi: "सुबह के समय फल और सब्जियां तोड़ें ताकि वे तरोताजा रहें।",
  };
};

/**
 * Direct client-side Open-Meteo fallback (with native browser CORS)
 * Guarantees weather loads even if the deployed backend is waking up from sleep.
 */
const fetchDirectClientWeather = async (lat, lng, cityName = "") => {
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current=temperature_2m,relative_humidity_2m,apparent_temperature,is_day,precipitation,weather_code,wind_speed_10m,wind_direction_10m,surface_pressure&hourly=temperature_2m,relative_humidity_2m,precipitation_probability,weather_code&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max,wind_speed_10m_max,uv_index_max,sunrise,sunset&timezone=auto`;

  const { data } = await axios.get(url, { timeout: 8000 });
  const current = data.current || {};
  const daily = data.daily || {};
  const hourly = data.hourly || {};
  const desc = getWeatherDescription(current.weather_code);
  const rainProbToday = daily.precipitation_probability_max?.[0] || 0;

  const advisory = generateClientAgriAdvisory({
    currentTemp: current.temperature_2m,
    rainProb: rainProbToday,
    maxTemp: daily.temperature_2m_max?.[0] || current.temperature_2m,
    minTemp: daily.temperature_2m_min?.[0] || current.temperature_2m,
    windSpeed: current.wind_speed_10m,
    weatherCode: current.weather_code,
  });

  const forecast = (daily.time || []).slice(0, 7).map((dateStr, idx) => {
    const code = daily.weather_code?.[idx] || 0;
    const dayDesc = getWeatherDescription(code);
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
      weatherCode: code,
      label: dayDesc.label,
      labelHi: dayDesc.labelHi,
      icon: dayDesc.icon,
    };
  });

  const nowISO = new Date().toISOString().slice(0, 13);
  let startIndex = (hourly.time || []).findIndex((t) => t.startsWith(nowISO));
  if (startIndex < 0) startIndex = 0;

  const hourlyForecast = (hourly.time || []).slice(startIndex, startIndex + 24).map((timeStr, idx) => {
    const actualIdx = startIndex + idx;
    const dateObj = new Date(timeStr);
    const hourStr = dateObj.toLocaleTimeString("en-IN", { hour: "numeric", hour12: true });
    const code = hourly.weather_code?.[actualIdx] || 0;
    const hDesc = getWeatherDescription(code);

    return {
      time: timeStr,
      hour: idx === 0 ? "Now" : hourStr,
      temp: Math.round(hourly.temperature_2m?.[actualIdx] || 0),
      humidity: hourly.relative_humidity_2m?.[actualIdx] || 0,
      rainProb: hourly.precipitation_probability?.[actualIdx] || 0,
      weatherCode: code,
      icon: hDesc.icon,
      label: hDesc.label,
    };
  });

  const formatTime = (iso) => {
    if (!iso) return "--:--";
    const d = new Date(iso);
    return d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true });
  };

  return {
    location: {
      latitude: lat,
      longitude: lng,
      timezone: data.timezone,
      city: cityName || "Your Location",
      displayName: cityName || "Current Farm Region",
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
      label: desc.label,
      labelHi: desc.labelHi,
      icon: desc.icon,
      condition: desc.condition,
      isDay: current.is_day === 1,
      sunrise: formatTime(daily.sunrise?.[0]),
      sunset: formatTime(daily.sunset?.[0]),
      uvIndex: daily.uv_index_max?.[0] || 0,
      updatedAt: current.time || new Date().toISOString(),
    },
    advisory,
    forecast,
    hourly: hourlyForecast,
    source: "client-direct",
  };
};

/**
 * Main fetchWeather function:
 * Calls Backend first; if backend times out or fails, falls back to direct client Open-Meteo!
 */
export const fetchWeather = async (latitude, longitude, cityName = "") => {
  const lat = Number(latitude) || 26.4499;
  const lng = Number(longitude) || 80.3319;

  try {
    const params = { latitude: lat, longitude: lng };
    const { data } = await api.get("/weather", { params, timeout: 6000 });
    // If backend returned actual data
    if (data?.current && data.source !== "seasonal-estimate") {
      if (cityName && data.location) {
        data.location.city = cityName;
        data.location.displayName = cityName;
      }
      return data;
    }
  } catch (backendError) {
    console.warn("fetchWeather: Backend proxy unreachable, switching to direct client Open-Meteo:", backendError.message);
  }

  // Fallback to direct client call
  return fetchDirectClientWeather(lat, lng, cityName);
};

/**
 * Search Indian towns and cities by name
 */
export const searchWeatherCities = async (query) => {
  if (!query || query.trim().length < 2) return [];

  try {
    const { data } = await api.get("/weather/search", { params: { q: query }, timeout: 4000 });
    if (data?.cities?.length > 0) return data.cities;
  } catch (err) {
    // Client fallback to Open-Meteo geocoding directly
  }

  try {
    const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(
      query.trim()
    )}&count=8&language=en&format=json`;
    const res = await axios.get(url, { timeout: 5000 });
    return (res.data?.results || []).map((item) => ({
      name: item.name,
      state: item.admin1 || "",
      country: item.country || "India",
      latitude: item.latitude,
      longitude: item.longitude,
      displayName: `${item.name}${item.admin1 ? `, ${item.admin1}` : ""}${
        item.country && item.country !== "India" ? ` (${item.country})` : ""
      }`,
    }));
  } catch (clientErr) {
    return [];
  }
};
