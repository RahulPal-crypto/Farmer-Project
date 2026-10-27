import { useState } from "react";
import { Link, NavLink, useNavigate, useLocation } from "react-router-dom";

import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
import { useWishlist } from "../context/WishlistContext";
import { useLanguage } from "../context/LanguageContext";
import NotificationBell from "./NotificationBell";

function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isAuthenticated, logout } = useAuth();
  const { itemCount, addToCart } = useCart();
  const { items: wishlistItems, itemCount: wishlistCount, removeFromWishlist } = useWishlist();
  const { language, setLanguage, t } = useLanguage();
  const [wishlistOpen, setWishlistOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    setMobileMenuOpen(false);
    navigate("/login");
  };

  const closeMobileMenu = () => {
    setMobileMenuOpen(false);
    setWishlistOpen(false);
  };

  const navLinkClass = ({ isActive }) =>
    `whitespace-nowrap rounded-full px-3 py-1.5 font-bold transition text-sm ${
      isActive ? "bg-emerald-100 text-emerald-800" : "text-slate-700 hover:bg-emerald-50 hover:text-emerald-700"
    }`;

  const mobileNavLinkClass = ({ isActive }) =>
    `flex items-center justify-between rounded-2xl px-4 py-3 font-bold transition text-sm ${
      isActive ? "bg-emerald-100 text-emerald-800" : "text-slate-700 hover:bg-emerald-50 hover:text-emerald-700"
    }`;

  return (
    <header className="sticky top-0 z-30 border-b border-emerald-100 bg-white/95 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl 2xl:max-w-[1536px] 3xl:max-w-[1780px] items-center justify-between gap-3 px-3.5 py-2.5 sm:px-6 lg:px-8 2xl:px-10">
        {/* Brand Logo */}
        <Link
          to="/"
          onClick={closeMobileMenu}
          className="flex items-center gap-2 shrink-0 text-xl font-black text-emerald-700 tracking-tight"
        >
          <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-600 text-white text-base shadow-sm">
            🌱
          </span>
          <span>{t("brand_name", "KrishiSetu")}</span>
        </Link>

        {/* Desktop Navigation (>= lg breakpoint) */}
        <nav className="hidden lg:flex min-w-0 flex-1 items-center justify-end gap-2 text-sm font-bold text-slate-700">
          <NavLink to="/" className={navLinkClass}>
            {t("nav_home", "Home")}
          </NavLink>

          {user?.role === "customer" && (
            <>
              <NavLink
                to="/cart"
                className={({ isActive }) =>
                  `relative whitespace-nowrap rounded-full px-3 py-1.5 font-bold transition text-sm ${
                    isActive ? "bg-emerald-100 text-emerald-800" : "hover:bg-emerald-50 hover:text-emerald-700"
                  }`
                }
              >
                {t("nav_cart", "Cart")}
                {itemCount > 0 && (
                  <span className="ml-1.5 rounded-full bg-emerald-600 px-2 py-0.5 text-xs text-white">
                    {itemCount}
                  </span>
                )}
              </NavLink>

              {/* Wishlist Dropdown */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setWishlistOpen((prev) => !prev)}
                  className="inline-flex items-center whitespace-nowrap rounded-full px-3 py-1.5 text-slate-700 hover:bg-emerald-50 hover:text-emerald-700 font-bold"
                >
                  {t("nav_wishlist", "Wishlist")}
                  {wishlistCount > 0 && (
                    <span className="ml-1.5 rounded-full bg-rose-500 px-2 py-0.5 text-xs text-white">
                      {wishlistCount}
                    </span>
                  )}
                </button>

                {wishlistOpen && (
                  <div className="absolute right-0 top-11 z-40 w-80 rounded-3xl border border-slate-200 bg-white p-4 shadow-2xl">
                    <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                      <p className="font-bold text-slate-900">Saved Produce ({wishlistCount})</p>
                      <button
                        type="button"
                        onClick={() => setWishlistOpen(false)}
                        className="text-xs font-bold text-slate-400 hover:text-slate-600"
                      >
                        ✕ Close
                      </button>
                    </div>

                    {wishlistItems.length === 0 ? (
                      <p className="py-6 text-center text-xs text-slate-500">Your wishlist is empty.</p>
                    ) : (
                      <div className="mt-3 max-h-80 space-y-3 overflow-y-auto">
                        {wishlistItems.map((item) => (
                          <div key={item._id} className="flex items-center justify-between gap-3 text-sm">
                            <div className="min-w-0">
                              <p className="truncate font-semibold text-slate-900">{item.name}</p>
                              <p className="text-xs text-emerald-700 font-bold">₹{item.price}</p>
                            </div>
                            <div className="flex shrink-0 items-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => {
                                  addToCart(item);
                                  removeFromWishlist(item._id);
                                }}
                                className="rounded-xl bg-emerald-600 px-2.5 py-1 text-xs font-bold text-white hover:bg-emerald-700"
                              >
                                Move to Cart
                              </button>
                              <button
                                type="button"
                                onClick={() => removeFromWishlist(item._id)}
                                className="rounded-xl border border-slate-200 px-2 py-1 text-xs font-bold text-rose-500 hover:bg-rose-50"
                              >
                                ✕
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {wishlistItems.length > 0 && (
                      <div className="mt-3 pt-2.5 border-t border-slate-100 text-center">
                        <Link
                          to="/wishlist"
                          onClick={() => setWishlistOpen(false)}
                          className="block text-xs font-bold text-emerald-700 hover:text-emerald-800 hover:underline"
                        >
                          View All Saved Produce ({wishlistCount}) →
                        </Link>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <NavLink to="/orders" className={navLinkClass}>
                {t("nav_orders", "Orders")}
              </NavLink>
              <NavLink to="/group-orders" className={navLinkClass}>
                {t("nav_group_orders", "Group Orders")}
              </NavLink>
              <NavLink to="/subscriptions" className={navLinkClass}>
                {t("nav_subscriptions", "Farm Boxes 📦")}
              </NavLink>
            </>
          )}

          {user?.role === "farmer" && (
            <>
              <NavLink to="/farmer/dashboard" className={navLinkClass}>
                {t("nav_dashboard", "Dashboard")}
              </NavLink>
              <NavLink to="/farmer/products" className={navLinkClass}>
                {t("nav_my_products", "My Products")}
              </NavLink>
              <NavLink to="/farmer/orders" className={navLinkClass}>
                {t("nav_orders_received", "Orders Received")}
              </NavLink>
              <NavLink to="/subscriptions" className={navLinkClass}>
                {t("nav_subscribers", "Subscribers 📦")}
              </NavLink>
              <NavLink
                to="/farmer/add-product"
                className="whitespace-nowrap rounded-full bg-emerald-600 px-3.5 py-1.5 text-xs font-bold text-white hover:bg-emerald-700 shadow-xs"
              >
                {t("nav_add_product", "+ Add Produce")}
              </NavLink>
            </>
          )}

          {user?.role === "admin" && (
            <NavLink to="/admin" className={navLinkClass}>
              {t("nav_admin", "Admin")}
            </NavLink>
          )}

          {/* Desktop Language Switcher Toggle Pill */}
          <div className="flex items-center rounded-full bg-slate-100 p-0.5 text-xs font-bold border border-slate-200">
            <button
              type="button"
              onClick={() => setLanguage("en")}
              className={`rounded-full px-2.5 py-1 transition ${
                language === "en"
                  ? "bg-white text-emerald-800 shadow-xs"
                  : "text-slate-500 hover:text-slate-900"
              }`}
              title="Switch to English"
            >
              EN
            </button>
            <button
              type="button"
              onClick={() => setLanguage("hi")}
              className={`rounded-full px-2.5 py-1 transition ${
                language === "hi"
                  ? "bg-emerald-600 text-white shadow-xs"
                  : "text-slate-500 hover:text-slate-900"
              }`}
              title="हिन्दी में बदलें"
            >
              हिन्दी
            </button>
          </div>

          <NotificationBell />

          {!isAuthenticated ? (
            <div className="flex items-center gap-2 pl-2">
              <NavLink
                to="/login"
                className="whitespace-nowrap rounded-full px-3.5 py-1.5 text-sm font-bold text-slate-700 hover:bg-emerald-50 hover:text-emerald-700"
              >
                {t("nav_login", "Login")}
              </NavLink>
              <NavLink
                to="/signup"
                className="whitespace-nowrap rounded-full bg-emerald-600 px-4 py-1.5 text-sm font-bold text-white hover:bg-emerald-700 shadow-xs"
              >
                {t("nav_signup", "Register")}
              </NavLink>
            </div>
          ) : (
            <div className="flex items-center gap-2 pl-2">
              <NavLink
                to="/profile"
                className={({ isActive }) =>
                  `inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold transition ${
                    isActive
                      ? "bg-emerald-600 text-white shadow-xs"
                      : "bg-slate-100 text-slate-700 hover:bg-emerald-50 hover:text-emerald-700"
                  }`
                }
                title="Account Profile & Settings"
              >
                <span>👤</span>
                <span className="max-w-28 truncate">{user?.storeName || t("nav_profile", "Profile")}</span>
                <span className="rounded-full bg-black/10 px-1.5 py-0.2 text-[10px] uppercase">
                  {user?.role}
                </span>
              </NavLink>
              <button
                type="button"
                onClick={handleLogout}
                className="whitespace-nowrap rounded-full bg-slate-900 px-3 py-1.5 text-xs font-bold text-white transition hover:bg-slate-700"
              >
                {t("nav_logout", "Logout")}
              </button>
            </div>
          )}
        </nav>

        {/* Mobile Action Cluster (< lg breakpoint) */}
        <div className="flex lg:hidden items-center gap-2">
          {user?.role === "customer" && (
            <>
              {/* Mobile Quick Cart Link */}
              <Link
                to="/cart"
                onClick={closeMobileMenu}
                className="relative flex h-9 w-9 items-center justify-center rounded-full bg-emerald-50 text-emerald-800 hover:bg-emerald-100"
                aria-label="View Cart"
              >
                <span>🛒</span>
                {itemCount > 0 && (
                  <span className="absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-emerald-600 px-1 text-[10px] font-black text-white">
                    {itemCount}
                  </span>
                )}
              </Link>

              {/* Mobile Quick Wishlist Link */}
              <Link
                to="/wishlist"
                onClick={closeMobileMenu}
                className="relative flex h-9 w-9 items-center justify-center rounded-full bg-rose-50 text-rose-600 hover:bg-rose-100"
                aria-label="View Wishlist"
              >
                <span>❤️</span>
                {wishlistCount > 0 && (
                  <span className="absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-black text-white">
                    {wishlistCount}
                  </span>
                )}
              </Link>
            </>
          )}

          <NotificationBell />

          {/* Hamburger Menu Toggle Button */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen((prev) => !prev)}
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-100 active:scale-95 transition"
            aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
          >
            {mobileMenuOpen ? "✕" : "☰"}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Navigation Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-slate-100 bg-white/98 shadow-xl backdrop-blur-md animate-fade-in">
          <div className="mx-auto max-w-7xl px-4 py-4 space-y-3 max-h-[80vh] overflow-y-auto">
            {/* User Profile Card or Welcome Banner */}
            {isAuthenticated ? (
              <div className="flex items-center justify-between rounded-2xl bg-emerald-50 p-3.5 border border-emerald-100">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-600 text-white font-bold">
                    {user?.storeName ? user.storeName[0].toUpperCase() : "👤"}
                  </div>
                  <div>
                    <p className="font-bold text-slate-900">{user?.storeName || "My Account"}</p>
                    <p className="text-xs font-semibold text-emerald-700 uppercase tracking-wide">
                      {user?.role} Account
                    </p>
                  </div>
                </div>
                <Link
                  to="/profile"
                  onClick={closeMobileMenu}
                  className="rounded-xl bg-white px-3 py-1.5 text-xs font-bold text-slate-700 shadow-xs border border-slate-200"
                >
                  Settings
                </Link>
              </div>
            ) : (
              <div className="rounded-2xl bg-emerald-50 p-3.5 text-center border border-emerald-100">
                <p className="font-black text-emerald-950">
                  {language === "hi" ? "कृषिसेतु में आपका स्वागत है" : "Welcome to KrishiSetu"}
                </p>
                <p className="text-xs text-emerald-800 mt-0.5">
                  {language === "hi"
                    ? "स्थानीय किसानों से सीधे खेत की ताज़ा उपज खरीदें।"
                    : "Order direct farm fresh harvest from local growers."}
                </p>
                <div className="mt-3 flex items-center justify-center gap-2">
                  <Link
                    to="/login"
                    onClick={closeMobileMenu}
                    className="flex-1 rounded-xl bg-white py-2 text-xs font-black text-slate-800 border border-slate-200"
                  >
                    Login
                  </Link>
                  <Link
                    to="/signup"
                    onClick={closeMobileMenu}
                    className="flex-1 rounded-xl bg-emerald-600 py-2 text-xs font-black text-white"
                  >
                    Sign Up
                  </Link>
                </div>
              </div>
            )}

            {/* Mobile Language Switcher Bar */}
            <div className="flex items-center justify-between rounded-2xl bg-slate-50 p-3 border border-slate-200">
              <span className="text-xs font-black text-slate-700 flex items-center gap-1.5">
                <span>🌐</span> {language === "hi" ? "भाषा (Language)" : "Language"}
              </span>
              <div className="flex items-center rounded-full bg-white p-0.5 text-xs font-bold border border-slate-200 shadow-2xs">
                <button
                  type="button"
                  onClick={() => setLanguage("en")}
                  className={`rounded-full px-3 py-1 transition ${
                    language === "en"
                      ? "bg-emerald-700 text-white shadow-xs"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  English
                </button>
                <button
                  type="button"
                  onClick={() => setLanguage("hi")}
                  className={`rounded-full px-3 py-1 transition ${
                    language === "hi"
                      ? "bg-emerald-700 text-white shadow-xs"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  हिन्दी
                </button>
              </div>
            </div>

            {/* Navigation Links list */}
            <nav className="space-y-1">
              <NavLink to="/" onClick={closeMobileMenu} className={mobileNavLinkClass}>
                <span>🏠 {t("nav_home", "Home / Marketplace")}</span>
                <span>→</span>
              </NavLink>

              {user?.role === "customer" && (
                <>
                  <NavLink to="/cart" onClick={closeMobileMenu} className={mobileNavLinkClass}>
                    <span>🛒 {t("nav_cart", "My Cart")}</span>
                    {itemCount > 0 && (
                      <span className="rounded-full bg-emerald-600 px-2 py-0.5 text-xs text-white">
                        {itemCount}
                      </span>
                    )}
                  </NavLink>
                  <NavLink to="/wishlist" onClick={closeMobileMenu} className={mobileNavLinkClass}>
                    <span>❤️ {t("nav_wishlist", "Saved Wishlist")}</span>
                    {wishlistCount > 0 && (
                      <span className="rounded-full bg-rose-500 px-2 py-0.5 text-xs text-white">
                        {wishlistCount}
                      </span>
                    )}
                  </NavLink>
                  <NavLink to="/orders" onClick={closeMobileMenu} className={mobileNavLinkClass}>
                    <span>📦 {t("nav_orders", "Orders & Tracking")}</span>
                    <span>→</span>
                  </NavLink>
                  <NavLink to="/group-orders" onClick={closeMobileMenu} className={mobileNavLinkClass}>
                    <span>👥 {t("nav_group_orders", "Group Buying Deals")}</span>
                    <span>→</span>
                  </NavLink>
                  <NavLink to="/subscriptions" onClick={closeMobileMenu} className={mobileNavLinkClass}>
                    <span>🎁 {t("nav_subscriptions", "Farm Box Subscriptions")}</span>
                    <span>→</span>
                  </NavLink>
                </>
              )}

              {user?.role === "farmer" && (
                <>
                  <NavLink to="/farmer/dashboard" onClick={closeMobileMenu} className={mobileNavLinkClass}>
                    <span>📊 {t("nav_dashboard", "Farmer Dashboard")}</span>
                    <span>→</span>
                  </NavLink>
                  <NavLink to="/farmer/products" onClick={closeMobileMenu} className={mobileNavLinkClass}>
                    <span>🌾 {t("nav_my_products", "My Crop Listings")}</span>
                    <span>→</span>
                  </NavLink>
                  <NavLink to="/farmer/orders" onClick={closeMobileMenu} className={mobileNavLinkClass}>
                    <span>📋 {t("nav_orders_received", "Orders Received")}</span>
                    <span>→</span>
                  </NavLink>
                  <NavLink to="/subscriptions" onClick={closeMobileMenu} className={mobileNavLinkClass}>
                    <span>📦 {t("nav_subscribers", "Subscriber Farm Boxes")}</span>
                    <span>→</span>
                  </NavLink>
                  <NavLink
                    to="/farmer/add-product"
                    onClick={closeMobileMenu}
                    className="flex items-center justify-between rounded-2xl bg-emerald-600 px-4 py-3 font-bold text-white shadow-xs"
                  >
                    <span>➕ {t("nav_add_product", "Add New Crop Produce")}</span>
                    <span>→</span>
                  </NavLink>
                </>
              )}

              {user?.role === "admin" && (
                <NavLink to="/admin" onClick={closeMobileMenu} className={mobileNavLinkClass}>
                  <span>🛡️ {t("nav_admin", "Admin Portal")}</span>
                  <span>→</span>
                </NavLink>
              )}

              {isAuthenticated && (
                <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-3">
                  <NavLink
                    to="/profile"
                    onClick={closeMobileMenu}
                    className="flex-1 rounded-xl bg-slate-100 py-2.5 text-center text-xs font-bold text-slate-700 hover:bg-slate-200"
                  >
                    👤 {t("nav_profile", "Profile")}
                  </NavLink>
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="flex-1 rounded-xl bg-rose-600 py-2.5 text-center text-xs font-bold text-white hover:bg-rose-700"
                  >
                    🚪 {t("nav_logout", "Logout")}
                  </button>
                </div>
              )}
            </nav>
          </div>
        </div>
      )}
    </header>
  );
}

export default Navbar;
