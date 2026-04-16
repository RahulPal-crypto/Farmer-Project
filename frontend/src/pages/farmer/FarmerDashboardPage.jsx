import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";

import ErrorAlert from "../../components/ErrorAlert";
import LoadingSpinner from "../../components/LoadingSpinner";
import { useAuth } from "../../context/AuthContext";
import api, { getApiErrorMessage } from "../../services/api";

function FarmerDashboardPage() {
  const { user } = useAuth();
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        setLoading(true);
        const [{ data: productData }, { data: orderData }] = await Promise.all([
          api.get("/products"),
          api.get("/orders/received"),
        ]);

        setProducts((productData.products || []).filter((product) => product.farmer?._id === user?.id));
        setOrders(orderData.orders || []);
      } catch (error) {
        setError(getApiErrorMessage(error, "Unable to load dashboard"));
      } finally {
        setLoading(false);
      }
    };

    loadDashboard();
  }, [user?.id]);

  const stats = useMemo(
    () => [
      { label: "Products Listed", value: products.length },
      { label: "Orders Received", value: orders.length },
      { label: "Pending Orders", value: orders.filter((order) => order.status === "pending").length },
    ],
    [products, orders]
  );

  if (loading) {
    return <LoadingSpinner label="Loading dashboard..." />;
  }

  return (
    <div className="space-y-8">
      <section className="rounded-[2rem] bg-gradient-to-r from-emerald-700 to-lime-600 p-8 text-white">
        <p className="text-sm uppercase tracking-[0.3em] text-emerald-100">Farmer workspace</p>
        <h1 className="mt-4 text-4xl font-bold">Manage your products and incoming orders.</h1>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link to="/farmer/add-product" className="rounded-2xl bg-white px-5 py-3 font-semibold text-emerald-700">
            Add Product
          </Link>
          <Link to="/farmer/orders" className="rounded-2xl border border-white/30 px-5 py-3 font-semibold text-white">
            View Orders
          </Link>
        </div>
      </section>

      <ErrorAlert message={error} />

      <section className="grid gap-5 md:grid-cols-3">
        {stats.map((stat) => (
          <div key={stat.label} className="rounded-3xl bg-white p-6 shadow-sm">
            <p className="text-sm text-slate-500">{stat.label}</p>
            <p className="mt-3 text-4xl font-bold text-slate-900">{stat.value}</p>
          </div>
        ))}
      </section>
    </div>
  );
}

export default FarmerDashboardPage;
