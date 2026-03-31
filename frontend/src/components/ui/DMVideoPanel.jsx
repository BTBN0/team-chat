import { useEffect, useRef, useState } from "react";
import { Mic, MicOff, Video, VideoOff, Monitor, MonitorOff, PhoneOff, Maximize2, Minimize2, X } from "lucide-react";

const VideoTile = ({ stream, label, muted = false, isLocal = false, isCameraOff = false, isScreenSharing = false, large = false }) => {
  const videoRef = useRef(null);

  useEffect(() => {
    if (videoRef.current && stream) videoRef.current.srcObject = stream;
  }, [stream]);

  const hasVideo = stream && stream.getVideoTracks().length > 0;

  return (
    <div style={{ position: "relative", background: "#000", borderRadius: large ? 0 : 10, overflow: "hidden", aspectRatio: large ? "auto" : "16/9", flex: large ? 1 : "none", minHeight: large ? 0 : "auto", display: "flex", alignItems: "center", justifyContent: "center", border: large ? "none" : "1px solid var(--border)" }}>
      {hasVideo && !isCameraOff ? (
        <video ref={videoRef} autoPlay playsInline muted={muted}
          style={{ width: "100%", height: "100%", objectFit: isScreenSharing ? "contain" : "cover", transform: isLocal && !isScreenSharing ? "scaleX(-1)" : "none" }} />
      ) : (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
          <div style={{ width: large ? 56 : 36, height: large ? 56 : 36, borderRadius: "50%", background: "var(--surface3)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: large ? 24 : 16 }}>👤</div>
          <span style={{ fontSize: large ? 13 : 10, color: "var(--text5)" }}>{isCameraOff ? "Camera off" : "No video"}</span>
        </div>
      )}
      {label && (
        <div style={{ position: "absolute", bottom: 8, left: 10, fontSize: 11, fontWeight: 500, color: "rgba(255,255,255,0.9)", background: "rgba(0,0,0,0.6)", padding: "3px 9px", borderRadius: 20, backdropFilter: "blur(4px)" }}>
          {label}{isLocal ? " (you)" : ""}
        </div>
      )}
      {isScreenSharing && (
        <div style={{ position: "absolute", top: 8, right: 8, fontSize: 10, fontWeight: 600, color: "#fff", background: "rgba(34,197,94,0.85)", padding: "3px 9px", borderRadius: 20 }}>Screen</div>
      )}
    </div>
  );
};

const CtrlBtn = ({ onClick, active, danger, title, children, size = 36 }) => (
  <button onClick={onClick} title={title}
    style={{ width: size, height: size, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", border: "none", cursor: "pointer", transition: "all 0.15s", background: danger ? "rgba(239,68,68,0.85)" : active ? "rgba(255,255,255,0.15)" : "rgba(255,255,255,0.08)", color: "#fff", flexShrink: 0 }}
    onMouseEnter={(e) => { e.currentTarget.style.background = danger ? "#ef4444" : "rgba(255,255,255,0.25)"; }}
    onMouseLeave={(e) => { e.currentTarget.style.background = danger ? "rgba(239,68,68,0.85)" : active ? "rgba(255,255,255,0.15)" : "rgba(255,255,255,0.08)"; }}>
    {children}
  </button>
);

const DMVideoPanel = ({
  inCall,
  localStream,
  remoteStream,
  localUser,
  remoteUser,
  isMuted,
  isCameraOff,
  isScreenSharing,
  callStatus,
  onToggleMute,
  onToggleCamera,
  onToggleScreen,
  onEndCall,
}) => {
  const [fullscreen, setFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const controlTimeout = useRef(null);

  // Auto fullscreen when screen sharing
  useEffect(() => {
    if (isScreenSharing) setFullscreen(true);
  }, [isScreenSharing]);

  const handleMouseMove = () => {
    setShowControls(true);
    clearTimeout(controlTimeout.current);
    controlTimeout.current = setTimeout(() => setShowControls(false), 3000);
  };

  if (!inCall) return null;

  // Fullscreen mode
  if (fullscreen) {
    return (
      <div onMouseMove={handleMouseMove}
        style={{ position: "fixed", inset: 0, zIndex: 200, background: "#000", display: "flex", flexDirection: "column" }}>
        {/* Main video — remote or screen share */}
        <div style={{ flex: 1, minHeight: 0, display: "flex" }}>
          <VideoTile
            stream={remoteStream || localStream}
            label={remoteStream ? (remoteUser?.username || "Remote") : (localUser?.username || "You")}
            muted={!remoteStream}
            isLocal={!remoteStream}
            isScreenSharing={isScreenSharing}
            large
          />
        </div>

        {/* PiP — local tile when remote exists */}
        {remoteStream && localStream && (
          <div style={{ position: "absolute", bottom: 80, right: 16, width: 180, borderRadius: 10, overflow: "hidden", boxShadow: "0 8px 24px rgba(0,0,0,0.6)", border: "1px solid rgba(255,255,255,0.1)" }}>
            <VideoTile stream={localStream} label={localUser?.username || "You"} muted isLocal isCameraOff={isCameraOff} isScreenSharing={false} />
          </div>
        )}

        {/* Controls */}
        <div style={{ position: "absolute", bottom: 20, left: "50%", transform: "translateX(-50%)", display: "flex", alignItems: "center", gap: 10, background: "rgba(0,0,0,0.7)", padding: "10px 16px", borderRadius: 30, backdropFilter: "blur(12px)", transition: "opacity 0.3s", opacity: showControls ? 1 : 0 }}>
          <CtrlBtn onClick={onToggleMute} active={isMuted} title={isMuted ? "Unmute" : "Mute"} size={42}>
            {isMuted ? <MicOff size={16} /> : <Mic size={16} />}
          </CtrlBtn>
          <CtrlBtn onClick={onToggleCamera} active={isCameraOff} title={isCameraOff ? "Camera on" : "Camera off"} size={42}>
            {isCameraOff ? <VideoOff size={16} /> : <Video size={16} />}
          </CtrlBtn>
          <CtrlBtn onClick={onToggleScreen} active={isScreenSharing} title={isScreenSharing ? "Stop sharing" : "Share screen"} size={42}>
            {isScreenSharing ? <MonitorOff size={16} /> : <Monitor size={16} />}
          </CtrlBtn>
          <CtrlBtn onClick={onEndCall} danger title="End call" size={42}>
            <PhoneOff size={16} />
          </CtrlBtn>
          <div style={{ width: 1, height: 24, background: "rgba(255,255,255,0.2)", margin: "0 2px" }} />
          <CtrlBtn onClick={() => setFullscreen(false)} title="Exit fullscreen" size={42}>
            <Minimize2 size={16} />
          </CtrlBtn>
        </div>

        {/* Top right close */}
        <button onClick={() => setFullscreen(false)}
          style={{ position: "absolute", top: 16, right: 16, width: 34, height: 34, borderRadius: "50%", background: "rgba(255,255,255,0.1)", border: "none", cursor: "pointer", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", opacity: showControls ? 1 : 0, transition: "opacity 0.3s" }}>
          <X size={15} />
        </button>
      </div>
    );
  }

  // Side panel mode
  return (
    <div style={{ width: 240, background: "var(--surface)", borderLeft: "1px solid var(--border)", display: "flex", flexDirection: "column", flexShrink: 0 }}>
      <div style={{ padding: "12px 14px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{ width: 6, height: 6, borderRadius: "50%", background: callStatus === "active" ? "var(--green)" : "#fbbf24", animation: "pulse 1.5s infinite" }} />
          <h3 style={{ fontSize: 12, fontWeight: 600, color: "var(--text)" }}>
            {callStatus === "calling" ? "Calling..." : callStatus === "active" ? "In call" : "Connecting..."}
          </h3>
        </div>
        <button onClick={() => setFullscreen(true)} title="Fullscreen"
          style={{ width: 24, height: 24, display: "flex", alignItems: "center", justifyContent: "center", background: "none", border: "none", cursor: "pointer", color: "var(--text5)", borderRadius: 5, transition: "all 0.15s" }}
          onMouseEnter={(e) => { e.currentTarget.style.color = "var(--text)"; e.currentTarget.style.background = "var(--surface2)"; }}
          onMouseLeave={(e) => { e.currentTarget.style.color = "var(--text5)"; e.currentTarget.style.background = "none"; }}>
          <Maximize2 size={12} />
        </button>
      </div>

      <div style={{ flex: 1, padding: 8, display: "flex", flexDirection: "column", gap: 8, overflowY: "auto" }}>
        {remoteStream ? (
          <VideoTile stream={remoteStream} label={remoteUser?.username || "Remote"} />
        ) : (
          <div style={{ aspectRatio: "16/9", background: "var(--surface2)", borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", border: "1px solid var(--border)", flexDirection: "column", gap: 6 }}>
            <div style={{ fontSize: 28 }}>👤</div>
            <p style={{ fontSize: 11, color: "var(--text5)" }}>
              {callStatus === "calling" ? "Ringing..." : "Connecting..."}
            </p>
          </div>
        )}
        {localStream && (
          <VideoTile stream={localStream} label={localUser?.username || "You"} muted isLocal isCameraOff={isCameraOff} isScreenSharing={isScreenSharing} />
        )}
      </div>

      <div style={{ padding: "10px", borderTop: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
        <CtrlBtn onClick={onToggleMute} active={isMuted} title={isMuted ? "Unmute" : "Mute"} size={34}>
          {isMuted ? <MicOff size={13} /> : <Mic size={13} />}
        </CtrlBtn>
        <CtrlBtn onClick={onToggleCamera} active={isCameraOff} title={isCameraOff ? "Camera on" : "Camera off"} size={34}>
          {isCameraOff ? <VideoOff size={13} /> : <Video size={13} />}
        </CtrlBtn>
        <CtrlBtn onClick={onToggleScreen} active={isScreenSharing} title={isScreenSharing ? "Stop sharing" : "Share screen"} size={34}>
          {isScreenSharing ? <MonitorOff size={13} /> : <Monitor size={13} />}
        </CtrlBtn>
        <CtrlBtn onClick={onEndCall} danger title="End call" size={34}>
          <PhoneOff size={13} />
        </CtrlBtn>
      </div>
      <style>{`@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }`}</style>
    </div>
  );
};

export default DMVideoPanel;