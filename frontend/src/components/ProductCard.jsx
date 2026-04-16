import { useNavigate } from "react-router-dom";

import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";

function ProductCard({ product }) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { addToCart } = useCart();

  const handleAddToCart = () => {
    if (user?.role !== "customer") {
      navigate("/login");
      return;
    }

    addToCart(product);
  };

  return (
    <article className="overflow-hidden rounded-3xl border border-emerald-100 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-lg">
      <div className="h-48 bg-gradient-to-br from-emerald-100 via-lime-50 to-amber-50">
        {product.image ? (
          <img
            src={`http://localhost:5000${product.image}`}
            alt={product.name}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-5xl">🥬</div>
        )}
      </div>

      <div className="space-y-3 p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="text-lg font-semibold text-slate-900">{product.name}</h3>
            <p className="text-sm text-slate-500">{product.category}</p>
          </div>
          <span className="rounded-full bg-emerald-50 px-3 py-1 text-sm font-semibold text-emerald-700">
            Rs. {product.price}
          </span>
        </div>

        <p className="text-sm text-slate-600">
          Farmer: {product.farmer?.storeName || "Local Farm"} · Stock: {product.quantity}
        </p>

        {product.distanceInKm !== undefined && (
          <p className="text-sm text-slate-500">{product.distanceInKm} km away</p>
        )}

        <button
          type="button"
          onClick={handleAddToCart}
          disabled={product.quantity <= 0}
          className="w-full rounded-2xl bg-emerald-600 px-4 py-3 font-semibold text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-slate-300"
        >
          {product.quantity > 0 ? "Add to Cart" : "Out of Stock"}
        </button>
      </div>
    </article>
  );
}

export default ProductCard;
