import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";

import MarketPriceBadge from "../../components/MarketPriceBadge";
import WeatherWidget from "../../components/WeatherWidget";
import ErrorAlert from "../../components/ErrorAlert";
import LoadingSpinner from "../../components/LoadingSpinner";
import { useAuth } from "../../context/AuthContext";
import api, { getApiErrorMessage } from "../../services/api";
import { fetchMyProducts } from "../../services/productService";
import { fetchFarmerReviews } from "../../services/reviewService";

function FarmerDashboardPage() {
  const { user } = useAuth();
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        setLoading(true);
        const [{ data: productData }, { data: orderData }, reviewData] = await Promise.all([
          fetchMyProducts().then((data) => ({ data })),
          api.get("/orders/received"),
          user?.id ? fetchFarmerReviews(user.id, { limit: 50 }) : Promise.resolve({ reviews: [] }),
        ]);

        setProducts(productData.products || []);
        setOrders(orderData.orders || []);
        setReviews(reviewData.reviews || []);
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
      {
        label: "Estimated Sales",
        value: `Rs. ${orders
          .reduce((total, order) => total + Number(order.discountedTotalPrice || order.totalPrice || 0), 0)
          .toFixed(0)}`,
      },
    ],
    [products, orders]
  );
  const lowStockProducts = products.filter((product) => Number(product.quantity || 0) <= 5);
  const actionableOrders = orders.filter((order) => ["accepted", "rejected"].includes(order.status));
  const acceptanceRate = actionableOrders.length
    ? Math.round((actionableOrders.filter((order) => order.status === "accepted").length / actionableOrders.length) * 100)
    : null;
  const averageRating = reviews.length
    ? (reviews.reduce((total, review) => total + Number(review.rating || 0), 0) / reviews.length).toFixed(1)
    : user?.averageRating || null;

  if (loading) {
    return <LoadingSpinner label="Loading dashboard..." />;
  }

  return (
    <div className="space-y-8">
      {/* Workspace Hero Banner */}
      <section className="rounded-3xl sm:rounded-4xl bg-gradient-to-r from-emerald-800 via-emerald-700 to-lime-600 p-5 sm:p-8 lg:p-10 text-white shadow-xl shadow-emerald-900/20">
        <p className="text-xs sm:text-sm font-black uppercase tracking-[0.25em] text-emerald-100">Farmer workspace</p>
        <h1 className="mt-3 max-w-3xl text-2xl sm:text-4xl lg:text-5xl font-black leading-tight">
          Manage inventory, orders, reviews, and sales from one dashboard.
        </h1>
        <p className="mt-2.5 max-w-2xl text-xs sm:text-sm leading-6 text-emerald-50">
          Keep listings fresh, track low stock, accept orders quickly, and build trust through customer ratings.
        </p>
        <div className="mt-5 flex flex-wrap gap-3">
          <Link to="/farmer/add-product" className="rounded-2xl bg-white px-5 py-2.5 sm:py-3 text-sm font-semibold text-emerald-700 shadow-sm hover:bg-emerald-50">
            + Add Product
          </Link>
          <Link to="/farmer/orders" className="rounded-2xl border border-white/30 px-5 py-2.5 sm:py-3 text-sm font-semibold text-white hover:bg-white/10">
            View Orders
          </Link>
        </div>
      </section>

      <ErrorAlert message={error} />

      {/* KPI Stats */}
      <section className="grid gap-3 sm:gap-5 grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <div key={stat.label} className="rounded-3xl border border-slate-100 bg-white p-4 sm:p-6 shadow-sm">
            <p className="text-xs sm:text-sm font-bold text-slate-500">{stat.label}</p>
            <p className="mt-2 text-2xl sm:text-4xl font-black text-slate-900">{stat.value}</p>
          </div>
        ))}
      </section>

      {/* Kisan Mausam Seva & Agri-Advisory Forecast */}
      <WeatherWidget
        latitude={user?.location?.coordinates?.[1]}
        longitude={user?.location?.coordinates?.[0]}
      />

      {/* Market Prices Benchmark */}
      <section className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm">
        <h2 className="text-2xl font-bold text-slate-900">Market Price Benchmark</h2>
        <p className="mt-2 text-sm text-slate-500">Current government mandi rates for your listed commodities.</p>
        <div className="mt-4 grid gap-3">
          {products.slice(0, 6).map((product) => (
            <div key={product._id} className="rounded-2xl bg-slate-50 p-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                  <p className="font-semibold text-slate-900">{product.name}</p>
                  <p className="text-sm text-slate-500">Your price: Rs. {product.price}</p>
                </div>
                <div>
                  <MarketPriceBadge commodityKey={product.commodityKey} productPrice={product.price} />
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Inventory & Sales Analytics */}
      <section className="grid gap-5 lg:grid-cols-[1fr_1fr]">
        <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm">
          <h2 className="text-2xl font-black text-slate-900">Inventory Tracking</h2>
          {lowStockProducts.length === 0 ? (
            <p className="mt-4 rounded-2xl bg-emerald-50 p-4 text-sm font-bold text-emerald-700">
              Inventory looks healthy. No low-stock alerts.
            </p>
          ) : (
            <div className="mt-4 space-y-3">
              {lowStockProducts.slice(0, 4).map((product) => (
                <div key={product._id} className="flex items-center justify-between rounded-2xl bg-amber-50 p-4">
                  <span className="font-bold text-slate-900">{product.name}</span>
                  <span className="text-sm font-black text-amber-700">{product.quantity} left</span>
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm">
          <h2 className="text-2xl font-black text-slate-900">Sales Analytics</h2>
          <div className="mt-4 grid gap-3">
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-sm font-bold text-slate-500">Acceptance Rate</p>
              <p className="mt-1 text-2xl font-black text-slate-900">
                {acceptanceRate === null ? "No data" : `${acceptanceRate}%`}
              </p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-sm font-bold text-slate-500">Avg. Rating</p>
              <p className="mt-1 text-2xl font-black text-slate-900">
                {averageRating ? `${averageRating}/5` : "No ratings"}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Customer Feedback */}
      <section className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">Customer Reviews</h2>
            <p className="mt-1 text-sm text-slate-500">Recent feedback from delivered orders.</p>
          </div>
          <div className="rounded-2xl bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">
            {averageRating ? `${averageRating}/5 rating` : "No ratings yet"}
          </div>
        </div>

        {reviews.length === 0 ? (
          <div className="mt-5 rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-8 text-center">
            <p className="font-medium text-slate-700">No reviews yet</p>
            <p className="mt-1 text-sm text-slate-500">Reviews will appear after customers rate delivered orders.</p>
          </div>
        ) : (
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            {reviews.map((review) => (
              <article key={review._id} className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                <div className="flex items-center justify-between gap-3">
                  <p className="font-semibold text-slate-900">{review.customer?.storeName || "Customer"}</p>
                  <span className="rounded-full bg-amber-50 px-3 py-1 text-sm font-semibold text-amber-700">
                    {review.rating}/5
                  </span>
                </div>
                <p className="mt-3 text-sm text-slate-600">
                  {review.comment || "No written comment provided."}
                </p>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

export default FarmerDashboardPage;
