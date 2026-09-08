import React, { createContext, useContext, useEffect, useState } from "react";
import api, { formatApiErrorDetail } from "../lib/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null); // null=checking, false=guest, object=logged in
  const [error, setError] = useState("");

  useEffect(() => {
    let cached = null;
    try {
      cached = JSON.parse(localStorage.getItem("eg_user") || "null");
    } catch {
      cached = null;
    }
    const hasToken = !!localStorage.getItem("eg_token");
    if (cached && hasToken && !navigator.onLine) setUser(cached);

    const fetchMe = async () => {
      try {
        const { data } = await api.get("/auth/me");
        setUser(data);
        localStorage.setItem("eg_user", JSON.stringify(data));
      } catch (e) {
        // no HTTP response => network is down: keep the cached session so the app works offline
        if (cached && hasToken && !e.response) {
          setUser(cached);
        } else {
          localStorage.removeItem("eg_user");
          setUser(false);
        }
      }
    };
    fetchMe();
  }, []);

  const login = async (email, password) => {
    setError("");
    try {
      const { data } = await api.post("/auth/login", { email, password });
      if (data.token) localStorage.setItem("eg_token", data.token);
      localStorage.setItem("eg_user", JSON.stringify(data));
      setUser(data);
      return true;
    } catch (e) {
      setError(formatApiErrorDetail(e.response?.data?.detail) || e.message);
      return false;
    }
  };

  const register = async (name, email, password) => {
    setError("");
    try {
      const { data } = await api.post("/auth/register", { name, email, password });
      if (data.token) localStorage.setItem("eg_token", data.token);
      localStorage.setItem("eg_user", JSON.stringify(data));
      setUser(data);
      return true;
    } catch (e) {
      setError(formatApiErrorDetail(e.response?.data?.detail) || e.message);
      return false;
    }
  };

  const logout = async () => {
    try {
      await api.post("/auth/logout");
    } catch (_) {
      // ignore
    }
    localStorage.removeItem("eg_token");
    localStorage.removeItem("eg_user");
    setUser(false);
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout, error, setError }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
