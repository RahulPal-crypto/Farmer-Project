import { useState } from "react";
import { useNavigate } from "react-router-dom";

import ErrorAlert from "../../components/ErrorAlert";
import { useCart } from "../../context/CartContext";
import { getApiErrorMessage } from "../../services/api";
import { createOrder } from "../../services/orderService";

function CheckoutPage() {
  const navigate = useNavigate();
  const { items, subtotal, clearCart } = useCart();
  const [placingOrder, setPlacingOrder] = useState(false);
  const [error, setError] = useState("");

  const handlePlaceOrder = async () => {
    try {
      setPlacingOrder(true);
      setError("");

      await createOrder({
        items: items.map((item) => ({
          productId: item._id,
          quantity: item.cartQuantity,
        })),
      });

      clearCart();
      navigate("/orders");
    } catch (error) {
      setError(getApiErrorMessage(error, "Unable to place order"));
    } finally {
      setPlacingOrder(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl rounded-3xl bg-white p-6 shadow-sm md:p-8">
      <h1 className="text-3xl font-bold text-slate-900">Checkout</h1>
      <p className="mt-2 text-sm text-slate-500">Review your cart and place your order.</p>

      <div className="mt-6 space-y-4">
        {items.map((item) => (
          <div key={item._id} className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3">
            <div>
              <p className="font-semibold text-slate-900">{item.name}</p>
              <p className="text-sm text-slate-500">
                {item.cartQuantity} x Rs. {item.price}
              </p>
            </div>
            <p className="font-semibold text-slate-900">Rs. {(item.price * item.cartQuantity).toFixed(2)}</p>
          </div>
        ))}
      </div>

      <div className="mt-6 rounded-2xl bg-emerald-50 px-4 py-5">
        <div className="flex items-center justify-between">
          <span className="text-sm text-emerald-900">Total payable</span>
          <span className="text-2xl font-bold text-emerald-800">Rs. {subtotal.toFixed(2)}</span>
        </div>
      </div>

      <div className="mt-6 space-y-4">
        <ErrorAlert message={error} />
        <button
          type="button"
          onClick={handlePlaceOrder}
          disabled={placingOrder || items.length === 0}
          className="w-full rounded-2xl bg-slate-900 px-4 py-3 font-semibold text-white hover:bg-slate-700 disabled:opacity-60"
        >
          {placingOrder ? "Placing order..." : "Place Order"}
        </button>
      </div>
    </div>
  );
}

export default CheckoutPage;
