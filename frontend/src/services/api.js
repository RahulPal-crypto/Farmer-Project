import axios from "axios";

export const API_BASE_URL =
  import.meta.env.VITE_API_URL?.trim() ||
  (import.meta.env.DEV ? "http://localhost:5000/api" : "https://farmer-project-2d84.onrender.com/api");

const removeTrailingSlash = (value) => value.replace(/\/+$/, "");

export const getBackendBaseUrl = () => {
  const fallbackOrigin = typeof window !== "undefined" ? window.location.origin : "";
  const url = new URL(API_BASE_URL, fallbackOrigin || "http://localhost");

  if (url.pathname === "/api" || url.pathname.endsWith("/api/")) {
    url.pathname = url.pathname.replace(/\/api\/?$/, "");
  }

  url.search = "";
  url.hash = "";

  return removeTrailingSlash(url.toString());
};

export const getAssetUrl = (assetPath) => {
  if (!assetPath) {
    return "";
  }

  if (/^https?:\/\//i.test(assetPath)) {
    return assetPath;
  }

  const normalizedPath = assetPath.startsWith("/") ? assetPath : `/${assetPath}`;
  return `${getBackendBaseUrl()}${normalizedPath}`;
};

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

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error?.response?.status === 401) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      // If we are not already on login/signup, redirect to login
      if (
        typeof window !== "undefined" &&
        !window.location.pathname.startsWith("/login") &&
        !window.location.pathname.startsWith("/signup")
      ) {
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  }
);

export const getApiErrorMessage = (error, fallbackMessage = "Something went wrong") => {
  return error?.response?.data?.message || fallbackMessage;
};

export default api;
