import { useNavigate } from "react-router-dom";

import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
import { useWishlist } from "../context/WishlistContext";
import { getAssetUrl } from "../services/api";

const fallbackImage =
  "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=700&q=80";

function ProductCard({ product, onQuickView }) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { addToCart } = useCart();
  const { isWishlisted, toggleWishlist } = useWishlist();
  const imageUrl = product.imageUrl || getAssetUrl(product.image) || fallbackImage;
  const ratingValue = Number(product.averageRating || product.rating || 0);
  const rating = ratingValue > 0 ? ratingValue.toFixed(1) : null;
  const stockLabel = product.quantity > 0 ? `${product.quantity} in stock` : "Out of stock";
  const wishlisted = isWishlisted(product._id);

  const handleAddToCart = () => {
    if (user?.role !== "customer") {
      navigate("/login");
      return;
    }

    addToCart(product);
  };

  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm transition hover:-translate-y-1 hover:border-emerald-200 hover:shadow-xl">
      <div className="relative h-48 bg-linear-to-br from-emerald-50 via-lime-50 to-amber-50">
        <img src={imageUrl} alt={product.name} className="h-full w-full object-cover transition group-hover:scale-105" />
        <button
          type="button"
          onClick={() => toggleWishlist(product)}
          className={`absolute right-3 top-3 rounded-full px-3 py-2 text-sm font-black shadow-sm ${
            wishlisted ? "bg-red-500 text-white" : "bg-white/95 text-slate-700 hover:text-red-500"
          }`}
          aria-label={wishlisted ? "Remove from wishlist" : "Add to wishlist"}
        >
          {wishlisted ? "Saved" : "Save"}
        </button>
        <span className="absolute bottom-3 left-3 rounded-full bg-lime-500 px-3 py-1 text-xs font-black text-white">
          Live Listing
        </span>
      </div>

      <div className="flex flex-1 flex-col space-y-3 p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="truncate text-lg font-black text-slate-900">{product.name}</h3>
            <p className="mt-1 truncate text-sm font-medium text-slate-500">
              {product.farmer?.storeName || product.farmerName || "Farmer listing"}
            </p>
          </div>
          <span className="shrink-0 rounded-full bg-emerald-50 px-3 py-1 text-sm font-black text-emerald-700">
            Rs. {product.price}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-2 text-xs font-bold">
          <span className="rounded-full bg-amber-50 px-3 py-2 text-amber-700">
            {rating ? `Rating ${rating}/5` : "New listing"}
          </span>
          <span className="rounded-full bg-slate-50 px-3 py-2 text-slate-600">{product.category}</span>
        </div>

        <div className="flex items-center justify-between gap-3 text-sm font-medium text-slate-500">
          <span>{stockLabel}</span>
          <span>{product.distanceInKm !== undefined ? `${product.distanceInKm} km away` : "Nearby farm"}</span>
        </div>

        <div className="mt-auto grid grid-cols-[1fr_auto] gap-3 pt-2">
          <button
            type="button"
            onClick={handleAddToCart}
            disabled={product.quantity <= 0}
            className="rounded-xl bg-emerald-600 px-4 py-3 text-sm font-black text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-slate-300"
          >
            {product.quantity > 0 ? "Add to Cart" : "Out of Stock"}
          </button>
          <button
            type="button"
            onClick={() => onQuickView?.(product)}
            className="rounded-xl border border-slate-200 px-4 py-3 text-sm font-black text-slate-700 hover:bg-slate-50"
          >
            View
          </button>
        </div>
      </div>
    </article>
  );
}

export default ProductCard;
