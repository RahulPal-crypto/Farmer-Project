import api from "./api";

export const fetchNotifications = async (params = {}) => {
  const { data } = await api.get("/notifications", { params });
  return data;
};

export const markNotificationRead = async (id) => {
  const { data } = await api.put(`/notifications/${id}/read`);
  return data;
};
