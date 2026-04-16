import { useEffect, useState } from "react";

import EmptyState from "../../components/EmptyState";
import ErrorAlert from "../../components/ErrorAlert";
import LoadingSpinner from "../../components/LoadingSpinner";
import api, { getApiErrorMessage } from "../../services/api";

function OrdersPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadOrders = async () => {
      try {
        setLoading(true);
        const { data } = await api.get("/orders/my");
        setOrders(data.orders || []);
      } catch (error) {
        setError(getApiErrorMessage(error, "Unable to fetch your orders"));
      } finally {
        setLoading(false);
      }
    };

    loadOrders();
  }, []);

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
          </article>
        ))
      )}
    </div>
  );
}

export default OrdersPage;
