import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import ErrorAlert from "../../components/ErrorAlert";
import { useAuth } from "../../context/AuthContext";
import { DEFAULT_LOCATION, getCurrentCoordinates } from "../../utils/location";

function SignupPage() {
  const navigate = useNavigate();
  const { signup, loading, error, clearAuthError } = useAuth();
  const [locationLoading, setLocationLoading] = useState(false);
  const [locationError, setLocationError] = useState("");
  const [formData, setFormData] = useState({
    storeName: "",
    email: "",
    password: "",
    role: "customer",
    phone: "",
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
          <p className="text-sm uppercase tracking-[0.3em] text-emerald-700">Join the marketplace</p>
          <h1 className="mt-4 text-4xl font-bold text-slate-900">Create your farmer marketplace account.</h1>
          <p className="mt-3 text-sm text-slate-500">
            Register as a customer to shop nearby, or as a farmer to list fresh products and manage incoming orders.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <ErrorAlert message={error} />
          <ErrorAlert message={locationError} />

          <input
            type="text"
            name="storeName"
            placeholder="Store or full name"
            value={formData.storeName}
            onChange={handleChange}
            required
            className="w-full rounded-2xl border border-slate-200 px-4 py-3 focus:border-emerald-500 focus:outline-none"
          />
          <input
            type="email"
            name="email"
            placeholder="Email"
            value={formData.email}
            onChange={handleChange}
            required
            className="w-full rounded-2xl border border-slate-200 px-4 py-3 focus:border-emerald-500 focus:outline-none"
          />
          <input
            type="password"
            name="password"
            placeholder="Password"
            value={formData.password}
            onChange={handleChange}
            required
            className="w-full rounded-2xl border border-slate-200 px-4 py-3 focus:border-emerald-500 focus:outline-none"
          />
          <input
            type="text"
            name="phone"
            placeholder="Phone number"
            value={formData.phone}
            onChange={handleChange}
            required
            className="w-full rounded-2xl border border-slate-200 px-4 py-3 focus:border-emerald-500 focus:outline-none"
          />

          <select
            name="role"
            value={formData.role}
            onChange={handleChange}
            className="w-full rounded-2xl border border-slate-200 px-4 py-3 focus:border-emerald-500 focus:outline-none"
          >
            <option value="customer">Customer</option>
            <option value="farmer">Farmer</option>
          </select>

          <div className="grid gap-4 sm:grid-cols-2">
            <input
              type="text"
              name="latitude"
              placeholder="Latitude"
              value={formData.latitude}
              onChange={handleChange}
              required
              className="w-full rounded-2xl border border-slate-200 px-4 py-3 focus:border-emerald-500 focus:outline-none"
            />
            <input
              type="text"
              name="longitude"
              placeholder="Longitude"
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
            {locationLoading ? "Finding location..." : "Use Current Location"}
          </button>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-2xl bg-emerald-600 px-4 py-3 font-semibold text-white hover:bg-emerald-700 disabled:opacity-70"
          >
            {loading ? "Creating account..." : "Create Account"}
          </button>

          <p className="text-sm text-slate-500">
            Already have an account?{" "}
            <Link to="/login" className="font-semibold text-emerald-700">
              Login here
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}

export default SignupPage;
