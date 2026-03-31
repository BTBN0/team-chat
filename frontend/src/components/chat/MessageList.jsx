import { useEffect, useRef, useState } from "react";
import { useAuth } from "../../context/AuthContext.jsx";
import { Edit2, Trash2, Pin, CornerUpLeft } from "lucide-react";
import Picker from "@emoji-mart/react";
import data from "@emoji-mart/data";
import api from "../../api/axios.js";
import UserProfilePopup from "../ui/UserProfilePopup.jsx";
import VoiceMessage from "./VoiceMessage.jsx";

const formatTime = (dateStr) => {
  const date = new Date(dateStr);
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
};

const formatDate = (dateStr) => {
  const date = new Date(dateStr);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  if (date.toDateString() === today.toDateString()) return "Today";
  if (date.toDateString() === yesterday.toDateString()) return "Yesterday";
  return date.toLocaleDateString([], { month: "long", day: "numeric" });
};

const UserAvatar = ({ user, size = 32, onClick }) => {
  const gradients = ["linear-gradient(135deg,#3b82f6,#6366f1)", "linear-gradient(135deg,#8b5cf6,#ec4899)", "linear-gradient(135deg,#06b6d4,#3b82f6)", "linear-gradient(135deg,#10b981,#06b6d4)", "linear-gradient(135deg,#f59e0b,#ef4444)"];
  const gradient = gradients[user?.username?.charCodeAt(0) % gradients.length] || gradients[0];
  if (user?.avatar) return <img src={user.avatar} alt={user.username} onClick={onClick} style={{ width: size, height: size, borderRadius: "50%", objectFit: "cover", cursor: "pointer", flexShrink: 0 }} />;
  return (
    <div onClick={onClick} style={{ width: size, height: size, borderRadius: "50%", background: gradient, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: size * 0.38, fontWeight: 600, cursor: "pointer", flexShrink: 0 }}>
      {user?.username?.[0]?.toUpperCase()}
    </div>
  );
};

const FileAttachment = ({ fileUrl, fileType, isOwn }) => {
  if (!fileUrl) return null;
  if (fileType?.startsWith("audio/")) {
    return <VoiceMessage fileUrl={fileUrl} isOwn={isOwn} />;
  }
  if (!fileUrl) return null;
  const isImage = fileType?.startsWith("image/");
  const filename = fileUrl.split("/").pop();
  const ext = filename.split(".").pop().toUpperCase();
  if (isImage) {
    return (
      <a href={fileUrl} target="_blank" rel="noreferrer" style={{ display: "block", marginTop: 8 }}>
        <img src={fileUrl} alt="attachment" style={{ maxWidth: 320, maxHeight: 240, borderRadius: 10, border: "1px solid var(--border)", objectFit: "cover", display: "block" }} />
      </a>
    );
  }
  return (
    <a href={fileUrl} target="_blank" rel="noreferrer" style={{ display: "inline-flex", alignItems: "center", gap: 8, marginTop: 8, padding: "8px 12px", background: "var(--surface2)", border: "1px solid var(--border)", borderRadius: 9, textDecoration: "none", transition: "border-color 0.15s" }}>
      <span style={{ fontSize: 10, fontWeight: 700, color: "var(--text3)", background: "var(--surface3)", padding: "2px 6px", borderRadius: 4 }}>{ext}</span>
      <span style={{ fontSize: 13, color: "var(--text3)", maxWidth: 240, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{filename}</span>
      <span style={{ fontSize: 12, color: "var(--text5)" }}>↗</span>
    </a>
  );
};

const ReactionBar = ({ reactions = [], onReaction, messageId, currentUserId }) => {
  const [showPicker, setShowPicker] = useState(false);
  const pickerRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (pickerRef.current && !pickerRef.current.contains(e.target)) setShowPicker(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const grouped = reactions.reduce((acc, r) => {
    if (!acc[r.emoji]) acc[r.emoji] = [];
    acc[r.emoji].push(r);
    return acc;
  }, {});

  if (Object.keys(grouped).length === 0 && !showPicker) return null;

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 4, flexWrap: "wrap", marginTop: 6 }}>
      {Object.entries(grouped).map(([emoji, users]) => {
        const hasReacted = users.some((u) => u.user?.id === currentUserId);
        return (
          <button key={emoji} onClick={() => onReaction(messageId, emoji)}
            style={{ display: "flex", alignItems: "center", gap: 4, padding: "2px 8px", background: hasReacted ? "rgba(255,255,255,0.06)" : "var(--surface2)", border: `1px solid ${hasReacted ? "var(--border2)" : "var(--border)"}`, borderRadius: 20, cursor: "pointer", fontSize: 12, color: "var(--text3)", transition: "all 0.15s" }}>
            <span>{emoji}</span>
            <span style={{ fontSize: 11, color: "var(--text4)" }}>{users.length}</span>
          </button>
        );
      })}
      <div style={{ position: "relative" }} ref={pickerRef}>
        <button onClick={() => setShowPicker((p) => !p)}
          style={{ display: "flex", alignItems: "center", padding: "2px 7px", background: "transparent", border: "1px solid transparent", borderRadius: 20, cursor: "pointer", fontSize: 12, color: "var(--text5)", transition: "all 0.15s" }}
          onMouseEnter={(e) => { e.currentTarget.style.borderColor = "var(--border)"; e.currentTarget.style.color = "var(--text3)"; }}
          onMouseLeave={(e) => { e.currentTarget.style.borderColor = "transparent"; e.currentTarget.style.color = "var(--text5)"; }}>
          + 😊
        </button>
        {showPicker && (
          <div style={{ position: "absolute", bottom: 28, left: 0, zIndex: 50 }}>
            <Picker data={data} onEmojiSelect={(emoji) => { onReaction(messageId, emoji.native); setShowPicker(false); }} theme="dark" previewPosition="none" skinTonePosition="none" />
          </div>
        )}
      </div>
    </div>
  );
};

