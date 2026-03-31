import { useState, useRef, useEffect } from "react";
import { Search, Users, Hash, Ban, BookOpen, X, Plus } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useTheme } from "../../context/ThemeContext.jsx";
import { useStory } from "../../context/StoryContext.jsx";
import { useAuth } from "../../context/AuthContext.jsx";
import StoryRing from "../story/StoryRing.jsx";

const SKINS = [
  {bg:"#FDDBB4",fg:"#8B5E3C"},{bg:"#F5C99A",fg:"#7A4A2A"},
  {bg:"#E8A87C",fg:"#6B3820"},{bg:"#C68642",fg:"#3E1F00"},
  {bg:"#8D5524",fg:"#FFD5A8"},{bg:"#4A2912",fg:"#F5C99A"},
  {bg:"#DBEAFE",fg:"#1D4ED8"},{bg:"#EDE9FE",fg:"#7C3AED"},
  {bg:"#FCE7F3",fg:"#BE185D"},{bg:"#D1FAE5",fg:"#065F46"},
];

const ChatHeader = ({
  channel, onlineCount, onToggleMembers, showMembers,
  onSearch, workspaceId, isOwner,
  onStoryOpen, onAddStory,
}) => {
  const navigate   = useNavigate();
  const { theme }  = useTheme();
  const { user, profile } = useAuth();
  const { allStories, myStories } = useStory();
  const isDark     = theme === "dark";
  const [showStories, setShowStories] = useState(false);
  const dropRef    = useRef(null);
  const btnRef     = useRef(null);

  const unseenCount = allStories.filter(g => !g.seen && !g.isMe).length;
  const skin = SKINS[profile?.skinIdx ?? 0] || SKINS[0];

  // Close on outside click
  useEffect(() => {
    if (!showStories) return;
    const fn = e => {
      if (!dropRef.current?.contains(e.target) && !btnRef.current?.contains(e.target))
        setShowStories(false);
    };
    document.addEventListener("mousedown", fn);
    return () => document.removeEventListener("mousedown", fn);
  }, [showStories]);

  const P = {
    bg:           isDark ? "#080B2A"                    : "#ffffff",
    border:       isDark ? "#1B3066"                    : "#c8c8dc",
    btnBgHover:   isDark ? "rgba(107,115,153,0.18)"     : "rgba(27,48,102,0.08)",
    btnBgActive:  isDark ? "rgba(107,115,153,0.22)"     : "rgba(27,48,102,0.12)",
    btnBorder:    isDark ? "rgba(107,115,153,0.35)"     : "rgba(27,48,102,0.2)",
    btnText:      isDark ? "#b8bdd8"                    : "#1B3066",
    btnTextHover: isDark ? "#F0F0F5"                    : "#080B2A",
    btnMuted:     isDark ? "#6B7399"                    : "#6B7399",
    dropBg:       isDark ? "#0D1035"                    : "#ffffff",
    dropBorder:   isDark ? "#1B3066"                    : "#c8c8dc",
    dropShadow:   isDark ? "0 16px 48px rgba(8,11,42,0.7)" : "0 8px 32px rgba(8,11,42,0.12)",
    nameMuted:    isDark ? "#6B7399"                    : "#6B7399",
    nameSeen:     isDark ? "#3d4670"                    : "#b0b0cc",
  };

  const btn = (active = false) => ({
    display: "flex", alignItems: "center", gap: 5,
    padding: "5px 11px", borderRadius: 8, fontSize: 12, fontWeight: 500,
    cursor: "pointer", transition: "all 0.15s",
    background: active ? P.btnBgActive : "transparent",
    border: `1px solid ${active ? P.btnBorder : "transparent"}`,
    color: active ? P.btnText : P.btnMuted,
  });

  const onHover = (e, override = {}) => {
    e.currentTarget.style.background  = override.bg   || P.btnBgHover;
    e.currentTarget.style.color       = override.text || P.btnTextHover;
    e.currentTarget.style.borderColor = override.bd   || P.btnBorder;
    e.currentTarget.style.transform   = "translateY(-1px)";
  };
  const onLeave = (e, active = false) => {
    e.currentTarget.style.background  = active ? P.btnBgActive : "transparent";
    e.currentTarget.style.color       = active ? P.btnText : P.btnMuted;
    e.currentTarget.style.borderColor = active ? P.btnBorder : "transparent";
    e.currentTarget.style.transform   = "none";
  };

  return (
    <div style={{ position: "relative", flexShrink: 0 }}>
      {/* Header bar */}
      <div style={{
        height: 48,
        borderBottom: `1px solid ${P.border}`,
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "0 18px",
        background: P.bg,
        boxShadow: isDark ? "0 1px 0 rgba(27,48,102,0.4)" : "0 1px 0 rgba(8,11,42,0.06)",
        animation: "fadeIn .2s ease both",
      }}>
        {/* Left */}
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{
            width: 24, height: 24, borderRadius: 6,
            background: isDark ? "rgba(27,48,102,0.5)" : "rgba(27,48,102,0.08)",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <Hash size={13} color={isDark ? "#6B7399" : "#1B3066"} strokeWidth={2} />
          </div>
          <span style={{ fontSize: 14, fontWeight: 600, color: isDark ? "#F0F0F5" : "#080B2A" }}>
            {channel?.name || "channel"}
          </span>
          {channel?.description && (
            <>
              <span style={{ width: 1, height: 16, background: P.border, margin: "0 4px" }} />
              <span style={{ fontSize: 12, color: P.btnMuted }}>{channel.description}</span>
            </>
          )}
        </div>

        {/* Right */}
        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
          {/* Online pill */}
          <div style={{
            display: "flex", alignItems: "center", gap: 5,
            padding: "4px 10px", borderRadius: 20, marginRight: 6,
            background: isDark ? "rgba(34,197,94,0.1)" : "rgba(34,197,94,0.08)",
            border: `1px solid ${isDark ? "rgba(34,197,94,0.2)" : "rgba(34,197,94,0.15)"}`,
          }}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#22c55e", flexShrink: 0 }} />
            <span style={{ fontSize: 11, fontWeight: 500, color: isDark ? "#4ade80" : "#16a34a" }}>
              {onlineCount} online
            </span>
          </div>

          {/* Stories button */}
          <button ref={btnRef}
            onClick={() => setShowStories(v => !v)}
            style={{ ...btn(showStories), position: "relative" }}
            onMouseEnter={e => onHover(e)}
            onMouseLeave={e => onLeave(e, showStories)}
          >
            <BookOpen size={12} />
            Stories
            {unseenCount > 0 && (
              <span style={{
                position: "absolute", top: -4, right: -4,
                minWidth: 14, height: 14, borderRadius: 7,
                background: "linear-gradient(135deg,#1B3066,#6B7399)",
                color: "#F0F0F5", fontSize: 8, fontWeight: 700,
                display: "flex", alignItems: "center", justifyContent: "center",
                padding: "0 3px",
                border: `2px solid ${P.bg}`,
              }}>
                {unseenCount}
              </span>
            )}
          </button>

          {/* Search */}
          <button style={btn(false)}
            onClick={onSearch}
            onMouseEnter={e => onHover(e)}
            onMouseLeave={e => onLeave(e)}>
            <Search size={12} /> Search
          </button>

          {/* Bans */}
          {isOwner && (
            <button style={btn(false)}
              onClick={() => navigate(`/bans/${workspaceId}`)}
              onMouseEnter={e => onHover(e, {
                bg:   isDark ? "rgba(239,68,68,0.1)"  : "rgba(239,68,68,0.06)",
                text: isDark ? "#fca5a5"               : "#dc2626",
                bd:   isDark ? "rgba(239,68,68,0.25)" : "rgba(239,68,68,0.2)",
              })}
              onMouseLeave={e => onLeave(e)}>
              <Ban size={12} /> Bans
            </button>
          )}

          {/* Members */}
          <button
            onClick={onToggleMembers}
            style={{
              ...btn(showMembers),
              background: showMembers ? P.btnBgActive : "transparent",
              border: `1px solid ${showMembers ? P.btnBorder : "transparent"}`,
            }}
            onMouseEnter={e => { if (!showMembers) onHover(e); }}
            onMouseLeave={e => onLeave(e, showMembers)}
          >
            <Users size={12} /> Members
          </button>
        </div>
      </div>

      {/* Story dropdown — slides down from header */}
      {showStories && (
        <div ref={dropRef} style={{
          position: "absolute", top: "100%", left: 0, right: 0,
          zIndex: 80,
          background: P.dropBg,
          borderBottom: `1px solid ${P.dropBorder}`,
          boxShadow: P.dropShadow,
          animation: "slideDown .22s cubic-bezier(0.22,1,0.36,1) both",
          overflow: "hidden",
        }}>
          {/* Top bar inside dropdown */}
          <div style={{
            display: "flex", alignItems: "center", justifyContent: "space-between",
            padding: "10px 16px 6px",
            borderBottom: `1px solid ${isDark ? "rgba(27,48,102,0.5)" : "#e8e8f0"}`,
          }}>
            <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: P.btnMuted }}>
              Stories
            </span>
            <div style={{ display: "flex", gap: 6 }}>
              <button onClick={() => { onAddStory?.(); setShowStories(false); }} style={{
                display: "flex", alignItems: "center", gap: 5,
                padding: "4px 10px", borderRadius: 8,
                background: "linear-gradient(135deg,#1B3066,#2a4080)",
                border: "none", color: "#F0F0F5", fontSize: 11, fontWeight: 600,
                cursor: "pointer", transition: "all .15s",
                boxShadow: "0 2px 8px rgba(27,48,102,0.4)",
              }}
                onMouseEnter={e => e.currentTarget.style.boxShadow = "0 4px 14px rgba(107,115,153,0.4)"}
                onMouseLeave={e => e.currentTarget.style.boxShadow = "0 2px 8px rgba(27,48,102,0.4)"}>
                <Plus size={10} /> Нэмэх
              </button>
              <button onClick={() => setShowStories(false)} style={{
                width: 24, height: 24, borderRadius: 6,
                background: isDark ? "rgba(107,115,153,0.15)" : "rgba(27,48,102,0.06)",
                border: "none", cursor: "pointer",
                display: "flex", alignItems: "center", justifyContent: "center",
                color: P.btnMuted, transition: "all .15s",
              }}
                onMouseEnter={e => { e.currentTarget.style.color = isDark ? "#F0F0F5" : "#080B2A"; }}
                onMouseLeave={e => { e.currentTarget.style.color = P.btnMuted; }}>
                <X size={12} />
              </button>
            </div>
          </div>

          {/* Story rings row */}
          <div style={{
            display: "flex", alignItems: "flex-start", gap: 16,
            padding: "12px 20px 14px",
            overflowX: "auto", scrollbarWidth: "none",
          }}>
            {/* My story */}
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6, flexShrink: 0 }}>
              <div style={{ position: "relative" }}>
                <StoryRing
                  user={{
                    id: String(user?.id),
                    initials: user?.username?.slice(0,2).toUpperCase() || "??",
                    bg: skin.bg, color: skin.fg,
                  }}
                  size={56}
                  hasStory={myStories.length > 0}
                  seen={true}
                  onClick={() => {
                    if (myStories.length > 0) {
                      onStoryOpen?.({ userId: String(user?.id) });
                    } else {
                      onAddStory?.();
                    }
                    setShowStories(false);
                  }}
                />
                {/* Add overlay if no story */}
                {myStories.length === 0 && (
                  <div style={{
                    position: "absolute", bottom: -2, right: -2,
                    width: 20, height: 20, borderRadius: "50%",
                    background: "linear-gradient(135deg,#1B3066,#6B7399)",
                    border: `2px solid ${P.dropBg}`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}>
                    <Plus size={9} color="#F0F0F5" />
                  </div>
                )}
              </div>
              <span style={{ fontSize: 10, fontWeight: 500, color: P.btnMuted, textAlign: "center" }}>
                {myStories.length > 0 ? "Минийх" : "Нэмэх"}
              </span>
            </div>

            {/* Divider */}
            <div style={{ width: 1, height: 70, background: P.dropBorder, flexShrink: 0, alignSelf: "center" }} />

            {/* Other stories */}
            {allStories.filter(g => !g.isMe).map(group => (
              <div key={group.userId} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6, flexShrink: 0, cursor: "pointer" }}
                onClick={() => { onStoryOpen?.({ userId: group.userId }); setShowStories(false); }}>
                <div style={{ position: "relative" }}>
                  <StoryRing
                    user={{ id: group.userId, initials: group.userInitials, bg: group.userBg, color: group.userColor }}
                    size={56}
                    hasStory={true}
                    seen={group.seen}
                    onClick={() => {}}
                  />
                  {/* Unseen pulse dot */}
                  {!group.seen && (
                    <span style={{
                      position: "absolute", top: 2, right: 2,
                      width: 10, height: 10, borderRadius: "50%",
                      background: "linear-gradient(135deg,#1B3066,#6B7399)",
                      border: `2px solid ${P.dropBg}`,
                    }} />
                  )}
                </div>
                <span style={{
                  fontSize: 10, fontWeight: 500, maxWidth: 56,
                  overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                  textAlign: "center",
                  color: group.seen ? P.nameSeen : (isDark ? "#b8bdd8" : "#1B3066"),
                }}>
                  {group.userName.split(" ")[0]}
                </span>
              </div>
            ))}

            {allStories.filter(g => !g.isMe).length === 0 && (
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", flex: 1, padding: "8px 0" }}>
                <p style={{ fontSize: 12, color: P.btnMuted }}>Хэн ч story нийтлээгүй байна</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatHeader;
