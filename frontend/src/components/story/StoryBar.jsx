import { useRef } from "react";
import { useAuth } from "../../context/AuthContext.jsx";
import { useStory } from "../../context/StoryContext.jsx";
import { useTheme } from "../../context/ThemeContext.jsx";
import StoryRing from "./StoryRing.jsx";

const SKINS = [
  {bg:"#FDDBB4",fg:"#8B5E3C"},{bg:"#F5C99A",fg:"#7A4A2A"},
  {bg:"#E8A87C",fg:"#6B3820"},{bg:"#C68642",fg:"#3E1F00"},
  {bg:"#8D5524",fg:"#FFD5A8"},{bg:"#4A2912",fg:"#F5C99A"},
  {bg:"#DBEAFE",fg:"#1D4ED8"},{bg:"#EDE9FE",fg:"#7C3AED"},
  {bg:"#FCE7F3",fg:"#BE185D"},{bg:"#D1FAE5",fg:"#065F46"},
];

export default function StoryBar({ onStoryOpen, onAddStory }) {
  const { user, profile } = useAuth();
  const { allStories, myStories } = useStory();
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const scrollRef = useRef(null);

  const skin = SKINS[profile?.skinIdx ?? 0] || SKINS[0];
  const hasMyStory = myStories.length > 0;

  const P = {
    bg:     isDark ? "#0D1035"  : "#ffffff",
    border: isDark ? "#1B3066"  : "#c8c8dc",
    text:   isDark ? "#b8bdd8"  : "#1B3066",
    muted:  isDark ? "#6B7399"  : "#6B7399",
    add:    isDark ? "#1B3066"  : "#080B2A",
  };

  return (
    <div style={{
      flexShrink: 0,
      borderBottom: `1px solid ${P.border}`,
      background: P.bg,
    }}>
      <div
        ref={scrollRef}
        style={{
          display: "flex", alignItems: "center", gap: 16,
          padding: "10px 16px",
          overflowX: "auto", scrollbarWidth: "none",
        }}
      >
        {/* My story / Add button */}
        <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:5, flexShrink:0 }}>
          <div style={{ position:"relative" }}>
            <StoryRing
              user={{
                id: String(user?.id),
                initials: user?.username?.slice(0,2).toUpperCase() || "??",
                bg: skin.bg, color: skin.fg,
              }}
              size={52}
              hasStory={hasMyStory}
              seen={true}
              onClick={() => hasMyStory
                ? onStoryOpen({ userId: String(user?.id) })
                : onAddStory()
              }
            />
            {!hasMyStory && (
              <div style={{
                position:"absolute", bottom:-2, right:-2,
                width:20, height:20, borderRadius:"50%",
                background:"linear-gradient(135deg,#1B3066,#6B7399)",
                border:`2px solid ${P.bg}`,
                display:"flex", alignItems:"center", justifyContent:"center",
              }}>
                <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3">
                  <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
                </svg>
              </div>
            )}
          </div>
          <span style={{ fontSize:10, color:P.muted, fontWeight:500 }}>
            {hasMyStory ? "Минийх" : "Нэмэх"}
          </span>
        </div>

        {/* Divider */}
        {allStories.filter(g => !g.isMe).length > 0 && (
          <div style={{ width:1, height:44, background:P.border, flexShrink:0 }}/>
        )}

        {/* Other stories */}
        {allStories.filter(g => !g.isMe).map(group => (
          <div key={group.userId} style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:5, flexShrink:0 }}>
            <StoryRing
              user={{
                id: group.userId,
                initials: group.userInitials,
                bg: group.userBg, color: group.userColor,
              }}
              size={52}
              hasStory={true}
              seen={group.seen}
              onClick={() => onStoryOpen({ userId: group.userId })}
            />
            <span style={{
              fontSize:10, fontWeight:500,
              color: group.seen ? P.muted : P.text,
              maxWidth:52, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap",
            }}>
              {group.userName.split(" ")[0]}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
