import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Link } from "react-router-dom";

import EmptyState from "../../components/EmptyState";
import ErrorAlert from "../../components/ErrorAlert";
import { useCart } from "../../context/CartContext";
import { useAuth } from "../../context/AuthContext";
import api, { getApiErrorMessage } from "../../services/api";
import { createRazorpayOrder, verifyRazorpayPayment } from "../../services/paymentService";
import { formatWhatsAppUrl, buildCustomerToFarmerOrderText } from "../../utils/whatsapp";

const loadRazorpayCheckout = () => {
  return new Promise((resolve, reject) => {
    if (window.Razorpay) {
      resolve(true);
      return;
    }

    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(true);
    script.onerror = () => reject(new Error("Unable to load Razorpay checkout"));
    document.body.appendChild(script);
  });
};

function CheckoutPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { items, subtotal, clearCart } = useCart();
  const [paymentMethod, setPaymentMethod] = useState("razorpay"); // "razorpay" | "cod"
  const [placingOrder, setPlacingOrder] = useState(false);
  const [placedSuccessData, setPlacedSuccessData] = useState(null);
  const [error, setError] = useState("");
  const [deliveryAddress, setDeliveryAddress] = useState({
    street: "",
    city: "",
    pincode: "",
    notes: "",
    contactPhone: user?.phone || "",
    isWhatsappSameAsPhone: user?.isWhatsappSameAsPhone ?? true,
    whatsappPhone: user?.whatsappPhone || "",
    deliverySlot: "Morning Harvest (7:00 AM - 10:00 AM)",
  });

  const farmerIds = new Set(
    items.map((item) => (typeof item.farmer === "object" ? item.farmer?._id : item.farmer)).filter(Boolean)
  );
  const hasMultipleFarmers = farmerIds.size > 1;

  const itemsByFarm = items.reduce((acc, item) => {
    const farmName = item.farmer?.storeName || item.farmerName || "Local Farm";
    if (!acc[farmName]) acc[farmName] = [];
    acc[farmName].push(item);
    return acc;
  }, {});

  if (placedSuccessData) {
    return (
      <div className="mx-auto max-w-2xl rounded-3xl bg-white p-6 shadow-xl border border-emerald-100 md:p-8 text-center animate-fade-in">
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100 text-4xl shadow-inner">
          🎉
        </div>
        <h1 className="mt-4 text-3xl font-black text-slate-900">Order Placed Successfully!</h1>
        <p className="mt-2 text-sm text-slate-600">
          Your direct farm harvest order has been sent to the local grower(s).
        </p>

        <div className="mt-6 rounded-2xl bg-emerald-50/70 p-4 border border-emerald-200 text-left space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-500 font-bold">Total Payable:</span>
            <span className="font-black text-slate-900 text-base">
              Rs. {Number(placedSuccessData.total).toFixed(0)} ({placedSuccessData.paymentMethod.toUpperCase()})
            </span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-500 font-bold">Harvest / Delivery Slot:</span>
            <span className="font-bold text-emerald-800">
              {placedSuccessData.deliveryAddress?.deliverySlot || "Standard Any-Time"}
            </span>
          </div>
          <div className="text-xs text-slate-600 border-t border-emerald-200/60 pt-2">
            📍 <span className="font-semibold">{placedSuccessData.deliveryAddress?.street}, {placedSuccessData.deliveryAddress?.city} ({placedSuccessData.deliveryAddress?.pincode})</span>
          </div>
        </div>

        {/* 1-Click WhatsApp Button for each Farm Order */}
        <div className="mt-6 space-y-3">
          <p className="text-xs font-black uppercase tracking-wider text-slate-500 text-left">
            📲 Instant WhatsApp Dispatch (Direct to Grower):
          </p>
          {placedSuccessData.orders.map((order, idx) => {
            const farmer = order.farmer;
            const farmerName = farmer?.storeName || (order.farmerName ? order.farmerName : `Farm #${idx + 1}`);
            const farmerPhone = farmer?.whatsappPhone || farmer?.phone;
            const waUrl = farmerPhone
              ? formatWhatsAppUrl(farmerPhone, buildCustomerToFarmerOrderText({ order, farmer, customer: user }))
              : null;

            return (
              <div key={order._id || idx} className="rounded-2xl border border-emerald-200 bg-white p-4 text-left flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
                <div>
                  <p className="font-bold text-slate-900">🌾 {farmerName}</p>
                  <p className="text-xs text-slate-500">Order #{String(order._id || "").slice(-6).toUpperCase()} • {order.items?.length || placedSuccessData.itemCount} item(s)</p>
                </div>
                {waUrl ? (
                  <a
                    href={waUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-4 py-2.5 text-sm font-bold text-white shadow-md hover:bg-emerald-700 transition"
                  >
                    <span>💬</span>
                    <span>Send Order on WhatsApp</span>
                  </a>
                ) : (
                  <span className="text-xs text-slate-400 italic">Farmer phone not registered</span>
                )}
              </div>
            );
          })}
        </div>

        <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            to="/orders"
            className="rounded-2xl bg-slate-900 px-6 py-3 font-bold text-white hover:bg-slate-800 transition"
          >
            Go to My Orders
          </Link>
          <Link
            to="/"
            className="rounded-2xl border border-slate-200 px-6 py-3 font-bold text-slate-700 hover:bg-slate-50 transition"
          >
            Continue Shopping
          </Link>
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <EmptyState
        title="Your cart is empty"
        description="Add live marketplace products before starting checkout."
        action={
          <Link to="/" className="rounded-2xl bg-emerald-600 px-5 py-3 font-semibold text-white">
            Browse Products
          </Link>
        }
      />
    );
  }

  const validateAddress = () => {
    if (!deliveryAddress.street.trim() || !deliveryAddress.city.trim() || !deliveryAddress.pincode.trim()) {
      setError("Please fill out your complete delivery address (Street, City, Pincode).");
      return false;
    }
    if (!deliveryAddress.contactPhone?.trim()) {
      setError("Please provide a contact phone number for delivery coordination.");
      return false;
    }
    if (!deliveryAddress.isWhatsappSameAsPhone && !deliveryAddress.whatsappPhone?.trim()) {
      setError("Please provide your WhatsApp number for order updates or check 'Same as phone'.");
      return false;
    }
    return true;
  };

  const handlePlaceCodOrder = async () => {
    if (!validateAddress()) return;

    try {
      setPlacingOrder(true);
      setError("");
      const orderItems = items.map((item) => ({
        productId: item._id,
        quantity: item.cartQuantity,
      }));

      const { data } = await api.post("/orders/create", { items: orderItems, deliveryAddress });
      const createdOrders = data.orders || (data.order ? [data.order] : []);
      const orderTotal = subtotal;
      const orderItemCount = items.length;
      clearCart();
      setPlacedSuccessData({
        orders: createdOrders,
        paymentMethod: "cod",
        deliveryAddress,
        total: orderTotal,
        itemCount: orderItemCount,
      });
    } catch (err) {
      setError(getApiErrorMessage(err, "Unable to place Cash on Delivery order"));
    } finally {
      setPlacingOrder(false);
    }
  };

  const handlePlaceOrder = async () => {
    if (!validateAddress()) return;

    if (paymentMethod === "cod") {
      return handlePlaceCodOrder();
    }
    try {
      setPlacingOrder(true);
      setError("");

      await loadRazorpayCheckout();

      const orderItems = items.map((item) => ({
        productId: item._id,
        quantity: item.cartQuantity,
      }));

      const paymentOrder = await createRazorpayOrder({ items: orderItems, deliveryAddress });

      const options = {
        key: paymentOrder.keyId,
        amount: paymentOrder.amount,
        currency: paymentOrder.currency,
        name: "Farmer Market",
        description: "Fresh produce direct from farms",
        order_id: paymentOrder.razorpayOrderId,
        prefill: {
          name: user?.storeName || "",
          email: user?.email || "",
          contact: user?.phone || "",
        },
        theme: {
          color: "#059669",
        },
        handler: async (response) => {
          try {
            const verifyRes = await verifyRazorpayPayment(response);
            const createdOrders = verifyRes.orders || (verifyRes.order ? [verifyRes.order] : []);
            const orderTotal = subtotal;
            const orderItemCount = items.length;
            clearCart();
            setPlacedSuccessData({
              orders: createdOrders,
              paymentMethod: "razorpay",
              deliveryAddress,
              total: orderTotal,
              itemCount: orderItemCount,
            });
          } catch (error) {
            setError(getApiErrorMessage(error, "Payment verification failed"));
          } finally {
            setPlacingOrder(false);
          }
        },
        modal: {
          ondismiss: () => {
            setPlacingOrder(false);
          },
        },
      };

      const razorpay = new window.Razorpay(options);
      razorpay.on("payment.failed", (response) => {
        setError(response?.error?.description || "Payment failed. Please try again.");
        setPlacingOrder(false);
      });
      razorpay.open();
    } catch (error) {
      setError(getApiErrorMessage(error, error.message || "Unable to start payment"));
      setPlacingOrder(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl rounded-3xl bg-white p-6 shadow-sm md:p-8">
      <h1 className="text-3xl font-bold text-slate-900">Checkout</h1>
      <p className="mt-2 text-sm text-slate-500">Provide your delivery details and choose payment to place your order.</p>

      {/* Multi-farm notice */}
      {hasMultipleFarmers ? (
        <div className="mt-4 flex items-start gap-3 rounded-2xl border border-emerald-200 bg-emerald-50/70 p-4 text-sm text-emerald-900">
          <span className="text-xl">🚜</span>
          <div>
            <p className="font-bold">Multi-Farm Order</p>
            <p className="mt-0.5 text-xs text-emerald-700">
              Your cart has items from {farmerIds.size} different farms. They will be automatically split into individual orders so each farmer can fulfill and deliver their fresh produce directly to you.
            </p>
          </div>
        </div>
      ) : null}

      {/* Order Summary Grouped by Farm */}
      <div className="mt-6 space-y-5">
        <h2 className="text-base font-bold text-slate-900">Items by Farm</h2>
        {Object.entries(itemsByFarm).map(([farmName, farmItems]) => (
          <div key={farmName} className="rounded-2xl border border-slate-100 bg-slate-50/60 p-4">
            <div className="flex items-center gap-2 border-b border-slate-200/60 pb-2">
              <span className="text-base">🏡</span>
              <p className="font-semibold text-slate-800">{farmName}</p>
              <span className="rounded-full bg-slate-200 px-2 py-0.5 text-[10px] font-bold text-slate-600">
                {farmItems.length} {farmItems.length === 1 ? "item" : "items"}
              </span>
            </div>
            <div className="mt-3 space-y-2">
              {farmItems.map((item) => (
                <div key={item._id} className="flex items-center justify-between text-sm">
                  <div>
                    <span className="font-medium text-slate-800">{item.name}</span>
                    <span className="ml-2 text-xs text-slate-500">
                      ({item.cartQuantity} × Rs. {item.price})
                    </span>
                  </div>
                  <span className="font-semibold text-slate-900">
                    Rs. {(item.price * item.cartQuantity).toFixed(2)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Delivery Address Form */}
      <div className="mt-8 rounded-2xl border border-slate-200/80 bg-white p-5">
        <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
          <span className="text-lg">📍</span>
          <div>
            <h2 className="font-bold text-slate-900">Delivery Address</h2>
            <p className="text-xs text-slate-500">Farmers need your destination details for doorstep delivery</p>
          </div>
        </div>

        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600">
              Street / House / Flat Address *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. House #14, Green Valley Road, Sector 4"
              value={deliveryAddress.street}
              onChange={(e) => setDeliveryAddress({ ...deliveryAddress, street: e.target.value })}
              className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm focus:border-emerald-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600">
              City / District *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Pune, Nashik, Bengaluru"
              value={deliveryAddress.city}
              onChange={(e) => setDeliveryAddress({ ...deliveryAddress, city: e.target.value })}
              className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm focus:border-emerald-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600">
              Postal Pincode *
            </label>
            <input
              type="text"
              required
              maxLength={10}
              placeholder="e.g. 411001"
              value={deliveryAddress.pincode}
              onChange={(e) => setDeliveryAddress({ ...deliveryAddress, pincode: e.target.value })}
              className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm focus:border-emerald-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600">
              Contact Phone Number *
            </label>
            <input
              type="tel"
              required
              placeholder="e.g. 9876543210"
              value={deliveryAddress.contactPhone}
              onChange={(e) => setDeliveryAddress({ ...deliveryAddress, contactPhone: e.target.value })}
              className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm focus:border-emerald-500 focus:outline-none"
            />
          </div>

          <div className="flex flex-col justify-end">
            <label className="flex items-center gap-2 cursor-pointer py-2.5 text-xs font-bold text-slate-700">
              <input
                type="checkbox"
                checked={deliveryAddress.isWhatsappSameAsPhone}
                onChange={(e) =>
                  setDeliveryAddress({
                    ...deliveryAddress,
                    isWhatsappSameAsPhone: e.target.checked,
                    whatsappPhone: e.target.checked ? "" : deliveryAddress.whatsappPhone,
                  })
                }
                className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
              />
              <span>💬 Same as my WhatsApp number</span>
            </label>
          </div>

          {!deliveryAddress.isWhatsappSameAsPhone && (
            <div className="sm:col-span-2 rounded-xl border border-emerald-200 bg-emerald-50/60 p-3.5">
              <label className="block text-xs font-bold uppercase tracking-wider text-emerald-950">
                Alternate WhatsApp Number (For Live Order & Dispatch Updates) *
              </label>
              <input
                type="tel"
                required
                placeholder="e.g. 9123456789 (WhatsApp to receive order notifications)"
                value={deliveryAddress.whatsappPhone}
                onChange={(e) => setDeliveryAddress({ ...deliveryAddress, whatsappPhone: e.target.value })}
                className="mt-1 w-full rounded-xl border border-emerald-300 bg-white px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none"
              />
              <p className="mt-1 text-[11px] text-emerald-700">
                Order confirmation, farm acceptance, and doorstep delivery alerts will be delivered directly to this WhatsApp number.
              </p>
            </div>
          )}

          {/* Preferred Harvest & Delivery Window */}
          <div className="sm:col-span-2 pt-2">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
              Preferred Harvest & Delivery Window *
            </label>
            <div className="mt-2 grid gap-2.5 sm:grid-cols-3">
              {[
                { id: "Morning Harvest (7:00 AM - 10:00 AM)", icon: "🌅", title: "Morning Harvest", desc: "7:00 AM - 10:00 AM" },
                { id: "Evening Fresh (4:00 PM - 7:00 PM)", icon: "🌇", title: "Evening Fresh", desc: "4:00 PM - 7:00 PM" },
                { id: "Standard Any-Time (Within 24 Hours)", icon: "⚡", title: "Standard Slot", desc: "Within 24 Hours" },
              ].map((slot) => {
                const isSelected = deliveryAddress.deliverySlot === slot.id;
                return (
                  <button
                    key={slot.id}
                    type="button"
                    onClick={() => setDeliveryAddress({ ...deliveryAddress, deliverySlot: slot.id })}
                    className={`flex flex-col items-start rounded-2xl border p-3 text-left transition ${
                      isSelected
                        ? "border-emerald-600 bg-emerald-50/70 text-emerald-950 ring-2 ring-emerald-500/20"
                        : "border-slate-200 hover:border-slate-300 bg-white text-slate-700"
                    }`}
                  >
                    <span className="text-xl">{slot.icon}</span>
                    <span className="mt-1 font-bold text-xs">{slot.title}</span>
                    <span className="text-[11px] text-slate-500">{slot.desc}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="sm:col-span-2">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600">
              Delivery Notes / Instructions (Optional)
            </label>
            <input
              type="text"
              placeholder="e.g. Landmark near water tank, call before arriving"
              value={deliveryAddress.notes}
              onChange={(e) => setDeliveryAddress({ ...deliveryAddress, notes: e.target.value })}
              className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm focus:border-emerald-500 focus:outline-none"
            />
          </div>
        </div>
      </div>

      {/* Payable Subtotal */}
      <div className="mt-6 rounded-2xl bg-emerald-50 px-5 py-4">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-emerald-900">Total payable</span>
          <span className="text-2xl font-bold text-emerald-800">Rs. {subtotal.toFixed(2)}</span>
        </div>
      </div>

      {/* Payment Selection */}
      <div className="mt-6 space-y-3">
        <p className="font-semibold text-slate-900">Select Payment Method</p>
        <div className="grid gap-3 sm:grid-cols-2">
          <label
            className={`flex cursor-pointer items-center gap-3 rounded-2xl border p-4 transition ${
              paymentMethod === "razorpay"
                ? "border-emerald-600 bg-emerald-50 text-emerald-900 ring-2 ring-emerald-500/20"
                : "border-slate-200 bg-white text-slate-700 hover:border-slate-300"
            }`}
          >
            <input
              type="radio"
              name="paymentMethod"
              value="razorpay"
              checked={paymentMethod === "razorpay"}
              onChange={() => setPaymentMethod("razorpay")}
              className="text-emerald-600 focus:ring-emerald-500"
            />
            <div>
              <p className="font-bold">Online Payment (Razorpay)</p>
              <p className="text-xs text-slate-500">Cards, UPI, NetBanking, Wallets</p>
            </div>
          </label>

          <label
            className={`flex cursor-pointer items-center gap-3 rounded-2xl border p-4 transition ${
              paymentMethod === "cod"
                ? "border-emerald-600 bg-emerald-50 text-emerald-900 ring-2 ring-emerald-500/20"
                : "border-slate-200 bg-white text-slate-700 hover:border-slate-300"
            }`}
          >
            <input
              type="radio"
              name="paymentMethod"
              value="cod"
              checked={paymentMethod === "cod"}
              onChange={() => setPaymentMethod("cod")}
              className="text-emerald-600 focus:ring-emerald-500"
            />
            <div>
              <p className="font-bold">Cash on Delivery (COD)</p>
              <p className="text-xs text-slate-500">Pay directly when delivered</p>
            </div>
          </label>
        </div>
      </div>

      {/* Submit Button */}
      <div className="mt-6 space-y-4">
        <ErrorAlert message={error} />
        <button
          type="button"
          onClick={handlePlaceOrder}
          disabled={placingOrder || items.length === 0}
          className="w-full rounded-2xl bg-emerald-600 px-4 py-3.5 font-bold text-white shadow-md shadow-emerald-600/20 transition hover:bg-emerald-700 disabled:opacity-60"
        >
          {placingOrder
            ? paymentMethod === "cod"
              ? "Placing order..."
              : "Opening payment..."
            : paymentMethod === "cod"
            ? "Place Cash on Delivery Order"
            : `Pay Rs. ${subtotal.toFixed(2)} with Razorpay`}
        </button>
      </div>
    </div>
  );
}

export default CheckoutPage;

