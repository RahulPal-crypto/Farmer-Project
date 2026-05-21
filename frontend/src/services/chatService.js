import api from "./api";

export const fetchChatHistory = async (orderId) => {
  const { data } = await api.get(`/chat/${orderId}`);
  return data;
};
