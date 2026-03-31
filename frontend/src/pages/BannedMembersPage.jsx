import { useState, useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import api from "../api/axios.js";
import { useTheme } from "../context/ThemeContext.jsx";

const Avatar = ({ user, size = 40 }) => {
  const grads = [
    "linear-gradient(135deg,#1B3066,#2a4080)",
    "linear-gradient(135deg,#2a4080,#6B7399)",
    "linear-gradient(135deg,#6B7399,#1B3066)",
    "linear-gradient(135deg,#080B2A,#1B3066)",
  ];
  const g = grads[(user?.username?.charCodeAt(0) || 0) % grads.length];
  const API_BASE = (import.meta.env.VITE_API_URL || "http://localhost:3001/api").replace("/api", "");
  const src = user?.avatar ? (user.avatar.startsWith("http") ? user.avatar : API_BASE + user.avatar) : null;
  if (src) return <img src={src} alt={user.username} style={{ width: size, height: size, borderRadius: "50%", objectFit: "cover", flexShrink: 0 }} />;
  return (
    <div style={{ width: size, height: size, borderRadius: "50%", background: g, flexShrink: 0,
      display: "flex", alignItems: "center", justifyContent: "center",
      color: "#F0F0F5", fontSize: size * 0.36, fontWeight: 700 }}>
      {user?.username?.[0]?.toUpperCase()}
    </div>
  );
};

const BannedMembersPage = () => {
  const { workspaceId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const [bans, setBans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [unbanTarget, setUnbanTarget] = useState(null);
  const [unbanning, setUnbanning] = useState(false);
  const [workspaceName, setWorkspaceName] = useState("");
  const [error, setError] = useState("");

  const P = {
    bg:       isDark ? "#080B2A" : "#F0F0F5",
    surface:  isDark ? "#0D1035" : "#ffffff",
    surface2: isDark ? "#111540" : "#f0f0f8",
    border:   isDark ? "#1B3066" : "#c8c8dc",
    border2:  isDark ? "#2a4080" : "#b0b0cc",
    text:     isDark ? "#F0F0F5" : "#080B2A",
    text2:    isDark ? "#b8bdd8" : "#1B3066",
    muted:    isDark ? "#6B7399" : "#6B7399",
    hoverBg:  isDark ? "rgba(107,115,153,0.13)" : "rgba(27,48,102,0.06)",
    shadow:   isDark ? "0 24px 60px rgba(8,11,42,0.7)" : "0 4px 24px rgba(8,11,42,0.1)",
  };

  useEffect(() => {
    fetchBans();
    api.get("/workspaces").then(res => {
      const found = (res.data.data || []).find(w => w.id === workspaceId);
      if (found) setWorkspaceName(found.name);
    });
  }, [workspaceId, location.key]);

  const fetchBans = async () => {
    try {
      setLoading(true); setError("");
      const res = await api.get(`/bans/${workspaceId}`);
      setBans(res.data.data || []);
    } catch (err) {
      setError(err.response?.data?.message || "Уншиж чадсангүй");
    } finally { setLoading(false); }
  };

  const handleUnban = async () => {
    if (!unbanTarget) return;
    setUnbanning(true);
    try {
      await api.delete(`/bans/${workspaceId}/${unbanTarget.user.id}`);
      setBans(prev => prev.filter(b => b.id !== unbanTarget.id));
      setUnbanTarget(null);
    } catch (err) { console.error(err); }
    finally { setUnbanning(false); }
  };

  const fmt = d => new Date(d).toLocaleDateString("mn-MN", { year: "numeric", month: "short", day: "numeric" });

  return (
    <div style={{ minHeight: "100dvh", background: P.bg, color: P.text, transition: "background .25s" }}>

      {/* Header */}
      <div style={{
        borderBottom: `1px solid ${P.border}`,
        background: P.surface,
        padding: "14px 28px",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        boxShadow: isDark ? "0 1px 0 rgba(27,48,102,0.4)" : "0 1px 0 rgba(8,11,42,0.06)",
        animation: "fadeIn .2s ease both",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <button onClick={() => navigate(-1)} style={{
            display: "flex", alignItems: "center", gap: 6,
            background: "none", border: "none", cursor: "pointer",
            color: P.muted, fontSize: 13, padding: "5px 10px",
            borderRadius: 8, transition: "all .15s",
          }}
            onMouseEnter={e => { e.currentTarget.style.color = P.text; e.currentTarget.style.background = P.hoverBg; }}
            onMouseLeave={e => { e.currentTarget.style.color = P.muted; e.currentTarget.style.background = "none"; }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/>
            </svg>
            Буцах
          </button>
          <div style={{ width: 1, height: 20, background: P.border }} />
          <div>
            <h1 style={{ fontSize: 15, fontWeight: 700, color: P.text, margin: 0 }}>Хориглосон гишүүд</h1>
            {workspaceName && <p style={{ fontSize: 11, color: P.muted, margin: 0 }}>{workspaceName}</p>}
          </div>
        </div>
        <button onClick={fetchBans} style={{
          display: "flex", alignItems: "center", gap: 6,
          fontSize: 12, color: P.muted, padding: "6px 12px",
          background: P.surface2, border: `1px solid ${P.border}`,
          borderRadius: 8, cursor: "pointer", transition: "all .15s",
        }}
          onMouseEnter={e => { e.currentTarget.style.color = P.text; e.currentTarget.style.borderColor = P.border2; }}
          onMouseLeave={e => { e.currentTarget.style.color = P.muted; e.currentTarget.style.borderColor = P.border; }}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
          </svg>
          Шинэчлэх
        </button>
      </div>

      {/* Content */}
      <div style={{ maxWidth: 640, margin: "0 auto", padding: "32px 24px" }}>

        {error && (
          <div style={{
            marginBottom: 20, padding: "12px 16px", borderRadius: 12,
            background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.25)",
            color: "#f87171", fontSize: 13, animation: "slideDown .2s ease both",
          }}>
            {error}
          </div>
        )}

        {loading ? (
          <div style={{ textAlign: "center", paddingTop: 80 }}>
            <svg style={{ animation: "spinSlow 1.2s linear infinite", color: P.muted }} width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" strokeOpacity=".2"/><path d="M12 2a10 10 0 0110 10"/>
            </svg>
          </div>
        ) : bans.length === 0 ? (
          <div style={{ textAlign: "center", paddingTop: 80, animation: "fadeUp .3s ease both" }}>
            <div style={{
              width: 64, height: 64, borderRadius: "50%", margin: "0 auto 16px",
              background: isDark ? "rgba(34,197,94,0.1)" : "rgba(34,197,94,0.08)",
              border: "1px solid rgba(34,197,94,0.2)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 28,
            }}>✅</div>
            <p style={{ fontSize: 15, fontWeight: 600, color: P.text2, marginBottom: 4 }}>Хориглосон гишүүд байхгүй</p>
            <p style={{ fontSize: 13, color: P.muted }}>Энэ workspace-д зөрчил гаргаагүй байна</p>
          </div>
        ) : (
          <>
            <p style={{ fontSize: 12, color: P.muted, marginBottom: 16 }}>
              {bans.length} хориглогдсон гишүүн
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {bans.map((ban, i) => (
                <div key={ban.id} style={{
                  display: "flex", alignItems: "center", gap: 14,
                  padding: "14px 16px",
                  background: P.surface,
                  border: `1px solid ${P.border}`,
                  borderRadius: 14,
                  transition: "all .2s",
                  animation: `fadeUp .3s cubic-bezier(0.22,1,0.36,1) ${i * 0.05}s both`,
                  cursor: "default",
                }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = "rgba(239,68,68,0.3)"; e.currentTarget.style.boxShadow = "0 4px 16px rgba(239,68,68,0.08)"; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = P.border; e.currentTarget.style.boxShadow = "none"; }}>
                  <div style={{ position: "relative" }}>
                    <Avatar user={ban.user} size={42} />
                    <span style={{
                      position: "absolute", bottom: -1, right: -1,
                      width: 14, height: 14, borderRadius: "50%",
                      background: "rgba(239,68,68,0.9)", border: `2px solid ${P.surface}`,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: 7,
                    }}>🚫</span>
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: 14, fontWeight: 600, color: P.text, margin: 0, marginBottom: 3 }}>
                      {ban.user?.username}
                    </p>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                      <span style={{ fontSize: 11, color: P.muted }}>Хориглосон: {fmt(ban.createdAt)}</span>
                      {ban.reason && (
                        <>
                          <span style={{ color: P.border2 }}>·</span>
                          <span style={{ fontSize: 11, color: P.muted, fontStyle: "italic" }}>"{ban.reason}"</span>
                        </>
                      )}
                    </div>
                  </div>
                  <button onClick={() => setUnbanTarget(ban)} style={{
                    fontSize: 12, fontWeight: 500, padding: "6px 14px",
                    borderRadius: 8, cursor: "pointer", transition: "all .15s",
                    background: "transparent",
                    border: `1px solid ${P.border2}`,
                    color: P.muted, flexShrink: 0,
                  }}
                    onMouseEnter={e => { e.currentTarget.style.background = "rgba(34,197,94,0.1)"; e.currentTarget.style.borderColor = "rgba(34,197,94,0.4)"; e.currentTarget.style.color = "#4ade80"; }}
                    onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.borderColor = P.border2; e.currentTarget.style.color = P.muted; }}>
                    Буцаах
                  </button>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Unban confirm modal */}
      {unbanTarget && (
        <div style={{
          position: "fixed", inset: 0, zIndex: 50,
          background: isDark ? "rgba(8,11,42,0.75)" : "rgba(8,11,42,0.4)",
          backdropFilter: "blur(6px)",
          display: "flex", alignItems: "center", justifyContent: "center",
          padding: 16, animation: "fadeIn .15s ease both",
        }}
          onClick={e => { if (e.target === e.currentTarget) setUnbanTarget(null); }}>
          <div style={{
            width: "100%", maxWidth: 360,
            background: P.surface, border: `1px solid ${P.border}`,
            borderRadius: 20, padding: 24,
            boxShadow: P.shadow,
            animation: "fadeUp .25s cubic-bezier(0.22,1,0.36,1) both",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
              <Avatar user={unbanTarget.user} size={44} />
              <div>
                <h3 style={{ fontSize: 15, fontWeight: 700, color: P.text, margin: 0 }}>
                  @{unbanTarget.user?.username} буцаах уу?
                </h3>
                <p style={{ fontSize: 12, color: P.muted, margin: 0 }}>Урилгаар дахин нэгдэх боломжтой болно</p>
              </div>
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={() => setUnbanTarget(null)} style={{
                flex: 1, padding: "10px", borderRadius: 10,
                border: `1px solid ${P.border2}`, background: "transparent",
                color: P.muted, fontSize: 13, fontWeight: 500, cursor: "pointer",
                transition: "all .15s",
              }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = "#6B7399"; e.currentTarget.style.color = P.text; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = P.border2; e.currentTarget.style.color = P.muted; }}>
                Болих
              </button>
              <button onClick={handleUnban} disabled={unbanning} style={{
                flex: 1, padding: "10px", borderRadius: 10, border: "none",
                background: "linear-gradient(135deg,#16a34a,#22c55e)",
                color: "#fff", fontSize: 13, fontWeight: 600,
                cursor: unbanning ? "not-allowed" : "pointer",
                opacity: unbanning ? 0.6 : 1, transition: "all .15s",
                boxShadow: "0 4px 14px rgba(34,197,94,0.3)",
              }}
                onMouseEnter={e => { if (!unbanning) e.currentTarget.style.boxShadow = "0 6px 20px rgba(34,197,94,0.45)"; }}
                onMouseLeave={e => e.currentTarget.style.boxShadow = "0 4px 14px rgba(34,197,94,0.3)"}>
                {unbanning ? "Буцааж байна…" : "Буцаах"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BannedMembersPage;
