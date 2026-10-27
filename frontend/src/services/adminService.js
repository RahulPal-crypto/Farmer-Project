import api from "./api";

export const fetchAdminUsers = async () => {
  const { data } = await api.get("/admin/users");
  return data;
};

export const fetchAdminOrders = async () => {
  const { data } = await api.get("/admin/orders");
  return data;
};

export const adminDeleteProduct = async (productId) => {
  const { data } = await api.delete(`/admin/product/${productId}`);
  return data;
};

export const fetchFarmerVerifications = async () => {
  const { data } = await api.get("/admin/farmers/verifications");
  return data;
};

export const reviewFarmerVerification = async (farmerId, decision, notes = "") => {
  const { data } = await api.put(`/admin/farmers/${farmerId}/verification`, { decision, notes });
  return data;
};

export const updateUserRole = async (userId, role) => {
  const { data } = await api.patch(`/admin/users/${userId}/role`, { role });
  return data;
};

export const toggleUserStatus = async (userId) => {
  const { data } = await api.patch(`/admin/users/${userId}/status`);
  return data;
};

export const triggerMandiSync = async () => {
  const { data } = await api.post("/admin/sync-mandi-prices");
  return data;
};

export const fetchPlatformAnalytics = async () => {
  const { data } = await api.get("/admin/analytics");
  return data;
};
