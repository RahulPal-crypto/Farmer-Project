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
