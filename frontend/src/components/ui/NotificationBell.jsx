import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Bell } from "lucide-react";
import { useNotifications } from "../../context/NotificationContext.jsx";

const timeAgo = (id) => {
  const diff = Date.now() - id;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
};

const typeIcon = (type) => {
  switch (type) {
    case "friend_request": return "👥";
    case "friend_accepted": return "✅";
    case "dm": return "💬";
    case "mention": return "🔔";
    default: return "🔔";
  }
};

const NotificationBell = () => {
  const { notifications, unreadCount, markRead, markAllRead, clearAll } = useNotifications();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleClick = (notification) => {
    markRead(notification.id);
    setOpen(false);
    if (notification.link) navigate(notification.link);
  };

  return (
    <div style={{ position: "relative" }} ref={ref}>
      <button
        onClick={() => setOpen((p) => !p)}
        title="Notifications"
        style={{ width: 26, height: 26, display: "flex", alignItems: "center", justifyContent: "center", background: "none", border: "none", cursor: "pointer", color: "var(--text5)", borderRadius: 6, position: "relative", transition: "all 0.15s" }}
        onMouseEnter={(e) => { e.currentTarget.style.color = "var(--text)"; e.currentTarget.style.background = "var(--surface2)"; }}
        onMouseLeave={(e) => { e.currentTarget.style.color = "var(--text5)"; e.currentTarget.style.background = "none"; }}
      >
        <Bell size={13} />
        {unreadCount > 0 && (
          <span style={{ position: "absolute", top: 2, right: 2, width: 13, height: 13, background: "var(--red)", color: "#fff", borderRadius: "50%", fontSize: 7, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center" }}>
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div style={{ position: "absolute", bottom: 34, left: 0, width: 300, background: "var(--surface2)", border: "1px solid var(--border2)", borderRadius: 12, boxShadow: "0 16px 40px rgba(0,0,0,0.5)", zIndex: 100, overflow: "hidden" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 14px", borderBottom: "1px solid var(--border)" }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: "var(--text)" }}>Notifications</span>
            <div style={{ display: "flex", gap: 10 }}>
              {unreadCount > 0 && (
                <button onClick={markAllRead} style={{ fontSize: 11, color: "var(--text3)", background: "none", border: "none", cursor: "pointer" }}>Mark all read</button>
              )}
              {notifications.length > 0 && (
                <button onClick={clearAll} style={{ fontSize: 11, color: "var(--text5)", background: "none", border: "none", cursor: "pointer" }}>Clear</button>
              )}
            </div>
          </div>

          <div style={{ maxHeight: 320, overflowY: "auto" }}>
            {notifications.length === 0 ? (
              <div style={{ padding: "32px 0", textAlign: "center", color: "var(--text5)", fontSize: 13 }}>
                <Bell size={20} style={{ margin: "0 auto 8px", opacity: 0.3 }} />
                <p>No notifications</p>
              </div>
            ) : notifications.map((n) => (
              <button
                key={n.id}
                onClick={() => handleClick(n)}
                style={{ width: "100%", textAlign: "left", padding: "10px 14px", display: "flex", alignItems: "flex-start", gap: 10, background: n.read ? "transparent" : "rgba(255,255,255,0.02)", border: "none", borderBottom: "1px solid var(--border)", cursor: "pointer", transition: "background 0.1s" }}
                onMouseEnter={(e) => e.currentTarget.style.background = "var(--surface3)"}
                onMouseLeave={(e) => e.currentTarget.style.background = n.read ? "transparent" : "rgba(255,255,255,0.02)"}
              >
                <div style={{ width: 30, height: 30, borderRadius: "50%", background: "var(--surface3)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, flexShrink: 0 }}>
                  {typeIcon(n.type)}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 8, marginBottom: 2 }}>
                    <p style={{ fontSize: 12, fontWeight: 600, color: "var(--text)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{n.title}</p>
                    <span style={{ fontSize: 10, color: "var(--text5)", flexShrink: 0 }}>{timeAgo(n.id)}</span>
                  </div>
                  <p style={{ fontSize: 11, color: "var(--text4)", overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>{n.message}</p>
                </div>
                {!n.read && <span style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--text)", flexShrink: 0, marginTop: 4 }} />}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
