import { Link, NavLink, useNavigate } from "react-router-dom";

import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
import { useWishlist } from "../context/WishlistContext";
import NotificationBell from "./NotificationBell";

function Navbar() {
  const navigate = useNavigate();
  const { user, isAuthenticated, logout } = useAuth();
  const { itemCount } = useCart();
  const { itemCount: wishlistCount } = useWishlist();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <header className="sticky top-0 z-20 border-b border-emerald-100 bg-white/95 backdrop-blur">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6 lg:px-8">
        <Link to="/" className="shrink-0 text-xl font-bold text-emerald-700">
          Farmer Market
        </Link>

        <nav className="flex min-w-0 flex-1 flex-wrap items-center justify-end gap-2 text-sm font-bold text-slate-700 sm:gap-3">
          <NavLink to="/" className="whitespace-nowrap rounded-full px-3 py-2 hover:bg-emerald-50 hover:text-emerald-700">
            Home
          </NavLink>

          {user?.role === "customer" && (
            <>
              <NavLink
                to="/cart"
                className="relative whitespace-nowrap rounded-full px-3 py-2 hover:bg-emerald-50 hover:text-emerald-700"
              >
                Cart
                {itemCount > 0 && (
                  <span className="ml-1 rounded-full bg-emerald-600 px-2 py-0.5 text-xs text-white">{itemCount}</span>
                )}
              </NavLink>
              <span className="whitespace-nowrap rounded-full px-3 py-2 text-slate-600">
                Wishlist
                {wishlistCount > 0 && (
                  <span className="ml-1 rounded-full bg-red-500 px-2 py-0.5 text-xs text-white">{wishlistCount}</span>
                )}
              </span>
              <NavLink
                to="/orders"
                className="whitespace-nowrap rounded-full px-3 py-2 hover:bg-emerald-50 hover:text-emerald-700"
              >
                Orders
              </NavLink>
              <NavLink
                to="/group-orders"
                className="whitespace-nowrap rounded-full px-3 py-2 hover:bg-emerald-50 hover:text-emerald-700"
              >
                Group Orders
              </NavLink>
            </>
          )}

          {user?.role === "farmer" && (
            <>
              <NavLink
                to="/farmer/dashboard"
                className="whitespace-nowrap rounded-full px-3 py-2 hover:bg-emerald-50 hover:text-emerald-700"
              >
                Dashboard
              </NavLink>
              <NavLink
                to="/farmer/products"
                className="whitespace-nowrap rounded-full px-3 py-2 hover:bg-emerald-50 hover:text-emerald-700"
              >
                My Products
              </NavLink>
              <NavLink
                to="/farmer/orders"
                className="whitespace-nowrap rounded-full px-3 py-2 hover:bg-emerald-50 hover:text-emerald-700"
              >
                Orders Received
              </NavLink>
            </>
          )}

          {user?.role === "admin" && (
            <NavLink
              to="/admin"
              className="whitespace-nowrap rounded-full px-3 py-2 hover:bg-emerald-50 hover:text-emerald-700"
            >
              Admin
            </NavLink>
          )}

          <NotificationBell />

          {!isAuthenticated ? (
            <>
              <NavLink to="/login" className="whitespace-nowrap rounded-full px-3 py-2 hover:bg-emerald-50 hover:text-emerald-700">
                Login
              </NavLink>
              <NavLink
                to="/signup"
                className="whitespace-nowrap rounded-full bg-emerald-600 px-4 py-2 text-white hover:bg-emerald-700"
              >
                Sign Up
              </NavLink>
            </>
          ) : (
            <>
              <span className="hidden max-w-56 truncate rounded-full bg-slate-100 px-3 py-2 text-slate-600 md:inline-flex">
                {user?.storeName} ({user?.role})
              </span>
              <button
                type="button"
                onClick={handleLogout}
                className="whitespace-nowrap rounded-full bg-slate-900 px-4 py-2 text-white hover:bg-slate-700"
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
