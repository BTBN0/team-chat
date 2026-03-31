import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useSocket } from "../../context/SocketContext.jsx";
import { useAuth } from "../../context/AuthContext.jsx";

const Toast = ({ toast, onClose }) => {
  const navigate = useNavigate();
  const [visible, setVisible] = useState(false);
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    // Slide in
    requestAnimationFrame(() => setVisible(true));

    // Auto close after 5s
    const timer = setTimeout(() => handleClose(), 5000);
    return () => clearTimeout(timer);
  }, []);

  const handleClose = () => {
    setLeaving(true);
    setTimeout(() => onClose(toast.id), 300);
  };

  const handleClick = () => {
    if (toast.link) navigate(toast.link);
    handleClose();
  };

  const typeColors = {
    dm: "border-indigo-500/40 bg-indigo-500/5",
    friend_request: "border-purple-500/40 bg-purple-500/5",
    friend_accepted: "border-green-500/40 bg-green-500/5",
    mention: "border-amber-500/40 bg-amber-500/5",
    default: "border-[#1B3066] bg-[#0D1035]",
  };

  const typeIcons = {
    dm: "💬",
    friend_request: "👥",
    friend_accepted: "✅",
    mention: "🔔",
    default: "🔔",
  };

  const borderColor = typeColors[toast.type] || typeColors.default;
  const icon = typeIcons[toast.type] || typeIcons.default;

  return (
    <div
      onClick={handleClick}
      style={{
        transform: visible && !leaving ? "translateX(0)" : "translateX(120%)",
        opacity: visible && !leaving ? 1 : 0,
        transition: "transform 0.3s ease, opacity 0.3s ease",
      }}
      className={`w-80 bg-[#0D1035] border ${borderColor} rounded-xl shadow-2xl cursor-pointer overflow-hidden`}
    >
      {/* Progress bar */}
      <div className="h-0.5 bg-[#1B3066] w-full">
        <div
          className="h-full bg-indigo-500 origin-left"
          style={{ animation: "shrink 5s linear forwards" }}
        />
      </div>

      <div className="p-3 flex items-start gap-3">
        {/* Avatar or icon */}
        <div className="flex-shrink-0">
          {toast.avatar ? (
            <img src={toast.avatar} alt=""
              className="w-9 h-9 rounded-full object-cover" />
          ) : (
            <div className="w-9 h-9 bg-[#1B3066] rounded-full flex items-center justify-center text-base">
              {icon}
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold text-white truncate">{toast.title}</p>
          <p className="text-xs text-slate-400 mt-0.5 line-clamp-2">{toast.message}</p>
        </div>

        {/* Close */}
        <button
          onClick={(e) => { e.stopPropagation(); handleClose(); }}
          className="text-slate-600 hover:text-white transition text-xs flex-shrink-0 mt-0.5"
        >
          ✕
        </button>
      </div>
    </div>
  );
};

const ToastContainer = () => {
  const { socket } = useSocket();
  const { user } = useAuth();
  const [toasts, setToasts] = useState([]);
  const counterRef = useRef(0);

  const addToast = (toast) => {
    const id = ++counterRef.current;
    setToasts((prev) => [...prev, { ...toast, id }]);
  };

  const removeToast = (id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  useEffect(() => {
    if (!socket || !user) return;

    const handleDM = (message) => {
      if (message.senderId === user.id) return;
      addToast({
        type: "dm",
        title: `💬 ${message.sender?.username || "New message"}`,
        message: message.content || "Sent an attachment",
        avatar: message.sender?.avatar,
        link: `/dm/${message.senderId}`,
      });
    };

    const handleFriendRequest = (request) => {
      addToast({
        type: "friend_request",
        title: "👥 Friend Request",
        message: `${request.sender?.username} sent you a friend request`,
        avatar: request.sender?.avatar,
        link: "/friends",
      });
    };

    const handleFriendAccepted = ({ username }) => {
      addToast({
        type: "friend_accepted",
        title: "✅ Friend Accepted",
        message: `${username} accepted your friend request`,
        link: "/friends",
      });
    };

    const handleNewMessage = (message) => {
      if (message.user?.id === user.id) return;
      if (!message.content?.includes(`@${user.username}`)) return;
      addToast({
        type: "mention",
        title: `🔔 ${message.user?.username} mentioned you`,
        message: message.content,
        avatar: message.user?.avatar,
        link: message.channelId ? `/chat/${message.workspaceId}/${message.channelId}` : null,
      });
    };

    socket.on("dm_new_message", handleDM);
    socket.on("friend_request_received", handleFriendRequest);
    socket.on("friend_accepted", handleFriendAccepted);
    socket.on("new_message", handleNewMessage);

    return () => {
      socket.off("dm_new_message", handleDM);
      socket.off("friend_request_received", handleFriendRequest);
      socket.off("friend_accepted", handleFriendAccepted);
      socket.off("new_message", handleNewMessage);
    };
  }, [socket, user]);

  if (toasts.length === 0) return null;

  return (
    <>
      <style>{`
        @keyframes shrink {
          from { transform: scaleX(1); }
          to { transform: scaleX(0); }
        }
      `}</style>
      <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
        {toasts.map((toast) => (
          <Toast key={toast.id} toast={toast} onClose={removeToast} />
        ))}
      </div>
    </>
  );
};

export default ToastContainer;