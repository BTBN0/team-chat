import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, LogOut, Copy, Check, Hash, Users, ChevronRight } from "lucide-react";
import api from "../api/axios.js";
import { useAuth } from "../context/AuthContext.jsx";
import ProfilePage from "./ProfilePage.jsx";

const WorkspaceAvatar = ({ workspace, size = 44 }) => {
  const gradients = [
    "linear-gradient(135deg,#3b82f6,#6366f1)",
    "linear-gradient(135deg,#8b5cf6,#ec4899)",
    "linear-gradient(135deg,#06b6d4,#3b82f6)",
    "linear-gradient(135deg,#10b981,#06b6d4)",
    "linear-gradient(135deg,#f59e0b,#ef4444)",
    "linear-gradient(135deg,#ec4899,#f43f5e)",
  ];
  const gradient = gradients[workspace?.name?.charCodeAt(0) % gradients.length] || gradients[0];
  if (workspace?.avatar) return <img src={workspace.avatar} alt={workspace.name} style={{ width: size, height: size, borderRadius: 12, objectFit: "cover", flexShrink: 0 }} />;
  return (
    <div style={{ width: size, height: size, borderRadius: 12, background: gradient, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: size * 0.38, fontWeight: 700, flexShrink: 0, boxShadow: "0 4px 12px rgba(0,0,0,0.3)" }}>
      {workspace?.name?.[0]?.toUpperCase()}
    </div>
  );
};

const UserAvatar = ({ user, size = 32 }) => {
  const gradients = ["linear-gradient(135deg,#3b82f6,#6366f1)", "linear-gradient(135deg,#8b5cf6,#ec4899)", "linear-gradient(135deg,#06b6d4,#3b82f6)", "linear-gradient(135deg,#10b981,#06b6d4)"];
  const gradient = gradients[user?.username?.charCodeAt(0) % gradients.length] || gradients[0];
  if (user?.avatar) return <img src={user.avatar} alt={user.username} style={{ width: size, height: size, borderRadius: "50%", objectFit: "cover" }} />;
  return (
    <div style={{ width: size, height: size, borderRadius: "50%", background: gradient, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: size * 0.38, fontWeight: 600 }}>
      {user?.username?.[0]?.toUpperCase()}
    </div>
  );
};

