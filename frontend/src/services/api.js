import axios from "axios";

const API_BASE_URL =
  import.meta.env.VITE_API_URL?.trim() ||
  (import.meta.env.DEV ? "http://localhost:5000/api" : "/api");

const api = axios.create({
  baseURL: API_BASE_URL,
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

export const getApiErrorMessage = (error, fallbackMessage = "Something went wrong") => {
  return error?.response?.data?.message || fallbackMessage;
};

export default api;
