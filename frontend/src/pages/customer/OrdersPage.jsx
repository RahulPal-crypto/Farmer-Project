import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import EmptyState from "../../components/EmptyState";
import ErrorAlert from "../../components/ErrorAlert";
import LoadingSpinner from "../../components/LoadingSpinner";
import DeliveryRouteMap from "../../components/DeliveryRouteMap";
import api, { getApiErrorMessage } from "../../services/api";
import { addReview } from "../../services/reviewService";
import { formatWhatsAppUrl, buildCustomerToFarmerOrderText } from "../../utils/whatsapp";

function OrdersPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reviewForms, setReviewForms] = useState({});
  const [reviewedOrders, setReviewedOrders] = useState([]);
  const [submittingReviewId, setSubmittingReviewId] = useState("");
  const [expandedMapOrderId, setExpandedMapOrderId] = useState(null);

  useEffect(() => {
    const loadOrders = async () => {
      try {
        setLoading(true);
        const { data } = await api.get("/orders/my");
        setOrders(data.orders || []);
        setReviewedOrders((data.orders || []).filter((order) => order.hasReview).map((order) => order._id));
      } catch (error) {
        setError(getApiErrorMessage(error, "Unable to fetch your orders"));
      } finally {
        setLoading(false);
      }
    };

    loadOrders();
  }, []);

  const updateReviewForm = (orderId, field, value) => {
    setReviewForms((current) => ({
      ...current,
      [orderId]: {
        rating: "5",
        comment: "",
        ...current[orderId],
        [field]: value,
      },
    }));
  };

  const handleSubmitReview = async (orderId) => {
    const form = reviewForms[orderId] || { rating: "5", comment: "" };

    try {
      setSubmittingReviewId(orderId);
      setError("");
      await addReview({
        orderId,
        rating: form.rating,
        comment: form.comment,
      });
      setReviewedOrders((current) => [...current, orderId]);
    } catch (error) {
      setError(getApiErrorMessage(error, "Unable to submit review"));
    } finally {
      setSubmittingReviewId("");
    }
  };

  if (loading) {
    return <LoadingSpinner label="Loading your orders..." />;
  }

  return (
    <div className="space-y-5">
      <div className="rounded-3xl bg-white p-6 shadow-sm">
        <h1 className="text-3xl font-black text-slate-900">My Orders</h1>
        <p className="mt-2 text-sm text-slate-500">Track orders, chat with farmers, and review delivered purchases.</p>
      </div>

      <ErrorAlert message={error} />

      {orders.length === 0 ? (
        <EmptyState title="No orders yet" description="Your placed orders will appear here." />
      ) : (
        orders.map((order) => (
          <article key={order._id} className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-xs sm:text-sm text-slate-500 break-all">Order ID: {order._id}</p>
                <h2 className="text-lg font-semibold text-slate-900">{order.farmer?.storeName || "Local Farmer"}</h2>
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
                  ? "Pending Confirmation"
                  : order.status === "accepted"
                  ? "Accepted & Packing"
                  : order.status === "rejected"
                  ? "Order Rejected"
                  : "Delivered"}
              </span>
            </div>

            {order.status === "rejected" ? (
              <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 p-3 text-xs font-semibold text-red-700">
                This order was rejected by the farm and cancelled.
              </div>
            ) : (
              <div className="mt-5 grid gap-2 sm:grid-cols-4">
                {["placed", "accepted", "packed", "delivered"].map((step) => {
                  const activeSteps = ["pending", "accepted", "delivered"].includes(order.status)
                    ? [
                        "placed",
                        ...(order.status !== "pending" ? ["accepted", "packed"] : []),
                        ...(order.status === "delivered" ? ["delivered"] : []),
                      ]
                    : ["placed"];

                  return (
                    <div
                      key={step}
                      className={`rounded-2xl px-3 py-2 text-xs font-black capitalize ${
                        activeSteps.includes(step) ? "bg-emerald-100 text-emerald-700" : "bg-slate-50 text-slate-400"
                      }`}
                    >
                      {step}
                    </div>
                  );
                })}
              </div>
            )}

            <div className="mt-4 space-y-2 text-sm text-slate-600">
              {order.items.map((item) => (
                <div key={`${order._id}-${item.product}`} className="flex items-center justify-between">
                  <span>
                    {item.name} x {item.quantity}
                  </span>
                  <span>Rs. {(item.price * item.quantity).toFixed(2)}</span>
                </div>
              ))}
            </div>

            {order.deliveryAddress?.street && (
              <div className="mt-3 rounded-2xl bg-slate-50 p-3 text-xs text-slate-600">
                <span className="font-bold text-slate-700">📍 Delivery Address: </span>
                <span>
                  {order.deliveryAddress.street}, {order.deliveryAddress.city} - {order.deliveryAddress.pincode}
                </span>
                {order.deliveryAddress.deliverySlot && (
                  <span className="mt-1 block font-semibold text-emerald-800">
                    🕒 Slot: {order.deliveryAddress.deliverySlot}
                  </span>
                )}
                {order.deliveryAddress.notes && (
                  <span className="mt-0.5 block text-slate-500 italic">Instructions: {order.deliveryAddress.notes}</span>
                )}
              </div>
            )}

            <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-4">
              <span className="text-sm text-slate-500">Total</span>
              <span className="font-semibold text-slate-900">
                Rs. {Number(order.discountedTotalPrice || order.totalPrice || 0).toFixed(2)}
              </span>
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-2.5">
              <Link
                to={`/chat/${order._id}`}
                className="inline-flex rounded-2xl border border-emerald-200 px-4 py-2 text-sm font-semibold text-emerald-700 hover:bg-emerald-50"
              >
                In-App Chat
              </Link>
              {(order.farmer?.whatsappPhone || order.farmer?.phone) && (
                <a
                  href={formatWhatsAppUrl(
                    order.farmer.whatsappPhone || order.farmer.phone,
                    buildCustomerToFarmerOrderText({ order, farmer: order.farmer })
                  )}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-2xl border border-emerald-300 bg-emerald-50 px-4 py-2 text-sm font-bold text-emerald-800 shadow-2xs hover:bg-emerald-100"
                >
                  <span>💬</span>
                  <span>WhatsApp Farmer</span>
                </a>
              )}
              <button
                type="button"
                onClick={() => setExpandedMapOrderId(expandedMapOrderId === order._id ? null : order._id)}
                className="inline-flex items-center gap-1.5 rounded-2xl border border-blue-200 bg-blue-50 px-4 py-2 text-sm font-bold text-blue-800 shadow-2xs hover:bg-blue-100"
              >
                <span>🗺️</span>
                <span>{expandedMapOrderId === order._id ? "Hide Route Map" : "View Route Map"}</span>
              </button>
            </div>

            {expandedMapOrderId === order._id && (
              <div className="mt-4">
                <DeliveryRouteMap
                  farmerLocation={order.farmer?.location}
                  customerLocation={order.deliveryAddress?.coordinates ? { coordinates: order.deliveryAddress.coordinates } : null}
                  farmerName={order.farmer?.storeName || "Local Farm"}
                  customerName="Your Destination"
                  deliveryAddress={order.deliveryAddress}
                />
              </div>
            )}

            {order.status === "delivered" && (
              <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                {reviewedOrders.includes(order._id) ? (
                  <p className="text-sm font-medium text-emerald-700">Review submitted. Thank you.</p>
                ) : (
                  <div className="space-y-3">
                    <div className="grid gap-3 sm:grid-cols-[160px_1fr]">
                      <select
                        value={reviewForms[order._id]?.rating || "5"}
                        onChange={(event) => updateReviewForm(order._id, "rating", event.target.value)}
                        className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm"
                      >
                        <option value="5">5 stars</option>
                        <option value="4">4 stars</option>
                        <option value="3">3 stars</option>
                        <option value="2">2 stars</option>
                        <option value="1">1 star</option>
                      </select>
                      <input
                        type="text"
                        value={reviewForms[order._id]?.comment || ""}
                        onChange={(event) => updateReviewForm(order._id, "comment", event.target.value)}
                        placeholder="Write a short review for the farmer"
                        className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => handleSubmitReview(order._id)}
                      disabled={submittingReviewId === order._id}
                      className="rounded-2xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
                    >
                      {submittingReviewId === order._id ? "Submitting..." : "Submit Review"}
                    </button>
                  </div>
                )}
              </div>
            )}
          </article>
        ))
      )}
    </div>
  );
}

export default OrdersPage;
