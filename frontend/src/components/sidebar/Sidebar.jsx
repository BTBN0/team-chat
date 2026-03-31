import { useNavigate, useParams } from "react-router-dom";
import { useEffect, useState, useRef } from "react";
import { useAuth } from "../../context/AuthContext.jsx";
import { useSocket } from "../../context/SocketContext.jsx";
import { Bell, Users, LogOut, Hash, MessageSquare, UserPlus, ChevronDown, ChevronRight, Plus, Settings, Sun, Moon } from "lucide-react";
import { useTheme } from "../../context/ThemeContext.jsx";
import { useStory } from "../../context/StoryContext.jsx";
import StoryRing from "../story/StoryRing.jsx";
import WorkspaceList from "./WorkspaceList.jsx";
import ChannelList from "./ChannelList.jsx";
import NotificationBell from "../ui/NotificationBell.jsx";
import api from "../../api/axios.js";

const Avatar = ({ user, size = 28 }) => {
  const gradients = [
    "linear-gradient(135deg,#3b82f6,#6366f1)",
    "linear-gradient(135deg,#8b5cf6,#ec4899)",
    "linear-gradient(135deg,#06b6d4,#3b82f6)",
    "linear-gradient(135deg,#10b981,#06b6d4)",
    "linear-gradient(135deg,#f59e0b,#ef4444)",
  ];
  const gradient = gradients[user?.username?.charCodeAt(0) % gradients.length] || gradients[0];
  if (user?.avatar) return <img src={user.avatar} alt={user.username} style={{ width: size, height: size, borderRadius: "50%", objectFit: "cover", flexShrink: 0 }} />;
  return (
    <div style={{ width: size, height: size, borderRadius: "50%", background: gradient, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: size * 0.38, fontWeight: 600, flexShrink: 0 }}>
      {user?.username?.[0]?.toUpperCase()}
    </div>
  );
};

const WorkspaceAvatar = ({ workspace, size = 32 }) => {
  const gradients = [
    "linear-gradient(135deg,#3b82f6,#6366f1)",
    "linear-gradient(135deg,#8b5cf6,#ec4899)",
    "linear-gradient(135deg,#06b6d4,#3b82f6)",
    "linear-gradient(135deg,#10b981,#06b6d4)",
    "linear-gradient(135deg,#f59e0b,#ef4444)",
  ];
  const gradient = gradients[workspace?.name?.charCodeAt(0) % gradients.length] || gradients[0];
  if (workspace?.avatar) return <img src={workspace.avatar} alt={workspace.name} style={{ width: size, height: size, borderRadius: 10, objectFit: "cover", flexShrink: 0 }} />;
  return (
    <div style={{ width: size, height: size, borderRadius: 10, background: gradient, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: size * 0.38, fontWeight: 700, flexShrink: 0 }}>
      {workspace?.name?.[0]?.toUpperCase()}
    </div>
  );
};

