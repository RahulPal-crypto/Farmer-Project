import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import ErrorAlert from "../../components/ErrorAlert";
import { useAuth } from "../../context/AuthContext";

function SignupPage() {
  const navigate = useNavigate();
  const { signup, loading, error, clearAuthError } = useAuth();
  const [formData, setFormData] = useState({
    storeName: "",
    email: "",
    password: "",
    role: "customer",
    phone: "",
    latitude: "28.6139",
    longitude: "77.2090",
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
