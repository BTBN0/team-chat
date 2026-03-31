import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Hash, Plus, Volume2, Lock } from "lucide-react";
import api from "../../api/axios.js";

const ChannelList = ({ channels, setChannels }) => {
  const navigate = useNavigate();
  const { channelId, workspaceId } = useParams();
  const [showCreate, setShowCreate] = useState(false);
  const [newChannelName, setNewChannelName] = useState("");
  const [creating, setCreating] = useState(false);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!newChannelName.trim()) return;
    setCreating(true);
    try {
      const res = await api.post("/channels", { name: newChannelName.trim(), workspaceId });
      setChannels((prev) => [...prev, res.data.data]);
      setNewChannelName("");
      setShowCreate(false);
      navigate(`/chat/${workspaceId}/${res.data.data.id}`);
    } catch (err) {
      console.error(err);
    } finally {
      setCreating(false);
    }
  };

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "4px 8px", marginBottom: 2 }}>
        <span style={{ fontSize: 10, fontWeight: 600, color: "var(--text5)", letterSpacing: "0.6px", textTransform: "uppercase" }}>Channels</span>
        <button
          onClick={() => setShowCreate((p) => !p)}
          title="New channel"
          style={{ width: 18, height: 18, display: "flex", alignItems: "center", justifyContent: "center", background: "none", border: "none", cursor: "pointer", color: "var(--text5)", borderRadius: 4, transition: "all 0.15s" }}
          onMouseEnter={(e) => { e.currentTarget.style.color = "var(--text)"; e.currentTarget.style.background = "var(--surface2)"; }}
          onMouseLeave={(e) => { e.currentTarget.style.color = "var(--text5)"; e.currentTarget.style.background = "none"; }}
        >
          <Plus size={12} />
        </button>
      </div>

      {showCreate && (
        <form onSubmit={handleCreate} style={{ marginBottom: 8, padding: "0 4px" }}>
          <input
            autoFocus
            type="text"
            value={newChannelName}
            onChange={(e) => setNewChannelName(e.target.value)}
            onKeyDown={(e) => e.key === "Escape" && setShowCreate(false)}
            placeholder="channel-name"
            style={{ width: "100%", background: "var(--surface2)", border: "1px solid var(--border2)", borderRadius: 7, padding: "6px 10px", color: "var(--text)", fontSize: 12, outline: "none" }}
            onFocus={(e) => e.target.style.borderColor = "var(--text5)"}
            onBlur={(e) => e.target.style.borderColor = "var(--border2)"}
          />
          <div style={{ display: "flex", gap: 4, marginTop: 4 }}>
            <button type="submit" disabled={creating}
              style={{ flex: 1, padding: "5px", background: "var(--text)", border: "none", borderRadius: 6, color: "var(--bg)", fontSize: 11, fontWeight: 600, cursor: "pointer" }}>
              {creating ? "..." : "Create"}
            </button>
            <button type="button" onClick={() => setShowCreate(false)}
              style={{ flex: 1, padding: "5px", background: "var(--surface3)", border: "none", borderRadius: 6, color: "var(--text4)", fontSize: 11, cursor: "pointer" }}>
              Cancel
            </button>
          </div>
        </form>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 1 }}>
        {channels.map((ch) => {
          const isActive = ch.id === channelId;
          return (
            <button
              key={ch.id}
              onClick={() => navigate(`/chat/${workspaceId}/${ch.id}`)}
              style={{ display: "flex", alignItems: "center", gap: 7, padding: "5px 8px", borderRadius: 7, border: "none", background: isActive ? "rgba(27,48,102,0.5)" : "transparent", cursor: "pointer", textAlign: "left", width: "100%", transition: "all 0.15s", borderLeft: isActive ? "2px solid #6B7399" : "2px solid transparent" }}
              onMouseEnter={(e) => { if (!isActive) { e.currentTarget.style.background = "rgba(107,115,153,0.12)"; e.currentTarget.style.borderLeft = "2px solid rgba(107,115,153,0.5)"; } }}
              onMouseLeave={(e) => { if (!isActive) { e.currentTarget.style.background = "transparent"; e.currentTarget.style.borderLeft = "2px solid transparent"; } }}
            >
              <Hash size={13} color={isActive ? "var(--text3)" : "var(--text5)"} strokeWidth={2} />
              <span style={{ fontSize: 13, fontWeight: isActive ? 500 : 400, color: isActive ? "var(--text)" : "var(--text4)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {ch.name}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default ChannelList;
