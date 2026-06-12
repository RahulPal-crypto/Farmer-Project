import { Link } from "react-router-dom";

import EmptyState from "../../components/EmptyState";
import { useCart } from "../../context/CartContext";
import { getAssetUrl } from "../../services/api";

const fallbackImage =
  "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=500&q=80";

function CartPage() {
  const { items, subtotal, removeFromCart, updateCartQuantity } = useCart();

  if (items.length === 0) {
    return (
      <EmptyState
        title="Your cart is empty"
        description="Browse nearby farm products and add a few items to get started."
        action={
          <Link to="/" className="rounded-2xl bg-emerald-600 px-5 py-3 font-semibold text-white">
            Explore Products
          </Link>
        }
      />
    );
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[1.4fr_0.8fr]">
      <section className="space-y-4">
        <div className="rounded-3xl bg-white p-6 shadow-sm">
          <h1 className="text-3xl font-black text-slate-950">Shopping Cart</h1>
          <p className="mt-2 text-sm text-slate-500">
            Review fresh items, adjust quantity, and checkout with secure payment.
          </p>
        </div>
        {items.map((item) => (
          <div key={item._id} className="rounded-3xl border border-slate-100 bg-white p-5 shadow-sm">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex gap-4">
                <img
                  src={item.imageUrl || getAssetUrl(item.image) || fallbackImage}
                  alt={item.name}
                  className="h-24 w-24 rounded-2xl object-cover"
                />
                <div>
                  <h3 className="text-lg font-black text-slate-900">{item.name}</h3>
                  <p className="text-sm font-medium text-slate-500">
                    {item.farmer?.storeName || item.farmerName || "Farmer listing"}
                  </p>
                  <p className="mt-1 text-sm font-black text-emerald-700">Rs. {item.price}</p>
                  <p className="mt-1 text-xs font-bold text-slate-400">{item.category} - Farmer listing</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <input
                  type="number"
                  min="1"
                  max={item.quantity}
                  value={item.cartQuantity}
                  onChange={(event) => updateCartQuantity(item._id, Number(event.target.value))}
                  className="w-24 rounded-2xl border border-slate-200 px-3 py-2"
                />
                <button
                  type="button"
                  onClick={() => removeFromCart(item._id)}
                  className="rounded-2xl border border-red-200 px-4 py-2 text-sm font-semibold text-red-600 hover:bg-red-50"
                >
                  Remove
                </button>
              </div>
            </div>
          </div>
        ))}
      </section>

      <aside className="rounded-3xl bg-white p-6 shadow-sm">
        <h2 className="text-xl font-black text-slate-900">Order Summary</h2>
        <div className="mt-5 rounded-2xl bg-emerald-50 p-4">
          <p className="text-sm font-black text-emerald-800">Order confirmation</p>
          <p className="mt-1 text-sm text-emerald-700">Payment creates an order record for the farmer to process.</p>
        </div>
        <div className="mt-6 flex items-center justify-between text-sm text-slate-500">
          <span>Subtotal</span>
          <span className="font-semibold text-slate-900">Rs. {subtotal.toFixed(2)}</span>
        </div>
        <div className="mt-3 flex items-center justify-between text-sm text-slate-500">
          <span>Delivery</span>
          <span className="font-semibold text-slate-900">Coordinated by farmer</span>
        </div>
        <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-4 text-sm text-slate-500">
          <span>Total</span>
          <span className="text-lg font-black text-slate-900">Rs. {subtotal.toFixed(2)}</span>
        </div>
        <Link
          to="/checkout"
          className="mt-6 inline-flex w-full justify-center rounded-2xl bg-emerald-600 px-4 py-3 font-semibold text-white hover:bg-emerald-700"
        >
          Proceed to Checkout
        </Link>
        <div className="mt-5 grid gap-2 text-xs font-bold text-slate-500">
          <span>Secure payments</span>
          <span>Farmer-managed listings</span>
          <span>Farmer-managed fulfilment</span>
        </div>
      </aside>
    </div>
  );
}

export default CartPage;
