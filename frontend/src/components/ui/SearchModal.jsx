import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useTheme } from "../../context/ThemeContext.jsx";
import api from "../../api/axios.js";

const SearchModal = ({ onClose, channelId }) => {
  const [tab, setTab] = useState("users");
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef(null);
  const navigate = useNavigate();
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const P = {
    bg:       isDark ? "rgba(8,11,42,0.7)"   : "rgba(8,11,42,0.35)",
    card:     isDark ? "#0D1035"              : "#ffffff",
    card2:    isDark ? "#111540"              : "#f4f4fb",
    border:   isDark ? "#1B3066"              : "#c8c8dc",
    border2:  isDark ? "#2a4080"              : "#b0b0cc",
    text:     isDark ? "#F0F0F5"              : "#080B2A",
    text2:    isDark ? "#b8bdd8"              : "#1B3066",
    muted:    isDark ? "#6B7399"              : "#6B7399",
    hoverBg:  isDark ? "rgba(107,115,153,0.13)" : "rgba(27,48,102,0.07)",
    inputBg:  isDark ? "#080B2A"              : "#F0F0F5",
    shadow:   isDark ? "0 24px 60px rgba(8,11,42,0.8)" : "0 8px 40px rgba(8,11,42,0.15)",
    accent:   "#6B7399",
    accentBd: isDark ? "rgba(107,115,153,0.4)" : "rgba(27,48,102,0.25)",
  };

  useEffect(() => { inputRef.current?.focus(); }, []);

  useEffect(() => {
    const handleKey = e => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, []);

  useEffect(() => {
    if (query.trim().length < 2) { setResults([]); return; }
    const t = setTimeout(async () => {
      setLoading(true);
      try {
        if (tab === "users") {
          const res = await api.get(`/auth/search?q=${query}`);
          setResults(res.data.data || []);
        } else {
          const res = await api.get(`/messages/${channelId}/search?q=${query}`);
          setResults(res.data.data || []);
        }
      } catch (err) { console.error(err); }
      finally { setLoading(false); }
    }, 380);
    return () => clearTimeout(t);
  }, [query, tab, channelId]);

  const Avatar = ({ user, size = 34 }) => {
    const grads = [
      "linear-gradient(135deg,#1B3066,#2a4080)",
      "linear-gradient(135deg,#2a4080,#6B7399)",
      "linear-gradient(135deg,#6B7399,#1B3066)",
      "linear-gradient(135deg,#080B2A,#2a4080)",
    ];
    const g = grads[(user?.username?.charCodeAt(0) || 0) % grads.length];
    const API_BASE = (import.meta.env.VITE_API_URL || "http://localhost:3001/api").replace("/api", "");
    const src = user?.avatar ? (user.avatar.startsWith("http") ? user.avatar : API_BASE + user.avatar) : null;
    if (src) return <img src={src} alt={user.username} style={{ width: size, height: size, borderRadius: "50%", objectFit: "cover", flexShrink: 0 }} />;
    return (
      <div style={{ width: size, height: size, borderRadius: "50%", background: g, flexShrink: 0,
        display: "flex", alignItems: "center", justifyContent: "center",
        color: "#F0F0F5", fontSize: size * 0.35, fontWeight: 700 }}>
        {user?.username?.[0]?.toUpperCase()}
      </div>
    );
  };

  const fmt = d => new Date(d).toLocaleDateString([], { month: "short", day: "numeric" });

  return (
    <div onClick={onClose} style={{
      position: "fixed", inset: 0, zIndex: 100,
      background: P.bg,
      backdropFilter: "blur(6px)",
      display: "flex", alignItems: "flex-start", justifyContent: "center",
      paddingTop: 80,
      animation: "fadeIn .15s ease both",
    }}>
      <div onClick={e => e.stopPropagation()} style={{
        width: "100%", maxWidth: 540,
        background: P.card,
        border: `1px solid ${P.border}`,
        borderRadius: 18,
        boxShadow: P.shadow,
        overflow: "hidden",
        animation: "fadeUp .25s cubic-bezier(0.22,1,0.36,1) both",
      }}>

        {/* Search input row */}
        <div style={{
          display: "flex", alignItems: "center", gap: 10,
          padding: "14px 16px",
          borderBottom: `1px solid ${P.border}`,
          background: P.card,
        }}>
          <div style={{
            width: 32, height: 32, borderRadius: 8,
            background: P.hoverBg, border: `1px solid ${P.border}`,
            display: "flex", alignItems: "center", justifyContent: "center",
            flexShrink: 0,
          }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={P.muted} strokeWidth="2">
              <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
          </div>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder={tab === "users" ? "Хэрэглэгч хайх..." : "Мессеж хайх..."}
            style={{
              flex: 1, background: "transparent", border: "none", outline: "none",
              color: P.text, fontSize: 14, caretColor: "#6B7399",
              fontFamily: "inherit",
            }}
          />
          {query && (
            <button onClick={() => setQuery("")} style={{
              width: 22, height: 22, borderRadius: "50%",
              background: P.hoverBg, border: `1px solid ${P.border}`,
              display: "flex", alignItems: "center", justifyContent: "center",
              cursor: "pointer", color: P.muted, fontSize: 12,
              transition: "all .15s",
            }}
              onMouseEnter={e => { e.currentTarget.style.color = P.text; e.currentTarget.style.borderColor = P.border2; }}
              onMouseLeave={e => { e.currentTarget.style.color = P.muted; e.currentTarget.style.borderColor = P.border; }}>
              ✕
            </button>
          )}
          <kbd style={{
            fontSize: 10, color: P.muted,
            border: `1px solid ${P.border}`,
            padding: "2px 7px", borderRadius: 6,
            background: P.card2,
          }}>Esc</kbd>
        </div>

        {/* Tabs */}
        <div style={{ display: "flex", background: P.card2, borderBottom: `1px solid ${P.border}` }}>
          {[["users", "👤", "Хэрэглэгч"], ["messages", "💬", "Мессеж"]].map(([key, icon, label]) => {
            const active = tab === key;
            return (
              <button key={key} onClick={() => { setTab(key); setResults([]); }} style={{
                flex: 1, padding: "10px 0", fontSize: 12, fontWeight: 500,
                background: "none", border: "none", cursor: "pointer",
                display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                color: active ? P.text2 : P.muted,
                borderBottom: active ? `2px solid #6B7399` : "2px solid transparent",
                transition: "all .15s",
                marginBottom: -1,
              }}>
                <span>{icon}</span>
                {label}
                {key === "messages" && !channelId && (
                  <span style={{ fontSize: 10, color: P.muted }}>(channel нээгээрэй)</span>
                )}
              </button>
            );
          })}
        </div>

        {/* Results */}
        <div style={{ maxHeight: 360, overflowY: "auto", scrollbarWidth: "thin" }}>
          {loading && (
            <div style={{ padding: "36px 0", textAlign: "center" }}>
              <svg style={{ animation: "spinSlow 1.2s linear infinite", color: P.muted }} width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" strokeOpacity=".2"/><path d="M12 2a10 10 0 0110 10"/>
              </svg>
            </div>
          )}

          {!loading && query.trim().length < 2 && (
            <div style={{ padding: "36px 0", textAlign: "center" }}>
              <div style={{ fontSize: 28, marginBottom: 8 }}>🔍</div>
              <p style={{ fontSize: 13, color: P.muted }}>2+ тэмдэгт оруулна уу</p>
            </div>
          )}

          {!loading && query.trim().length >= 2 && results.length === 0 && (
            <div style={{ padding: "36px 0", textAlign: "center" }}>
              <div style={{ fontSize: 28, marginBottom: 8 }}>🫥</div>
              <p style={{ fontSize: 13, color: P.muted }}>«{query}» олдсонгүй</p>
            </div>
          )}

          {!loading && tab === "users" && results.map((user, i) => (
            <div key={user.id} style={{
              display: "flex", alignItems: "center", gap: 12,
              padding: "11px 16px",
              borderBottom: `1px solid ${P.border}`,
              transition: "background .12s",
              animation: `slideDown .2s ease ${i * 0.04}s both`,
            }}
              onMouseEnter={e => e.currentTarget.style.background = P.hoverBg}
              onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
              <Avatar user={user} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: 13, fontWeight: 600, color: P.text, margin: 0 }}>{user.username}</p>
                {user.email && <p style={{ fontSize: 11, color: P.muted, margin: 0 }}>{user.email}</p>}
              </div>
              <button onClick={() => { navigate(`/dm/${user.id}`); onClose(); }} style={{
                fontSize: 12, fontWeight: 500, padding: "6px 14px",
                borderRadius: 8, cursor: "pointer", transition: "all .15s",
                background: isDark ? "rgba(27,48,102,0.4)" : "rgba(27,48,102,0.08)",
                border: `1px solid ${P.border2}`,
                color: P.text2,
              }}
                onMouseEnter={e => { e.currentTarget.style.background = "#1B3066"; e.currentTarget.style.color = "#F0F0F5"; e.currentTarget.style.borderColor = "#2a4080"; }}
                onMouseLeave={e => { e.currentTarget.style.background = isDark ? "rgba(27,48,102,0.4)" : "rgba(27,48,102,0.08)"; e.currentTarget.style.color = P.text2; e.currentTarget.style.borderColor = P.border2; }}>
                💬 DM
              </button>
            </div>
          ))}

          {!loading && tab === "messages" && results.map((msg, i) => (
            <div key={msg.id} style={{
              padding: "11px 16px",
              borderBottom: `1px solid ${P.border}`,
              transition: "background .12s",
              animation: `slideDown .2s ease ${i * 0.04}s both`,
            }}
              onMouseEnter={e => e.currentTarget.style.background = P.hoverBg}
              onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 5 }}>
                <Avatar user={msg.user} size={26} />
                <span style={{ fontSize: 12, fontWeight: 600, color: P.text2 }}>{msg.user?.username}</span>
                <span style={{ fontSize: 11, color: P.muted }}>{fmt(msg.createdAt)}</span>
              </div>
              <p style={{ fontSize: 13, color: P.text, paddingLeft: 34, lineHeight: 1.55, margin: 0 }}>
                {msg.content}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default SearchModal;
