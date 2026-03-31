import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../api/axios.js";
import { useAuth } from "../context/AuthContext.jsx";

const RegisterPage = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ username: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await api.post("/auth/register", form);
      login(res.data.data.token, res.data.data.user);
      navigate("/dashboard");
    } catch (err) {
      setError(err.response?.data?.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = { width: "100%", background: "var(--surface2)", border: "1px solid var(--border2)", borderRadius: 9, padding: "9px 12px", color: "var(--text)", fontSize: 13, transition: "border-color 0.15s" };
  const labelStyle = { display: "block", fontSize: 11, fontWeight: 500, color: "var(--text4)", marginBottom: 6, letterSpacing: "0.4px", textTransform: "uppercase" };

  return (
    <div style={{ background: "var(--bg)", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "0 16px" }}>
      <div style={{ width: "100%", maxWidth: 380, background: "rgba(255,255,255,0.04)", backdropFilter: "blur(40px)", WebkitBackdropFilter: "blur(40px)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 18, overflow: "hidden", boxShadow: "0 32px 64px rgba(0,0,0,0.6)" }}>
        <div style={{ height: 40, background: "rgba(255,255,255,0.03)", borderBottom: "1px solid rgba(255,255,255,0.06)", display: "flex", alignItems: "center", padding: "0 14px", gap: 7 }}>
          <div style={{ width: 12, height: 12, borderRadius: "50%", background: "#ff5f56" }} />
          <div style={{ width: 12, height: 12, borderRadius: "50%", background: "#ffbd2e" }} />
          <div style={{ width: 12, height: 12, borderRadius: "50%", background: "#27c93f" }} />
          <span style={{ flex: 1, textAlign: "center", fontSize: 12, color: "var(--text5)", fontWeight: 500, marginRight: 52 }}>AuraSync</span>
        </div>
        <div style={{ padding: "28px 28px 24px" }}>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginBottom: 26 }}>
            <div style={{ width: 48, height: 48, borderRadius: 14, background: "linear-gradient(135deg,#1B3066,#2a4080)", border: "1px solid var(--border2)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 12, boxShadow: "0 8px 24px rgba(0,0,0,0.4)" }}>
              <span style={{ fontWeight: 700, fontSize: 15, color: "var(--text)", letterSpacing: -0.5 }}>AS</span>
            </div>
            <h1 style={{ fontSize: 18, fontWeight: 600, color: "var(--text)", marginBottom: 3 }}>Create account</h1>
            <p style={{ fontSize: 13, color: "var(--text4)" }}>Join AuraSync today</p>
          </div>
          {error && (
            <div style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 10, padding: "9px 12px", marginBottom: 16, color: "#fca5a5", fontSize: 13 }}>{error}</div>
          )}
          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: 14 }}>
              <label style={labelStyle}>Username</label>
              <input type="text" name="username" value={form.username} onChange={handleChange} required placeholder="cooluser" style={inputStyle}
                onFocus={(e) => e.target.style.borderColor = "var(--text5)"} onBlur={(e) => e.target.style.borderColor = "var(--border2)"} />
            </div>
            <div style={{ marginBottom: 14 }}>
              <label style={labelStyle}>Email</label>
              <input type="email" name="email" value={form.email} onChange={handleChange} required placeholder="you@example.com" style={inputStyle}
                onFocus={(e) => e.target.style.borderColor = "var(--text5)"} onBlur={(e) => e.target.style.borderColor = "var(--border2)"} />
            </div>
            <div style={{ marginBottom: 22 }}>
              <label style={labelStyle}>Password</label>
              <input type="password" name="password" value={form.password} onChange={handleChange} required placeholder="••••••••" style={inputStyle}
                onFocus={(e) => e.target.style.borderColor = "var(--text5)"} onBlur={(e) => e.target.style.borderColor = "var(--border2)"} />
            </div>
            <button type="submit" disabled={loading}
              style={{ width: "100%", padding: "10px", borderRadius: 9, border: "none", background: loading ? "var(--surface3)" : "var(--text)", color: loading ? "var(--text4)" : "var(--bg)", fontSize: 13, fontWeight: 600, cursor: loading ? "not-allowed" : "pointer", transition: "all 0.15s" }}>
              {loading ? "Creating account..." : "Create account →"}
            </button>
          </form>
          <p style={{ textAlign: "center", marginTop: 18, fontSize: 12, color: "var(--text5)" }}>
            Already have an account?{" "}
            <Link to="/login" style={{ color: "var(--text3)", textDecoration: "none", fontWeight: 500 }}>Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
