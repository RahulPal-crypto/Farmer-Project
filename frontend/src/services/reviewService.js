import api from "./api";

export const addReview = async (payload) => {
  const { data } = await api.post("/reviews", payload);
  return data;
};

export const fetchFarmerReviews = async (farmerId, params = {}) => {
  const { data } = await api.get(`/reviews/farmer/${farmerId}`, { params });
  return data;
};
