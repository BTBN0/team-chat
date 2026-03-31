export default function StoryRing({ user, size = 36, seen = false, hasStory = false, onClick }) {
  const pad = hasStory ? 4 : 0;
  const outer = size + pad * 2;
  const uid = `sr-${user?.id || Math.random().toString(36).slice(2)}-${size}`;

  return (
    <button onClick={onClick} style={{
      width: outer, height: outer, flexShrink: 0,
      background: "none", border: "none", padding: 0, cursor: "pointer",
      transition: "transform .15s ease",
    }}
      onMouseEnter={e => { if (hasStory) e.currentTarget.style.transform = "scale(1.1)"; }}
      onMouseLeave={e => e.currentTarget.style.transform = "scale(1)"}
    >
      <svg width={outer} height={outer} viewBox={`0 0 ${outer} ${outer}`} style={{ display: "block" }}>
        <defs>
          {/* Unseen: vibrant navy→slate gradient */}
          <linearGradient id={`unseen-${uid}`} x1="0%" y1="100%" x2="100%" y2="0%">
            <stop offset="0%"   stopColor="#1B3066"/>
            <stop offset="50%"  stopColor="#6B7399"/>
            <stop offset="100%" stopColor="#b8bdd8"/>
          </linearGradient>
          <clipPath id={`clip-${uid}`}>
            <circle cx={outer/2} cy={outer/2} r={size/2 - 1}/>
          </clipPath>
        </defs>

        {/* UNSEEN ring — thick, gradient, glowing */}
        {hasStory && !seen && (
          <>
            <circle cx={outer/2} cy={outer/2} r={outer/2 - 1}
              fill="none" stroke={`url(#unseen-${uid})`} strokeWidth="3"
              strokeDasharray="0" opacity="1"/>
            {/* Glow effect */}
            <circle cx={outer/2} cy={outer/2} r={outer/2 - 1}
              fill="none" stroke="#6B7399" strokeWidth="5" opacity="0.2"/>
          </>
        )}

        {/* SEEN ring — thin, muted */}
        {hasStory && seen && (
          <circle cx={outer/2} cy={outer/2} r={outer/2 - 1.5}
            fill="none" stroke="rgba(107,115,153,0.28)" strokeWidth="1.5"
            strokeDasharray="4 2"/>
        )}

        {/* Gap between ring and avatar */}
        {hasStory && (
          <circle cx={outer/2} cy={outer/2} r={size/2 + 0.5} fill="var(--surface, #0D1035)"/>
        )}

        {/* Avatar background */}
        <circle cx={outer/2} cy={outer/2}
          r={size/2 - (hasStory ? 1 : 0)}
          fill={user?.bg || "#111540"}
          clipPath={`url(#clip-${uid})`}/>

        {/* Initials */}
        <text x={outer/2} y={outer/2}
          textAnchor="middle" dominantBaseline="central"
          fontSize={size * 0.36} fontWeight="700"
          fill={user?.color || "#F0F0F5"}
          style={{ userSelect:"none", pointerEvents:"none", fontFamily:"system-ui,sans-serif" }}>
          {user?.initials || user?.username?.slice(0,2).toUpperCase() || "?"}
        </text>
      </svg>
    </button>
  );
}
