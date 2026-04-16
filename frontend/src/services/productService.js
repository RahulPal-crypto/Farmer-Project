import api from "./api";

export const fetchProducts = async (params = {}) => {
  const { data } = await api.get("/products/nearby", { params });
  return data;
};

export const fetchAllProducts = async (params = {}) => {
  const { data } = await api.get("/products", { params });
  return data;
};

export const addProduct = async (payload) => {
  const { data } = await api.post("/products/add", payload, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
  return data;
};