const WorkspaceCard = ({ workspace, onEnter }) => {
  const [copied, setCopied] = useState(false);
  const [hovered, setHovered] = useState(false);

  const copyInvite = async (e) => {
    e.stopPropagation();
    await navigator.clipboard.writeText(workspace.inviteCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      onClick={() => onEnter(workspace)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{ background: hovered ? "var(--surface2)" : "var(--surface)", border: "1px solid", borderColor: hovered ? "var(--border2)" : "var(--border)", borderRadius: 14, padding: "16px 18px", cursor: "pointer", display: "flex", alignItems: "center", gap: 14,
        transition: "all 0.2s ease",
        transform: hovered ? "translateY(-2px)" : "translateY(0)",
        boxShadow: hovered ? "0 8px 24px rgba(8,11,42,0.4), 0 0 0 1px var(--border2)" : "none",
      }}
    >
      <WorkspaceAvatar workspace={workspace} size={44} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <h3 style={{ fontSize: 15, fontWeight: 600, color: "var(--text)", marginBottom: 3, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{workspace.name}</h3>
        {workspace.description && (
          <p style={{ fontSize: 12, color: "var(--text4)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", marginBottom: 4 }}>{workspace.description}</p>
        )}
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <code style={{ fontSize: 10, color: "var(--text5)", fontFamily: "monospace", background: "var(--surface3)", padding: "2px 6px", borderRadius: 4, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 180 }}>
            {workspace.inviteCode}
          </code>
          <button
            onClick={copyInvite}
            style={{ display: "flex", alignItems: "center", gap: 4, padding: "2px 7px", background: "none", border: "1px solid var(--border2)", borderRadius: 5, cursor: "pointer", color: copied ? "var(--green)" : "var(--text4)", fontSize: 11, fontWeight: 500, transition: "all 0.15s" }}
          >
            {copied ? <Check size={10} /> : <Copy size={10} />}
            {copied ? "Copied" : "Copy"}
          </button>
        </div>
      </div>
      <ChevronRight size={16} color="var(--text5)" style={{ flexShrink: 0, opacity: hovered ? 1 : 0, transition: "opacity 0.15s" }} />
    </div>
  );
};

const Modal = ({ title, children, onClose }) => (
  <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 50, padding: "0 16px" }}>
    <div style={{ width: "100%", maxWidth: 400, background: "var(--surface2)", border: "1px solid var(--border2)", borderRadius: 16, overflow: "hidden", boxShadow: "0 24px 48px rgba(0,0,0,0.5)" }}>
      <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <h3 style={{ fontSize: 14, fontWeight: 600, color: "var(--text)" }}>{title}</h3>
        <button onClick={onClose} style={{ background: "none", border: "none", color: "var(--text5)", cursor: "pointer", fontSize: 18, lineHeight: 1 }}>✕</button>
      </div>
      <div style={{ padding: 20 }}>{children}</div>
    </div>
  </div>
);

const DashboardPage = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [workspaces, setWorkspaces] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [showJoin, setShowJoin] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [createForm, setCreateForm] = useState({ name: "", description: "" });
  const [joinCode, setJoinCode] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    api.get("/workspaces").then((res) => {
      setWorkspaces(res.data.data || []);
    }).finally(() => setLoading(false));
  }, []);

  const handleEnter = async (workspace) => {
    const res = await api.get(`/channels/workspace/${workspace.id}`);
    const channels = res.data.data || [];
    if (channels.length > 0) navigate(`/chat/${workspace.id}/${channels[0].id}`);
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setError(""); setSubmitting(true);
    try {
      const res = await api.post("/workspaces", createForm);
      setWorkspaces((prev) => [...prev, res.data.data]);
      setShowCreate(false);
      setCreateForm({ name: "", description: "" });
      handleEnter(res.data.data);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to create");
    } finally { setSubmitting(false); }
  };

  const handleJoin = async (e) => {
    e.preventDefault();
    setError(""); setSubmitting(true);
    try {
      const res = await api.post("/workspaces/join", { inviteCode: joinCode });
      setWorkspaces((prev) => [...prev, res.data.data]);
      setShowJoin(false);
      setJoinCode("");
      handleEnter(res.data.data);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to join");
    } finally { setSubmitting(false); }
  };

  const inputStyle = { width: "100%", background: "var(--surface)", border: "1px solid var(--border2)", borderRadius: 9, padding: "9px 12px", color: "var(--text)", fontSize: 13, marginBottom: 12, transition: "border-color 0.15s" };
  const btnPrimary = { width: "100%", padding: "10px", borderRadius: 9, border: "none", background: "var(--text)", color: "var(--bg)", fontSize: 13, fontWeight: 600, cursor: "pointer" };

  return (
    <div style={{ background: "var(--bg)", minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      {/* Top nav */}
      <div style={{ height: 52, borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 28px", background: "var(--surface)", flexShrink: 0, animation: "fadeIn .3s ease both" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 28, height: 28, borderRadius: 8, background: "linear-gradient(135deg,#1B3066,#2a4080)", border: "1px solid var(--border2)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <span style={{ fontSize: 10, fontWeight: 700, color: "#F0F0F5" }}>AS</span>
          </div>
          <span style={{ fontSize: 14, fontWeight: 600, color: "var(--text)" }}>AuraSync</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }} onClick={() => setShowProfile(true)}>
            <UserAvatar user={user} size={28} />
            <span style={{ fontSize: 13, color: "var(--text3)", fontWeight: 500 }}>@{user?.username}</span>
          </div>
          <button
            onClick={logout}
            style={{ display: "flex", alignItems: "center", gap: 5, padding: "5px 10px", background: "none", border: "1px solid var(--border)", borderRadius: 7, color: "var(--text4)", fontSize: 12, cursor: "pointer", transition: "all 0.15s" }}
            onMouseEnter={(e) => { e.currentTarget.style.borderColor = "#6B7399"; e.currentTarget.style.color = "#F0F0F5"; e.currentTarget.style.background = "rgba(107,115,153,0.12)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = "var(--border)"; e.currentTarget.style.color = "var(--text4)"; }}
          >
            <LogOut size={12} /> Sign out
          </button>
        </div>
      </div>

      {/* Main */}
      <div style={{ flex: 1, maxWidth: 720, width: "100%", margin: "0 auto", padding: "48px 24px" }}>
        <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginBottom: 28, animation: "fadeUp .35s cubic-bezier(0.22,1,0.36,1) both" }}>
          <div>
            <h1 style={{ fontSize: 24, fontWeight: 700, color: "var(--text)", marginBottom: 4 }}>
              Good to see you, {user?.username} 👋
            </h1>
            <p style={{ fontSize: 14, color: "var(--text4)" }}>Pick up where you left off</p>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button
              onClick={() => { setError(""); setShowJoin(true); }}
              style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 14px", background: "rgba(107,115,153,0.12)", border: "1px solid var(--border2)", borderRadius: 9, color: "var(--text2)", fontSize: 13, fontWeight: 500, cursor: "pointer", transition: "all 0.15s" }}
              onMouseEnter={(e) => { e.currentTarget.style.color = "#F0F0F5"; e.currentTarget.style.borderColor = "#6B7399"; e.currentTarget.style.background = "rgba(107,115,153,0.15)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.color = "var(--text2)"; e.currentTarget.style.borderColor = "var(--border2)"; e.currentTarget.style.background = "rgba(27,48,102,0.2)"; }}
            >
              <Hash size={13} /> Join
            </button>
            <button
              onClick={() => { setError(""); setShowCreate(true); }}
              style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 14px", background: "linear-gradient(135deg,#1B3066,#2a4080)", border: "none", borderRadius: 9, color: "#F0F0F5", fontSize: 13, fontWeight: 600, cursor: "pointer", transition: "all 0.2s", boxShadow: "0 4px 12px rgba(8,11,42,0.4)" }}
              onMouseEnter={(e) => e.currentTarget.style.opacity = "0.9"}
              onMouseLeave={(e) => e.currentTarget.style.opacity = "1"}
            >
              <Plus size={14} /> New workspace
            </button>
          </div>
        </div>

        {loading ? (
          <div style={{ textAlign: "center", padding: "64px 0", color: "var(--text5)", fontSize: 13 }}>Loading...</div>
        ) : workspaces.length === 0 ? (
          <div style={{ textAlign: "center", padding: "80px 0" }}>
            <div style={{ width: 56, height: 56, borderRadius: 16, background: "var(--surface2)", border: "1px solid var(--border2)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
              <Users size={24} color="var(--text5)" />
            </div>
            <p style={{ fontSize: 15, fontWeight: 600, color: "var(--text3)", marginBottom: 6 }}>No workspaces yet</p>
            <p style={{ fontSize: 13, color: "var(--text5)", marginBottom: 20 }}>Create one or join with an invite code</p>
            <button onClick={() => setShowCreate(true)}
              style={{ padding: "9px 20px", background: "var(--text)", border: "none", borderRadius: 9, color: "var(--bg)", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
              Create your first workspace
            </button>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {workspaces.map((ws, i) => (
              <div key={ws.id} style={{ animation: `fadeUp .3s cubic-bezier(0.22,1,0.36,1) ${i * 0.06}s both` }}>
                <WorkspaceCard workspace={ws} onEnter={handleEnter} />
              </div>
            ))}
            ))}
          </div>
        )}
      </div>

      {/* Create modal */}
      {showCreate && (
        <Modal title="Create workspace" onClose={() => setShowCreate(false)}>
          {error && <div style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 8, padding: "8px 12px", marginBottom: 14, color: "#fca5a5", fontSize: 12 }}>{error}</div>}
          <form onSubmit={handleCreate}>
            <label style={{ display: "block", fontSize: 11, fontWeight: 500, color: "var(--text4)", marginBottom: 5, textTransform: "uppercase", letterSpacing: "0.4px" }}>Name</label>
            <input type="text" placeholder="My workspace" required value={createForm.name} onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })} style={inputStyle}
              onFocus={(e) => e.target.style.borderColor = "var(--text5)"} onBlur={(e) => e.target.style.borderColor = "var(--border2)"} />
            <label style={{ display: "block", fontSize: 11, fontWeight: 500, color: "var(--text4)", marginBottom: 5, textTransform: "uppercase", letterSpacing: "0.4px" }}>Description <span style={{ color: "var(--text5)" }}>(optional)</span></label>
            <input type="text" placeholder="What's this workspace for?" value={createForm.description} onChange={(e) => setCreateForm({ ...createForm, description: e.target.value })} style={inputStyle}
              onFocus={(e) => e.target.style.borderColor = "var(--text5)"} onBlur={(e) => e.target.style.borderColor = "var(--border2)"} />
            <button type="submit" disabled={submitting} style={{ ...btnPrimary, opacity: submitting ? 0.6 : 1, cursor: submitting ? "not-allowed" : "pointer" }}>
              {submitting ? "Creating..." : "Create workspace →"}
            </button>
          </form>
        </Modal>
      )}

      {/* Join modal */}
      {showJoin && (
        <Modal title="Join workspace" onClose={() => setShowJoin(false)}>
          {error && <div style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 8, padding: "8px 12px", marginBottom: 14, color: "#fca5a5", fontSize: 12 }}>{error}</div>}
          <form onSubmit={handleJoin}>
            <label style={{ display: "block", fontSize: 11, fontWeight: 500, color: "var(--text4)", marginBottom: 5, textTransform: "uppercase", letterSpacing: "0.4px" }}>Invite Code</label>
            <input type="text" placeholder="Paste invite code..." required value={joinCode} onChange={(e) => setJoinCode(e.target.value)} style={inputStyle}
              onFocus={(e) => e.target.style.borderColor = "var(--text5)"} onBlur={(e) => e.target.style.borderColor = "var(--border2)"} />
            <button type="submit" disabled={submitting} style={{ ...btnPrimary, opacity: submitting ? 0.6 : 1, cursor: submitting ? "not-allowed" : "pointer" }}>
              {submitting ? "Joining..." : "Join workspace →"}
            </button>
          </form>
        </Modal>
      )}

      {showProfile && (
        <ProfilePage onClose={() => setShowProfile(false)} />
      )}
    </div>
  );
};

export default DashboardPage;
