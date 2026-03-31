import { useState, useRef, useEffect } from "react";
import { Play, Pause } from "lucide-react";

const formatTime = (seconds) => {
  if (!seconds || isNaN(seconds)) return "0:00";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
};

const VoiceMessage = ({ fileUrl, isOwn }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [progress, setProgress] = useState(0);
  const audioRef = useRef(null);
  const progressRef = useRef(null);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const onLoaded = () => setDuration(audio.duration);
    const onTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
      setProgress((audio.currentTime / audio.duration) * 100 || 0);
    };
    const onEnded = () => { setIsPlaying(false); setCurrentTime(0); setProgress(0); };

    audio.addEventListener("loadedmetadata", onLoaded);
    audio.addEventListener("timeupdate", onTimeUpdate);
    audio.addEventListener("ended", onEnded);
    return () => {
      audio.removeEventListener("loadedmetadata", onLoaded);
      audio.removeEventListener("timeupdate", onTimeUpdate);
      audio.removeEventListener("ended", onEnded);
    };
  }, []);

  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (isPlaying) { audio.pause(); setIsPlaying(false); }
    else { audio.play(); setIsPlaying(true); }
  };

  const handleSeek = (e) => {
    const audio = audioRef.current;
    const bar = progressRef.current;
    if (!audio || !bar) return;
    const rect = bar.getBoundingClientRect();
    const pct = (e.clientX - rect.left) / rect.width;
    audio.currentTime = pct * audio.duration;
  };

  // Generate fake waveform bars for visual
  const bars = 30;
  const barHeights = useRef(
    Array.from({ length: bars }, () => Math.random() * 0.7 + 0.2)
  );

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 12px", background: isOwn ? "rgba(255,255,255,0.06)" : "var(--surface2)", borderRadius: 12, border: "1px solid var(--border)", maxWidth: 280, marginTop: 4 }}>
      <audio ref={audioRef} src={fileUrl} preload="metadata" />

      {/* Play button */}
      <button onClick={togglePlay}
        style={{ width: 34, height: 34, borderRadius: "50%", background: "var(--text)", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--bg)", flexShrink: 0, transition: "opacity 0.15s" }}
        onMouseEnter={(e) => e.currentTarget.style.opacity = "0.85"}
        onMouseLeave={(e) => e.currentTarget.style.opacity = "1"}>
        {isPlaying ? <Pause size={14} fill="var(--bg)" /> : <Play size={14} fill="var(--bg)" style={{ marginLeft: 2 }} />}
      </button>

      {/* Waveform + progress */}
      <div style={{ flex: 1, cursor: "pointer" }} onClick={handleSeek} ref={progressRef}>
        <div style={{ display: "flex", alignItems: "center", gap: 1.5, height: 28 }}>
          {barHeights.current.map((h, i) => {
            const barProgress = (i / bars) * 100;
            const isActive = barProgress <= progress;
            return (
              <div key={i} style={{ flex: 1, borderRadius: 2, transition: "background 0.1s", background: isActive ? "var(--text)" : "var(--text5)", height: `${h * 100}%` }} />
            );
          })}
        </div>
      </div>

      {/* Time */}
      <span style={{ fontSize: 11, color: "var(--text4)", flexShrink: 0, minWidth: 30, fontVariantNumeric: "tabular-nums" }}>
        {isPlaying ? formatTime(currentTime) : formatTime(duration)}
      </span>
    </div>
  );
};

export default VoiceMessage;
