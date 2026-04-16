import { useEffect, useState } from "react";

import EmptyState from "../../components/EmptyState";
import ErrorAlert from "../../components/ErrorAlert";
import LoadingSpinner from "../../components/LoadingSpinner";
import { useAuth } from "../../context/AuthContext";
import api, { getApiErrorMessage } from "../../services/api";

function MyProductsPage() {
  const { user } = useAuth();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadProducts = async () => {
      try {
        setLoading(true);
        const { data } = await api.get("/products");
        setProducts((data.products || []).filter((product) => product.farmer?._id === user?.id));
      } catch (error) {
        setError(getApiErrorMessage(error, "Unable to fetch your products"));
      } finally {
        setLoading(false);
      }
    };

    loadProducts();
  }, [user?.id]);

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
            </article>
          ))}
        </div>
      )}
    </div>
  );
}

export default MyProductsPage;
