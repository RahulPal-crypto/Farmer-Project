import { useState, useEffect } from "react";
import MarketPriceBadge from "./MarketPriceBadge";
import FreshnessBadge from "./FreshnessBadge";
import VerifiedFarmerBadge from "./VerifiedFarmerBadge";
import { useLanguage } from "../context/LanguageContext";
import { getAssetUrl } from "../services/api";

const fallbackImage =
  "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=900&q=80";

function QuickViewModal({ product, onClose, onAddToCart, onToggleWishlist, wishlisted }) {
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const { isHindi, t } = useLanguage();

  useEffect(() => {
    return () => {
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  if (!product) {
    return null;
  }

  const imageUrl = product.imageUrl || getAssetUrl(product.image) || fallbackImage;
  const ratingValue = Number(product.farmer?.averageRating || product.averageRating || product.rating || 0);
  const rating = ratingValue > 0 ? ratingValue.toFixed(1) : null;
  const unit = product.unit || "kg";
  const isOutOfStock = product.quantity <= 0;

  const handlePlayAudio = () => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) {
      alert("Audio speech synthesis is not supported on this browser.");
      return;
    }

    if (isPlayingAudio) {
      window.speechSynthesis.cancel();
      setIsPlayingAudio(false);
      return;
    }

    window.speechSynthesis.cancel();
    const farmerName = product.farmer?.storeName || product.farmerName || "Local Farm";
    const textToSpeak = `${product.name}. Daam hai ${product.price} rupaye prati ${unit}. Kisan: ${farmerName}. Available stock: ${product.quantity} ${unit}.`;

    const utterance = new SpeechSynthesisUtterance(textToSpeak);
    utterance.lang = "hi-IN";
    utterance.rate = 0.92;

    utterance.onend = () => setIsPlayingAudio(false);
    utterance.onerror = () => setIsPlayingAudio(false);

    setIsPlayingAudio(true);
    window.speechSynthesis.speak(utterance);
  };

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-3 sm:p-6 backdrop-blur-sm animate-fade-in"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-3xl bg-white shadow-2xl transition-all"
      >
        <div className="grid gap-0 md:grid-cols-[0.9fr_1.1fr]">
          {/* Crop Image & Freshness Container */}
          <div className="relative bg-gradient-to-br from-emerald-50 to-lime-50 p-4 sm:p-5 flex items-center justify-center">
            <img
              src={imageUrl}
              alt={product.name}
              className="h-56 sm:h-72 md:h-80 w-full rounded-2xl object-cover shadow-sm"
            />
            <FreshnessBadge harvestDate={product.harvestDate} className="absolute top-6 left-6 shadow-md" />
            <span className="absolute bottom-6 left-6 rounded-full bg-emerald-700/90 px-3 py-1 text-xs font-bold text-white backdrop-blur-xs">
              🌿 {t("prod_direct_farm", "Direct Farm Listing")}
            </span>
          </div>

          {/* Product Details Section */}
          <div className="p-5 sm:p-6 flex flex-col justify-between">
            <div>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-bold uppercase tracking-wide text-emerald-700">
                      {product.category}
                    </span>
                    <button
                      type="button"
                      onClick={handlePlayAudio}
                      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-bold transition shadow-xs ${
                        isPlayingAudio
                          ? "bg-rose-500 text-white animate-pulse"
                          : "bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200"
                      }`}
                      title={isPlayingAudio ? "Stop audio" : "Listen to produce details in Hindi / English"}
                    >
                      <span>{isPlayingAudio ? (isHindi ? "⏹️ रोकें" : "⏹️ Stop") : (isHindi ? "🔊 सुनिए (ऑडियो)" : "🔊 Suniye (Listen)")}</span>
                    </button>
                  </div>
                  <h2 className="mt-2 text-2xl sm:text-3xl font-black text-slate-950 leading-tight">
                    {product.name}
                  </h2>
                  <div className="mt-2 flex items-center gap-1.5 flex-wrap text-sm">
                    <span>🚜</span>
                    <p className="font-semibold text-slate-600">
                      {t("prod_sold_by", "Sold by")} {product.farmer?.storeName || product.farmerName || "Local Farm"}
                    </p>
                    <VerifiedFarmerBadge isVerified={product.farmer?.isVerifiedFarmer} />
                  </div>
                </div>

                {/* Close Button */}
                <button
                  type="button"
                  onClick={onClose}
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-100 text-sm font-black text-slate-500 hover:bg-slate-200 hover:text-slate-800 transition"
                  aria-label="Close modal"
                >
                  ✕
                </button>
              </div>

              {/* Metric Highlights (Rating, Stock, Distance) */}
              <div className="mt-4 grid grid-cols-3 gap-2 sm:gap-3">
                <div className="rounded-2xl bg-amber-50 p-3 text-center sm:text-left">
                  <p className="text-[11px] font-bold text-amber-700">{t("prod_rating", "Rating")}</p>
                  <p className="mt-0.5 text-base sm:text-lg font-black text-slate-900">
                    {rating ? `★ ${rating}` : (isHindi ? "नया" : "New")}
                  </p>
                </div>
                <div className="rounded-2xl bg-emerald-50 p-3 text-center sm:text-left">
                  <p className="text-[11px] font-bold text-emerald-700">{t("prod_stock", "Stock")}</p>
                  <p className="mt-0.5 text-base sm:text-lg font-black text-slate-900">
                    {product.quantity || 0} {unit}
                  </p>
                </div>
                <div className="rounded-2xl bg-sky-50 p-3 text-center sm:text-left">
                  <p className="text-[11px] font-bold text-sky-700">{t("prod_distance", "Distance")}</p>
                  <p className="mt-0.5 text-base sm:text-lg font-black text-slate-900">
                    {product.distanceInKm !== undefined ? `${product.distanceInKm} km` : (isHindi ? "नज़दीक" : "Nearby")}
                  </p>
                </div>
              </div>

              {/* Commodity Key / APMC Mandi Price Badge */}
              {product.commodityKey && (
                <div className="mt-4 p-3 rounded-2xl bg-slate-50 border border-slate-100">
                  <p className="text-xs font-bold text-slate-500 mb-1">{t("prod_govt_benchmark", "Government Mandi Benchmark:")}</p>
                  <MarketPriceBadge commodityKey={product.commodityKey} productPrice={product.price} />
                </div>
              )}

              <p className="mt-4 text-xs sm:text-sm leading-relaxed text-slate-600">
                {isHindi
                  ? "स्थानीय किसानों द्वारा ताज़ा कटाई व तैयार की गई शुद्ध उपज। पारदर्शी दामों पर अपने घर सीधे मंगवाएं।"
                  : "Directly harvested and prepared by local farmers. Order fresh, transparently priced produce delivered straight to your doorstep."}
              </p>
            </div>

            {/* Price & Action Buttons Footer */}
            <div className="mt-6 pt-4 border-t border-slate-100">
              <div className="flex items-baseline justify-between mb-4">
                <div>
                  <p className="text-xs font-semibold text-slate-400">{isHindi ? "सीधा किसान मूल्य" : "Direct Farm Price"}</p>
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-black text-emerald-800">₹{product.price}</span>
                    <span className="text-sm font-bold text-slate-500">/{unit}</span>
                  </div>
                </div>
                {isOutOfStock ? (
                  <span className="rounded-full bg-rose-100 px-3 py-1 text-xs font-bold text-rose-700">
                    {t("prod_out_of_stock", "Sold Out")}
                  </span>
                ) : (
                  <span className="rounded-full bg-lime-100 px-3 py-1 text-xs font-bold text-lime-800">
                    ✓ {t("prod_available_harvest", "Available for Harvest")}
                  </span>
                )}
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  type="button"
                  onClick={() => {
                    onAddToCart(product);
                    onClose();
                  }}
                  disabled={isOutOfStock}
                  className="flex-1 inline-flex items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-5 py-3.5 text-sm font-black text-white hover:bg-emerald-700 active:scale-98 transition disabled:cursor-not-allowed disabled:bg-slate-300 shadow-md shadow-emerald-700/20"
                >
                  <span>🛒</span>
                  <span>{isOutOfStock ? t("prod_out_of_stock", "Out of Stock") : t("prod_add_to_cart", "Add to Cart")}</span>
                </button>
                <button
                  type="button"
                  onClick={() => onToggleWishlist?.(product)}
                  className={`inline-flex items-center justify-center gap-2 rounded-2xl border px-5 py-3.5 text-sm font-black transition ${
                    wishlisted
                      ? "border-rose-200 bg-rose-50 text-rose-600"
                      : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  <span>{wishlisted ? "❤️" : "🤍"}</span>
                  <span>{wishlisted ? t("prod_saved_wishlist", "Saved in Wishlist") : t("prod_save_for_later", "Save for Later")}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default QuickViewModal;
