import { Link } from "react-router-dom";

import EmptyState from "../../components/EmptyState";
import { useCart } from "../../context/CartContext";
import { useLanguage } from "../../context/LanguageContext";
import { getAssetUrl } from "../../services/api";

const fallbackImage =
  "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=500&q=80";

function CartPage() {
  const { items, subtotal, removeFromCart, updateCartQuantity } = useCart();
  const { t, isHindi } = useLanguage();

  const farmerIds = new Set(
    items.map((item) => (typeof item.farmer === "object" ? item.farmer?._id : item.farmer)).filter(Boolean)
  );
  const hasMultipleFarmers = farmerIds.size > 1;

  if (items.length === 0) {
    return (
      <EmptyState
        title={isHindi ? "आपका थैला (कार्ट) खाली है" : "Your cart is empty"}
        description={
          isHindi
            ? "नज़दीकी खेतों की ताज़ा फसलें देखें और खरीदारी शुरू करने के लिए कुछ उत्पाद जोड़ें।"
            : "Browse nearby farm products and add a few items to get started."
        }
        action={
          <Link to="/" className="rounded-2xl bg-emerald-600 px-5 py-3 font-semibold text-white">
            {isHindi ? "फसलें देखें" : "Explore Products"}
          </Link>
        }
      />
    );
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1.4fr_0.8fr] 2xl:grid-cols-[1.7fr_0.8fr]">
      <section className="space-y-4">
        <div className="rounded-3xl bg-white p-6 shadow-sm">
          <h1 className="text-3xl font-black text-slate-950">{t("cart_title", "Shopping Cart")}</h1>
          <p className="mt-2 text-sm text-slate-500">
            {t(
              "cart_subtitle",
              "Review fresh items, adjust quantity, and checkout with secure payment."
            )}
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
                    {item.farmer?.storeName || item.farmerName || (isHindi ? "किसान सूची" : "Farmer listing")}
                  </p>
                  <p className="mt-1 text-sm font-black text-emerald-700">₹{item.price}</p>
                  <p className="mt-1 text-xs font-bold text-slate-400">
                    {item.category} - {isHindi ? "सीधे खेत से" : "Farmer listing"}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <input
                  type="number"
                  min="1"
                  max={item.quantity}
                  value={item.cartQuantity}
                  onChange={(event) => updateCartQuantity(item._id, Number(event.target.value))}
                  className="w-24 rounded-2xl border border-slate-200 px-3 py-2 text-center font-bold"
                />
                <button
                  type="button"
                  onClick={() => removeFromCart(item._id)}
                  className="rounded-2xl border border-red-200 px-4 py-2 text-sm font-semibold text-red-600 hover:bg-red-50"
                >
                  {isHindi ? "हटाएं" : "Remove"}
                </button>
              </div>
            </div>
          </div>
        ))}
      </section>

      <aside className="rounded-3xl bg-white p-6 shadow-sm">
        <h2 className="text-xl font-black text-slate-900">{t("cart_summary_title", "Order Summary")}</h2>
        <div className="mt-5 rounded-2xl bg-emerald-50 p-4">
          <p className="text-sm font-black text-emerald-800">
            {isHindi ? "ऑर्डर की पुष्टि" : "Order confirmation"}
          </p>
          <p className="mt-1 text-sm text-emerald-700">
            {isHindi
              ? "ऑर्डर करने पर किसान को पैकिंग और डिलीवरी हेतु सूचना प्राप्त होगी।"
              : "Payment creates an order record for the farmer to process."}
          </p>
        </div>
        <div className="mt-6 flex items-center justify-between text-sm text-slate-500">
          <span>{t("cart_subtotal", "Subtotal")}</span>
          <span className="font-semibold text-slate-900">₹{subtotal.toFixed(2)}</span>
        </div>
        <div className="mt-3 flex items-center justify-between text-sm text-slate-500">
          <span>{t("cart_delivery", "Delivery")}</span>
          <span className="font-semibold text-slate-900">
            {t("cart_delivery_desc", "Coordinated directly by farmer")}
          </span>
        </div>
        <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-4 text-sm text-slate-500">
          <span>{t("cart_total", "Total")}</span>
          <span className="text-lg font-black text-slate-900">₹{subtotal.toFixed(2)}</span>
        </div>
        {hasMultipleFarmers && (
          <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50/80 p-3 text-xs text-emerald-800">
            <strong>{isHindi ? "✨ बहु-खेत ऑर्डर:" : "✨ Multi-farm order supported:"}</strong>{" "}
            {isHindi
              ? `${farmerIds.size} अलग-अलग खेतों की उपज चेकआउट पर स्वतः अलग-अलग आर्डर्स में विभाजित हो जाएगी।`
              : `Items from ${farmerIds.size} different farms will be seamlessly auto-split into individual orders per farm at checkout.`}
          </div>
        )}
        <Link
          to="/checkout"
          className="mt-6 inline-flex w-full justify-center rounded-2xl bg-emerald-600 px-4 py-3 font-semibold text-white hover:bg-emerald-700 transition"
        >
          {t("cart_btn_checkout", "Proceed to Checkout")}
        </Link>
        <div className="mt-5 grid gap-2 text-xs font-bold text-slate-500">
          <span>🔒 {isHindi ? "सुरक्षित भुगतान विकल्प" : "Secure payments"}</span>
          <span>🚜 {isHindi ? "सीधे किसान-प्रबंधित फसलें" : "Farmer-managed listings"}</span>
          <span>🌱 {isHindi ? "100% बिचौलिया-मुक्त ताज़गी" : "Farmer-managed fulfilment"}</span>
        </div>
      </aside>
    </div>
  );
}

export default CartPage;
