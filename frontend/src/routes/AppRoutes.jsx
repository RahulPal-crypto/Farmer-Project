import { Navigate, Route, Routes } from "react-router-dom";

import Navbar from "../components/Navbar";
import PrivateRoute from "./PrivateRoute";
import AdminDashboardPage from "../pages/admin/AdminDashboardPage";
import AddProductPage from "../pages/farmer/AddProductPage";
import FarmerDashboardPage from "../pages/farmer/FarmerDashboardPage";
import FarmerOrdersPage from "../pages/farmer/FarmerOrdersPage";
import MyProductsPage from "../pages/farmer/MyProductsPage";
import CartPage from "../pages/customer/CartPage";
import CheckoutPage from "../pages/customer/CheckoutPage";
import CustomerHomePage from "../pages/customer/CustomerHomePage";
import GroupOrdersPage from "../pages/customer/GroupOrdersPage";
import OrdersPage from "../pages/customer/OrdersPage";
import LoginPage from "../pages/auth/LoginPage";
import SignupPage from "../pages/auth/SignupPage";
import ChatPage from "../pages/shared/ChatPage";

function AppRoutes() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <Navbar />
      <main className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <Routes>
          <Route path="/" element={<CustomerHomePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />

          <Route element={<PrivateRoute allowedRoles={["customer"]} />}>
            <Route path="/cart" element={<CartPage />} />
            <Route path="/checkout" element={<CheckoutPage />} />
            <Route path="/orders" element={<OrdersPage />} />
            <Route path="/group-orders" element={<GroupOrdersPage />} />
          </Route>

          <Route element={<PrivateRoute allowedRoles={["farmer"]} />}>
            <Route path="/farmer/dashboard" element={<FarmerDashboardPage />} />
            <Route path="/farmer/add-product" element={<AddProductPage />} />
            <Route path="/farmer/products" element={<MyProductsPage />} />
            <Route path="/farmer/orders" element={<FarmerOrdersPage />} />
          </Route>

          <Route element={<PrivateRoute allowedRoles={["customer", "farmer"]} />}>
            <Route path="/chat/:orderId" element={<ChatPage />} />
          </Route>

          <Route element={<PrivateRoute allowedRoles={["admin"]} />}>
            <Route path="/admin" element={<AdminDashboardPage />} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  );
}

export default AppRoutes;
