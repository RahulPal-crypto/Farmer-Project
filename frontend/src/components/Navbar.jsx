import { Link, NavLink, useNavigate } from "react-router-dom";

import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
import NotificationBell from "./NotificationBell";

function Navbar() {
  const navigate = useNavigate();
  const { user, isAuthenticated, logout } = useAuth();
  const { itemCount } = useCart();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <header className="sticky top-0 z-20 border-b border-emerald-100 bg-white/95 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
        <Link to="/" className="text-xl font-bold text-emerald-700">
          Farmer Market
        </Link>

        <nav className="flex items-center gap-3 text-sm font-medium text-slate-700">
          <NavLink to="/" className="rounded-full px-3 py-2 hover:bg-emerald-50 hover:text-emerald-700">
            Home
          </NavLink>

          {user?.role === "customer" && (
            <>
              <NavLink
                to="/cart"
                className="rounded-full px-3 py-2 hover:bg-emerald-50 hover:text-emerald-700"
              >
                Cart ({itemCount})
              </NavLink>
              <NavLink
                to="/orders"
                className="rounded-full px-3 py-2 hover:bg-emerald-50 hover:text-emerald-700"
              >
                Orders
              </NavLink>
              <NavLink
                to="/group-orders"
                className="rounded-full px-3 py-2 hover:bg-emerald-50 hover:text-emerald-700"
              >
                Group Orders
              </NavLink>
            </>
          )}

          {user?.role === "farmer" && (
            <>
              <NavLink
                to="/farmer/dashboard"
                className="rounded-full px-3 py-2 hover:bg-emerald-50 hover:text-emerald-700"
              >
                Dashboard
              </NavLink>
              <NavLink
                to="/farmer/products"
                className="rounded-full px-3 py-2 hover:bg-emerald-50 hover:text-emerald-700"
              >
                My Products
              </NavLink>
              <NavLink
                to="/farmer/orders"
                className="rounded-full px-3 py-2 hover:bg-emerald-50 hover:text-emerald-700"
              >
                Orders Received
              </NavLink>
            </>
          )}

          {user?.role === "admin" && (
            <NavLink
              to="/admin"
              className="rounded-full px-3 py-2 hover:bg-emerald-50 hover:text-emerald-700"
            >
              Admin
            </NavLink>
          )}

          <NotificationBell />

          {!isAuthenticated ? (
            <>
              <NavLink to="/login" className="rounded-full px-3 py-2 hover:bg-emerald-50 hover:text-emerald-700">
                Login
              </NavLink>
              <NavLink
                to="/signup"
                className="rounded-full bg-emerald-600 px-4 py-2 text-white hover:bg-emerald-700"
              >
                Sign Up
              </NavLink>
            </>
          ) : (
            <>
              <span className="hidden rounded-full bg-slate-100 px-3 py-2 text-slate-600 md:inline-flex">
                {user?.storeName} ({user?.role})
              </span>
              <button
                type="button"
                onClick={handleLogout}
                className="rounded-full bg-slate-900 px-4 py-2 text-white hover:bg-slate-700"
              >
                Logout
              </button>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}

export default Navbar;
