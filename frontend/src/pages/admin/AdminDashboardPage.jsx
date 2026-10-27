import { useEffect, useState, useMemo } from "react";

import ErrorAlert from "../../components/ErrorAlert";
import LoadingSpinner from "../../components/LoadingSpinner";
import { getApiErrorMessage } from "../../services/api";
import {
  adminDeleteProduct,
  fetchAdminOrders,
  fetchAdminUsers,
  fetchFarmerVerifications,
  reviewFarmerVerification,
  updateUserRole,
  toggleUserStatus,
  triggerMandiSync,
  fetchPlatformAnalytics,
} from "../../services/adminService";
import { fetchAllProducts } from "../../services/productService";

function AdminDashboardPage() {
  const [users, setUsers] = useState([]);
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [farmers, setFarmers] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [syncingMandi, setSyncingMandi] = useState(false);
  const [error, setError] = useState("");
  const [actionSuccess, setActionSuccess] = useState("");
  const [deletingProductId, setDeletingProductId] = useState("");
  const [reviewingFarmerId, setReviewingFarmerId] = useState("");
  const [updatingUserId, setUpdatingUserId] = useState("");

  // Filters
  const [userRoleFilter, setUserRoleFilter] = useState("all");
  const [userSearch, setUserSearch] = useState("");
  const [orderStatusFilter, setOrderStatusFilter] = useState("all");
  const [productSearch, setProductSearch] = useState("");

  const loadAdminData = async () => {
    try {
      setLoading(true);
      setError("");
      const [userData, orderData, productData, verificationData, analyticsData] = await Promise.all([
        fetchAdminUsers(),
        fetchAdminOrders(),
        fetchAllProducts({ limit: 100 }),
        fetchFarmerVerifications(),
        fetchPlatformAnalytics().catch(() => null),
      ]);
      setUsers(userData.users || []);
      setOrders(orderData.orders || []);
      setProducts(productData.products || []);
      setFarmers(verificationData.farmers || []);
      setAnalytics(analyticsData);
    } catch (error) {
      setError(getApiErrorMessage(error, "Unable to load admin data"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAdminData();
  }, []);

  const handleReviewFarmer = async (farmerId, decision) => {
    try {
      setReviewingFarmerId(farmerId);
      setError("");
      await reviewFarmerVerification(farmerId, decision);
      setActionSuccess(`Farmer verification ${decision === "approve" ? "approved" : "rejected"}.`);
      await loadAdminData();
      setTimeout(() => setActionSuccess(""), 4000);
    } catch (err) {
      setError(getApiErrorMessage(err, "Failed to update farmer verification"));
    } finally {
      setReviewingFarmerId("");
    }
  };

  const handleDeleteProduct = async (productId) => {
    if (!window.confirm("Are you sure you want to delete this product from the marketplace?")) {
      return;
    }

    try {
      setDeletingProductId(productId);
      await adminDeleteProduct(productId);
      setProducts((current) => current.filter((product) => product._id !== productId));
      setActionSuccess("Product deleted successfully.");
      setTimeout(() => setActionSuccess(""), 4000);
    } catch (error) {
      setError(getApiErrorMessage(error, "Unable to delete product"));
    } finally {
      setDeletingProductId("");
    }
  };

  const handleRoleChange = async (userId, nextRole) => {
    try {
      setUpdatingUserId(userId);
      setError("");
      await updateUserRole(userId, nextRole);
      setUsers((prev) => prev.map((u) => (u._id === userId ? { ...u, role: nextRole } : u)));
      setActionSuccess(`User role changed to: ${nextRole}`);
      setTimeout(() => setActionSuccess(""), 4000);
    } catch (err) {
      setError(getApiErrorMessage(err, "Failed to change user role"));
    } finally {
      setUpdatingUserId("");
    }
  };

  const handleToggleStatus = async (userId) => {
    try {
      setUpdatingUserId(userId);
      setError("");
      const res = await toggleUserStatus(userId);
      setUsers((prev) =>
        prev.map((u) => (u._id === userId ? { ...u, isActive: res.user.isActive } : u))
      );
      setActionSuccess(res.message);
      setTimeout(() => setActionSuccess(""), 4000);
    } catch (err) {
      setError(getApiErrorMessage(err, "Failed to toggle user account status"));
    } finally {
      setUpdatingUserId("");
    }
  };

  const handleMandiSync = async () => {
    try {
      setSyncingMandi(true);
      setError("");
      const res = await triggerMandiSync();
      setActionSuccess(`Mandi Rates Synced: ${res.count} commodities updated with latest government benchmarks.`);
      setTimeout(() => setActionSuccess(""), 5000);
    } catch (err) {
      setError(getApiErrorMessage(err, "Failed to sync Mandi rates"));
    } finally {
      setSyncingMandi(false);
    }
  };

  // Filtered lists
  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      const matchesRole = userRoleFilter === "all" || u.role === userRoleFilter;
      const searchLower = userSearch.toLowerCase();
      const matchesSearch =
        !userSearch ||
        u.storeName?.toLowerCase().includes(searchLower) ||
        u.email?.toLowerCase().includes(searchLower) ||
        u.phone?.includes(userSearch);
      return matchesRole && matchesSearch;
    });
  }, [users, userRoleFilter, userSearch]);

  const filteredOrders = useMemo(() => {
    return orders.filter((o) => {
      if (orderStatusFilter === "all") return true;
      return o.status === orderStatusFilter;
    });
  }, [orders, orderStatusFilter]);

  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      if (!productSearch) return true;
      const searchLower = productSearch.toLowerCase();
      return (
        p.name?.toLowerCase().includes(searchLower) ||
        p.category?.toLowerCase().includes(searchLower) ||
        p.farmer?.storeName?.toLowerCase().includes(searchLower)
      );
    });
  }, [products, productSearch]);

  if (loading) {
    return <LoadingSpinner label="Loading admin master portal..." />;
  }

  return (
    <div className="space-y-8">
      {/* Admin Hero Header & Sync Controls */}
      <section className="rounded-3xl sm:rounded-4xl bg-gradient-to-r from-slate-900 via-emerald-950 to-slate-900 p-6 sm:p-8 text-white shadow-xl">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-emerald-500/20 px-3 py-1 text-xs font-black uppercase tracking-wider text-emerald-300">
              🛡️ Super Administrator Console
            </div>
            <h1 className="mt-3 text-3xl sm:text-4xl font-black">Platform Master Control</h1>
            <p className="mt-2 max-w-2xl text-xs sm:text-sm text-slate-300">
              Full control over user accounts, farmer verifications, marketplace listings, live orders, and market pricing.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={handleMandiSync}
              disabled={syncingMandi}
              className="inline-flex items-center gap-2 rounded-2xl bg-emerald-600 px-5 py-3 text-sm font-bold text-white shadow-md hover:bg-emerald-700 active:scale-95 transition disabled:opacity-60"
            >
              <span>{syncingMandi ? "⏳" : "🔄"}</span>
              <span>{syncingMandi ? "Syncing Mandi Rates..." : "Sync Govt Mandi Rates"}</span>
            </button>
            <button
              type="button"
              onClick={loadAdminData}
              className="rounded-2xl border border-white/20 bg-white/5 px-4 py-3 text-sm font-bold text-white hover:bg-white/10"
            >
              Refresh Data
            </button>
          </div>
        </div>
      </section>

      <ErrorAlert message={error} />

      {actionSuccess && (
        <div className="rounded-2xl border border-emerald-300 bg-emerald-50 p-4 text-sm font-bold text-emerald-900 shadow-xs flex items-center justify-between">
          <span>✅ {actionSuccess}</span>
          <button onClick={() => setActionSuccess("")} className="text-xs text-emerald-700 font-black">
            ✕
          </button>
        </div>
      )}

      {/* Analytics KPI Cards */}
      <section className="grid gap-4 sm:gap-5 grid-cols-2 lg:grid-cols-4">
        <div className="rounded-3xl border border-slate-100 bg-white p-5 sm:p-6 shadow-sm">
          <p className="text-xs sm:text-sm font-bold text-slate-500">Delivered Sales (GMV)</p>
          <p className="mt-2 text-2xl sm:text-3xl font-black text-emerald-700">
            ₹{Number(analytics?.totalDeliveredRevenue || 0).toFixed(0)}
          </p>
          <p className="mt-1 text-[11px] text-slate-400">Total fulfilled orders value</p>
        </div>

        <div className="rounded-3xl border border-slate-100 bg-white p-5 sm:p-6 shadow-sm">
          <p className="text-xs sm:text-sm font-bold text-slate-500">Registered Users</p>
          <p className="mt-2 text-2xl sm:text-3xl font-black text-slate-900">{users.length}</p>
          <div className="mt-1 flex items-center gap-2 text-[11px] text-slate-500">
            <span className="font-bold text-emerald-700">🌾 {analytics?.usersByRole?.farmer || 0} Farmers</span>
            <span>•</span>
            <span className="font-bold text-slate-700">🛒 {analytics?.usersByRole?.customer || 0} Buyers</span>
          </div>
        </div>

        <div className="rounded-3xl border border-slate-100 bg-white p-5 sm:p-6 shadow-sm">
          <p className="text-xs sm:text-sm font-bold text-slate-500">Total Orders Placed</p>
          <p className="mt-2 text-2xl sm:text-3xl font-black text-slate-900">{orders.length}</p>
          <p className="mt-1 text-[11px] text-slate-400">
            {orders.filter((o) => o.status === "pending").length} Pending confirmation
          </p>
        </div>

        <div className="rounded-3xl border border-slate-100 bg-white p-5 sm:p-6 shadow-sm">
          <p className="text-xs sm:text-sm font-bold text-slate-500">Marketplace Produce</p>
          <p className="mt-2 text-2xl sm:text-3xl font-black text-slate-900">{products.length}</p>
          <p className="mt-1 text-[11px] text-slate-400">
            {farmers.filter((f) => f.isVerifiedFarmer).length} Verified growers
          </p>
        </div>
      </section>

      {/* Farmer Verification KYC Queue */}
      <section className="rounded-3xl bg-white p-5 sm:p-6 shadow-sm">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900">🛡️ Farmer KYC & Land Verification Queue</h2>
            <p className="text-xs text-slate-500">Review land documents, organic certificates, and grant verified grower badges</p>
          </div>
          <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-black text-amber-800 self-start sm:self-auto">
            {farmers.filter((f) => f.verificationStatus === "pending").length} Pending KYC
          </span>
        </div>

        <div className="mt-4 overflow-x-auto">
          {farmers.length === 0 ? (
            <p className="py-6 text-center text-xs text-slate-500">No farmers registered yet.</p>
          ) : (
            <table className="w-full text-left text-sm min-w-[650px]">
              <thead className="text-slate-500 border-b border-slate-100 text-xs uppercase tracking-wider font-bold">
                <tr>
                  <th className="py-3">Farm / Grower</th>
                  <th>Contact</th>
                  <th>Status</th>
                  <th>Documents Submitted</th>
                  <th className="text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {farmers.map((farmer) => (
                  <tr key={farmer._id} className="border-t border-slate-100 hover:bg-slate-50/50">
                    <td className="py-3 font-semibold text-slate-900">
                      <div>
                        <p>{farmer.storeName}</p>
                        <p className="text-[11px] text-slate-400">ID: {farmer._id}</p>
                      </div>
                    </td>
                    <td className="text-xs text-slate-600">
                      <p>{farmer.phone}</p>
                      <p className="text-slate-400">{farmer.email}</p>
                    </td>
                    <td>
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-[11px] font-black uppercase ${
                          farmer.isVerifiedFarmer
                            ? "bg-emerald-100 text-emerald-800"
                            : farmer.verificationStatus === "pending"
                            ? "bg-amber-100 text-amber-800"
                            : farmer.verificationStatus === "rejected"
                            ? "bg-red-100 text-red-800"
                            : "bg-slate-100 text-slate-600"
                        }`}
                      >
                        {farmer.isVerifiedFarmer ? "✓ Verified" : farmer.verificationStatus || "Unverified"}
                      </span>
                    </td>
                    <td className="text-xs text-slate-600">
                      {farmer.verificationDocuments?.length > 0 ? (
                        farmer.verificationDocuments.map((doc, idx) => (
                          <div key={idx} className="text-[11px]">
                            <span className="font-bold text-slate-800">{doc.docType}:</span> {doc.docNumber}
                          </div>
                        ))
                      ) : (
                        <span className="italic text-slate-400">None submitted</span>
                      )}
                    </td>
                    <td className="py-3 text-right">
                      {!farmer.isVerifiedFarmer ? (
                        <button
                          type="button"
                          onClick={() => handleReviewFarmer(farmer._id, "approve")}
                          disabled={reviewingFarmerId === farmer._id}
                          className="rounded-xl bg-emerald-600 px-3.5 py-1.5 text-xs font-bold text-white hover:bg-emerald-700 shadow-xs disabled:opacity-60"
                        >
                          Approve Grower
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleReviewFarmer(farmer._id, "reject")}
                          disabled={reviewingFarmerId === farmer._id}
                          className="rounded-xl border border-red-200 px-3.5 py-1.5 text-xs font-bold text-red-600 hover:bg-red-50 disabled:opacity-60"
                        >
                          Revoke Badge
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </section>

      {/* User Management & Access Control */}
      <section className="rounded-3xl bg-white p-5 sm:p-6 shadow-sm">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900">👥 User Accounts & Roles Control</h2>
            <p className="text-xs text-slate-500">Manage all registered accounts, change roles, or suspend bad actors.</p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <input
              type="text"
              placeholder="Search user by name, email, phone..."
              value={userSearch}
              onChange={(e) => setUserSearch(e.target.value)}
              className="rounded-xl border border-slate-200 px-3 py-1.5 text-xs outline-none focus:border-emerald-500 w-56"
            />
            <select
              value={userRoleFilter}
              onChange={(e) => setUserRoleFilter(e.target.value)}
              className="rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-semibold outline-none"
            >
              <option value="all">All Roles ({users.length})</option>
              <option value="farmer">Farmers</option>
              <option value="customer">Customers</option>
              <option value="admin">Admins</option>
            </select>
          </div>
        </div>

        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-left text-sm min-w-[700px]">
            <thead className="text-slate-500 border-b border-slate-100 text-xs uppercase tracking-wider font-bold">
              <tr>
                <th className="py-2.5">Name / Store</th>
                <th>Email</th>
                <th>Phone</th>
                <th>Role (Click to Change)</th>
                <th>Account Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((u) => {
                const isSuspended = u.isActive === false;

                return (
                  <tr key={u._id} className="border-t border-slate-100 hover:bg-slate-50/50">
                    <td className="py-3 font-semibold text-slate-900">{u.storeName}</td>
                    <td className="text-xs text-slate-600">{u.email}</td>
                    <td className="text-xs text-slate-600">{u.phone}</td>
                    <td>
                      <select
                        value={u.role}
                        disabled={updatingUserId === u._id}
                        onChange={(e) => handleRoleChange(u._id, e.target.value)}
                        className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs font-bold capitalize text-slate-800"
                      >
                        <option value="customer">Customer</option>
                        <option value="farmer">Farmer</option>
                        <option value="admin">Admin</option>
                      </select>
                    </td>
                    <td>
                      <button
                        type="button"
                        onClick={() => handleToggleStatus(u._id)}
                        disabled={updatingUserId === u._id}
                        className={`rounded-full px-3 py-1 text-xs font-bold transition ${
                          isSuspended
                            ? "bg-rose-100 text-rose-700 hover:bg-rose-200"
                            : "bg-emerald-100 text-emerald-800 hover:bg-emerald-200"
                        }`}
                        title="Click to toggle active/suspended status"
                      >
                        {isSuspended ? "🔴 Suspended (Click to Activate)" : "🟢 Active"}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      {/* Product Moderation */}
      <section className="rounded-3xl bg-white p-5 sm:p-6 shadow-sm">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900">📦 Live Marketplace Crops Moderation</h2>
            <p className="text-xs text-slate-500">Remove inappropriate, out-of-stock, or spam crop listings immediately</p>
          </div>
          <input
            type="text"
            placeholder="Search crop or farmer..."
            value={productSearch}
            onChange={(e) => setProductSearch(e.target.value)}
            className="rounded-xl border border-slate-200 px-3 py-1.5 text-xs outline-none focus:border-emerald-500 w-52"
          />
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredProducts.map((product) => (
            <article
              key={product._id}
              className="flex flex-col justify-between rounded-2xl border border-slate-100 bg-slate-50 p-4"
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="font-bold text-slate-900 line-clamp-1">{product.name}</h3>
                    <p className="text-xs text-slate-500">{product.farmer?.storeName || "Farmer"}</p>
                  </div>
                  <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-black text-emerald-800">
                    ₹{product.price}
                  </span>
                </div>
                <div className="mt-2 flex items-center gap-2 text-xs text-slate-500">
                  <span className="rounded-md bg-white px-2 py-0.5 font-semibold border border-slate-200">
                    {product.category}
                  </span>
                  <span>{product.quantity} kg in stock</span>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-200/60 flex items-center justify-between">
                <span className="text-[10px] text-slate-400">{product.commodityKey || "No Mandi Key"}</span>
                <button
                  type="button"
                  onClick={() => handleDeleteProduct(product._id)}
                  disabled={deletingProductId === product._id}
                  className="rounded-xl bg-rose-50 border border-rose-200 px-3 py-1 text-xs font-bold text-rose-600 hover:bg-rose-100 transition disabled:opacity-60"
                >
                  Delete Listing
                </button>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* Recent Orders Oversight */}
      <section className="rounded-3xl bg-white p-5 sm:p-6 shadow-sm">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900">📋 Global Marketplace Orders Oversight</h2>
            <p className="text-xs text-slate-500">Monitor order fulfillment, farmer acceptance, and delivery status</p>
          </div>
          <select
            value={orderStatusFilter}
            onChange={(e) => setOrderStatusFilter(e.target.value)}
            className="rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-semibold outline-none self-start sm:self-auto"
          >
            <option value="all">All Statuses ({orders.length})</option>
            <option value="pending">Pending</option>
            <option value="accepted">Accepted & Packing</option>
            <option value="delivered">Delivered</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>

        <div className="mt-4 space-y-3">
          {filteredOrders.slice(0, 15).map((order) => (
            <article
              key={order._id}
              className="rounded-2xl border border-slate-100 bg-slate-50/80 p-4 text-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3"
            >
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-900">Order #{String(order._id).slice(-8).toUpperCase()}</span>
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold capitalize ${
                      order.status === "delivered"
                        ? "bg-emerald-100 text-emerald-800"
                        : order.status === "rejected"
                        ? "bg-rose-100 text-rose-800"
                        : order.status === "accepted"
                        ? "bg-blue-100 text-blue-800"
                        : "bg-amber-100 text-amber-800"
                    }`}
                  >
                    {order.status}
                  </span>
                </div>
                <p className="mt-1 text-xs text-slate-500">
                  Buyer: <span className="font-semibold text-slate-700">{order.customer?.storeName || "Customer"}</span> ➔ Grower:{" "}
                  <span className="font-semibold text-slate-700">{order.farmer?.storeName || "Farm"}</span>
                </p>
              </div>

              <div className="text-right shrink-0">
                <span className="text-base font-black text-slate-900">
                  ₹{Number(order.discountedTotalPrice || order.totalPrice || 0).toFixed(0)}
                </span>
                <p className="text-[11px] text-slate-400">
                  {order.deliveryAddress?.deliverySlot || "Standard Slot"}
                </p>
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}

export default AdminDashboardPage;