const MessageItem = ({ msg, isOwn, showAvatar, showDate, onReaction, onEdit, onDelete, onPin, onReply, onAvatarClick, currentUserId, socket, channelId }) => {
  const [editing, setEditing] = useState(false);
  const [editContent, setEditContent] = useState(msg.content || "");
  const [showActions, setShowActions] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.setSelectionRange(editContent.length, editContent.length);
    }
  }, [editing]);

  const handleEditSubmit = async () => {
    if (!editContent.trim() || editContent.trim() === msg.content) { setEditing(false); return; }
    try {
      const res = await api.patch(`/messages/${msg.id}`, { content: editContent.trim() });
      onEdit(res.data.data);
      socket?.emit("message_edited", { message: res.data.data, channelId });
      setEditing(false);
    } catch (err) { console.error(err); }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleEditSubmit(); }
    if (e.key === "Escape") { setEditing(false); setEditContent(msg.content || ""); }
  };

  return (
    <>
      {showDate && (
        <div style={{ display: "flex", alignItems: "center", gap: 10, margin: "16px 0 8px", padding: "0 4px" }}>
          <div style={{ flex: 1, height: 1, background: "var(--border)" }} />
          <span style={{ fontSize: 11, color: "var(--text5)", fontWeight: 500, whiteSpace: "nowrap" }}>{formatDate(msg.createdAt)}</span>
          <div style={{ flex: 1, height: 1, background: "var(--border)" }} />
        </div>
      )}
      <div
        onMouseEnter={() => setShowActions(true)}
        onMouseLeave={() => setShowActions(false)}
        style={{ display: "flex", alignItems: "flex-start", gap: 10, padding: showAvatar ? "8px 4px 2px" : "1px 4px", borderRadius: 8, background: showActions ? "rgba(107,115,153,0.1)" : "transparent", position: "relative", borderLeft: msg.pinned ? "2px solid var(--accent)" : "2px solid transparent", paddingLeft: msg.pinned ? 10 : 4, transition: "background 0.15s", animation: showAvatar ? "slideInRight .2s cubic-bezier(0.22,1,0.36,1) both" : "none" }}
      >
        <div style={{ width: 36, flexShrink: 0, paddingTop: showAvatar ? 0 : 0 }}>
          {showAvatar && <UserAvatar user={msg.user} size={32} onClick={(e) => onAvatarClick(e, msg.user)} />}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          {showAvatar && (
            <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginBottom: 2 }}>
              <span onClick={(e) => onAvatarClick(e, msg.user)} style={{ fontSize: 13, fontWeight: 600, color: "var(--text)", cursor: "pointer" }}
                onMouseEnter={(e) => e.currentTarget.style.textDecoration = "underline"}
                onMouseLeave={(e) => e.currentTarget.style.textDecoration = "none"}>
                {msg.user?.username}
              </span>
              <span style={{ fontSize: 11, color: "var(--text5)" }}>{formatTime(msg.createdAt)}</span>
              {msg.updatedAt !== msg.createdAt && <span style={{ fontSize: 10, color: "var(--text5)", fontStyle: "italic" }}>(edited)</span>}
              {msg.pinned && <span style={{ fontSize: 10, color: "var(--text5)" }}>· 📌</span>}
            </div>
          )}

          {msg.deleted ? (
            <p style={{ fontSize: 13, color: "var(--text5)", fontStyle: "italic" }}>Message deleted</p>
          ) : editing ? (
            <div>
              <input ref={inputRef} value={editContent} onChange={(e) => setEditContent(e.target.value)} onKeyDown={handleKeyDown}
                style={{ width: "100%", background: "var(--surface2)", border: "1px solid var(--border2)", borderRadius: 8, padding: "8px 12px", color: "var(--text)", fontSize: 13, outline: "none" }} />
              <div style={{ display: "flex", gap: 6, marginTop: 6 }}>
                <button onClick={handleEditSubmit} style={{ padding: "4px 12px", background: "linear-gradient(135deg,#1B3066,#2a4080)", border: "none", borderRadius: 6, color: "#F0F0F5", fontSize: 11, fontWeight: 600, cursor: "pointer" }}>Хадгалах</button>
                <button onClick={() => { setEditing(false); setEditContent(msg.content || ""); }} style={{ padding: "4px 12px", background: "var(--surface2)", border: "none", borderRadius: 6, color: "var(--text4)", fontSize: 11, cursor: "pointer" }}>Болих</button>
                <span style={{ fontSize: 11, color: "var(--text5)", alignSelf: "center" }}>Enter · Esc</span>
              </div>
            </div>
          ) : (
            <>
              {/* Reply-to preview */}
              {msg.replyTo && (
                <div style={{
                  display: "flex", alignItems: "flex-start", gap: 6,
                  padding: "5px 8px", marginBottom: 4, borderRadius: 6,
                  background: "rgba(107,115,153,0.1)",
                  borderLeft: "2px solid #6B7399",
                }}>
                  <CornerUpLeft size={10} style={{ color: "var(--text5)", flexShrink: 0, marginTop: 2 }} />
                  <div style={{ minWidth: 0 }}>
                    <span style={{ fontSize: 11, fontWeight: 600, color: "#6B7399" }}>{msg.replyTo.username} </span>
                    <span style={{ fontSize: 11, color: "var(--text5)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", display: "inline-block", maxWidth: 200 }}>
                      {msg.replyTo.content}
                    </span>
                  </div>
                </div>
              )}
              {msg.content && <p style={{ fontSize: 13, color: "var(--text3)", lineHeight: 1.6, wordBreak: "break-word" }}>{msg.content}</p>}
              <FileAttachment fileUrl={msg.fileUrl} fileType={msg.fileType} />
              <ReactionBar reactions={msg.reactions || []} onReaction={onReaction} messageId={msg.id} currentUserId={currentUserId} />
              {/* Reply thread count */}
              {msg.thread?.replies?.length > 0 && (
                <button onClick={() => onReply?.(msg)} style={{
                  display: "inline-flex", alignItems: "center", gap: 5,
                  marginTop: 4, padding: "3px 8px", borderRadius: 6,
                  background: "rgba(27,48,102,0.2)", border: "1px solid rgba(107,115,153,0.25)",
                  color: "#6B7399", fontSize: 11, fontWeight: 600, cursor: "pointer",
                  transition: "all .15s",
                }}
                  onMouseEnter={e => { e.currentTarget.style.background = "rgba(27,48,102,0.35)"; e.currentTarget.style.color = "#b8bdd8"; }}
                  onMouseLeave={e => { e.currentTarget.style.background = "rgba(27,48,102,0.2)"; e.currentTarget.style.color = "#6B7399"; }}>
                  <CornerUpLeft size={10} />
                  {msg.thread.replies.length} {msg.thread.replies.length === 1 ? "reply" : "replies"}
                </button>
              )}
            </>
          )}
        </div>

        {/* Hover actions */}
        {showActions && !msg.deleted && !editing && (
          <div style={{ position: "absolute", right: 8, top: showAvatar ? 6 : -8, display: "flex", alignItems: "center", gap: 2, background: "var(--surface2)", border: "1px solid var(--border2)", borderRadius: 8, padding: "3px 4px", boxShadow: "0 4px 12px rgba(0,0,0,0.3)", zIndex: 10 }}>
            {/* Reply button */}
            <button onClick={() => onReply?.(msg)}
              style={{ width: 26, height: 26, display: "flex", alignItems: "center", justifyContent: "center", background: "none", border: "none", cursor: "pointer", color: "var(--text5)", borderRadius: 5, transition: "all 0.1s" }}
              onMouseEnter={(e) => { e.currentTarget.style.background = "var(--surface3)"; e.currentTarget.style.color = "var(--text)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = "none"; e.currentTarget.style.color = "var(--text5)"; }}
              title="Reply">
              <CornerUpLeft size={12} />
            </button>
            {isOwn && (
              <button onClick={() => { setEditing(true); setEditContent(msg.content || ""); }}
                style={{ width: 26, height: 26, display: "flex", alignItems: "center", justifyContent: "center", background: "none", border: "none", cursor: "pointer", color: "var(--text5)", borderRadius: 5, transition: "all 0.1s" }}
                onMouseEnter={(e) => { e.currentTarget.style.background = "var(--surface3)"; e.currentTarget.style.color = "var(--text)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = "none"; e.currentTarget.style.color = "var(--text5)"; }}
                title="Edit">
                <Edit2 size={12} />
              </button>
            )}
            <button onClick={() => onPin(msg)}
              style={{ width: 26, height: 26, display: "flex", alignItems: "center", justifyContent: "center", background: "none", border: "none", cursor: "pointer", color: msg.pinned ? "var(--text)" : "var(--text5)", borderRadius: 5, transition: "all 0.1s" }}
              onMouseEnter={(e) => { e.currentTarget.style.background = "var(--surface3)"; e.currentTarget.style.color = "var(--text)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = "none"; e.currentTarget.style.color = msg.pinned ? "var(--text)" : "var(--text5)"; }}
              title={msg.pinned ? "Unpin" : "Pin"}>
              <Pin size={12} />
            </button>
            {isOwn && (
              <button onClick={() => onDelete(msg.id)}
                style={{ width: 26, height: 26, display: "flex", alignItems: "center", justifyContent: "center", background: "none", border: "none", cursor: "pointer", color: "var(--text5)", borderRadius: 5, transition: "all 0.1s" }}
                onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(239,68,68,0.1)"; e.currentTarget.style.color = "#fca5a5"; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = "none"; e.currentTarget.style.color = "var(--text5)"; }}
                title="Delete">
                <Trash2 size={12} />
              </button>
            )}
          </div>
        )}
      </div>
    </>
  );
};

const MessageList = ({ messages, typingUsers, onReaction, onEdit, onDelete, onPin, onReply, socket, channelId }) => {
  const { user } = useAuth();
  const bottomRef = useRef(null);
  const [profilePopup, setProfilePopup] = useState(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, typingUsers]);

  const handleAvatarClick = (e, clickedUser) => {
    e.stopPropagation();
    setProfilePopup({ user: clickedUser, position: { x: e.clientX, y: e.clientY } });
  };

  return (
    <div style={{ flex: 1, overflowY: "auto", padding: "8px 20px 8px", display: "flex", flexDirection: "column" }}>
      {messages.length === 0 && (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", flex: 1, color: "var(--text5)", textAlign: "center" }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>💬</div>
          <p style={{ fontSize: 14, fontWeight: 500, color: "var(--text4)", marginBottom: 4 }}>No messages yet</p>
          <p style={{ fontSize: 13, color: "var(--text5)" }}>Be the first to say something!</p>
        </div>
      )}

      {messages.map((msg, i) => {
        const isOwn = msg.user?.id === user?.id;
        const prevMsg = messages[i - 1];
        const showAvatar = !prevMsg || prevMsg.user?.id !== msg.user?.id || (new Date(msg.createdAt) - new Date(prevMsg.createdAt)) > 5 * 60 * 1000;
        const showDate = !prevMsg || new Date(msg.createdAt).toDateString() !== new Date(prevMsg.createdAt).toDateString();

        return (
          <MessageItem key={msg.id} msg={msg} isOwn={isOwn} showAvatar={showAvatar} showDate={showDate}
            onReaction={onReaction} onEdit={onEdit} onDelete={onDelete} onPin={onPin} onReply={onReply}
            onAvatarClick={handleAvatarClick} currentUserId={user?.id} socket={socket} channelId={channelId} />
        );
      })}

      {typingUsers.length > 0 && (
        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "4px 4px", marginTop: 4 }}>
          <div style={{ width: 36 }} />
          <div style={{ display: "flex", align: "center", gap: 6 }}>
            <div style={{ display: "flex", gap: 3, alignItems: "center" }}>
              {[0, 1, 2].map((i) => (
                <span key={i} style={{ width: 5, height: 5, borderRadius: "50%", background: "var(--text5)", display: "inline-block", animation: `bounce 1.2s ease-in-out ${i * 0.2}s infinite` }} />
              ))}
            </div>
            <span style={{ fontSize: 12, color: "var(--text5)", fontStyle: "italic" }}>
              {typingUsers.join(", ")} {typingUsers.length === 1 ? "is" : "are"} typing
            </span>
          </div>
        </div>
      )}

      <style>{`
        @keyframes bounce {
          0%, 60%, 100% { transform: translateY(0); }
          30% { transform: translateY(-4px); }
        }
      `}</style>

      <div ref={bottomRef} />

      {profilePopup && (
        <UserProfilePopup user={profilePopup.user} position={profilePopup.position} onClose={() => setProfilePopup(null)} />
      )}
    </div>
  );
};

export default MessageList;
