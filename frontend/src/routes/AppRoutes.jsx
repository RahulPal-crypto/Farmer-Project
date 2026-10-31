import { Navigate, Route, Routes } from "react-router-dom";

import Footer from "../components/Footer";
import Navbar from "../components/Navbar";
import IncomingOrderRinger from "../components/IncomingOrderRinger";
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
import WishlistPage from "../pages/customer/WishlistPage";
import LoginPage from "../pages/auth/LoginPage";
import SignupPage from "../pages/auth/SignupPage";
import ChatPage from "../pages/shared/ChatPage";
import ProfilePage from "../pages/shared/ProfilePage";
import SubscriptionsPage from "../pages/customer/SubscriptionsPage";
import AboutPage from "../pages/shared/AboutPage";
import ContactPage from "../pages/shared/ContactPage";
import TermsPage from "../pages/shared/TermsPage";

function AppRoutes() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <IncomingOrderRinger />
      <Navbar />
      <main className="mx-auto w-full max-w-7xl 2xl:max-w-[1536px] 3xl:max-w-[1780px] px-3.5 py-4 sm:px-6 sm:py-6 lg:px-8 2xl:px-10">
        <Routes>
          <Route path="/" element={<CustomerHomePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/contact" element={<ContactPage />} />
          <Route path="/help" element={<ContactPage />} />
          <Route path="/terms" element={<TermsPage />} />
          <Route path="/privacy" element={<TermsPage />} />
          <Route path="/refund" element={<TermsPage />} />

          <Route element={<PrivateRoute allowedRoles={["customer"]} />}>
            <Route path="/cart" element={<CartPage />} />
            <Route path="/checkout" element={<CheckoutPage />} />
            <Route path="/orders" element={<OrdersPage />} />
            <Route path="/wishlist" element={<WishlistPage />} />
            <Route path="/group-orders" element={<GroupOrdersPage />} />
          </Route>

          <Route element={<PrivateRoute allowedRoles={["farmer"]} />}>
            <Route path="/farmer/dashboard" element={<FarmerDashboardPage />} />
            <Route path="/farmer/add-product" element={<AddProductPage />} />
            <Route path="/farmer/products" element={<MyProductsPage />} />
            <Route path="/farmer/orders" element={<FarmerOrdersPage />} />
          </Route>

          <Route element={<PrivateRoute allowedRoles={["customer", "farmer", "admin"]} />}>
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/subscriptions" element={<SubscriptionsPage />} />
            <Route path="/chat/:orderId" element={<ChatPage />} />
          </Route>

          <Route element={<PrivateRoute allowedRoles={["admin"]} />}>
            <Route path="/admin" element={<AdminDashboardPage />} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      <Footer />
    </div>
  );
}

export default AppRoutes;
