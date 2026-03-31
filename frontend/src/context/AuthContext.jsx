import { createContext, useState, useEffect, useContext, useCallback } from "react";
import api from "../api/axios.js";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user,    setUser]    = useState(null);
  const [token,   setToken]   = useState(localStorage.getItem("token"));
  const [loading, setLoading] = useState(false);
  const [ready,   setReady]   = useState(false);
  const [profile, setProfile] = useState(() => {
    try { return JSON.parse(localStorage.getItem("aura-profile")) || {}; } catch { return {}; }
  });

  useEffect(() => {
    // 1. Google OAuth callback — URL-д ?token= байвал хүлээн авна
    const params = new URLSearchParams(window.location.search);
    const oauthToken = params.get("token");
    if (oauthToken) {
      window.history.replaceState({}, "", window.location.pathname);
      localStorage.setItem("token", oauthToken);
      setToken(oauthToken);
      api.get("/auth/me")
        .then(res => { const u = res.data.data; if (u?.id) setUser(u); })
        .catch(() => { localStorage.removeItem("token"); setToken(null); })
        .finally(() => setReady(true));
      return;
    }

    // 2. Хадгалагдсан session сэргээх
    const saved = localStorage.getItem("token");
    if (saved) {
      api.get("/auth/me")
        .then(res => { const u = res.data.data; if (u?.id) setUser(u); })
        .catch(() => { localStorage.removeItem("token"); setToken(null); })
        .finally(() => setReady(true));
    } else {
      setReady(true);
    }
  }, []);

  // Email login (passwordless / custom backend)
  const login = useCallback(async (email) => {
    setLoading(true);
    try {
      const res = await api.post("/auth/login", { email });
      const t = res.data.data?.token;
      const u = res.data.data?.user;
      if (!t || !u) return { ok: false, error: res.data.message || "Нэвтрэлт амжилтгүй" };
      localStorage.setItem("token", t);
      setToken(t);
      setUser(u);
      return { ok: true };
    } catch (err) {
      return { ok: false, error: err.response?.data?.message || "Нэвтрэх амжилтгүй" };
    } finally {
      setLoading(false);
    }
  }, []);

  // Google OAuth token-аар шууд нэвтрэх (callback-аас)
  const loginWithToken = useCallback((tokenVal, userData) => {
    localStorage.setItem("token", tokenVal);
    setToken(tokenVal);
    setUser(userData);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem("token");
    localStorage.removeItem("aura-profile");
    setToken(null);
    setUser(null);
  }, []);

  const saveProfile = useCallback((updates) => {
    setProfile(prev => {
      const next = { ...prev, ...updates };
      localStorage.setItem("aura-profile", JSON.stringify(next));
      return next;
    });
  }, []);

  const updateProfile = useCallback(async (data) => {
    try {
      const res = await api.patch("/auth/profile", data);
      const updated = res.data.data;
      if (updated?.id) setUser(updated);
      return { ok: true };
    } catch (err) {
      return { ok: false, error: err.response?.data?.message || "Алдаа гарлаа" };
    }
  }, []);

  const updateAvatar = useCallback(async (file) => {
    try {
      const form = new FormData();
      form.append("avatar", file);
      const res = await api.post("/auth/avatar", form, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      const updated = res.data.data;
      if (updated?.id) setUser(updated);
      return { ok: true, avatarUrl: updated?.avatar };
    } catch (err) {
      return { ok: false, error: err.response?.data?.message || "Алдаа гарлаа" };
    }
  }, []);

  return (
    <AuthContext.Provider value={{
      user, token, loading, ready,
      login, loginWithToken, logout,
      profile, saveProfile, updateProfile, updateAvatar,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
