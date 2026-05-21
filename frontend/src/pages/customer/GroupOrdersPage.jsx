import { useEffect, useState } from "react";

import EmptyState from "../../components/EmptyState";
import ErrorAlert from "../../components/ErrorAlert";
import LoadingSpinner from "../../components/LoadingSpinner";
import { getApiErrorMessage } from "../../services/api";
import { fetchAllProducts } from "../../services/productService";
import { createGroupOrder, fetchGroupOrders, joinGroupOrder } from "../../services/groupOrderService";

const tomorrow = () => {
  const date = new Date();
  date.setDate(date.getDate() + 1);
  return date.toISOString().slice(0, 16);
};

function GroupOrdersPage() {
  const [products, setProducts] = useState([]);
  const [groupOrders, setGroupOrders] = useState([]);
  const [formData, setFormData] = useState({
    productId: "",
    targetQuantity: "5",
    discountPercent: "10",
    quantity: "1",
    closesAt: tomorrow(),
  });
  const [joinQuantities, setJoinQuantities] = useState({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const loadData = async () => {
    try {
      setLoading(true);
      setError("");
      const [productData, groupData] = await Promise.all([fetchAllProducts(), fetchGroupOrders()]);
      const availableProducts = (productData.products || []).filter((product) => product.quantity > 0);
      setProducts(availableProducts);
      setGroupOrders(groupData.groupOrders || []);
      setFormData((current) => ({
        ...current,
        productId: current.productId || availableProducts[0]?._id || "",
      }));
    } catch (error) {
      setError(getApiErrorMessage(error, "Unable to load group orders"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreate = async (event) => {
    event.preventDefault();

    try {
      setSubmitting(true);
      setError("");
      setSuccess("");
      await createGroupOrder({
        ...formData,
        closesAt: new Date(formData.closesAt).toISOString(),
      });
      setSuccess("Group order created successfully.");
      await loadData();
    } catch (error) {
      setError(getApiErrorMessage(error, "Unable to create group order"));
    } finally {
      setSubmitting(false);
    }
  };

  const handleJoin = async (groupOrderId) => {
    try {
      setSubmitting(true);
      setError("");
      setSuccess("");
      await joinGroupOrder(groupOrderId, {
        quantity: joinQuantities[groupOrderId] || 1,
      });
      setSuccess("Joined group order successfully.");
      await loadData();
    } catch (error) {
      setError(getApiErrorMessage(error, "Unable to join group order"));
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <LoadingSpinner label="Loading group orders..." />;
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr]">
      <section className="rounded-3xl bg-white p-6 shadow-sm">
        <h1 className="text-3xl font-bold text-slate-900">Start Group Buy</h1>
        <p className="mt-2 text-sm text-slate-500">Create a shared order to unlock a quantity discount.</p>

        <form onSubmit={handleCreate} className="mt-6 space-y-4">
          <ErrorAlert message={error} />
          {success ? <div className="rounded-2xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{success}</div> : null}

          <select
            value={formData.productId}
            onChange={(event) => setFormData((current) => ({ ...current, productId: event.target.value }))}
            className="w-full rounded-2xl border border-slate-200 px-4 py-3"
            required
          >
            {products.map((product) => (
              <option key={product._id} value={product._id}>
                {product.name} - Rs. {product.price}
              </option>
            ))}
          </select>

          <div className="grid gap-4 sm:grid-cols-2">
            <input
              type="number"
              min="2"
              value={formData.targetQuantity}
              onChange={(event) => setFormData((current) => ({ ...current, targetQuantity: event.target.value }))}
              placeholder="Target quantity"
              className="rounded-2xl border border-slate-200 px-4 py-3"
              required
            />
            <input
              type="number"
              min="1"
              max="100"
              value={formData.discountPercent}
              onChange={(event) => setFormData((current) => ({ ...current, discountPercent: event.target.value }))}
              placeholder="Discount percent"
              className="rounded-2xl border border-slate-200 px-4 py-3"
              required
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <input
              type="number"
              min="1"
              value={formData.quantity}
              onChange={(event) => setFormData((current) => ({ ...current, quantity: event.target.value }))}
              placeholder="Your quantity"
              className="rounded-2xl border border-slate-200 px-4 py-3"
              required
            />
            <input
              type="datetime-local"
              value={formData.closesAt}
              onChange={(event) => setFormData((current) => ({ ...current, closesAt: event.target.value }))}
              className="rounded-2xl border border-slate-200 px-4 py-3"
              required
            />
          </div>

          <button
            type="submit"
            disabled={submitting || products.length === 0}
            className="w-full rounded-2xl bg-emerald-600 px-4 py-3 font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
          >
            Create Group Order
          </button>
        </form>
      </section>

      <section className="space-y-4">
        <div>
          <h2 className="text-3xl font-bold text-slate-900">Open Group Orders</h2>
          <p className="mt-2 text-sm text-slate-500">Join an existing shared purchase.</p>
        </div>

        {groupOrders.length === 0 ? (
          <EmptyState title="No open group orders" description="Create one to invite other customers into a shared buy." />
        ) : (
          groupOrders.map((groupOrder) => (
            <article key={groupOrder._id} className="rounded-3xl bg-white p-5 shadow-sm">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-slate-900">{groupOrder.product?.name}</h3>
                  <p className="text-sm text-slate-500">
                    {groupOrder.farmer?.storeName} - {groupOrder.discountPercent}% off
                  </p>
                </div>
                <span className="rounded-full bg-emerald-50 px-3 py-1 text-sm font-semibold text-emerald-700">
                  {groupOrder.totalJoinedQuantity}/{groupOrder.targetQuantity}
                </span>
              </div>
              <div className="mt-4 flex flex-col gap-3 sm:flex-row">
                <input
                  type="number"
                  min="1"
                  value={joinQuantities[groupOrder._id] || "1"}
                  onChange={(event) =>
                    setJoinQuantities((current) => ({ ...current, [groupOrder._id]: event.target.value }))
                  }
                  className="rounded-2xl border border-slate-200 px-4 py-2"
                />
                <button
                  type="button"
                  onClick={() => handleJoin(groupOrder._id)}
                  disabled={submitting}
                  className="rounded-2xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-700 disabled:opacity-60"
                >
                  Join
                </button>
              </div>
            </article>
          ))
        )}
      </section>
    </div>
  );
}

export default GroupOrdersPage;
