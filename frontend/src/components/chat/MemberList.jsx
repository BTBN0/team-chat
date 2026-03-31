import { useState } from "react";
import { X, Ban } from "lucide-react";
import { useSocket } from "../../context/SocketContext.jsx";
import { useAuth } from "../../context/AuthContext.jsx";
import api from "../../api/axios.js";

const formatLastSeen = (dateStr) => {
  if (!dateStr) return "Offline";
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
};

const UserAvatar = ({ user, size = 28 }) => {
  const gradients = ["linear-gradient(135deg,#3b82f6,#6366f1)", "linear-gradient(135deg,#8b5cf6,#ec4899)", "linear-gradient(135deg,#06b6d4,#3b82f6)", "linear-gradient(135deg,#10b981,#06b6d4)", "linear-gradient(135deg,#f59e0b,#ef4444)"];
  const gradient = gradients[user?.username?.charCodeAt(0) % gradients.length] || gradients[0];
  if (user?.avatar) return <img src={user.avatar} alt={user.username} style={{ width: size, height: size, borderRadius: "50%", objectFit: "cover", flexShrink: 0 }} />;
  return (
    <div style={{ width: size, height: size, borderRadius: "50%", background: gradient, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: size * 0.38, fontWeight: 600, flexShrink: 0 }}>
      {user?.username?.[0]?.toUpperCase()}
    </div>
  );
};

