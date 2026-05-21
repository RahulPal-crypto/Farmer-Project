import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import EmptyState from "../../components/EmptyState";
import ErrorAlert from "../../components/ErrorAlert";
import LoadingSpinner from "../../components/LoadingSpinner";
import api, { getApiErrorMessage } from "../../services/api";
import { addReview } from "../../services/reviewService";

function OrdersPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reviewForms, setReviewForms] = useState({});
  const [reviewedOrders, setReviewedOrders] = useState([]);
  const [submittingReviewId, setSubmittingReviewId] = useState("");

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
      <div>
        <h1 className="text-3xl font-bold text-slate-900">My Orders</h1>
        <p className="mt-2 text-sm text-slate-500">Track your marketplace orders and their current status.</p>
      </div>

      <ErrorAlert message={error} />

      {orders.length === 0 ? (
        <EmptyState title="No orders yet" description="Your placed orders will appear here." />
      ) : (
        orders.map((order) => (
          <article key={order._id} className="rounded-3xl bg-white p-6 shadow-sm">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-slate-500">Order ID: {order._id}</p>
                <h2 className="text-lg font-semibold text-slate-900">{order.farmer?.storeName || "Local Farmer"}</h2>
              </div>
              <span className="rounded-full bg-emerald-50 px-4 py-2 text-sm font-semibold capitalize text-emerald-700">
                {order.status}
              </span>
            </div>

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

            <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-4">
              <span className="text-sm text-slate-500">Total</span>
              <span className="font-semibold text-slate-900">
                Rs. {Number(order.discountedTotalPrice || order.totalPrice || 0).toFixed(2)}
              </span>
            </div>

            <div className="mt-4">
              <Link
                to={`/chat/${order._id}`}
                className="inline-flex rounded-2xl border border-emerald-200 px-4 py-2 text-sm font-semibold text-emerald-700 hover:bg-emerald-50"
              >
                Chat with Farmer
              </Link>
            </div>

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
