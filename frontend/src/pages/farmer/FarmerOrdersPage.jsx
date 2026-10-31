import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import EmptyState from "../../components/EmptyState";
import ErrorAlert from "../../components/ErrorAlert";
import LoadingSpinner from "../../components/LoadingSpinner";
import DeliveryRouteMap from "../../components/DeliveryRouteMap";
import api, { getApiErrorMessage } from "../../services/api";
import { updateOrderStatus } from "../../services/orderService";
import { formatWhatsAppUrl, buildFarmerToCustomerStatusText } from "../../utils/whatsapp";
import { useLanguage } from "../../context/LanguageContext";

const formatOrderDate = (value) => {
  if (!value) {
    return "Not available";
  }

  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
};

function FarmerOrdersPage() {
  const { t, isHindi } = useLanguage();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [updatingOrderId, setUpdatingOrderId] = useState("");
  const [expandedMapOrderId, setExpandedMapOrderId] = useState(null);

  const loadOrders = async () => {
    try {
      setLoading(true);
      setError("");
      const { data } = await api.get("/orders/received");
      setOrders(data.orders || []);
    } catch (error) {
      setError(getApiErrorMessage(error, "Unable to fetch incoming orders"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, []);

  const handleUpdateStatus = async (orderId, status) => {
    try {
      setUpdatingOrderId(orderId);
      await updateOrderStatus({ orderId, status });
      await loadOrders();
    } catch (error) {
      setError(getApiErrorMessage(error, "Unable to update order status"));
    } finally {
      setUpdatingOrderId("");
    }
  };

  if (loading) {
    return <LoadingSpinner label="Loading incoming orders..." />;
  }

  return (
    <div className="space-y-5">
      <div className="rounded-3xl bg-white p-6 shadow-sm">
        <h1 className="text-3xl font-black text-slate-900">{t("farmer_orders_title", "Order Management")}</h1>
        <p className="mt-2 text-sm text-slate-500">
          {t("farmer_orders_subtitle", "Accept, reject, deliver, and chat with customers from one queue.")}
        </p>
      </div>

      <ErrorAlert message={error} />

      {orders.length === 0 ? (
        <EmptyState
          title={isHindi ? "कोई नया ऑर्डर नहीं" : "No incoming orders"}
          description={isHindi ? "ग्राहकों के नए ऑर्डर्स यहां दिखाई देंगे।" : "New customer orders will appear here."}
        />
      ) : (
        orders.map((order) => (
          <article key={order._id} className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-slate-500">{isHindi ? "ग्राहक" : "Customer"}</p>
                <h2 className="text-lg font-semibold text-slate-900">
                  {order.customer?.storeName || (isHindi ? "ग्राहक" : "Customer")}
                </h2>
              </div>
              <span
                className={`rounded-full px-4 py-2 text-sm font-semibold capitalize ${
                  order.status === "delivered"
                    ? "bg-emerald-50 text-emerald-700"
                    : order.status === "rejected"
                    ? "bg-red-50 text-red-700"
                    : order.status === "accepted"
                    ? "bg-blue-50 text-blue-700"
                    : "bg-amber-50 text-amber-700"
                }`}
              >
                {order.status === "pending"
                  ? t("order_status_pending", "Pending")
                  : order.status === "accepted"
                  ? t("order_status_accepted", "Accepted & Packing")
                  : order.status === "rejected"
                  ? t("order_status_rejected", "Rejected")
                  : t("order_status_delivered", "Delivered")}
              </span>
            </div>

            <div className="mt-4 space-y-2 text-sm text-slate-600">
              {order.items.map((item) => (
                <div key={`${order._id}-${item.product}`} className="flex items-center justify-between">
                  <span>
                    {item.name} x {item.quantity}
                  </span>
                  <span>₹{(item.price * item.quantity).toFixed(2)}</span>
                </div>
              ))}
            </div>

            {order.deliveryAddress?.street && (
              <div className="mt-3 rounded-2xl border border-emerald-100 bg-emerald-50/60 p-3.5 text-xs text-slate-700">
                <p className="font-bold text-emerald-900">📍 {t("order_destination_label", "Customer Destination & Contact:")}</p>
                <p className="mt-1 font-medium">
                  {order.deliveryAddress.street}, {order.deliveryAddress.city} - {order.deliveryAddress.pincode}
                </p>
                {order.deliveryAddress.deliverySlot && (
                  <p className="mt-1 font-semibold text-emerald-800">
                    🕒 {t("order_slot_label", "Harvest/Delivery Window:")} {order.deliveryAddress.deliverySlot}
                  </p>
                )}
                {(order.deliveryAddress.contactPhone || order.customer?.phone) && (
                  <p className="mt-0.5 text-slate-600">
                    📞 {isHindi ? "फोन:" : "Phone:"} <span className="font-semibold text-slate-800">{order.deliveryAddress.contactPhone || order.customer.phone}</span>
                  </p>
                )}
                {(order.deliveryAddress.whatsappPhone || order.customer?.whatsappPhone) && (
                  <p className="mt-0.5 text-emerald-700">
                    💬 WhatsApp: <span className="font-semibold">{order.deliveryAddress.whatsappPhone || order.customer.whatsappPhone}</span>
                  </p>
                )}
                {order.deliveryAddress.notes && (
                  <p className="mt-0.5 italic text-slate-600">{isHindi ? "नोट:" : "Delivery note:"} {order.deliveryAddress.notes}</p>
                )}
              </div>
            )}

            <div className="mt-5 grid gap-3 sm:grid-cols-3">
              <div className="rounded-2xl bg-slate-50 p-3">
                <p className="text-xs font-bold text-slate-500">{isHindi ? "कुल फसलें" : "Items"}</p>
                <p className="text-lg font-black text-slate-900">{order.items.length}</p>
              </div>
              <div className="rounded-2xl bg-slate-50 p-3">
                <p className="text-xs font-bold text-slate-500">{t("cart_total", "Total")}</p>
                <p className="text-lg font-black text-slate-900">
                  ₹{Number(order.discountedTotalPrice || order.totalPrice || 0).toFixed(0)}
                </p>
              </div>
              <div className="rounded-2xl bg-slate-50 p-3">
                <p className="text-xs font-bold text-slate-500">{isHindi ? "ऑर्डर दिनांक" : "Placed On"}</p>
                <p className="text-lg font-black text-emerald-700">{formatOrderDate(order.createdAt)}</p>
              </div>
            </div>

            <div className="mt-5 flex flex-wrap items-center gap-3">
              <Link
                to={`/chat/${order._id}`}
                className="rounded-2xl border border-emerald-200 px-4 py-2 text-sm font-semibold text-emerald-700 hover:bg-emerald-50"
              >
                {t("order_btn_chat", "In-App Chat")}
              </Link>
              {(order.deliveryAddress?.whatsappPhone || order.customer?.whatsappPhone || order.deliveryAddress?.contactPhone || order.customer?.phone) && (
                <a
                  href={formatWhatsAppUrl(
                    order.deliveryAddress?.whatsappPhone || order.customer?.whatsappPhone || order.deliveryAddress?.contactPhone || order.customer?.phone,
                    buildFarmerToCustomerStatusText({
                      order,
                      status: order.status,
                      customer: order.customer,
                    })
                  )}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-2xl border border-emerald-300 bg-emerald-50 px-4 py-2 text-sm font-bold text-emerald-800 shadow-2xs hover:bg-emerald-100"
                >
                  <span>💬</span>
                  <span>{isHindi ? "ग्राहक को व्हाट्सएप करें" : "WhatsApp Customer"}</span>
                </a>
              )}
              <button
                type="button"
                onClick={() => setExpandedMapOrderId(expandedMapOrderId === order._id ? null : order._id)}
                className="inline-flex items-center gap-1.5 rounded-2xl border border-blue-200 bg-blue-50 px-4 py-2 text-sm font-bold text-blue-800 shadow-2xs hover:bg-blue-100"
              >
                <span>🗺️</span>
                <span>
                  {expandedMapOrderId === order._id
                    ? isHindi ? "नक्शा छिपाएं" : "Hide Route Map"
                    : t("order_btn_route_map", "View Route Map")}
                </span>
              </button>
              {order.status === "pending" && (
                <>
                  <button
                    type="button"
                    onClick={() => handleUpdateStatus(order._id, "accepted")}
                    disabled={updatingOrderId === order._id}
                    className="rounded-2xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
                  >
                    {t("order_btn_accept", "Accept Order")}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleUpdateStatus(order._id, "rejected")}
                    disabled={updatingOrderId === order._id}
                    className="rounded-2xl border border-red-200 px-4 py-2 text-sm font-semibold text-red-600 hover:bg-red-50 disabled:opacity-60"
                  >
                    {t("order_btn_reject", "Reject")}
                  </button>
                </>
              )}
              {order.status === "accepted" && (
                <button
                  type="button"
                  onClick={() => handleUpdateStatus(order._id, "delivered")}
                  disabled={updatingOrderId === order._id}
                  className="rounded-2xl bg-emerald-700 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-800 disabled:opacity-60"
                >
                  {t("order_btn_mark_delivered", "Mark Delivered")}
                </button>
              )}
              {order.status === "delivered" && (
                <span className="rounded-2xl bg-emerald-100 px-4 py-2 text-xs font-bold text-emerald-800">
                  {isHindi ? "सफलतापूर्वक डिलीवर हुआ ✓" : "Completed & Delivered"}
                </span>
              )}
              {order.status === "rejected" && (
                <span className="rounded-2xl bg-red-100 px-4 py-2 text-xs font-bold text-red-800">
                  {isHindi ? "ऑर्डर रद्द (स्टॉक वापस जोड़ा गया)" : "Order Rejected (Stock Restored)"}
                </span>
              )}
            </div>

            {expandedMapOrderId === order._id && (
              <div className="mt-5 border-t border-slate-100 pt-4">
                <DeliveryRouteMap
                  farmerLocation={order.farmer?.location}
                  customerLocation={order.customer?.location}
                  farmerName="Your Farm"
                  customerName={order.customer?.storeName || "Customer Destination"}
                  deliveryAddress={order.deliveryAddress}
                />
              </div>
            )}
          </article>
        ))
      )}
    </div>
  );
}

export default FarmerOrdersPage;