const MemberList = ({ members, onClose, workspaceId, onMemberBanned }) => {
  const { onlineUsers } = useSocket();
  const { user: currentUser } = useAuth();
  const [banTarget, setBanTarget] = useState(null);
  const [banReason, setBanReason] = useState("");
  const [banning, setBanning] = useState(false);
  const [hoveredId, setHoveredId] = useState(null);

  const isOwner = members.find((m) => m.id === currentUser?.id)?.role === "OWNER";
  const online = members.filter((m) => onlineUsers.includes(m.id));
  const offline = members.filter((m) => !onlineUsers.includes(m.id));

  const handleBan = async () => {
    if (!banTarget) return;
    setBanning(true);
    try {
      await api.post(`/bans/${workspaceId}/${banTarget.id}`, { reason: banReason });
      onMemberBanned?.(banTarget.id);
      setBanTarget(null); setBanReason("");
    } catch (err) { console.error(err); }
    finally { setBanning(false); }
  };

  const MemberRow = ({ member }) => {
    const isOnline = onlineUsers.includes(member.id);
    const isHovered = hoveredId === member.id;
    return (
      <div onMouseEnter={() => setHoveredId(member.id)} onMouseLeave={() => setHoveredId(null)}
        style={{ display: "flex", alignItems: "center", gap: 9, padding: "5px 10px", borderRadius: 8,
          background: isHovered ? "rgba(107,115,153,0.15)" : "transparent",
          transition: "background 0.15s, transform 0.15s",
          transform: isHovered ? "translateX(2px)" : "none",
          opacity: isOnline ? 1 : 0.55 }}>
        <div style={{ position: "relative", flexShrink: 0 }}>
          <UserAvatar user={member} size={28} />
          <span style={{ position: "absolute", bottom: -1, right: -1, width: 9, height: 9, borderRadius: "50%", border: "2px solid var(--surface)", background: isOnline ? "var(--green)" : "var(--text5)" }} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontSize: 13, fontWeight: 500, color: isOnline ? "var(--text)" : "var(--text3)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{member.username}</p>
          <p style={{ fontSize: 10, color: member.role === "OWNER" ? "#fbbf24" : isOnline ? "var(--green)" : "var(--text5)" }}>
            {member.role === "OWNER" ? "Owner" : isOnline ? "Online" : formatLastSeen(member.lastSeen)}
          </p>
        </div>
        {isOwner && member.id !== currentUser?.id && member.role !== "OWNER" && isHovered && (
          <button onClick={() => setBanTarget(member)}
            style={{ width: 22, height: 22, display: "flex", alignItems: "center", justifyContent: "center", background: "none", border: "none", cursor: "pointer", color: "var(--text5)", borderRadius: 5, transition: "all 0.15s" }}
            onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(239,68,68,0.1)"; e.currentTarget.style.color = "#fca5a5"; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "none"; e.currentTarget.style.color = "var(--text5)"; }}>
            <Ban size={11} />
          </button>
        )}
      </div>
    );
  };

  return (
    <div style={{ width: 200, background: "var(--surface)", borderLeft: "1px solid var(--border)", display: "flex", flexDirection: "column", flexShrink: 0, animation: "slideInRight .25s cubic-bezier(0.22,1,0.36,1) both" }}>
      <div style={{ padding: "12px 14px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <h3 style={{ fontSize: 13, fontWeight: 600, color: "var(--text)" }}>Members — {members.length}</h3>
        <button onClick={onClose}
          style={{ width: 24, height: 24, display: "flex", alignItems: "center", justifyContent: "center", background: "none", border: "none", cursor: "pointer", color: "var(--text5)", borderRadius: 5, transition: "all 0.15s" }}
          onMouseEnter={(e) => { e.currentTarget.style.color = "var(--text)"; e.currentTarget.style.background = "var(--surface2)"; }}
          onMouseLeave={(e) => { e.currentTarget.style.color = "var(--text5)"; e.currentTarget.style.background = "none"; }}>
          <X size={13} />
        </button>
      </div>
      <div style={{ flex: 1, overflowY: "auto", padding: "8px 4px" }}>
        {online.length > 0 && (
          <div style={{ marginBottom: 10 }}>
            <p style={{ fontSize: 10, fontWeight: 600, color: "var(--text5)", letterSpacing: "0.6px", textTransform: "uppercase", padding: "2px 10px 6px" }}>Online — {online.length}</p>
            {online.map((m) => <MemberRow key={m.id} member={m} />)}
          </div>
        )}
        {offline.length > 0 && (
          <div>
            <p style={{ fontSize: 10, fontWeight: 600, color: "var(--text5)", letterSpacing: "0.6px", textTransform: "uppercase", padding: "2px 10px 6px" }}>Offline — {offline.length}</p>
            {offline.map((m) => <MemberRow key={m.id} member={m} />)}
          </div>
        )}
      </div>

      {banTarget && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 50 }}>
          <div style={{ width: 360, background: "var(--surface2)", border: "1px solid var(--border2)", borderRadius: 16, padding: 24, boxShadow: "0 24px 48px rgba(0,0,0,0.5)" }}>
            <h3 style={{ fontSize: 15, fontWeight: 600, color: "var(--text)", marginBottom: 6 }}>Ban @{banTarget.username}?</h3>
            <p style={{ fontSize: 13, color: "var(--text4)", marginBottom: 16 }}>They will be removed and cannot rejoin.</p>
            <input type="text" value={banReason} onChange={(e) => setBanReason(e.target.value)} placeholder="Reason (optional)"
              style={{ width: "100%", background: "var(--surface)", border: "1px solid var(--border2)", borderRadius: 8, padding: "8px 12px", color: "var(--text)", fontSize: 13, marginBottom: 16, outline: "none" }} />
            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={() => { setBanTarget(null); setBanReason(""); }}
                style={{ flex: 1, padding: "9px", background: "none", border: "1px solid var(--border2)", borderRadius: 9, color: "var(--text4)", fontSize: 13, cursor: "pointer" }}>Cancel</button>
              <button onClick={handleBan} disabled={banning}
                style={{ flex: 1, padding: "9px", background: "rgba(239,68,68,0.15)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: 9, color: "#fca5a5", fontSize: 13, fontWeight: 600, cursor: "pointer", opacity: banning ? 0.6 : 1 }}>
                {banning ? "Banning..." : "Ban"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MemberList;
