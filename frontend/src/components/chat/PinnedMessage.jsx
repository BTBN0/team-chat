import { Pin, X } from "lucide-react";

const PinnedMessage = ({ messages, onUnpin }) => {
  if (!messages || messages.length === 0) return null;
  const latest = messages[0];

  return (
    <div style={{ padding: "7px 18px", background: "var(--surface)", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
      <Pin size={12} color="var(--text5)" style={{ flexShrink: 0 }} />
      <div style={{ flex: 1, minWidth: 0, display: "flex", alignItems: "center", gap: 6 }}>
        <span style={{ fontSize: 12, fontWeight: 500, color: "var(--text3)", whiteSpace: "nowrap" }}>
          {latest.user?.username}:
        </span>
        <span style={{ fontSize: 12, color: "var(--text4)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {latest.content || "Attachment"}
        </span>
        {messages.length > 1 && (
          <span style={{ fontSize: 11, color: "var(--text5)", whiteSpace: "nowrap" }}>+{messages.length - 1} more</span>
        )}
      </div>
      <button onClick={() => onUnpin(latest)}
        style={{ width: 20, height: 20, display: "flex", alignItems: "center", justifyContent: "center", background: "none", border: "none", cursor: "pointer", color: "var(--text5)", borderRadius: 4, transition: "all 0.15s", flexShrink: 0 }}
        onMouseEnter={(e) => { e.currentTarget.style.color = "var(--text)"; e.currentTarget.style.background = "var(--surface2)"; }}
        onMouseLeave={(e) => { e.currentTarget.style.color = "var(--text5)"; e.currentTarget.style.background = "none"; }}>
        <X size={11} />
      </button>
    </div>
  );
};

export default PinnedMessage;
