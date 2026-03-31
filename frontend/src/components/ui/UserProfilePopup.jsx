import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useSocket } from "../../context/SocketContext.jsx";
import { useAuth } from "../../context/AuthContext.jsx";
import api from "../../api/axios.js";

const STATUS_COLORS = {
  online:  { bg: "bg-green-400",  label: "Online",  ring: "#4ade80" },
  away:    { bg: "bg-amber-400",  label: "Away",    ring: "#fbbf24" },
  busy:    { bg: "bg-red-400",    label: "Busy",    ring: "#f87171" },
  offline: { bg: "bg-gray-500",   label: "Offline", ring: "#6b7280" },
};

const AVATAR_GRADIENTS = [
  "linear-gradient(135deg,#a855f7,#7c3aed)",
  "linear-gradient(135deg,#3b82f6,#6366f1)",
  "linear-gradient(135deg,#ec4899,#f43f5e)",
  "linear-gradient(135deg,#0ea5e9,#22d3ee)",
  "linear-gradient(135deg,#16a34a,#4ade80)",
];

const API_BASE = (import.meta.env.VITE_API_URL || "http://localhost:3001/api").replace("/api", "");

const UserProfilePopup = ({ user, position, onClose }) => {
  const { user: currentUser, profile } = useAuth();
  const { onlineUsers } = useSocket();
  const navigate  = useNavigate();
  const popupRef  = useRef(null);

  const [friendStatus, setFriendStatus] = useState(null);
  const [isBlocked,    setIsBlocked]    = useState(false);
  const [loading,      setLoading]      = useState(false);
  const [visible,      setVisible]      = useState(false);

  const isOnline     = onlineUsers.includes(user?.id);
  const isOwnProfile = currentUser?.id === user?.id;

  // Own profile-д saved status харуулах
  const ownStatus  = profile?.status || "online";
  const statusCfg  = STATUS_COLORS[isOwnProfile ? ownStatus : (isOnline ? "online" : "offline")];

  // Avatar url
  const avatarSrc  = user?.avatar
    ? (user.avatar.startsWith("http") ? user.avatar : API_BASE + user.avatar)
    : null;

  // Gradient by username char
  const gradientIdx = (user?.username?.charCodeAt(0) || 0) % AVATAR_GRADIENTS.length;
  const avatarGrad  = AVATAR_GRADIENTS[gradientIdx];

  // Animate in
  useEffect(() => {
    const t = requestAnimationFrame(() => setVisible(true));
    return () => cancelAnimationFrame(t);
  }, []);

  // Load friend/block status
  useEffect(() => {
    if (!user || isOwnProfile) return;
    api.get("/friends").then(res => {
      const friends = res.data.data || [];
      if (friends.find(f => f.id === user.id)) setFriendStatus("friends");
    }).catch(() => {});
    api.get("/friends/requests").then(res => {
      const reqs = res.data.data || [];
      if (reqs.find(r => r.senderId === currentUser?.id)) setFriendStatus("pending");
    }).catch(() => {});
    api.get(`/blocks/check/${user.id}`).then(res => {
      setIsBlocked(res.data.data.blocked);
    }).catch(() => {});
  }, [user]);

  // Click outside / Escape
  useEffect(() => {
    const clickOutside = e => {
      if (popupRef.current && !popupRef.current.contains(e.target)) onClose();
    };
    const esc = e => { if (e.key === "Escape") onClose(); };
    document.addEventListener("mousedown", clickOutside);
    document.addEventListener("keydown", esc);
    return () => {
      document.removeEventListener("mousedown", clickOutside);
      document.removeEventListener("keydown", esc);
    };
  }, []);

  const handleAddFriend = async () => {
    setLoading(true);
    try {
      await api.post("/friends/request", { username: user.username });
      setFriendStatus("pending");
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const handleBlock = async () => {
    setLoading(true);
    try {
      const res = await api.post(`/blocks/${user.id}`);
      setIsBlocked(res.data.data.blocked);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const handleDM = () => { navigate(`/dm/${user.id}`); onClose(); };

  const formatLastSeen = (dateStr) => {
    if (!dateStr) return "Offline";
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1)  return "Яг одоо";
    if (mins < 60) return `${mins}м өмнө`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24)  return `${hrs}ц өмнө`;
    return `${Math.floor(hrs / 24)}х өмнө`;
  };

  // Smart positioning
  const POPUP_W = 230;
  const POPUP_H = 260;
  const top  = Math.max(60, Math.min(position.y - 30, window.innerHeight - POPUP_H - 20));
  const left = Math.min(position.x + 16, window.innerWidth - POPUP_W - 16);

  return (
    <div
      ref={popupRef}
      style={{
        position: "fixed",
        zIndex: 500,
        top,
        left,
        width: POPUP_W,
        transition: "opacity .15s ease, transform .15s cubic-bezier(0.22,1,0.36,1)",
        opacity: visible ? 1 : 0,
        transform: visible ? "scale(1) translateY(0)" : "scale(0.95) translateY(6px)",
        transformOrigin: "top left",
      }}
      className="rounded-2xl shadow-2xl overflow-hidden"
      style2={{ background: "#1c1c1e", border: "1px solid rgba(255,255,255,0.1)" }}
    >
      <style>{`.aura-popup{background:#0D1035;border:1px solid #1B3066;border-radius:16px;overflow:hidden;box-shadow:0 24px 64px rgba(8,11,42,0.8),0 0 0 1px rgba(27,48,102,0.4)}`}</style>

      <div ref={popupRef} className="aura-popup" style={{ width: POPUP_W }}>
        {/* Cover banner */}
        <div
          className="relative"
          style={{
            height: 52,
            background: "linear-gradient(135deg,#080B2A,#1B3066,#2a4080)",
            backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.15) 1px, transparent 1px)",
            backgroundSize: "16px 16px",
          }}
        />

        {/* Avatar row */}
        <div className="px-3 pb-2 relative">
          {/* Avatar floated up */}
          <div className="relative -mt-7 mb-2 inline-block">
            <div
              className="w-14 h-14 rounded-full overflow-hidden flex items-center justify-center"
              style={{
                border: "3px solid #0D1035",
                background: avatarSrc ? "transparent" : avatarGrad,
                boxShadow: `0 0 0 2px ${statusCfg.ring}55`,
              }}
            >
              {avatarSrc
                ? <img src={avatarSrc} alt={user?.username} className="w-full h-full object-cover"/>
                : <span className="text-xl font-black text-white select-none leading-none">
                    {user?.username?.[0]?.toUpperCase()}
                  </span>
              }
            </div>
            <span
              className={`absolute bottom-0.5 right-0.5 w-3.5 h-3.5 rounded-full border-2 border-[#0D1035] ${statusCfg.bg}`}
            />
          </div>

          {/* Name + status */}
          <div className="mb-3">
            <h3 className="font-bold text-white text-sm leading-tight truncate">
              {user?.username}
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">
              {isOnline
                ? <span className="text-green-400">● Online</span>
                : <span>⚫ {formatLastSeen(user?.lastSeen)}</span>
              }
            </p>
            {user?.email && (
              <p className="text-[10px] text-gray-600 truncate mt-0.5">{user.email}</p>
            )}
          </div>

          {/* Actions */}
          <div className="space-y-1.5 pb-1">
            {!isOwnProfile ? (
              <>
                {/* DM button */}
                <button
                  onClick={handleDM}
                  className="w-full py-2 rounded-xl text-xs font-semibold text-white transition-all active:scale-[0.97]"
                  style={{ background: "linear-gradient(135deg,#a855f7,#6366f1)" }}
                  onMouseEnter={e => e.currentTarget.style.opacity = ".88"}
                  onMouseLeave={e => e.currentTarget.style.opacity = "1"}
                >
                  💬 Мессеж
                </button>

                {/* Friend button */}
                {friendStatus === "friends" ? (
                  <button disabled className="w-full py-2 rounded-xl bg-[#111540] text-gray-500 text-xs font-semibold border border-white/5 cursor-default">
                    ✅ Найзууд
                  </button>
                ) : friendStatus === "pending" ? (
                  <button disabled className="w-full py-2 rounded-xl bg-[#111540] text-gray-500 text-xs font-semibold border border-white/5 cursor-default">
                    ⏳ Хүлээгдэж байна
                  </button>
                ) : (
                  <button
                    onClick={handleAddFriend}
                    disabled={loading}
                    className="w-full py-2 rounded-xl bg-[#111540] hover:bg-[#1B3066] border border-[#1B3066] text-gray-300 hover:text-white text-xs font-semibold transition-all active:scale-[0.97] disabled:opacity-50"
                  >
                    👥 Найз болох
                  </button>
                )}

                {/* Block button */}
                <button
                  onClick={handleBlock}
                  disabled={loading}
                  className={`w-full py-2 rounded-xl text-xs font-semibold transition-all active:scale-[0.97] disabled:opacity-50 ${
                    isBlocked
                      ? "bg-red-600/20 text-red-400 hover:bg-red-600/30 border border-red-600/30"
                      : "bg-[#111540] text-gray-500 hover:text-red-400 border border-[#1B3066]"
                  }`}
                >
                  {isBlocked ? "🚫 Блок болгосон" : "🚫 Блок"}
                </button>
              </>
            ) : (
              <button
                onClick={() => { window.dispatchEvent(new CustomEvent("open-profile")); onClose(); }}
                className="w-full py-2 rounded-xl bg-[#111540] hover:bg-[#1B3066] border border-[#1B3066] text-gray-300 hover:text-white text-xs font-semibold transition-all active:scale-[0.97]"
              >
                ✏️ Профайл засах
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserProfilePopup;
