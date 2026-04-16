import { createContext, useContext, useEffect, useMemo, useState } from "react";

import api, { getApiErrorMessage } from "../services/api";

const AuthContext = createContext(null);

const USER_STORAGE_KEY = "user";
const TOKEN_STORAGE_KEY = "token";

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const storedUser = localStorage.getItem(USER_STORAGE_KEY);
    return storedUser ? JSON.parse(storedUser) : null;
  });
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_STORAGE_KEY));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (token) {
      localStorage.setItem(TOKEN_STORAGE_KEY, token);
    } else {
      localStorage.removeItem(TOKEN_STORAGE_KEY);
    }
  }, [token]);

  useEffect(() => {
    if (user) {
      localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
    } else {
      localStorage.removeItem(USER_STORAGE_KEY);
    }
  }, [user]);

  const login = async (payload) => {
    try {
      setLoading(true);
      setError("");
      const { data } = await api.post("/auth/login", payload);
      setUser(data.user);
      setToken(data.token);
      return data.user;
    } catch (error) {
      const message = getApiErrorMessage(error, "Unable to login");
      setError(message);
      throw new Error(message);
    } finally {
      setLoading(false);
    }
  };

  const signup = async (payload) => {
    try {
      setLoading(true);
      setError("");
      const { data } = await api.post("/auth/register", payload);
      setUser(data.user);
      setToken(data.token);
      return data.user;
    } catch (error) {
      const message = getApiErrorMessage(error, "Unable to create account");
      setError(message);
      throw new Error(message);
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    setError("");
  };

  const value = useMemo(
    () => ({
      user,
      token,
      loading,
      error,
      isAuthenticated: Boolean(user && token),
      login,
      signup,
      logout,
      clearAuthError: () => setError(""),
    }),
    [user, token, loading, error]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider");
  }

  return context;
}
