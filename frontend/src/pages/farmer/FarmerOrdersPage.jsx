import { useEffect, useState } from "react";

import EmptyState from "../../components/EmptyState";
import ErrorAlert from "../../components/ErrorAlert";
import LoadingSpinner from "../../components/LoadingSpinner";
import api, { getApiErrorMessage } from "../../services/api";
import { updateOrderStatus } from "../../services/orderService";

function FarmerOrdersPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [updatingOrderId, setUpdatingOrderId] = useState("");

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
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Orders Received</h1>
        <p className="mt-2 text-sm text-slate-500">Accept, reject, and deliver orders from customers.</p>
      </div>

      <ErrorAlert message={error} />

      {orders.length === 0 ? (
        <EmptyState title="No incoming orders" description="New customer orders will appear here." />
      ) : (
        orders.map((order) => (
          <article key={order._id} className="rounded-3xl bg-white p-6 shadow-sm">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-slate-500">Customer</p>
                <h2 className="text-lg font-semibold text-slate-900">{order.customer?.storeName || "Customer"}</h2>
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

            <div className="mt-5 flex flex-wrap gap-3">
              {["accepted", "rejected", "delivered"].map((status) => (
                <button
                  key={status}
                  type="button"
                  onClick={() => handleUpdateStatus(order._id, status)}
                  disabled={updatingOrderId === order._id}
                  className="rounded-2xl border border-slate-200 px-4 py-2 text-sm font-semibold capitalize text-slate-700 hover:bg-slate-50 disabled:opacity-60"
                >
                  Mark {status}
                </button>
              ))}
            </div>
          </article>
        ))
      )}
    </div>
  );
}

export default FarmerOrdersPage;
