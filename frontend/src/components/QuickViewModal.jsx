import { getAssetUrl } from "../services/api";

const fallbackImage =
  "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=900&q=80";

function QuickViewModal({ product, onClose, onAddToCart, onToggleWishlist, wishlisted }) {
  if (!product) {
    return null;
  }

  const imageUrl = product.imageUrl || getAssetUrl(product.image) || fallbackImage;
  const ratingValue = Number(product.averageRating || product.rating || 0);
  const rating = ratingValue > 0 ? ratingValue.toFixed(1) : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 px-4 py-6 backdrop-blur-sm">
      <div className="max-h-[92vh] w-full max-w-4xl overflow-y-auto rounded-3xl bg-white shadow-2xl">
        <div className="grid gap-0 md:grid-cols-[0.9fr_1.1fr]">
          <div className="bg-linear-to-br from-emerald-50 to-lime-50 p-5">
            <img src={imageUrl} alt={product.name} className="h-80 w-full rounded-2xl object-cover" />
          </div>
          <div className="p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-bold uppercase tracking-wide text-emerald-600">{product.category}</p>
                <h2 className="mt-2 text-3xl font-black text-slate-950">{product.name}</h2>
                <p className="mt-2 text-sm text-slate-500">
                  Sold by {product.farmer?.storeName || product.farmerName || "Farmer listing"}
                </p>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="rounded-full border border-slate-200 px-3 py-1 text-sm font-black text-slate-500 hover:bg-slate-50"
              >
                X
              </button>
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-3">
              <div className="rounded-2xl bg-amber-50 p-3">
                <p className="text-xs font-bold text-amber-700">Rating</p>
                <p className="mt-1 text-lg font-black text-slate-900">{rating ? `${rating}/5` : "New"}</p>
              </div>
              <div className="rounded-2xl bg-emerald-50 p-3">
                <p className="text-xs font-bold text-emerald-700">Stock</p>
                <p className="mt-1 text-lg font-black text-slate-900">{product.quantity || 0} left</p>
              </div>
              <div className="rounded-2xl bg-sky-50 p-3">
                <p className="text-xs font-bold text-sky-700">Distance</p>
                <p className="mt-1 text-lg font-black text-slate-900">
                  {product.distanceInKm !== undefined ? `${product.distanceInKm} km` : "Nearby"}
                </p>
              </div>
            </div>

            <p className="mt-5 text-sm leading-6 text-slate-600">
              Review the latest stock, price, farmer details, and location before adding this live marketplace listing
              to your cart.
            </p>

            <div className="mt-6 flex items-end justify-between gap-4">
              <div>
                <p className="text-sm text-slate-500">Marketplace Price</p>
                <p className="text-3xl font-black text-emerald-700">Rs. {product.price}</p>
              </div>
              <span className="rounded-full bg-lime-100 px-3 py-1 text-xs font-black text-lime-700">
                Live Listing
              </span>
            </div>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                onClick={() => onAddToCart(product)}
                disabled={product.quantity <= 0}
                className="flex-1 rounded-2xl bg-emerald-600 px-5 py-3 text-sm font-black text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-slate-300"
              >
                Add to Cart
              </button>
              <button
                type="button"
                onClick={() => onToggleWishlist(product)}
                className="rounded-2xl border border-emerald-200 px-5 py-3 text-sm font-black text-emerald-700 hover:bg-emerald-50"
              >
                {wishlisted ? "Saved" : "Save to Wishlist"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default QuickViewModal;
