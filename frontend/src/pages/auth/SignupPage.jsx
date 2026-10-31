import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import ErrorAlert from "../../components/ErrorAlert";
import { useAuth } from "../../context/AuthContext";
import { useLanguage } from "../../context/LanguageContext";
import { DEFAULT_LOCATION, getCurrentCoordinates } from "../../utils/location";

function SignupPage() {
  const navigate = useNavigate();
  const { signup, loading, error, clearAuthError } = useAuth();
  const { isHindi } = useLanguage();
  const [locationLoading, setLocationLoading] = useState(false);
  const [locationError, setLocationError] = useState("");
  const [formData, setFormData] = useState({
    storeName: "",
    email: "",
    password: "",
    role: "customer",
    phone: "",
    whatsappPhone: "",
    isWhatsappSameAsPhone: true,
    latitude: DEFAULT_LOCATION.latitude,
    longitude: DEFAULT_LOCATION.longitude,
  });

  const handleChange = (event) => {
    clearAuthError();
    setFormData((current) => ({
      ...current,
      [event.target.name]: event.target.value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    try {
      const user = await signup(formData);
      navigate(user.role === "farmer" ? "/farmer/dashboard" : "/", { replace: true });
    } catch (error) {}
  };

  const handleUseCurrentLocation = async () => {
    try {
      setLocationLoading(true);
      setLocationError("");
      const coordinates = await getCurrentCoordinates();
      setFormData((current) => ({
        ...current,
        ...coordinates,
      }));
    } catch (error) {
      setLocationError(error.message);
    } finally {
      setLocationLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-4xl rounded-[2rem] bg-white p-6 shadow-xl md:p-10">
      <div className="grid gap-8 md:grid-cols-[1.1fr_0.9fr]">
        <div>
          <p className="text-sm uppercase tracking-[0.3em] text-emerald-700">{isHindi ? "मार्केटप्लेस से जुड़ें" : "Join the marketplace"}</p>
          <h1 className="mt-4 text-4xl font-bold text-slate-900">
            {isHindi ? "कृषिसेतु पर अपना नया खाता बनाएं।" : "Create your farmer marketplace account."}
          </h1>
          <p className="mt-3 text-sm text-slate-500">
            {isHindi
              ? "नज़दीकी खेतों से ताज़ा उपज खरीदने के लिए ग्राहक के रूप में, या फसलें सूचीबद्ध करने और ऑर्डर्स प्राप्त करने के लिए किसान के रूप में रजिस्टर करें।"
              : "Register as a customer to shop nearby, or as a farmer to list fresh products and manage incoming orders."}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <ErrorAlert message={error} />
          <ErrorAlert message={locationError} />

          <input
            type="text"
            name="storeName"
            placeholder={isHindi ? "खेत या आपका पूरा नाम *" : "Store or full name *"}
            value={formData.storeName}
            onChange={handleChange}
            required
            className="w-full rounded-2xl border border-slate-200 px-4 py-3 focus:border-emerald-500 focus:outline-none"
          />
          <input
            type="email"
            name="email"
            placeholder={isHindi ? "ईमेल पता *" : "Email *"}
            value={formData.email}
            onChange={handleChange}
            required
            className="w-full rounded-2xl border border-slate-200 px-4 py-3 focus:border-emerald-500 focus:outline-none"
          />
          <input
            type="password"
            name="password"
            placeholder={isHindi ? "पासवर्ड (न्यूनतम 6 अक्षर) *" : "Password (Min 6 characters) *"}
            value={formData.password}
            onChange={handleChange}
            required
            className="w-full rounded-2xl border border-slate-200 px-4 py-3 focus:border-emerald-500 focus:outline-none"
          />
          <input
            type="text"
            name="phone"
            placeholder={isHindi ? "फ़ोन नंबर *" : "Phone number *"}
            value={formData.phone}
            onChange={handleChange}
            required
            className="w-full rounded-2xl border border-slate-200 px-4 py-3 focus:border-emerald-500 focus:outline-none"
          />

          <div className="rounded-2xl border border-slate-100 bg-slate-50 p-3">
            <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-700">
              <input
                type="checkbox"
                checked={formData.isWhatsappSameAsPhone ?? true}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    isWhatsappSameAsPhone: e.target.checked,
                    whatsappPhone: e.target.checked ? "" : formData.whatsappPhone,
                  })
                }
                className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
              />
              <span>💬 {isHindi ? "व्हाट्सएप नंबर कॉलिंग नंबर के समान है" : "Same as my WhatsApp number"}</span>
            </label>

            {!formData.isWhatsappSameAsPhone && (
              <input
                type="text"
                name="whatsappPhone"
                placeholder={isHindi ? "वैकल्पिक व्हाट्सएप नंबर (ऑर्डर अपडेट्स हेतु)" : "Alternate WhatsApp number (for order updates)"}
                value={formData.whatsappPhone || ""}
                onChange={handleChange}
                className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs focus:border-emerald-500 focus:outline-none"
              />
            )}
          </div>

          <select
            name="role"
            value={formData.role}
            onChange={handleChange}
            className="w-full rounded-2xl border border-slate-200 px-4 py-3 focus:border-emerald-500 focus:outline-none font-semibold text-slate-800"
          >
            <option value="customer">{isHindi ? "🛒 ग्राहक (Customer - उपज खरीदने हेतु)" : "Customer (Buy produce)"}</option>
            <option value="farmer">{isHindi ? "🌾 किसान (Farmer - फसल बेचने हेतु)" : "Farmer (Sell produce)"}</option>
          </select>

          <div className="grid gap-4 sm:grid-cols-2">
            <input
              type="text"
              name="latitude"
              placeholder={isHindi ? "अक्षांश (Latitude)" : "Latitude"}
              value={formData.latitude}
              onChange={handleChange}
              required
              className="w-full rounded-2xl border border-slate-200 px-4 py-3 focus:border-emerald-500 focus:outline-none"
            />
            <input
              type="text"
              name="longitude"
              placeholder={isHindi ? "देशांतर (Longitude)" : "Longitude"}
              value={formData.longitude}
              onChange={handleChange}
              required
              className="w-full rounded-2xl border border-slate-200 px-4 py-3 focus:border-emerald-500 focus:outline-none"
            />
          </div>

          <button
            type="button"
            onClick={handleUseCurrentLocation}
            disabled={locationLoading}
            className="w-full rounded-2xl border border-emerald-200 px-4 py-3 font-semibold text-emerald-700 hover:bg-emerald-50 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {locationLoading ? (isHindi ? "लोकेशन खोजी जा रही है..." : "Finding location...") : (isHindi ? "📍 वर्तमान GPS लोकेशन उपयोग करें" : "Use Current Location")}
          </button>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-2xl bg-emerald-600 px-4 py-3 font-semibold text-white hover:bg-emerald-700 disabled:opacity-70"
          >
            {loading ? (isHindi ? "खाता बनाया जा रहा है..." : "Creating account...") : (isHindi ? "नया खाता बनाएं" : "Create Account")}
          </button>

          <p className="text-sm text-slate-500">
            {isHindi ? "पहले से खाता है? " : "Already have an account? "}
            <Link to="/login" className="font-semibold text-emerald-700">
              {isHindi ? "यहाँ लॉगिन करें" : "Login here"}
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}

export default SignupPage;
