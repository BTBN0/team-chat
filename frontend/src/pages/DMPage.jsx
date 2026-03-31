import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../api/axios.js";
import { useAuth } from "../context/AuthContext.jsx";
import { useSocket } from "../context/SocketContext.jsx";
import useDMWebRTC from "../hooks/useDMWebRTC.js";
import Sidebar from "../components/sidebar/Sidebar.jsx";
import MessageInput from "../components/chat/MessageInput.jsx";
import DMVideoPanel from "../components/ui/DMVideoPanel.jsx";

const formatTime = (dateStr) => {
  const date = new Date(dateStr);
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
};

const UserAvatar = ({ user, size = "md" }) => {
  const sizes = { sm: "w-7 h-7 text-xs", md: "w-9 h-9 text-sm" };
  const colors = ["bg-indigo-600", "bg-purple-600", "bg-pink-600", "bg-blue-600"];
  const color = colors[user?.username?.charCodeAt(0) % colors.length] || "bg-indigo-600";
  if (user?.avatar) {
    return (
      <img src={user.avatar} alt={user.username}
        className={`${sizes[size]} rounded-full object-cover flex-shrink-0`} />
    );
  }
  return (
    <div className={`${sizes[size]} ${color} rounded-full flex items-center justify-center text-white font-semibold flex-shrink-0`}>
      {user?.username?.[0]?.toUpperCase() || "?"}
    </div>
  );
};

