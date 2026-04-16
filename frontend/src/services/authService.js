import api from "./api";

export const loginUser = async (payload) => {
  const { data } = await api.post("/auth/login", payload);
  return data;
};

export const signupUser = async (payload) => {
  const { data } = await api.post("/auth/register", payload);
  return data;
};
