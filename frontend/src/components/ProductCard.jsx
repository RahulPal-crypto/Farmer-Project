import { useNavigate } from "react-router-dom";
import MarketPriceBadge from "./MarketPriceBadge";
import FreshnessBadge from "./FreshnessBadge";
import VerifiedFarmerBadge from "./VerifiedFarmerBadge";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
import { useWishlist } from "../context/WishlistContext";
import { useLanguage } from "../context/LanguageContext";
import { getAssetUrl } from "../services/api";

const fallbackImage =
  "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=700&q=80";

function ProductCard({ product, onQuickView }) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { items: cartItems, addToCart, updateCartQuantity, removeFromCart } = useCart();
  const { isWishlisted, toggleWishlist } = useWishlist();
  const { isHindi, t } = useLanguage();

  const imageUrl = product.imageUrl || getAssetUrl(product.image) || fallbackImage;
  const ratingValue = Number(product.farmer?.averageRating || product.averageRating || product.rating || 0);
  const rating = ratingValue > 0 ? ratingValue.toFixed(1) : null;
  const wishlisted = isWishlisted(product._id);
  const unit = product.unit || "kg";

  // Cart item tracking for interactive stepper
  const cartItem = cartItems?.find((item) => item._id === product._id);
  const inCartQty = cartItem ? cartItem.cartQuantity : 0;
  const isOutOfStock = product.quantity <= 0;

  const handleAddToCart = (e) => {
    e?.stopPropagation();
    if (user?.role !== "customer") {
      navigate("/login");
      return;
    }
    addToCart(product);
  };

  const handleIncrement = (e) => {
    e?.stopPropagation();
    if (user?.role !== "customer") {
      navigate("/login");
      return;
    }
    if (inCartQty < product.quantity) {
      updateCartQuantity(product._id, inCartQty + 1);
    }
  };

  const handleDecrement = (e) => {
    e?.stopPropagation();
    if (inCartQty <= 1) {
      removeFromCart(product._id);
    } else {
      updateCartQuantity(product._id, inCartQty - 1);
    }
  };

  const handleWishlistClick = (e) => {
    e?.stopPropagation();
    toggleWishlist(product);
  };

  return (
    <article
      onClick={() => onQuickView?.(product)}
      className="group relative flex h-full flex-col overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-emerald-300 hover:shadow-xl cursor-pointer"
    >
      {/* Crop Image & Badges Container */}
      <div className="relative h-44 sm:h-52 w-full overflow-hidden bg-gradient-to-br from-emerald-50 via-lime-50 to-amber-50">
        <img
          src={imageUrl}
          alt={product.name}
          loading="lazy"
          className="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-105"
        />

        {/* Top-Left: Freshness & Harvest Status */}
        <div className="absolute top-2.5 left-2.5 z-10 max-w-[75%] sm:top-3 sm:left-3">
          <FreshnessBadge harvestDate={product.harvestDate} className="shadow-md backdrop-blur-xs" />
        </div>

        {/* Top-Right: Sleek Floating Heart Wishlist Button */}
        <button
          type="button"
          onClick={handleWishlistClick}
          className={`absolute right-2.5 top-2.5 z-10 flex h-9 w-9 items-center justify-center rounded-full shadow-md backdrop-blur-md transition-all duration-200 hover:scale-110 active:scale-90 sm:right-3 sm:top-3 ${
            wishlisted
              ? "bg-rose-50 text-rose-500 shadow-rose-200/50 ring-2 ring-rose-400"
              : "bg-white/90 text-slate-400 hover:bg-white hover:text-rose-500"
          }`}
          aria-label={wishlisted ? "Remove from wishlist" : "Add to wishlist"}
          title={wishlisted ? "Remove from Saved" : "Save to wishlist"}
        >
          <svg
            className={`h-5 w-5 transition-transform duration-200 ${wishlisted ? "scale-110" : ""}`}
            viewBox="0 0 24 24"
            fill={wishlisted ? "currentColor" : "none"}
            stroke="currentColor"
            strokeWidth={wishlisted ? "0" : "2"}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z"
            />
          </svg>
        </button>

        {/* Bottom subtle gradient vignette with category pill */}
        <div className="absolute inset-x-0 bottom-0 flex items-end justify-between bg-gradient-to-t from-black/60 via-black/20 to-transparent p-2.5 sm:p-3">
          <span className="rounded-full bg-emerald-600/90 px-2.5 py-0.5 text-[10px] sm:text-xs font-bold text-white backdrop-blur-xs">
            🌿 {t("prod_direct_farm", "Direct Farm")}
          </span>
          <span className="rounded-full bg-white/90 px-2 py-0.5 text-[10px] sm:text-xs font-bold text-slate-700 backdrop-blur-xs">
            {product.category}
          </span>
        </div>
      </div>

      {/* Card Content Details */}
      <div className="flex flex-1 flex-col p-4 sm:p-5">
        {/* Crop Name & Farmer Row */}
        <div>
          <h3 className="line-clamp-1 text-base sm:text-lg font-black text-slate-900 group-hover:text-emerald-700 transition-colors">
            {product.name}
          </h3>

          <div className="mt-1.5 flex items-center gap-1.5 flex-wrap text-xs">
            <span className="text-sm">🚜</span>
            <span className="font-semibold text-slate-600 truncate max-w-[140px] sm:max-w-[180px]">
              {product.farmer?.storeName || product.farmerName || "Local Farm"}
            </span>
            <VerifiedFarmerBadge isVerified={product.farmer?.isVerifiedFarmer} />
          </div>
        </div>

        {/* APMC Govt Mandi Benchmark Price */}
        {product.commodityKey && (
          <div className="mt-2.5">
            <MarketPriceBadge commodityKey={product.commodityKey} productPrice={product.price} />
          </div>
        )}

        {/* Distance & Stock Urgency Indicators */}
        <div className="mt-3 flex items-center justify-between gap-2 text-xs">
          {/* Stock state */}
          {isOutOfStock ? (
            <span className="inline-flex items-center gap-1 rounded-md bg-rose-50 px-2 py-0.5 font-bold text-rose-600">
              {t("prod_out_of_stock", "Out of stock")}
            </span>
          ) : product.quantity <= 5 ? (
            <span className="inline-flex items-center gap-1 rounded-md bg-amber-50 px-2 py-0.5 font-black text-amber-700 animate-pulse">
              ⚡ {isHindi ? `केवल ${product.quantity} ${unit} शेष!` : `Only ${product.quantity} ${unit} left!`}
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-2 py-0.5 font-semibold text-emerald-800">
              ✓ {product.quantity} {unit} {isHindi ? "उपलब्ध" : "in stock"}
            </span>
          )}

          {/* Distance Pin */}
          <span className="inline-flex items-center gap-1 font-semibold text-slate-500 shrink-0">
            📍 {product.distanceInKm !== undefined ? `${product.distanceInKm} km` : (isHindi ? "नज़दीक" : "Nearby")}
          </span>
        </div>

        {/* Pricing & Interactive Cart Action Footer */}
        <div className="mt-auto pt-4 border-t border-slate-100 flex items-center justify-between gap-3">
          {/* Hero Price & Unit */}
          <div>
            <div className="flex items-baseline gap-1">
              <span className="text-xl sm:text-2xl font-black text-slate-950">
                ₹{product.price}
              </span>
              <span className="text-xs font-bold text-slate-400">
                /{unit}
              </span>
            </div>
            {rating && (
              <p className="text-[11px] font-bold text-amber-600">
                ★ {rating} <span className="text-slate-400">/ 5</span>
              </p>
            )}
          </div>

          {/* Action: Add to Cart OR Interactive Quantity Stepper */}
          <div className="shrink-0" onClick={(e) => e.stopPropagation()}>
            {inCartQty > 0 ? (
              <div className="inline-flex items-center rounded-xl bg-emerald-50 border border-emerald-300 p-0.5 shadow-xs">
                <button
                  type="button"
                  onClick={handleDecrement}
                  className="flex h-8 w-8 items-center justify-center rounded-lg bg-white font-black text-emerald-800 shadow-xs hover:bg-emerald-600 hover:text-white transition active:scale-95"
                  title="Decrease quantity"
                  aria-label="Decrease quantity"
                >
                  −
                </button>
                <div className="px-2 text-center">
                  <span className="block text-xs font-black text-emerald-950 leading-none">
                    {inCartQty}
                  </span>
                  <span className="text-[9px] font-bold text-emerald-700 uppercase">
                    {unit}
                  </span>
                </div>
                <button
                  type="button"
                  disabled={inCartQty >= product.quantity}
                  onClick={handleIncrement}
                  className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-600 font-black text-white shadow-xs hover:bg-emerald-700 transition active:scale-95 disabled:cursor-not-allowed disabled:bg-slate-300"
                  title="Increase quantity"
                  aria-label="Increase quantity"
                >
                  +
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={handleAddToCart}
                  disabled={isOutOfStock}
                  className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-emerald-600 px-3.5 py-2 sm:px-4 sm:py-2.5 text-xs sm:text-sm font-black text-white shadow-sm hover:bg-emerald-700 active:scale-95 transition disabled:cursor-not-allowed disabled:bg-slate-300"
                >
                  <span>🛒</span>
                  <span>{isOutOfStock ? t("prod_out_of_stock", "Sold Out") : (isHindi ? "जोड़ें" : "Add")}</span>
                </button>
                <button
                  type="button"
                  onClick={() => onQuickView?.(product)}
                  className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition"
                  title="Quick View Details"
                  aria-label="Quick View"
                >
                  👁️
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </article>
  );
}

export default ProductCard;
