import api from "./api";

const cleanParams = (params = {}) => {
  return Object.fromEntries(
    Object.entries(params).filter(([, value]) => value !== "" && value !== undefined && value !== null)
  );
};

export const fetchProducts = async (params = {}) => {
  const { data } = await api.get("/products/nearby", { params: cleanParams(params) });
  return data;
};

export const fetchAllProducts = async (params = {}) => {
  const { data } = await api.get("/products", { params: cleanParams(params) });
  return data;
};

export const fetchMyProducts = async () => {
  const { data } = await api.get("/products/my");
  return data;
};

export const addProduct = async (payload) => {
  const { data } = await api.post("/products", payload);
  return data;
};

export const updateProduct = async (productId, payload) => {
  const { data } = await api.put(`/products/${productId}`, payload);
  return data;
};

export const deleteProduct = async (productId) => {
  const { data } = await api.delete(`/products/${productId}`);
  return data;
};
