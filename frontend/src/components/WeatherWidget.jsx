import { useEffect, useState, useRef } from "react";
import { fetchWeather, searchWeatherCities } from "../services/weatherService";
import { useLanguage } from "../context/LanguageContext";
import { FaMapMarkerAlt, FaSearch, FaCrosshairs, FaTimes, FaCloudSun, FaTint, FaWind, FaSun } from "react-icons/fa";

function WeatherWidget({ latitude, longitude, compact = false, className = "" }) {
  const { isHindi } = useLanguage();
  const [weather, setWeather] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Custom city selection state
  const [selectedCoords, setSelectedCoords] = useState(() => {
    try {
      const saved = localStorage.getItem("krishisetu_weather_coords");
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const searchTimeoutRef = useRef(null);

  // Active lat/lng: prioritize user-selected city, then passed props, then Kanpur default
  const activeLat = selectedCoords?.lat ?? (latitude || 26.4499);
  const activeLng = selectedCoords?.lng ?? (longitude || 80.3319);
  const activeCityName = selectedCoords?.city || "";

  const loadWeather = async (lat = activeLat, lng = activeLng, cityName = activeCityName) => {
    try {
      setLoading(true);
      setError(false);
      const data = await fetchWeather(lat, lng, cityName);
      setWeather(data);
    } catch (err) {
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadWeather(activeLat, activeLng, activeCityName);
  }, [activeLat, activeLng, activeCityName]);

  // Handle GPS location detection
  const handleDetectLocation = () => {
    if (!navigator.geolocation) {
      alert(isHindi ? "आपके ब्राउज़र में जीपीएस सपोर्ट नहीं है" : "Geolocation not supported");
      return;
    }
    setLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const coords = { lat: pos.coords.latitude, lng: pos.coords.longitude, city: "Current Location" };
        setSelectedCoords(coords);
        localStorage.setItem("krishisetu_weather_coords", JSON.stringify(coords));
        setSearchOpen(false);
      },
      () => {
        setLoading(false);
        alert(isHindi ? "लोकेशन एक्सेस की अनुमति नहीं मिली" : "Unable to access your current location.");
      },
      { timeout: 8000 }
    );
  };

  // Search input debounce handler
  const handleSearchChange = (e) => {
    const val = e.target.value;
    setSearchQuery(val);
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);

    if (val.trim().length >= 2) {
      setSearchLoading(true);
      searchTimeoutRef.current = setTimeout(async () => {
        const results = await searchWeatherCities(val);
        setSearchResults(results);
        setSearchLoading(false);
      }, 350);
    } else {
      setSearchResults([]);
      setSearchLoading(false);
    }
  };

  // Select city from search results
  const handleSelectCity = (city) => {
    const coords = { lat: city.latitude, lng: city.longitude, city: city.name };
    setSelectedCoords(coords);
    localStorage.setItem("krishisetu_weather_coords", JSON.stringify(coords));
    setSearchOpen(false);
    setSearchQuery("");
    setSearchResults([]);
  };

  if (loading && !weather) {
    return (
      <div className={`animate-pulse rounded-2xl bg-slate-100 p-3.5 ${className}`}>
        <div className="flex items-center gap-3">
          <div className="h-6 w-6 rounded-full bg-slate-200"></div>
          <div className="h-4 w-48 rounded-md bg-slate-200"></div>
        </div>
      </div>
    );
  }

  if (error || !weather?.current) {
    return null;
  }

  const { current, advisory, forecast, hourly, location } = weather;
  const cityName = location?.city || activeCityName || "Kanpur";
  const stateName = location?.state || "UP";

  // Severity styling for advisory box
  const advisoryStyles = {
    warning: "border-blue-200 bg-blue-50/90 text-blue-900",
    caution: "border-amber-200 bg-amber-50/90 text-amber-900",
    ideal: "border-emerald-200 bg-emerald-50/90 text-emerald-950",
  }[advisory?.severity || "ideal"];

  // ==========================================
  // COMPACT MODE (Homepage & Header Banner)
  // ==========================================
  if (compact) {
    return (
      <>
        <div
          className={`group flex flex-wrap items-center justify-between gap-2.5 rounded-2xl border border-emerald-100 bg-white/95 px-3.5 py-2 text-xs shadow-xs backdrop-blur-md transition-all hover:border-emerald-300 ${className}`}
        >
          {/* Left: Location & Current Weather Badges */}
          <div
            onClick={() => setIsModalOpen(true)}
            className="flex cursor-pointer flex-wrap items-center gap-2"
            title="Click to view full 7-day agricultural forecast & hourly trends"
          >
            {/* City Tag */}
            <div className="flex items-center gap-1 rounded-lg bg-emerald-50 px-2 py-0.5 font-bold text-emerald-800 border border-emerald-200/60">
              <FaMapMarkerAlt className="text-[10px] text-emerald-600" />
              <span>{cityName}</span>
            </div>

            {/* Weather Metrics */}
            <div className="flex items-center gap-1.5 font-bold text-slate-800">
              <span className="text-base">{current.icon}</span>
              <span className="font-black text-sm">{current.temperature}°C</span>
              <span className="text-slate-500 font-medium hidden sm:inline">
                {isHindi && current.labelHi ? current.labelHi : current.label}
              </span>
            </div>

            <span className="text-slate-300">•</span>

            {/* Humidity */}
            <span className="font-semibold text-slate-600 hidden md:inline">
              💧 {current.humidity}% {isHindi ? "नमी" : "Humidity"}
            </span>

            {/* Rain Prob Pill */}
            {current.rainProbability > 10 && (
              <span className="rounded-full bg-blue-100 px-2 py-0.5 font-bold text-blue-700">
                🌧️ {current.rainProbability}% {isHindi ? "बारिश" : "Rain"}
              </span>
            )}
          </div>

          {/* Right: Quick Action Controls */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setSearchOpen(!searchOpen)}
              className="flex items-center gap-1 rounded-xl bg-slate-50 px-2.5 py-1 text-[11px] font-bold text-slate-700 hover:bg-emerald-50 hover:text-emerald-700 transition"
              title="Change city or search town"
            >
              <FaSearch className="text-[9px]" />
              <span>{isHindi ? "शहर बदलें" : "Change City"}</span>
            </button>

            <button
              type="button"
              onClick={() => setIsModalOpen(true)}
              className="rounded-xl bg-emerald-600 px-3 py-1 text-[11px] font-bold text-white shadow-2xs hover:bg-emerald-700 transition"
            >
              {isHindi ? "पूरा मौसम ❯" : "7-Day Forecast ❯"}
            </button>
          </div>
        </div>

        {/* Quick Search Popover */}
        {searchOpen && (
          <div className="relative z-50 mt-1.5 rounded-2xl border border-slate-200 bg-white p-3 shadow-xl">
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <FaSearch className="absolute left-3 top-3 text-slate-400" />
                <input
                  type="text"
                  placeholder={isHindi ? "अपना शहर / कस्बा खोजें (उदा. Kanpur, Lucknow)..." : "Search city or town (e.g. Kanpur, Delhi, Pune)..."}
                  value={searchQuery}
                  onChange={handleSearchChange}
                  autoFocus
                  className="w-full rounded-xl border border-slate-200 py-2 pl-9 pr-3 text-xs outline-none focus:border-emerald-500"
                />
              </div>
              <button
                type="button"
                onClick={handleDetectLocation}
                className="flex items-center gap-1 rounded-xl bg-emerald-50 px-3 py-2 text-xs font-bold text-emerald-800 hover:bg-emerald-100 transition"
                title="Detect GPS location"
              >
                <FaCrosshairs />
                <span>{isHindi ? "जीपीएस" : "GPS"}</span>
              </button>
              <button
                type="button"
                onClick={() => setSearchOpen(false)}
                className="rounded-xl p-2 text-slate-400 hover:bg-slate-100"
              >
                <FaTimes />
              </button>
            </div>

            {/* Results list */}
            {searchResults.length > 0 && (
              <div className="mt-2 max-h-48 overflow-y-auto divide-y divide-slate-100 rounded-xl border border-slate-100 bg-white shadow-inner">
                {searchResults.map((res, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => handleSelectCity(res)}
                    className="flex w-full items-center justify-between px-3 py-2 text-left text-xs hover:bg-emerald-50 text-slate-700"
                  >
                    <span className="font-bold">{res.displayName}</span>
                    <span className="text-[10px] text-slate-400">{res.country}</span>
                  </button>
                ))}
              </div>
            )}
            {searchLoading && <p className="mt-2 text-center text-xs text-slate-400">Searching towns...</p>}
          </div>
        )}

        {/* Rich Modal Popup for Compact View */}
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-3 sm:p-4 backdrop-blur-xs animate-fade-in">
            <div className="relative max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-3xl bg-white p-5 sm:p-7 shadow-2xl">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 transition"
              >
                <FaTimes />
              </button>

              <WeatherDetailsContent
                weather={weather}
                isHindi={isHindi}
                cityName={cityName}
                stateName={stateName}
                onRefresh={() => loadWeather()}
                onOpenSearch={() => {
                  setIsModalOpen(false);
                  setSearchOpen(true);
                }}
              />
            </div>
          </div>
        )}
      </>
    );
  }

  // ==========================================
  // FULL RICH DASHBOARD MODE (Farmer Dashboard)
  // ==========================================
  return (
    <article
      className={`overflow-hidden rounded-3xl sm:rounded-4xl border border-slate-100 bg-gradient-to-br from-white via-slate-50/50 to-emerald-50/30 p-5 sm:p-7 shadow-sm transition-all ${className}`}
    >
      <WeatherDetailsContent
        weather={weather}
        isHindi={isHindi}
        cityName={cityName}
        stateName={stateName}
        onRefresh={() => loadWeather()}
        onOpenSearch={() => setSearchOpen(true)}
      />

      {/* Inline Search Modal for Farmer Dashboard */}
      {searchOpen && (
        <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50/60 p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-emerald-900">
              {isHindi ? "📍 अपना जिला / कस्बा खोजें:" : "📍 Search Farm District / Tehsil:"}
            </span>
            <button type="button" onClick={() => setSearchOpen(false)} className="text-slate-400 hover:text-slate-600">
              <FaTimes />
            </button>
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder={isHindi ? "जिले का नाम लिखें (उदा. Kanpur, Barabanki, Lucknow)..." : "Type town name (e.g. Kanpur, Lucknow, Varanasi)..."}
              value={searchQuery}
              onChange={handleSearchChange}
              autoFocus
              className="flex-1 rounded-xl border border-slate-200 px-3.5 py-2 text-xs bg-white outline-none focus:border-emerald-500"
            />
            <button
              type="button"
              onClick={handleDetectLocation}
              className="flex items-center gap-1 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-700 transition"
            >
              <FaCrosshairs />
              <span>{isHindi ? "जीपीएस लगाएं" : "Auto GPS"}</span>
            </button>
          </div>

          {searchResults.length > 0 && (
            <div className="mt-2 max-h-48 overflow-y-auto divide-y divide-slate-100 rounded-xl border border-slate-100 bg-white">
              {searchResults.map((res, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => handleSelectCity(res)}
                  className="flex w-full items-center justify-between px-3 py-2 text-left text-xs hover:bg-emerald-50 text-slate-700"
                >
                  <span className="font-bold">{res.displayName}</span>
                  <span className="text-[10px] text-slate-400">{res.country}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </article>
  );
}

/**
 * Shared Full Weather View Content Component
 */
function WeatherDetailsContent({ weather, isHindi, cityName, stateName, onRefresh, onOpenSearch }) {
  const { current, advisory, forecast, hourly } = weather;

  const advisoryStyles = {
    warning: "border-blue-200 bg-blue-50/90 text-blue-900",
    caution: "border-amber-200 bg-amber-50/90 text-amber-900",
    ideal: "border-emerald-200 bg-emerald-50/90 text-emerald-950",
  }[advisory?.severity || "ideal"];

  return (
    <div className="space-y-6">
      {/* Top Header Row */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-600 text-xl text-white shadow-xs">
            ⛅
          </span>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg sm:text-xl font-black text-slate-900">
                {isHindi ? "किसान मौसम सेवा व कृषि सलाह" : "Kisan Mausam Seva & Agri-Advisory"}
              </h2>
              <span className="flex items-center gap-1 rounded-full bg-emerald-100/80 px-2.5 py-0.5 text-xs font-bold text-emerald-800">
                <FaMapMarkerAlt className="text-[10px] text-emerald-600" />
                {cityName}{stateName ? `, ${stateName}` : ""}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              {isHindi
                ? "खेत का लाइव मौसम पूर्वानुमान एवं फसल सुरक्षा निर्देश"
                : "Real-time farm meteorological forecast & harvest protection recommendations"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onOpenSearch}
            className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50 transition"
          >
            🔍 {isHindi ? "स्थान बदलें" : "Change Location"}
          </button>
          <button
            type="button"
            onClick={onRefresh}
            className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-600 hover:bg-slate-50 active:scale-95 transition"
            title="Refresh live weather"
          >
            🔄 {isHindi ? "ताज़ा करें" : "Refresh"}
          </button>
        </div>
      </div>

      {/* Main Meteorological Metrics Grid */}
      <div className="grid gap-4 lg:grid-cols-[1.1fr_1.9fr]">
        {/* Left Hero Card: Current Weather Condition */}
        <div className="flex flex-col justify-between rounded-3xl bg-gradient-to-br from-emerald-800 via-teal-900 to-slate-900 p-5 sm:p-6 text-white shadow-md">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-emerald-200">
                📍 {cityName} Ambient Weather
              </p>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-4xl sm:text-5xl font-black">{current.temperature}°C</span>
                <span className="text-sm font-semibold text-emerald-100">
                  Feels {current.feelsLike}°C
                </span>
              </div>
              <p className="mt-1 text-sm font-bold text-emerald-300">
                {isHindi && current.labelHi ? current.labelHi : current.label}
              </p>
            </div>
            <span className="text-5xl sm:text-6xl drop-shadow-md">{current.icon}</span>
          </div>

          <div className="mt-6 grid grid-cols-3 gap-2 border-t border-white/10 pt-4 text-center">
            <div>
              <p className="text-[10px] uppercase font-bold text-slate-300">Humidity</p>
              <p className="mt-0.5 text-base font-black text-white">{current.humidity}%</p>
            </div>
            <div>
              <p className="text-[10px] uppercase font-bold text-slate-300">Wind</p>
              <p className="mt-0.5 text-base font-black text-white">{current.windSpeed} km/h</p>
            </div>
            <div>
              <p className="text-[10px] uppercase font-bold text-slate-300">Rain Prob.</p>
              <p className="mt-0.5 text-base font-black text-emerald-300">{current.rainProbability}%</p>
            </div>
          </div>

          {(current.sunrise || current.sunset) && (
            <div className="mt-3 flex items-center justify-between border-t border-white/10 pt-3 text-[11px] text-emerald-200">
              <span>🌅 Sunrise: {current.sunrise}</span>
              <span>🌇 Sunset: {current.sunset}</span>
            </div>
          )}
        </div>

        {/* Right: Smart Actionable Agri-Advisory Banner */}
        <div className="flex flex-col justify-between space-y-4">
          <div className={`rounded-3xl border p-5 shadow-xs ${advisoryStyles}`}>
            <div className="flex items-center gap-2">
              <span className="rounded-full bg-white/80 px-2.5 py-0.5 text-xs font-black shadow-2xs backdrop-blur-xs">
                {advisory.badge}
              </span>
            </div>

            <h3 className="mt-2.5 text-base sm:text-lg font-black leading-snug">
              {isHindi && advisory.titleHi ? advisory.titleHi : advisory.title}
            </h3>

            <p className="mt-2 text-xs sm:text-sm leading-relaxed opacity-90">
              {isHindi && advisory.adviceHi ? advisory.adviceHi : advisory.advice}
            </p>

            {(advisory.farmerTip || advisory.farmerTipHi) && (
              <div className="mt-3.5 flex items-center gap-2 rounded-2xl bg-white/70 p-2.5 text-xs font-bold border border-white/80">
                <span>💡</span>
                <span>
                  Kisan Pro-Tip: {isHindi && advisory.farmerTipHi ? advisory.farmerTipHi : advisory.farmerTip}
                </span>
              </div>
            )}
          </div>

          {/* 7-Day Farm Forecast Outlook */}
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
              📅 7-Day Agricultural Forecast Outlook (7 दिवसीय पूर्वानुमान):
            </p>
            <div className="grid grid-cols-7 gap-1.5 sm:gap-2 overflow-x-auto pb-1">
              {forecast?.map((day) => (
                <div
                  key={day.date}
                  className="flex flex-col items-center justify-between rounded-2xl border border-slate-100 bg-white p-2 text-center shadow-2xs min-w-[4.2rem]"
                >
                  <p className="text-[11px] font-bold text-slate-700">{day.dayName}</p>
                  <span className="my-1 text-2xl">{day.icon}</span>
                  <div className="text-xs font-black text-slate-900">
                    {day.maxTemp}° <span className="text-[10px] font-medium text-slate-400">{day.minTemp}°</span>
                  </div>
                  {day.rainProb > 10 ? (
                    <span className="mt-1 rounded-md bg-blue-50 px-1 py-0.5 text-[9px] font-bold text-blue-700">
                      💧{day.rainProb}%
                    </span>
                  ) : (
                    <span className="mt-1 text-[9px] font-bold text-emerald-600">Dry</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Next 24-Hour Hourly Timeline */}
      {hourly && hourly.length > 0 && (
        <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-2xs">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
            ⏱️ Next 24 Hours Hourly Farm Trend (आगामी 24 घंटे का तापमान व बारिश):
          </p>
          <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-thin">
            {hourly.map((h, idx) => (
              <div
                key={idx}
                className="flex flex-col items-center rounded-xl bg-slate-50/80 px-3 py-2 text-center min-w-[4rem] flex-shrink-0"
              >
                <span className="text-[10px] font-bold text-slate-500">{h.hour}</span>
                <span className="my-1 text-lg">{h.icon}</span>
                <span className="text-xs font-black text-slate-800">{h.temp}°C</span>
                {h.rainProb > 10 && (
                  <span className="mt-0.5 text-[9px] font-bold text-blue-600">💧{h.rainProb}%</span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default WeatherWidget;
