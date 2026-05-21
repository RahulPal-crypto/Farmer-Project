import { useEffect, useState } from "react";

import ErrorAlert from "../../components/ErrorAlert";
import LoadingSpinner from "../../components/LoadingSpinner";
import { getApiErrorMessage } from "../../services/api";
import { adminDeleteProduct, fetchAdminOrders, fetchAdminUsers } from "../../services/adminService";
import { fetchAllProducts } from "../../services/productService";

function AdminDashboardPage() {
  const [users, setUsers] = useState([]);
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [deletingProductId, setDeletingProductId] = useState("");

  const loadAdminData = async () => {
    try {
      setLoading(true);
      setError("");
      const [userData, orderData, productData] = await Promise.all([
        fetchAdminUsers(),
        fetchAdminOrders(),
        fetchAllProducts({ limit: 100 }),
      ]);
      setUsers(userData.users || []);
      setOrders(orderData.orders || []);
      setProducts(productData.products || []);
    } catch (error) {
      setError(getApiErrorMessage(error, "Unable to load admin data"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAdminData();
  }, []);

  const handleDeleteProduct = async (productId) => {
    if (!window.confirm("Delete this product?")) {
      return;
    }

    try {
      setDeletingProductId(productId);
      await adminDeleteProduct(productId);
      setProducts((current) => current.filter((product) => product._id !== productId));
    } catch (error) {
      setError(getApiErrorMessage(error, "Unable to delete product"));
    } finally {
      setDeletingProductId("");
    }
  };

  if (loading) {
    return <LoadingSpinner label="Loading admin dashboard..." />;
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Admin Dashboard</h1>
        <p className="mt-2 text-sm text-slate-500">Monitor users, orders, and marketplace products.</p>
      </div>

      <ErrorAlert message={error} />

      <section className="grid gap-5 md:grid-cols-3">
        <div className="rounded-3xl bg-white p-6 shadow-sm">
          <p className="text-sm text-slate-500">Users</p>
          <p className="mt-3 text-4xl font-bold text-slate-900">{users.length}</p>
        </div>
        <div className="rounded-3xl bg-white p-6 shadow-sm">
          <p className="text-sm text-slate-500">Orders</p>
          <p className="mt-3 text-4xl font-bold text-slate-900">{orders.length}</p>
        </div>
        <div className="rounded-3xl bg-white p-6 shadow-sm">
          <p className="text-sm text-slate-500">Products</p>
          <p className="mt-3 text-4xl font-bold text-slate-900">{products.length}</p>
        </div>
      </section>

      <section className="rounded-3xl bg-white p-6 shadow-sm">
        <h2 className="text-2xl font-bold text-slate-900">Users</h2>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="text-slate-500">
              <tr>
                <th className="py-2">Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Phone</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user._id} className="border-t border-slate-100">
                  <td className="py-3 font-medium text-slate-900">{user.storeName}</td>
                  <td>{user.email}</td>
                  <td className="capitalize">{user.role}</td>
                  <td>{user.phone}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="rounded-3xl bg-white p-6 shadow-sm">
        <h2 className="text-2xl font-bold text-slate-900">Products</h2>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          {products.map((product) => (
            <article key={product._id} className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="font-semibold text-slate-900">{product.name}</h3>
                  <p className="text-sm text-slate-500">{product.farmer?.storeName || "Farmer"}</p>
                </div>
                <button
                  type="button"
                  onClick={() => handleDeleteProduct(product._id)}
                  disabled={deletingProductId === product._id}
                  className="rounded-2xl border border-red-200 px-3 py-2 text-sm font-semibold text-red-600 hover:bg-red-50 disabled:opacity-60"
                >
                  Delete
                </button>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="rounded-3xl bg-white p-6 shadow-sm">
        <h2 className="text-2xl font-bold text-slate-900">Recent Orders</h2>
        <div className="mt-4 space-y-3">
          {orders.slice(0, 10).map((order) => (
            <article key={order._id} className="rounded-2xl border border-slate-100 bg-slate-50 p-4 text-sm">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <p className="font-semibold text-slate-900">{order._id}</p>
                <span className="capitalize text-emerald-700">{order.status}</span>
              </div>
              <p className="mt-2 text-slate-500">
                {order.customer?.storeName || "Customer"} to {order.farmer?.storeName || "Farmer"} - Rs.{" "}
                {Number(order.discountedTotalPrice || order.totalPrice || 0).toFixed(2)}
              </p>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}

export default AdminDashboardPage;
