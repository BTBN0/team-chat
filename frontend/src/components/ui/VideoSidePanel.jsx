import { useEffect, useRef, useState } from "react";
import { Mic, MicOff, Video, VideoOff, Monitor, MonitorOff, PhoneOff, Phone, Maximize2, Minimize2, X } from "lucide-react";

// Standalone video element that properly reacts to stream changes
const VideoEl = ({ stream, muted, mirror = false, contain = false }) => {
  const ref = useRef(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (stream) {
      el.srcObject = stream;
      el.play().catch(() => {});
    } else {
      el.srcObject = null;
    }
  }, [stream]);

  return (
    <video
      ref={ref}
      autoPlay
      playsInline
      muted={muted}
      style={{
        width: "100%",
        height: "100%",
        objectFit: contain ? "contain" : "cover",
        transform: mirror ? "scaleX(-1)" : "none",
        display: "block",
        background: "#000",
      }}
    />
  );
};

const ParticipantTile = ({ stream, label, muted = false, isLocal = false, isCameraOff = false, isScreenShare = false }) => {
  const gradients = [
    "linear-gradient(135deg,#3b82f6,#6366f1)",
    "linear-gradient(135deg,#8b5cf6,#ec4899)",
    "linear-gradient(135deg,#06b6d4,#3b82f6)",
    "linear-gradient(135deg,#10b981,#06b6d4)",
    "linear-gradient(135deg,#f59e0b,#ef4444)",
    "linear-gradient(135deg,#ec4899,#f43f5e)",
  ];
  const gradient = gradients[(label?.charCodeAt(0) || 0) % gradients.length];

  const hasVideo = stream &&
    stream.getVideoTracks().length > 0 &&
    stream.getVideoTracks()[0].readyState === "live" &&
    !(isLocal && isCameraOff);

  return (
    <div style={{ position: "relative", background: "#111", borderRadius: 10, overflow: "hidden", aspectRatio: "16/9", display: "flex", alignItems: "center", justifyContent: "center", border: "1px solid rgba(255,255,255,0.06)", width: "100%" }}>
      {hasVideo ? (
        <VideoEl stream={stream} muted={muted} mirror={isLocal && !isScreenShare} contain={isScreenShare} />
      ) : (
        <>
          {stream && <VideoEl stream={stream} muted={muted} mirror={false} />}
          <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 8, background: "#111" }}>
            <div style={{ width: 44, height: 44, borderRadius: "50%", background: label ? gradient : "#333", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, fontWeight: 700, color: "#fff" }}>
              {label ? label[0].toUpperCase() : "?"}
            </div>
            <span style={{ fontSize: 11, color: "rgba(255,255,255,0.35)" }}>
              {isCameraOff ? "Camera off" : stream ? "Audio only" : "Connecting..."}
            </span>
          </div>
        </>
      )}
      {label && (
        <div style={{ position: "absolute", bottom: 7, left: 9, fontSize: 10, fontWeight: 500, color: "rgba(255,255,255,0.9)", background: "rgba(0,0,0,0.6)", padding: "2px 8px", borderRadius: 20, backdropFilter: "blur(4px)", zIndex: 2 }}>
          {label}{isLocal ? " (you)" : ""}
        </div>
      )}
    </div>
  );
};

const ScreenTile = ({ screenStream, large = false }) => {
  const ref = useRef(null);
  useEffect(() => {
    if (ref.current && screenStream) {
      ref.current.srcObject = screenStream;
      ref.current.play().catch(() => {});
    }
  }, [screenStream]);

  return (
    <div style={{ position: "relative", background: "#000", borderRadius: large ? 0 : 10, overflow: "hidden", flex: large ? 1 : "none", aspectRatio: large ? "auto" : "16/9", minHeight: large ? 0 : "auto", display: "flex", alignItems: "center", justifyContent: "center", border: large ? "none" : "1px solid rgba(255,255,255,0.08)", width: "100%" }}>
      <video ref={ref} autoPlay playsInline muted style={{ width: "100%", height: "100%", objectFit: "contain", display: "block" }} />
      <div style={{ position: "absolute", top: 8, right: 8, fontSize: 10, fontWeight: 600, color: "#fff", background: "rgba(34,197,94,0.85)", padding: "3px 9px", borderRadius: 20 }}>Sharing screen</div>
    </div>
  );
};

