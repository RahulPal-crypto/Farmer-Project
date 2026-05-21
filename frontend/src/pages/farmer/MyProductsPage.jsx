import { useEffect, useState } from "react";

import EmptyState from "../../components/EmptyState";
import ErrorAlert from "../../components/ErrorAlert";
import LoadingSpinner from "../../components/LoadingSpinner";
import { getApiErrorMessage } from "../../services/api";
import { deleteProduct, fetchMyProducts, updateProduct } from "../../services/productService";

function MyProductsPage() {
  const [products, setProducts] = useState([]);
  const [editingProductId, setEditingProductId] = useState("");
  const [editForm, setEditForm] = useState({});
  const [savingProductId, setSavingProductId] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadProducts = async () => {
      try {
        setLoading(true);
        const data = await fetchMyProducts();
        setProducts(data.products || []);
      } catch (error) {
        setError(getApiErrorMessage(error, "Unable to fetch your products"));
      } finally {
        setLoading(false);
      }
    };

    loadProducts();
  }, []);

  const startEditing = (product) => {
    setEditingProductId(product._id);
    setEditForm({
      name: product.name,
      category: product.category,
      price: product.price,
      quantity: product.quantity,
      isActive: String(product.isActive),
    });
  };

  const handleEditChange = (field, value) => {
    setEditForm((current) => ({
      ...current,
      [field]: value,
    }));
  };

  const handleSave = async (productId) => {
    try {
      setSavingProductId(productId);
      setError("");
      const payload = new FormData();
      Object.entries(editForm).forEach(([key, value]) => payload.append(key, value));
      const data = await updateProduct(productId, payload);
      setProducts((current) => current.map((product) => (product._id === productId ? data.product : product)));
      setEditingProductId("");
    } catch (error) {
      setError(getApiErrorMessage(error, "Unable to update product"));
    } finally {
      setSavingProductId("");
    }
  };

  const handleDelete = async (productId) => {
    if (!window.confirm("Delete this product?")) {
      return;
    }

    try {
      setError("");
      await deleteProduct(productId);
      setProducts((current) => current.filter((product) => product._id !== productId));
    } catch (error) {
      setError(getApiErrorMessage(error, "Unable to delete product"));
    }
  };

  if (loading) {
    return <LoadingSpinner label="Loading your products..." />;
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">My Products</h1>
        <p className="mt-2 text-sm text-slate-500">Track your current product listings and stock levels.</p>
      </div>

      <ErrorAlert message={error} />

      {products.length === 0 ? (
        <EmptyState title="No products listed" description="Add your first product to start selling." />
      ) : (
        <div className="grid gap-5 md:grid-cols-2">
          {products.map((product) => (
            <article key={product._id} className="rounded-3xl bg-white p-6 shadow-sm">
              {editingProductId === product._id ? (
                <div className="space-y-4">
                  <div className="grid gap-3 sm:grid-cols-2">
                    <input
                      type="text"
                      value={editForm.name || ""}
                      onChange={(event) => handleEditChange("name", event.target.value)}
                      className="rounded-2xl border border-slate-200 px-4 py-3"
                    />
                    <input
                      type="text"
                      value={editForm.category || ""}
                      onChange={(event) => handleEditChange("category", event.target.value)}
                      className="rounded-2xl border border-slate-200 px-4 py-3"
                    />
                    <input
                      type="number"
                      value={editForm.price || ""}
                      onChange={(event) => handleEditChange("price", event.target.value)}
                      className="rounded-2xl border border-slate-200 px-4 py-3"
                    />
                    <input
                      type="number"
                      value={editForm.quantity || ""}
                      onChange={(event) => handleEditChange("quantity", event.target.value)}
                      className="rounded-2xl border border-slate-200 px-4 py-3"
                    />
                  </div>
                  <select
                    value={editForm.isActive || "true"}
                    onChange={(event) => handleEditChange("isActive", event.target.value)}
                    className="w-full rounded-2xl border border-slate-200 px-4 py-3"
                  >
                    <option value="true">Active</option>
                    <option value="false">Inactive</option>
                  </select>
                  <div className="flex flex-wrap gap-3">
                    <button
                      type="button"
                      onClick={() => handleSave(product._id)}
                      disabled={savingProductId === product._id}
                      className="rounded-2xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
                    >
                      Save
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditingProductId("")}
                      className="rounded-2xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-lg font-semibold text-slate-900">{product.name}</h2>
                      <p className="text-sm text-slate-500">{product.category}</p>
                    </div>
                    <span className="rounded-full bg-emerald-50 px-3 py-1 text-sm font-semibold text-emerald-700">
                      Rs. {product.price}
                    </span>
                  </div>
                  <div className="mt-4 flex items-center justify-between text-sm text-slate-500">
                    <span>Quantity: {product.quantity}</span>
                    <span>{product.isActive ? "Active" : "Inactive"}</span>
                  </div>
                  <div className="mt-5 flex flex-wrap gap-3">
                    <button
                      type="button"
                      onClick={() => startEditing(product)}
                      className="rounded-2xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(product._id)}
                      className="rounded-2xl border border-red-200 px-4 py-2 text-sm font-semibold text-red-600 hover:bg-red-50"
                    >
                      Delete
                    </button>
                  </div>
                </>
              )}
            </article>
          ))}
        </div>
      )}
    </div>
  );
}

export default MyProductsPage;
