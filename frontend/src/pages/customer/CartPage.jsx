import { Link } from "react-router-dom";

import EmptyState from "../../components/EmptyState";
import { useCart } from "../../context/CartContext";

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
        {items.map((item) => (
          <div key={item._id} className="rounded-3xl bg-white p-5 shadow-sm">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h3 className="text-lg font-semibold text-slate-900">{item.name}</h3>
                <p className="text-sm text-slate-500">{item.category}</p>
                <p className="mt-1 text-sm font-medium text-emerald-700">Rs. {item.price}</p>
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
        <h2 className="text-xl font-bold text-slate-900">Order Summary</h2>
        <div className="mt-6 flex items-center justify-between text-sm text-slate-500">
          <span>Subtotal</span>
          <span className="font-semibold text-slate-900">Rs. {subtotal.toFixed(2)}</span>
        </div>
        <Link
          to="/checkout"
          className="mt-6 inline-flex w-full justify-center rounded-2xl bg-emerald-600 px-4 py-3 font-semibold text-white hover:bg-emerald-700"
        >
          Proceed to Checkout
        </Link>
      </aside>
    </div>
  );
}

export default CartPage;
