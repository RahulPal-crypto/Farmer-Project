import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

import ErrorAlert from "../../components/ErrorAlert";
import VoiceInputButton from "../../components/VoiceInputButton";
import { useLanguage } from "../../context/LanguageContext";
import { getApiErrorMessage } from "../../services/api";
import { addProduct } from "../../services/productService";
import { DEFAULT_LOCATION, getCurrentCoordinates } from "../../utils/location";

const initialForm = {
  name: "",
  price: "",
  quantity: "",
  category: "",
  commodityKey: "",
  harvestDate: "",
  latitude: DEFAULT_LOCATION.latitude,
  longitude: DEFAULT_LOCATION.longitude,
};

function AddProductPage() {
  const navigate = useNavigate();
  const { isHindi, t } = useLanguage();
  const [formData, setFormData] = useState(initialForm);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [locationLoading, setLocationLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleImageChange = (event) => {
    setError("");
    const file = event.target.files?.[0] || null;
    setImageFile(file);
    if (file) {
      setImagePreview(URL.createObjectURL(file));
    } else {
      setImagePreview(null);
    }
  };

  const handleChange = (event) => {
    setSuccess("");
    setError("");
    setFormData((current) => ({
      ...current,
      [event.target.name]: event.target.value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!imageFile) {
      setError("Product photo is mandatory. Please upload an authentic photo of your produce.");
      return;
    }

    try {
      setLoading(true);
      setError("");
      setSuccess("");

      if (
        formData.latitude === DEFAULT_LOCATION.latitude &&
        formData.longitude === DEFAULT_LOCATION.longitude &&
        typeof navigator !== "undefined" &&
        navigator.permissions
      ) {
        try {
          const perm = await navigator.permissions.query({ name: "geolocation" });
          if (perm.state === "granted" || perm.state === "prompt") {
            const coordinates = await getCurrentCoordinates();
            setFormData((current) => ({ ...current, ...coordinates }));
          }
        } catch (e) {
          // ignore
        }
      }

      const payload = new FormData();
      Object.entries(formData).forEach(([key, value]) => {
        if (value !== "" && value !== null && value !== undefined) {
          payload.append(key, value);
        }
      });

      if (imageFile) {
        payload.append("image", imageFile);
      }

      await addProduct(payload);
      setSuccess("Product added successfully with Mandi benchmark linkage.");
      setFormData(initialForm);
      setImageFile(null);
      setImagePreview(null);
    } catch (error) {
      const status = error?.response?.status;
      if (status === 401) {
        setError("Not authorized, please login again.");
        setTimeout(() => navigate("/login"), 1400);
      } else {
        setError(getApiErrorMessage(error, "Unable to add product"));
      }
    } finally {
      setLoading(false);
    }
  };

  const handleUseCurrentLocation = async () => {
    try {
      setLocationLoading(true);
      setError("");
      setSuccess("");
      const coordinates = await getCurrentCoordinates();
      setFormData((current) => ({
        ...current,
        ...coordinates,
      }));
    } catch (error) {
      setError(error.message);
    } finally {
      setLocationLoading(false);
    }
  };

  useEffect(() => {
    let cancelled = false;

    const tryAutoFill = async () => {
      if (typeof navigator === "undefined" || !navigator.permissions) return;

      try {
        const perm = await navigator.permissions.query({ name: "geolocation" });
        if (perm.state === "granted") {
          try {
            const coordinates = await getCurrentCoordinates();
            if (!cancelled) {
              setFormData((current) => ({ ...current, ...coordinates }));
            }
          } catch (e) {
            // ignore
          }
        }
      } catch (e) {
        // ignore
      }
    };

    tryAutoFill();

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="mx-auto max-w-3xl rounded-3xl bg-white p-6 shadow-sm md:p-8">
      <div>
        <h1 className="text-3xl font-black text-slate-900">{t("farmer_add_title", "Add New Crop Produce")}</h1>
        <p className="mt-2 text-sm text-slate-500">
          {t("farmer_add_desc", "List your fresh harvest, connect with local buyers, and compare rates against APMC Mandi prices.")}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        <ErrorAlert message={error} />
        {success && (
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-800">
            {success}
          </div>
        )}

        {/* Produce Name & Category */}
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                {t("farmer_crop_name", "Produce / Crop Name")} *
              </label>
              <VoiceInputButton
                onVoiceInput={(text) => {
                  setFormData((prev) => ({ ...prev, name: text }));
                }}
              />
            </div>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="e.g. Desi Hybrid Tomato, Aloo, Sharbati Gehun"
              required
              className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm focus:border-emerald-500 focus:outline-none"
            />
          </div>
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                {t("farmer_category", "Category")} *
              </label>
              <VoiceInputButton
                onVoiceInput={(text) => {
                  setFormData((prev) => ({ ...prev, category: text }));
                }}
              />
            </div>
            <input
              type="text"
              name="category"
              value={formData.category}
              onChange={handleChange}
              placeholder="e.g. Vegetables, Grains, Fruits, Dairy"
              required
              className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm focus:border-emerald-500 focus:outline-none"
            />
          </div>
        </div>

        {/* Price & Quantity */}
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
              {t("farmer_price", "Your Price (Rs. per kg / unit)")} *
            </label>
            <input
              type="number"
              name="price"
              min="0"
              step="any"
              value={formData.price}
              onChange={handleChange}
              placeholder="e.g. 30"
              required
              className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm focus:border-emerald-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
              {t("farmer_quantity", "Available Stock Quantity (kg / units)")} *
            </label>
            <input
              type="number"
              name="quantity"
              min="1"
              value={formData.quantity}
              onChange={handleChange}
              placeholder="e.g. 50"
              required
              className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm focus:border-emerald-500 focus:outline-none"
            />
          </div>
        </div>

        {/* Government Mandi Benchmark Crop Selector */}
        <div className="rounded-2xl border border-emerald-100 bg-emerald-50/50 p-4">
          <label className="block text-xs font-bold uppercase tracking-wider text-emerald-950">
            🏛️ Government Mandi Benchmark Crop (For Price Comparison Badge)
          </label>
          <select
            name="commodityKey"
            value={formData.commodityKey || ""}
            onChange={handleChange}
            className="mt-2 w-full rounded-xl border border-emerald-200 bg-white px-3.5 py-2.5 text-sm font-semibold text-slate-800 outline-none focus:border-emerald-500"
          >
            <option value="">Auto-Detect from Produce Name & Category (Recommended)</option>
            <option value="tomato">🍅 Tomato (Tamatar)</option>
            <option value="potato">🥔 Potato (Aloo)</option>
            <option value="onion">🧅 Onion (Pyaaz / Kanda)</option>
            <option value="wheat">🌾 Wheat (Gehun / Grain)</option>
            <option value="rice">🍚 Rice / Paddy (Chawal / Dhan)</option>
            <option value="maize">🌽 Maize / Corn / Barley (Makka)</option>
            <option value="carrot">🥕 Carrot (Gajar)</option>
            <option value="garlic">🧄 Garlic (Lehsun)</option>
            <option value="ginger">🫚 Ginger (Adrak)</option>
            <option value="apple">🍎 Apple (Seb)</option>
            <option value="banana">🍌 Banana (Kela)</option>
            <option value="cauliflower">🥦 Cauliflower (Gobhi)</option>
          </select>
          <p className="mt-1.5 text-xs text-slate-500">
            Matching this links APMC Mandi rates to display savings badge to customers (e.g. "Govt: Rs. 28/kg • Save Rs. 4").
          </p>
        </div>

        {/* Harvest Date / Freshness */}
        <div className="rounded-2xl border border-slate-200 bg-slate-50/60 p-4">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-slate-700">
                🌾 Harvest Date & Time (Optional)
              </p>
              <p className="text-xs text-slate-500">Displays a "Harvested Today" freshness badge to attract buyers</p>
            </div>
            <button
              type="button"
              onClick={() => {
                const now = new Date();
                const offset = now.getTimezoneOffset() * 60000;
                const localISOTime = new Date(now.getTime() - offset).toISOString().slice(0, 16);
                setFormData((prev) => ({ ...prev, harvestDate: localISOTime }));
              }}
              className="rounded-xl border border-emerald-300 bg-white px-3 py-1.5 text-xs font-bold text-emerald-800 shadow-xs hover:bg-emerald-50"
            >
              🌿 Harvested Today (Just Now)
            </button>
          </div>
          <div className="mt-2.5">
            <input
              type="datetime-local"
              name="harvestDate"
              value={formData.harvestDate || ""}
              onChange={handleChange}
              className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-800 focus:border-emerald-500 focus:outline-none"
            />
          </div>
        </div>

        {/* Farm Location Coordinates */}
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-3">
            <div>
              <p className="font-bold text-sm text-slate-800">Farm Location Coordinates</p>
              <p className="text-xs text-slate-500">Used for customer proximity searches and distance display</p>
            </div>
            <button
              type="button"
              onClick={handleUseCurrentLocation}
              disabled={locationLoading}
              className="rounded-xl border border-emerald-500 px-3.5 py-1.5 text-xs font-bold text-emerald-700 hover:bg-emerald-100 disabled:opacity-60"
            >
              {locationLoading ? (isHindi ? "लोकेशन खोजी जा रही है..." : "Pinpointing...") : t("farmer_pinpoint", "📍 Pinpoint Current Location")}
            </button>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <input
              type="text"
              name="latitude"
              value={formData.latitude}
              onChange={handleChange}
              placeholder="Latitude"
              required
              className="rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm"
            />
            <input
              type="text"
              name="longitude"
              value={formData.longitude}
              onChange={handleChange}
              placeholder="Longitude"
              required
              className="rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm"
            />
          </div>
        </div>

        {/* Product Photo Upload (Mandatory) */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
            Produce Photo * (Mandatory authentic farm harvest photo)
          </label>
          <input
            type="file"
            accept="image/*"
            required
            onChange={handleImageChange}
            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm file:mr-4 file:rounded-xl file:border-0 file:bg-emerald-100 file:px-4 file:py-2 file:text-xs file:font-bold file:text-emerald-800 hover:file:bg-emerald-200 cursor-pointer"
          />

          {imagePreview && (
            <div className="mt-3 flex items-center gap-3 rounded-2xl bg-slate-50 p-3 border border-slate-200">
              <img
                src={imagePreview}
                alt="Product preview"
                className="h-16 w-16 rounded-xl object-cover border border-slate-200"
              />
              <div>
                <p className="text-xs font-bold text-slate-800">Uploaded Produce Preview</p>
                <p className="text-[11px] text-slate-500">
                  {imageFile?.name} ({(imageFile?.size / 1024).toFixed(0)} KB)
                </p>
              </div>
            </div>
          )}
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-2xl bg-emerald-600 px-4 py-3.5 text-sm font-bold text-white shadow-md hover:bg-emerald-700 active:scale-98 transition disabled:opacity-60"
        >
          {loading ? (isHindi ? "फसल बाज़ार में जोड़ी जा रही है..." : "Publishing Produce Listing...") : t("farmer_submit_btn", "Publish Produce Listing")}
        </button>
      </form>
    </div>
  );
}

export default AddProductPage;