const CtrlBtn = ({ onClick, active, danger, title, children, size = 36 }) => (
  <button onClick={onClick} title={title}
    style={{ width: size, height: size, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", border: "none", cursor: "pointer", transition: "all 0.15s", background: danger ? "rgba(239,68,68,0.85)" : active ? "rgba(255,255,255,0.15)" : "rgba(255,255,255,0.1)", color: "#fff", flexShrink: 0 }}
    onMouseEnter={(e) => { e.currentTarget.style.background = danger ? "#ef4444" : "rgba(255,255,255,0.25)"; }}
    onMouseLeave={(e) => { e.currentTarget.style.background = danger ? "rgba(239,68,68,0.85)" : active ? "rgba(255,255,255,0.15)" : "rgba(255,255,255,0.1)"; }}>
    {children}
  </button>
);

const VideoSidePanel = ({
  inCall, localStream, screenStream, localUser, participants,
  isMuted, isCameraOff, isScreenSharing,
  onJoinAudio, onJoinVideo, onLeave, onToggleMute, onToggleCamera, onToggleScreen,
}) => {
  const [fullscreen, setFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const controlTimeout = useRef(null);

  useEffect(() => {
    if (isScreenSharing) setFullscreen(true);
    else setFullscreen(false);
  }, [isScreenSharing]);

  const resetTimer = () => {
    setShowControls(true);
    clearTimeout(controlTimeout.current);
    controlTimeout.current = setTimeout(() => setShowControls(false), 3000);
  };

  useEffect(() => {
    if (fullscreen) resetTimer();
    return () => clearTimeout(controlTimeout.current);
  }, [fullscreen]);

  const allInCall = [
    ...(localStream ? [{ socketId: "local", username: localUser?.username || "You", stream: localStream, isLocal: true }] : []),
    ...participants,
  ];

  return (
    <>
      {/* Fullscreen */}
      {fullscreen && inCall && (
        <div onMouseMove={resetTimer}
          style={{ position: "fixed", inset: 0, zIndex: 200, background: "#000", display: "flex", flexDirection: "column" }}>
          <div style={{ flex: 1, minHeight: 0, display: "flex" }}>
            {isScreenSharing && screenStream ? (
              <ScreenTile screenStream={screenStream} large />
            ) : participants[0]?.stream ? (
              <div style={{ flex: 1 }}>
                <ParticipantTile stream={participants[0].stream} label={participants[0].username} />
              </div>
            ) : (
              <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 12, color: "rgba(255,255,255,0.3)" }}>
                <div style={{ fontSize: 48 }}>👥</div>
                <p style={{ fontSize: 14 }}>Waiting for participants...</p>
              </div>
            )}
          </div>

          {/* Strip */}
          <div style={{ height: 130, background: "rgba(0,0,0,0.9)", display: "flex", alignItems: "center", gap: 8, padding: "0 16px", overflowX: "auto", flexShrink: 0, borderTop: "1px solid rgba(255,255,255,0.05)" }}>
            {allInCall.map((p) => (
              <div key={p.socketId} style={{ width: 180, flexShrink: 0 }}>
                <ParticipantTile stream={p.stream} label={p.username} muted={p.isLocal} isLocal={p.isLocal} isCameraOff={p.isLocal && isCameraOff} />
              </div>
            ))}
          </div>

          {/* Controls */}
          <div style={{ position: "absolute", bottom: 146, left: "50%", transform: "translateX(-50%)", display: "flex", alignItems: "center", gap: 10, background: "rgba(0,0,0,0.8)", padding: "12px 20px", borderRadius: 40, backdropFilter: "blur(16px)", transition: "opacity 0.3s", opacity: showControls ? 1 : 0, pointerEvents: showControls ? "auto" : "none" }}>
            <CtrlBtn onClick={onToggleMute} active={isMuted} title={isMuted ? "Unmute" : "Mute"} size={46}>{isMuted ? <MicOff size={18} /> : <Mic size={18} />}</CtrlBtn>
            <CtrlBtn onClick={onToggleCamera} active={isCameraOff} title={isCameraOff ? "Camera on" : "Camera off"} size={46}>{isCameraOff ? <VideoOff size={18} /> : <Video size={18} />}</CtrlBtn>
            <CtrlBtn onClick={onToggleScreen} active={isScreenSharing} title={isScreenSharing ? "Stop sharing" : "Share screen"} size={46}>{isScreenSharing ? <MonitorOff size={18} /> : <Monitor size={18} />}</CtrlBtn>
            <CtrlBtn onClick={onLeave} danger title="Leave call" size={46}><PhoneOff size={18} /></CtrlBtn>
            <div style={{ width: 1, height: 26, background: "rgba(255,255,255,0.15)", margin: "0 4px" }} />
            <CtrlBtn onClick={() => setFullscreen(false)} title="Exit fullscreen" size={46}><Minimize2 size={18} /></CtrlBtn>
          </div>

          <button onClick={() => setFullscreen(false)} style={{ position: "absolute", top: 14, right: 14, width: 34, height: 34, borderRadius: "50%", background: "rgba(255,255,255,0.1)", border: "none", cursor: "pointer", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", opacity: showControls ? 1 : 0, transition: "opacity 0.3s" }}>
            <X size={15} />
          </button>
        </div>
      )}

      {/* Side panel */}
      <div style={{ width: 230, background: "var(--surface)", borderLeft: "1px solid var(--border)", display: "flex", flexDirection: "column", flexShrink: 0 }}>
        <div style={{ padding: "11px 14px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            {inCall && <span style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--green)", animation: "vsp 1.5s infinite" }} />}
            <h3 style={{ fontSize: 12, fontWeight: 600, color: "var(--text)" }}>
              {inCall ? `Voice · ${allInCall.length}` : "Voice & Video"}
            </h3>
          </div>
          <div style={{ display: "flex", gap: 4 }}>
            {inCall ? (
              <button onClick={() => setFullscreen(true)} title="Fullscreen"
                style={{ width: 24, height: 24, display: "flex", alignItems: "center", justifyContent: "center", background: "none", border: "none", cursor: "pointer", color: "var(--text5)", borderRadius: 5, transition: "all 0.15s" }}
                onMouseEnter={(e) => { e.currentTarget.style.color = "var(--text)"; e.currentTarget.style.background = "var(--surface2)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.color = "var(--text5)"; e.currentTarget.style.background = "none"; }}>
                <Maximize2 size={12} />
              </button>
            ) : (
              <>
                <button onClick={onJoinAudio} title="Join audio"
                  style={{ width: 26, height: 26, display: "flex", alignItems: "center", justifyContent: "center", background: "var(--surface2)", border: "1px solid var(--border2)", borderRadius: 6, cursor: "pointer", color: "var(--text4)", transition: "all 0.15s" }}
                  onMouseEnter={(e) => { e.currentTarget.style.color = "var(--text)"; e.currentTarget.style.borderColor = "var(--text5)"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.color = "var(--text4)"; e.currentTarget.style.borderColor = "var(--border2)"; }}>
                  <Phone size={12} />
                </button>
                <button onClick={onJoinVideo} title="Join video"
                  style={{ width: 26, height: 26, display: "flex", alignItems: "center", justifyContent: "center", background: "var(--surface2)", border: "1px solid var(--border2)", borderRadius: 6, cursor: "pointer", color: "var(--text4)", transition: "all 0.15s" }}
                  onMouseEnter={(e) => { e.currentTarget.style.color = "var(--text)"; e.currentTarget.style.borderColor = "var(--text5)"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.color = "var(--text4)"; e.currentTarget.style.borderColor = "var(--border2)"; }}>
                  <Video size={12} />
                </button>
              </>
            )}
          </div>
        </div>

        <div style={{ flex: 1, overflowY: "auto", padding: "8px", display: "flex", flexDirection: "column", gap: 8 }}>
          {!inCall ? (
            <div style={{ textAlign: "center", padding: "32px 0", color: "var(--text5)" }}>
              <Phone size={22} style={{ margin: "0 auto 8px", opacity: 0.3 }} />
              <p style={{ fontSize: 12, marginBottom: 4 }}>No one in call</p>
              <p style={{ fontSize: 11 }}>Click 📞 or 📹 to join</p>
            </div>
          ) : (
            <>
              {isScreenSharing && screenStream && <ScreenTile screenStream={screenStream} />}
              {allInCall.map((p) => (
                <ParticipantTile
                  key={p.socketId}
                  stream={p.stream}
                  label={p.username}
                  muted={p.isLocal}
                  isLocal={p.isLocal}
                  isCameraOff={p.isLocal && isCameraOff}
                />
              ))}
            </>
          )}
        </div>

        {inCall && (
          <div style={{ padding: "10px 8px", borderTop: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
            <CtrlBtn onClick={onToggleMute} active={isMuted} title={isMuted ? "Unmute" : "Mute"} size={34}>{isMuted ? <MicOff size={13} /> : <Mic size={13} />}</CtrlBtn>
            <CtrlBtn onClick={onToggleCamera} active={isCameraOff} title={isCameraOff ? "Camera on" : "Camera off"} size={34}>{isCameraOff ? <VideoOff size={13} /> : <Video size={13} />}</CtrlBtn>
            <CtrlBtn onClick={onToggleScreen} active={isScreenSharing} title={isScreenSharing ? "Stop sharing" : "Share screen"} size={34}>{isScreenSharing ? <MonitorOff size={13} /> : <Monitor size={13} />}</CtrlBtn>
            <CtrlBtn onClick={onLeave} danger title="Leave call" size={34}><PhoneOff size={13} /></CtrlBtn>
          </div>
        )}
      </div>
      <style>{`@keyframes vsp { 0%,100%{opacity:1} 50%{opacity:0.4} }`}</style>
    </>
  );
};

export default VideoSidePanel;
