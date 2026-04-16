import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";

import ErrorAlert from "../../components/ErrorAlert";
import { useAuth } from "../../context/AuthContext";

function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, loading, error, clearAuthError } = useAuth();
  const [formData, setFormData] = useState({
    email: "",
    password: "",
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
      const user = await login(formData);
      const nextPath =
        location.state?.from?.pathname ||
        (user.role === "farmer" ? "/farmer/dashboard" : "/");
      navigate(nextPath, { replace: true });
    } catch (error) {}
  };

  return (
    <div className="mx-auto grid max-w-5xl gap-8 rounded-[2rem] bg-white p-6 shadow-xl md:grid-cols-2 md:p-10">
      <div className="rounded-[2rem] bg-gradient-to-br from-emerald-700 via-emerald-600 to-lime-500 p-8 text-white">
        <p className="text-sm uppercase tracking-[0.3em] text-emerald-100">Welcome back</p>
        <h1 className="mt-4 text-4xl font-bold leading-tight">Sign in to manage orders and fresh produce.</h1>
        <p className="mt-4 text-sm text-emerald-50">
          Customers can browse nearby farm products, and farmers can manage inventory and orders from one place.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <h2 className="text-3xl font-bold text-slate-900">Login</h2>
          <p className="mt-2 text-sm text-slate-500">Use your registered email and password.</p>
        </div>

        <ErrorAlert message={error} />

        <label className="block space-y-2">
          <span className="text-sm font-medium text-slate-700">Email</span>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            required
            className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-emerald-500"
          />
        </label>

        <label className="block space-y-2">
          <span className="text-sm font-medium text-slate-700">Password</span>
          <input
            type="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            required
            className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-emerald-500"
          />
        </label>

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-2xl bg-slate-900 px-4 py-3 font-semibold text-white hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {loading ? "Signing in..." : "Login"}
        </button>

        <p className="text-sm text-slate-500">
          Don&apos;t have an account?{" "}
          <Link to="/signup" className="font-semibold text-emerald-700">
            Create one
          </Link>
        </p>
      </form>
    </div>
  );
}

export default LoginPage;
