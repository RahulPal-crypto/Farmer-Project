import api from "./api";

export const fetchGroupOrders = async () => {
  const { data } = await api.get("/group-orders");
  return data;
};

export const createGroupOrder = async (payload) => {
  const { data } = await api.post("/group-orders", payload);
  return data;
};

export const joinGroupOrder = async (groupOrderId, payload) => {
  const { data } = await api.post(`/group-orders/${groupOrderId}/join`, payload);
  return data;
};
