import api from "./api";

export const createRazorpayOrder = async (payload) => {
  const { data } = await api.post("/payments/razorpay/order", payload);
  return data;
};

export const verifyRazorpayPayment = async (payload) => {
  const { data } = await api.post("/payments/razorpay/verify", payload);
  return data;
};