const Sidebar = ({ workspaces, channels, setChannels, currentWorkspace, onProfileOpen, onStoryOpen, onAddStory }) => {
  const { user, logout } = useAuth();
  const { theme, toggle } = useTheme();
  const { onlineUsers } = useSocket();
  const { allStories, myStories } = useStory();
  const navigate = useNavigate();
  const { workspaceId } = useParams();

  const [tab, setTab] = useState("channels");
  const [members, setMembers] = useState([]);
  const [friends, setFriends] = useState([]);
  const [conversations, setConversations] = useState([]);
  const [pendingCount, setPendingCount] = useState(0);
  const [showOnline, setShowOnline] = useState(true);
  const [showOffline, setShowOffline] = useState(true);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const avatarInputRef = useRef(null);

  const isOwner = workspaces.find(w => w.id === workspaceId) && true;

  useEffect(() => {
    if (!workspaceId) return;
    api.get(`/dm/users/${workspaceId}`).then((res) => setMembers(res.data.data || [])).catch(() => {});
  }, [workspaceId]);

  useEffect(() => {
    api.get("/friends").then((res) => setFriends(res.data.data || [])).catch(() => {});
    api.get("/friends/requests").then((res) => setPendingCount(res.data.data?.length || 0)).catch(() => {});
    api.get("/dm/conversations").then((res) => setConversations(res.data.data || [])).catch(() => {});
  }, []);

  const handleWorkspaceAvatarUpload = async (e) => {
    const file = e.target.files[0];
    if (!file || !workspaceId) return;
    setUploadingAvatar(true);
    try {
      const formData = new FormData();
      formData.append("avatar", file);
      await api.patch(`/workspaces/${workspaceId}/avatar`, formData, { headers: { "Content-Type": "multipart/form-data" } });
      window.location.reload();
    } catch (err) {
      console.error(err);
    } finally {
      setUploadingAvatar(false);
    }
  };

  const onlineFriends = friends.filter((f) => onlineUsers.includes(f.id));
  const offlineFriends = friends.filter((f) => !onlineUsers.includes(f.id));

  const allDMUsers = [
    ...conversations,
    ...members.filter((m) => !conversations.find((c) => c.partner?.id === m.id)).map((m) => ({ partner: m, lastMessage: null })),
  ];

  const tabStyle = (active) => ({
    flex: 1, paddingBottom: 8, fontSize: 12, fontWeight: 500, cursor: "pointer", border: "none", background: "transparent",
    color: active ? "var(--text)" : "var(--text5)",
    borderBottom: active ? "1px solid var(--text3)" : "1px solid transparent",
    transition: "all 0.15s",
  });

  const memberRowStyle = { display: "flex", alignItems: "center", gap: 9, padding: "5px 8px", borderRadius: 7, cursor: "pointer", transition: "background 0.1s" };

  return (
    <div style={{ display: "flex", height: "100%" }}>
      {/* Workspace rail */}
      <div style={{ width: 58, background: "var(--surface)", borderRight: "1px solid var(--border)", display: "flex", flexDirection: "column", alignItems: "center", padding: "10px 0", gap: 6 }}>
        {/* AuraSync logo */}
        <div
          onClick={() => navigate("/dashboard")}
          title="Dashboard"
          style={{ width: 36, height: 36, borderRadius: 10, background: "linear-gradient(135deg,#1B3066,#2a4080)", border: "1px solid var(--border2)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", marginBottom: 4, boxShadow: "0 2px 8px rgba(0,0,0,0.3)", flexShrink: 0 }}
        >
          <span style={{ fontSize: 11, fontWeight: 700, color: "var(--text)", letterSpacing: -0.5 }}>AS</span>
        </div>
        <div style={{ width: 24, height: 1, background: "var(--border)", margin: "2px 0" }} />
        <WorkspaceList workspaces={workspaces} />

        {/* Story rings in rail */}
        <div style={{ width: 24, height: 1, background: "var(--border)", margin: "2px 0" }} />
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6, overflowY: "auto", scrollbarWidth: "none", maxHeight: 200 }}>
          {/* My story / add */}
          {(() => {
            const SKINS = [{bg:"#FDDBB4",fg:"#8B5E3C"},{bg:"#F5C99A",fg:"#7A4A2A"},{bg:"#E8A87C",fg:"#6B3820"},{bg:"#C68642",fg:"#3E1F00"},{bg:"#8D5524",fg:"#FFD5A8"},{bg:"#4A2912",fg:"#F5C99A"},{bg:"#DBEAFE",fg:"#1D4ED8"},{bg:"#EDE9FE",fg:"#7C3AED"},{bg:"#FCE7F3",fg:"#BE185D"},{bg:"#D1FAE5",fg:"#065F46"}];
            // We need profile from auth context - get it from the rendered scope
            return null;
          })()}
          {allStories.slice(0, 5).map(group => (
            <div key={group.userId} title={group.userName} style={{ position: "relative" }}>
              <StoryRing
                user={{ id: group.userId, initials: group.userInitials, bg: group.userBg, color: group.userColor }}
                size={34}
                hasStory={true}
                seen={group.seen}
                onClick={() => onStoryOpen?.({ userId: group.userId })}
              />
              {!group.seen && (
                <span style={{
                  position: "absolute", top: -2, right: -2,
                  width: 8, height: 8, borderRadius: "50%",
                  background: "linear-gradient(135deg,#1B3066,#6B7399)",
                  border: "1.5px solid var(--surface)",
                }} />
              )}
            </div>
          ))}
          {/* Add story button */}
          <button onClick={() => onAddStory?.()} title="Story нэмэх" style={{
            width: 34, height: 34, borderRadius: "50%",
            background: "var(--surface2)",
            border: "1.5px dashed var(--border2)",
            display: "flex", alignItems: "center", justifyContent: "center",
            cursor: "pointer", color: "var(--text5)", transition: "all .15s", flexShrink: 0,
          }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = "#6B7399"; e.currentTarget.style.color = "#6B7399"; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = "var(--border2)"; e.currentTarget.style.color = "var(--text5)"; }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
          </button>
        </div>
      </div>

      {/* Main panel */}
      <div style={{ width: 210, background: "var(--surface)", display: "flex", flexDirection: "column", borderRight: "1px solid var(--border)" }}>
        {/* Workspace header */}
        <div style={{ padding: "10px 12px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", gap: 9 }}>
          <div style={{ position: "relative" }}>
            <div
              onClick={() => avatarInputRef.current?.click()}
              title="Change workspace avatar"
              style={{ cursor: "pointer", opacity: uploadingAvatar ? 0.5 : 1 }}
            >
              <WorkspaceAvatar workspace={currentWorkspace} size={30} />
            </div>
            <input ref={avatarInputRef} type="file" accept="image/*" onChange={handleWorkspaceAvatarUpload} style={{ display: "none" }} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontSize: 13, fontWeight: 600, color: "var(--text)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {currentWorkspace?.name || "Workspace"}
            </p>
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display: "flex", padding: "8px 8px 0", gap: 2, borderBottom: "1px solid var(--border)" }}>
          <button style={tabStyle(tab === "channels")} onClick={() => setTab("channels")}>
            <Hash size={11} style={{ display: "inline", marginRight: 4, verticalAlign: "middle" }} />
            Channels
          </button>
          <button style={tabStyle(tab === "dms")} onClick={() => setTab("dms")}>
            <MessageSquare size={11} style={{ display: "inline", marginRight: 4, verticalAlign: "middle" }} />
            DMs
          </button>
          <button style={{ ...tabStyle(tab === "friends"), position: "relative" }} onClick={() => setTab("friends")}>
            <Users size={11} style={{ display: "inline", marginRight: 4, verticalAlign: "middle" }} />
            Friends
            {pendingCount > 0 && (
              <span style={{ position: "absolute", top: 0, right: 2, width: 14, height: 14, background: "var(--red)", color: "#fff", borderRadius: "50%", fontSize: 8, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center" }}>
                {pendingCount > 9 ? "9+" : pendingCount}
              </span>
            )}
          </button>
        </div>

        {/* Tab content */}
        <div style={{ flex: 1, overflowY: "auto", padding: "6px" }}>

          {/* Channels tab */}
          {tab === "channels" && <ChannelList channels={channels} setChannels={setChannels} />}

          {/* DMs tab */}
          {tab === "dms" && (
            <div>
              {allDMUsers.length === 0 ? (
                <div style={{ textAlign: "center", padding: "32px 0", color: "var(--text5)", fontSize: 12 }}>
                  <MessageSquare size={24} style={{ margin: "0 auto 8px", opacity: 0.3 }} />
                  <p>No conversations yet</p>
                </div>
              ) : allDMUsers.map(({ partner, lastMessage }) => partner && (
                <div
                  key={partner.id}
                  onClick={() => navigate(`/dm/${partner.id}`)}
                  style={memberRowStyle}
                  onMouseEnter={(e) => e.currentTarget.style.background = "rgba(107,115,153,0.15)"}
                  onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
                >
                  <div style={{ position: "relative", flexShrink: 0 }}>
                    <Avatar user={partner} size={26} />
                    <span style={{ position: "absolute", bottom: -1, right: -1, width: 8, height: 8, borderRadius: "50%", border: "2px solid var(--surface)", background: onlineUsers.includes(partner.id) ? "var(--green)" : "var(--text5)" }} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: 13, fontWeight: 500, color: "var(--text2)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{partner.username}</p>
                    {lastMessage && <p style={{ fontSize: 11, color: "var(--text5)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{lastMessage.content || "Attachment"}</p>}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Friends tab */}
          {tab === "friends" && (
            <div>
              <button
                onClick={() => navigate("/friends")}
                style={{ width: "100%", marginBottom: 10, padding: "7px 8px", background: "var(--surface2)", border: "1px solid var(--border2)", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "space-between", cursor: "pointer", transition: "all 0.15s" }}
                onMouseEnter={(e) => { e.currentTarget.style.borderColor = "#6B7399"; e.currentTarget.style.background = "rgba(107,115,153,0.12)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.borderColor = "var(--border2)"; e.currentTarget.style.background = "transparent"; }}
              >
                <span style={{ fontSize: 12, fontWeight: 500, color: "var(--text3)", display: "flex", alignItems: "center", gap: 6 }}>
                  <UserPlus size={13} /> Manage Friends
                </span>
                {pendingCount > 0 && (
                  <span style={{ fontSize: 10, fontWeight: 700, color: "#fff", background: "var(--red)", padding: "1px 6px", borderRadius: 20 }}>{pendingCount}</span>
                )}
              </button>

              {friends.length === 0 ? (
                <div style={{ textAlign: "center", padding: "24px 0", color: "var(--text5)", fontSize: 12 }}>
                  <Users size={24} style={{ margin: "0 auto 8px", opacity: 0.3 }} />
                  <p>No friends yet</p>
                </div>
              ) : (
                <>
                  {onlineFriends.length > 0 && (
                    <div style={{ marginBottom: 8 }}>
                      <button onClick={() => setShowOnline(p => !p)} style={{ display: "flex", alignItems: "center", gap: 4, padding: "4px 8px", background: "none", border: "none", cursor: "pointer", width: "100%", marginBottom: 4 }}>
                        {showOnline ? <ChevronDown size={11} color="var(--text5)" /> : <ChevronRight size={11} color="var(--text5)" />}
                        <span style={{ fontSize: 10, fontWeight: 600, color: "var(--text5)", letterSpacing: "0.6px", textTransform: "uppercase" }}>Online — {onlineFriends.length}</span>
                      </button>
                      {showOnline && onlineFriends.map((friend) => (
                        <div key={friend.id} onClick={() => navigate(`/dm/${friend.id}`)} style={memberRowStyle}
                          onMouseEnter={(e) => e.currentTarget.style.background = "rgba(107,115,153,0.15)"}
                          onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}>
                          <div style={{ position: "relative", flexShrink: 0 }}>
                            <Avatar user={friend} size={26} />
                            <span style={{ position: "absolute", bottom: -1, right: -1, width: 8, height: 8, borderRadius: "50%", border: "2px solid var(--surface)", background: "var(--green)" }} />
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <p style={{ fontSize: 13, fontWeight: 500, color: "var(--text2)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{friend.username}</p>
                            <p style={{ fontSize: 10, color: "var(--green)" }}>Online</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  {offlineFriends.length > 0 && (
                    <div>
                      <button onClick={() => setShowOffline(p => !p)} style={{ display: "flex", alignItems: "center", gap: 4, padding: "4px 8px", background: "none", border: "none", cursor: "pointer", width: "100%", marginBottom: 4 }}>
                        {showOffline ? <ChevronDown size={11} color="var(--text5)" /> : <ChevronRight size={11} color="var(--text5)" />}
                        <span style={{ fontSize: 10, fontWeight: 600, color: "var(--text5)", letterSpacing: "0.6px", textTransform: "uppercase" }}>Offline — {offlineFriends.length}</span>
                      </button>
                      {showOffline && offlineFriends.map((friend) => (
                        <div key={friend.id} onClick={() => navigate(`/dm/${friend.id}`)} style={{ ...memberRowStyle, opacity: 0.5 }}
                          onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(107,115,153,0.15)"; e.currentTarget.style.opacity = 1; }}
                          onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.opacity = 0.5; }}>
                          <div style={{ position: "relative", flexShrink: 0 }}>
                            <Avatar user={friend} size={26} />
                            <span style={{ position: "absolute", bottom: -1, right: -1, width: 8, height: 8, borderRadius: "50%", border: "2px solid var(--surface)", background: "var(--text5)" }} />
                          </div>
                          <p style={{ fontSize: 13, fontWeight: 500, color: "var(--text3)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{friend.username}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </div>

        {/* User footer */}
        <div style={{ padding: "8px 10px", borderTop: "1px solid var(--border)", display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ position: "relative", cursor: "pointer", flexShrink: 0 }} onClick={() => (onProfileOpen ? onProfileOpen() : navigate("/profile"))}>
            <Avatar user={user} size={28} />
            <span style={{ position: "absolute", bottom: -1, right: -1, width: 9, height: 9, borderRadius: "50%", border: "2px solid var(--surface)", background: "var(--green)" }} />
          </div>
          <span onClick={() => (onProfileOpen ? onProfileOpen() : navigate("/profile"))} style={{ fontSize: 12, fontWeight: 500, color: "var(--text2)", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", cursor: "pointer" }}>
            {user?.username}
          </span>
          <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <button onClick={toggle} title={theme === "dark" ? "Light mode" : "Dark mode"}
              style={{ width: 26, height: 26, display: "flex", alignItems: "center", justifyContent: "center", background: "none", border: "none", cursor: "pointer", color: "var(--text5)", borderRadius: 6, transition: "all 0.15s" }}
              onMouseEnter={(e) => { e.currentTarget.style.color = "#F0F0F5"; e.currentTarget.style.background = "rgba(107,115,153,0.15)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.color = "var(--text5)"; e.currentTarget.style.background = "none"; }}>
              {theme === "dark" ? <Sun size={13} /> : <Moon size={13} />}
            </button>
            <NotificationBell />
            <button onClick={logout} title="Sign out"
              style={{ width: 26, height: 26, display: "flex", alignItems: "center", justifyContent: "center", background: "none", border: "none", cursor: "pointer", color: "var(--text5)", borderRadius: 6, transition: "all 0.15s" }}
              onMouseEnter={(e) => { e.currentTarget.style.color = "var(--text)"; e.currentTarget.style.background = "rgba(107,115,153,0.15)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.color = "var(--text5)"; e.currentTarget.style.background = "none"; }}>
              <LogOut size={13} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