const DMPage = () => {
  const { userId } = useParams();
  const { user } = useAuth();
  const { socket, onlineUsers } = useSocket();
  const navigate = useNavigate();

  const [workspaces, setWorkspaces] = useState([]);
  const [channels, setChannels] = useState([]);
  const [currentWorkspace, setCurrentWorkspace] = useState(null);
  const [messages, setMessages] = useState([]);
  const [targetUser, setTargetUser] = useState(null);
  const [isBlocked, setIsBlocked] = useState(false);
  const [isBlockedBy, setIsBlockedBy] = useState(false);
  const [showBlockConfirm, setShowBlockConfirm] = useState(false);
  const bottomRef = useRef(null);

  const canInteract = !isBlocked && !isBlockedBy;

  const { inCall, isMuted, callStatus, incomingCall, startCall, answerCall, rejectCall, endCall, toggleMute } =
    useDMWebRTC(socket, userId);

  const isOnline = onlineUsers.includes(userId);

  useEffect(() => {
    api.get("/workspaces").then(async (res) => {
      const ws = res.data.data || [];
      setWorkspaces(ws);
      const lastWsId = localStorage.getItem("lastWorkspaceId") || ws[0]?.id;
      const currentWs = ws.find((w) => w.id === lastWsId) || ws[0] || null;
      setCurrentWorkspace(currentWs);
      if (currentWs) {
        const chRes = await api.get(`/channels/workspace/${currentWs.id}`);
        setChannels(chRes.data.data || []);
        const membersRes = await api.get(`/dm/users/${currentWs.id}`);
        const members = membersRes.data.data || [];
        const found = members.find((m) => m.id === userId);
        if (found) setTargetUser(found);
      }
    });
  }, [userId]);

  useEffect(() => {
    if (!userId) return;
    setMessages([]);
    api.get(`/dm/${userId}`).then((res) => {
      const msgs = res.data.data || [];
      setMessages(msgs);
      if (msgs.length > 0 && !targetUser) {
        const other = msgs[0].senderId === user?.id ? msgs[0].receiver : msgs[0].sender;
        setTargetUser(other);
      }
    });

    // Check both block directions
    api.get(`/blocks/check/${userId}`).then((res) => {
      setIsBlocked(res.data.data.blocked);
    }).catch(() => {});

    api.get(`/blocks/blocked-by/${userId}`).then((res) => {
      setIsBlockedBy(res.data.data.blockedBy);
    }).catch(() => {});
  }, [userId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (!socket) return;
    const handleNewDM = (message) => {
      if (
        (message.senderId === userId && message.receiverId === user?.id) ||
        (message.senderId === user?.id && message.receiverId === userId)
      ) {
        setMessages((prev) => [...prev, message]);
      }
    };
    socket.on("dm_new_message", handleNewDM);
    return () => socket.off("dm_new_message", handleNewDM);
  }, [socket, userId]);

  const handleSend = async (content, fileUrl, fileType) => {
    if (!canInteract) return;
    try {
      const res = await api.post(`/dm/${userId}`, { content, fileUrl, fileType });
      const message = res.data.data;
      setMessages((prev) => [...prev, message]);
      socket?.emit("dm_send", { toUserId: userId, message });
    } catch (err) {
      console.error(err);
    }
  };

  const handleBlock = async () => {
    try {
      const res = await api.post(`/blocks/${userId}`);
      setIsBlocked(res.data.data.blocked);
      setShowBlockConfirm(false);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="flex h-screen bg-[#080B2A] overflow-hidden">
      <Sidebar
        workspaces={workspaces}
        channels={channels}
        setChannels={setChannels}
        currentWorkspace={currentWorkspace}
      />

      <div className="flex-1 flex flex-col min-w-0">
        {/* DM Header */}
        <div className="h-14 border-b border-[#1B3066] flex items-center justify-between px-6 bg-[#0D1035]">
          <div className="flex items-center gap-3">
            <div className="relative">
              <UserAvatar user={targetUser} size="sm" />
              <span className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-[#0D1035] ${isOnline ? "bg-green-400" : "bg-slate-500"}`} />
            </div>
            <div>
              <h2 className="font-semibold text-white text-sm">
                {targetUser?.username || "Direct Message"}
              </h2>
              <p className="text-xs text-[#6B7399]">
                {isBlocked ? "🚫 You blocked this user" : isBlockedBy ? "🚫 Blocked" : isOnline ? "Online" : "Offline"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Call button — only if not blocked either way */}
            {canInteract && !inCall && (
              <button onClick={startCall}
                className="px-3 py-1.5 bg-green-600 hover:bg-green-500 text-white text-xs font-medium rounded-lg transition">
                📞 Call
              </button>
            )}
            {inCall && (
              <>
                <span className="text-xs text-green-400 font-medium flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                  {callStatus === "calling" ? "Calling..." : "In call"}
                </span>
                <button onClick={toggleMute}
                  className={`px-3 py-1.5 text-xs font-medium rounded-lg transition ${isMuted ? "bg-red-600/20 text-red-400 border border-red-500/50" : "bg-[#1B3066] text-[#b8bdd8]"}`}>
                  {isMuted ? "🔇 Unmute" : "🎙️ Mute"}
                </button>
                <button onClick={endCall}
                  className="px-3 py-1.5 bg-red-600 hover:bg-red-500 text-white text-xs font-medium rounded-lg transition">
                  📵 End
                </button>
              </>
            )}

            {/* Block button — only show if I haven't been blocked by them */}
            {!isBlockedBy && (
              <button
                onClick={() => setShowBlockConfirm(true)}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition ${
                  isBlocked
                    ? "bg-red-600/20 text-red-400 border border-red-500/30 hover:bg-red-600/30"
                    : "bg-[#1B3066] text-[#6B7399] hover:text-red-400"
                }`}
              >
                {isBlocked ? "🚫 Unblock" : "🚫 Block"}
              </button>
            )}
          </div>
        </div>

        {/* Incoming call banner */}
        {incomingCall && !inCall && (
          <div className="px-6 py-3 bg-green-900/20 border-b border-green-700/30 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
              <span className="text-green-400 text-sm font-medium">
                {incomingCall.fromUsername} is calling...
              </span>
            </div>
            <div className="flex gap-2">
              <button onClick={answerCall}
                className="px-4 py-1.5 bg-green-600 hover:bg-green-500 text-white text-xs font-medium rounded-lg transition">
                Answer
              </button>
              <button onClick={rejectCall}
                className="px-4 py-1.5 bg-red-600 hover:bg-red-500 text-white text-xs font-medium rounded-lg transition">
                Decline
              </button>
            </div>
          </div>
        )}

        {/* Blocked banners */}
        {isBlocked && (
          <div className="px-6 py-3 bg-red-900/10 border-b border-red-700/20 text-center">
            <p className="text-red-400 text-xs">
              You have blocked this user. Unblock to send messages or call.
            </p>
          </div>
        )}
        {isBlockedBy && !isBlocked && (
          <div className="px-6 py-3 bg-[#0D1035] border-b border-[#1B3066] text-center">
            <p className="text-[#6B7399] text-xs">
              You cannot message or call this person.
            </p>
          </div>
        )}

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-1">
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-[#6B7399]">
              <p className="text-4xl mb-3">💬</p>
              <p className="text-sm">
                {canInteract ? `Start a conversation with ${targetUser?.username}` : "No messages"}
              </p>
            </div>
          )}

          {messages.map((msg, i) => {
            const isOwn = msg.senderId === user?.id;
            const showAvatar = i === 0 || messages[i - 1]?.senderId !== msg.senderId;

            return (
              <div key={msg.id} className={`flex items-start gap-3 ${showAvatar ? "mt-4" : "mt-0.5"}`}>
                <div className="w-9 flex-shrink-0">
                  {showAvatar && <UserAvatar user={isOwn ? user : targetUser} />}
                </div>
                <div className="flex-1 min-w-0">
                  {showAvatar && (
                    <div className="flex items-baseline gap-2 mb-0.5">
                      <span className={`text-sm font-semibold ${isOwn ? "text-indigo-400" : "text-white"}`}>
                        {isOwn ? user?.username : targetUser?.username}
                      </span>
                      <span className="text-xs text-[#6B7399]">{formatTime(msg.createdAt)}</span>
                    </div>
                  )}
                  {msg.deleted ? (
                    <p className="text-[#6B7399] italic text-sm">Message deleted</p>
                  ) : (
                    <>
                      {msg.content && msg.content !== "" && (
                        <p className="text-[#b8bdd8] text-sm leading-relaxed break-words">{msg.content}</p>
                      )}
                      {msg.fileUrl && msg.fileType?.startsWith("image/") && (
                        <a href={msg.fileUrl} target="_blank" rel="noreferrer" className="block mt-2">
                          <img src={msg.fileUrl} alt="attachment"
                            className="max-w-xs max-h-64 rounded-xl border border-[#1B3066] object-cover hover:opacity-90 transition" />
                        </a>
                      )}
                    </>
                  )}
                </div>
              </div>
            );
          })}
          <div ref={bottomRef} />
        </div>

        <MessageInput
          onSend={handleSend}
          onTyping={() => {}}
          channelName={targetUser?.username}
          disabled={!canInteract}
        />
      </div>

      {/* Block confirm modal */}
      {showBlockConfirm && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="w-full max-w-sm bg-[#0D1035] border border-[#1B3066] rounded-2xl p-6">
            <h3 className="text-base font-semibold text-white mb-2">
              {isBlocked ? "Unblock" : "Block"} @{targetUser?.username}?
            </h3>
            <p className="text-[#6B7399] text-sm mb-6">
              {isBlocked
                ? "They will be able to send you messages and call you again."
                : "They won't be able to message or call you anymore."}
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowBlockConfirm(false)}
                className="flex-1 py-2.5 border border-[#1B3066] rounded-lg text-[#6B7399] hover:text-white transition text-sm"
              >
                Cancel
              </button>
              <button
                onClick={handleBlock}
                className="flex-1 py-2.5 bg-red-600 hover:bg-red-500 rounded-lg text-white font-medium transition text-sm"
              >
                {isBlocked ? "Unblock" : "Block"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DMPage;