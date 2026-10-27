import { useEffect, useState } from "react";
import { fetchWeather } from "../services/weatherService";
import { useLanguage } from "../context/LanguageContext";

function WeatherWidget({ latitude, longitude, compact = false, className = "" }) {
  const { isHindi, t } = useLanguage();
  const [weather, setWeather] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const loadWeather = async () => {
    try {
      setLoading(true);
      setError(false);
      const data = await fetchWeather(latitude, longitude);
      setWeather(data);
    } catch (err) {
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadWeather();
  }, [latitude, longitude]);

  if (loading) {
    return (
      <div className={`animate-pulse rounded-3xl bg-slate-100 p-4 ${className}`}>
        <div className="h-6 w-36 rounded-md bg-slate-200"></div>
        <div className="mt-3 h-12 w-full rounded-xl bg-slate-200"></div>
      </div>
    );
  }

  if (error || !weather?.current) {
    return null;
  }

  const { current, advisory, forecast } = weather;

  // Severity styling for advisory box
  const advisoryStyles = {
    warning: "border-blue-200 bg-blue-50/90 text-blue-900",
    caution: "border-amber-200 bg-amber-50/90 text-amber-900",
    ideal: "border-emerald-200 bg-emerald-50/90 text-emerald-950",
  }[advisory?.severity || "ideal"];

  // Compact Mode (for Customer Homepage / Header Banner)
  if (compact) {
    return (
      <div
        className={`flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-emerald-100 bg-white/95 px-4 py-2 text-xs shadow-xs backdrop-blur-md ${className}`}
      >
        <div className="flex items-center gap-2">
          <span className="text-xl">{current.icon}</span>
          <span className="font-black text-slate-900">{current.temperature}°C</span>
          <span className="font-semibold text-slate-500">{current.label}</span>
          <span className="text-slate-300">•</span>
          <span className="font-bold text-emerald-700">💧 {current.humidity}% Humidity</span>
          {current.rainProbability > 10 && (
            <span className="rounded-full bg-blue-100 px-2 py-0.5 font-bold text-blue-700">
              🌧️ {current.rainProbability}% Rain
            </span>
          )}
        </div>
        <div className="hidden sm:flex items-center gap-1.5 text-slate-600">
          <span>🌾</span>
          <span className="font-medium truncate max-w-sm">
            {advisory?.type === "rain"
              ? "Rain expected: Farmers securing fresh harvests"
              : "Ideal harvest conditions across partner farms"}
          </span>
        </div>
      </div>
    );
  }

  // Full Rich Dashboard Mode (for Farmer Dashboard)
  return (
    <article
      className={`overflow-hidden rounded-3xl sm:rounded-4xl border border-slate-100 bg-gradient-to-br from-white via-slate-50/50 to-emerald-50/30 p-5 sm:p-7 shadow-sm transition-all ${className}`}
    >
      {/* Top Header Row */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
        <div className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-2xl bg-emerald-600 text-lg text-white shadow-xs">
            ⛅
          </span>
          <div>
            <h2 className="text-lg sm:text-xl font-black text-slate-900">
              {isHindi ? "किसान मौसम सेवा व कृषि सलाह" : "Kisan Mausam Seva & Agri-Advisory"}
            </h2>
            <p className="text-xs text-slate-500">
              {isHindi
                ? "खेत का लाइव मौसम पूर्वानुमान एवं फसल सुरक्षा निर्देश"
                : "Real-time farm meteorological forecast & harvest protection recommendations"}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={loadWeather}
          className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-600 hover:bg-slate-50 active:scale-95 transition"
          title="Refresh live weather"
        >
          {isHindi ? "🔄 ताज़ा करें" : "🔄 Refresh"}
        </button>
      </div>

      {/* Main Meteorological Metrics Grid */}
      <div className="mt-5 grid gap-4 lg:grid-cols-[1.1fr_1.9fr]">
        {/* Left Current Condition Hero Card */}
        <div className="flex flex-col justify-between rounded-3xl bg-gradient-to-br from-emerald-800 via-teal-900 to-slate-900 p-5 sm:p-6 text-white shadow-md">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-emerald-200">
                Farm Ambient Weather
              </p>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-4xl sm:text-5xl font-black">{current.temperature}°C</span>
                <span className="text-sm font-semibold text-emerald-100">
                  Feels like {current.feelsLike}°C
                </span>
              </div>
              <p className="mt-1 text-sm font-bold text-emerald-300">{current.label}</p>
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
              <p className="mt-0.5 text-base font-black text-emerald-300">
                {current.rainProbability}%
              </p>
            </div>
          </div>
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
              {advisory.title}
            </h3>

            <p className="mt-2 text-xs sm:text-sm leading-relaxed opacity-90">
              {advisory.advice}
            </p>

            {advisory.farmerTip && (
              <div className="mt-3.5 flex items-center gap-2 rounded-2xl bg-white/70 p-2.5 text-xs font-bold border border-white/80">
                <span>💡</span>
                <span>Kisan Pro-Tip: {advisory.farmerTip}</span>
              </div>
            )}
          </div>

          {/* 5-Day Farm Forecast Mini Pills Slider */}
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
              📅 5-Day Agricultural Forecast Outlook:
            </p>
            <div className="grid grid-cols-5 gap-2">
              {forecast?.map((day) => (
                <div
                  key={day.dayName}
                  className="flex flex-col items-center justify-between rounded-2xl border border-slate-100 bg-white p-2.5 text-center shadow-2xs"
                >
                  <p className="text-[11px] font-bold text-slate-700">{day.dayName}</p>
                  <span className="my-1 text-2xl">{day.icon}</span>
                  <div className="text-xs font-black text-slate-900">
                    {day.maxTemp}° <span className="text-[10px] font-medium text-slate-400">{day.minTemp}°</span>
                  </div>
                  {day.rainProb > 10 ? (
                    <span className="mt-1 rounded-md bg-blue-50 px-1 py-0.5 text-[10px] font-bold text-blue-700">
                      💧{day.rainProb}%
                    </span>
                  ) : (
                    <span className="mt-1 text-[10px] font-bold text-emerald-600">Dry</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </article>
  );
}

export default WeatherWidget;

