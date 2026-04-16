import api from "./api";

export const createOrder = async (payload) => {
  const { data } = await api.post("/orders/create", payload);
  return data;
};

export const updateOrderStatus = async (payload) => {
  const { data } = await api.patch("/orders/status", payload);
  return data;
};
