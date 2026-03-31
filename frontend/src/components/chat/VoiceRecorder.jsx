import { useState, useRef, useEffect } from "react";
import { Mic, Square, Send, X, Play, Pause } from "lucide-react";
import api from "../../api/axios.js";

const formatDuration = (seconds) => {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
};

const VoiceRecorder = ({ onSend, onCancel }) => {
  const [state, setState] = useState("idle"); // idle | recording | preview
  const [duration, setDuration] = useState(0);
  const [audioUrl, setAudioUrl] = useState(null);
  const [audioBlob, setAudioBlob] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playProgress, setPlayProgress] = useState(0);
  const [uploading, setUploading] = useState(false);

  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);
  const timerRef = useRef(null);
  const audioRef = useRef(null);
  const analyserRef = useRef(null);
  const canvasRef = useRef(null);
  const animFrameRef = useRef(null);
  const streamRef = useRef(null);

  // Start recording immediately on mount
  useEffect(() => {
    startRecording();
    return () => {
      stopEverything();
    };
  }, []);

  const stopEverything = () => {
    clearInterval(timerRef.current);
    cancelAnimationFrame(animFrameRef.current);
    mediaRecorderRef.current?.stop();
    streamRef.current?.getTracks().forEach((t) => t.stop());
    audioRef.current?.pause();
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      // Setup analyser for waveform
      const audioCtx = new AudioContext();
      const source = audioCtx.createMediaStreamSource(stream);
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);
      analyserRef.current = analyser;

      const mediaRecorder = new MediaRecorder(stream, { mimeType: "audio/webm" });
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        setAudioBlob(blob);
        setAudioUrl(URL.createObjectURL(blob));
        setState("preview");
        drawStaticWave();
      };

      mediaRecorder.start(100);
      setState("recording");
      setDuration(0);

      timerRef.current = setInterval(() => {
        setDuration((d) => d + 1);
      }, 1000);

      drawLiveWave();
    } catch (err) {
      console.error("Mic error:", err);
      alert("Microphone access required for voice messages.");
      onCancel();
    }
  };

  const stopRecording = () => {
    clearInterval(timerRef.current);
    cancelAnimationFrame(animFrameRef.current);
    mediaRecorderRef.current?.stop();
    streamRef.current?.getTracks().forEach((t) => t.stop());
  };

  const drawLiveWave = () => {
    const canvas = canvasRef.current;
    const analyser = analyserRef.current;
    if (!canvas || !analyser) return;

    const ctx = canvas.getContext("2d");
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const draw = () => {
      animFrameRef.current = requestAnimationFrame(draw);
      analyser.getByteFrequencyData(dataArray);
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const barWidth = (canvas.width / bufferLength) * 2.5;
      let x = 0;
      for (let i = 0; i < bufferLength; i++) {
        const barHeight = (dataArray[i] / 255) * canvas.height;
        const alpha = 0.4 + (dataArray[i] / 255) * 0.6;
        ctx.fillStyle = `rgba(250,250,250,${alpha})`;
        ctx.fillRect(x, canvas.height - barHeight, barWidth, barHeight);
        x += barWidth + 1;
      }
    };
    draw();
  };

  const drawStaticWave = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw static waveform bars
    const bars = 40;
    const barWidth = canvas.width / bars - 2;
    for (let i = 0; i < bars; i++) {
      const height = Math.random() * canvas.height * 0.7 + canvas.height * 0.1;
      ctx.fillStyle = "rgba(250,250,250,0.35)";
      ctx.fillRect(i * (barWidth + 2), (canvas.height - height) / 2, barWidth, height);
    }
  };

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play();
      setIsPlaying(true);
    }
  };

  const handleSend = async () => {
    if (!audioBlob) return;
    setUploading(true);
    try {
      const file = new File([audioBlob], `voice-${Date.now()}.webm`, { type: "audio/webm" });
      const formData = new FormData();
      formData.append("file", file);
      const uploadRes = await api.post("/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      const { fileUrl, fileType } = uploadRes.data.data;
      onSend("", fileUrl, fileType || "audio/webm");
    } catch (err) {
      console.error("Upload failed:", err);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, flex: 1, background: "var(--surface2)", border: "1px solid var(--border2)", borderRadius: 11, padding: "6px 10px" }}>
      {/* Cancel */}
      <button onClick={() => { stopEverything(); onCancel(); }}
        style={{ width: 28, height: 28, display: "flex", alignItems: "center", justifyContent: "center", background: "none", border: "none", cursor: "pointer", color: "var(--text5)", borderRadius: 6, transition: "all 0.15s", flexShrink: 0 }}
        onMouseEnter={(e) => { e.currentTarget.style.color = "var(--red)"; e.currentTarget.style.background = "rgba(239,68,68,0.1)"; }}
        onMouseLeave={(e) => { e.currentTarget.style.color = "var(--text5)"; e.currentTarget.style.background = "none"; }}>
        <X size={14} />
      </button>

      {/* Waveform canvas */}
      <div style={{ flex: 1, position: "relative", height: 32 }}>
        <canvas ref={canvasRef} width={300} height={32} style={{ width: "100%", height: "100%" }} />
        {state === "preview" && audioUrl && (
          <audio ref={audioRef} src={audioUrl}
            onEnded={() => { setIsPlaying(false); setPlayProgress(0); }}
            onTimeUpdate={(e) => {
              const pct = (e.target.currentTime / e.target.duration) * 100;
              setPlayProgress(pct || 0);
            }} />
        )}
      </div>

      {/* Duration */}
      <span style={{ fontSize: 12, color: "var(--text4)", fontVariantNumeric: "tabular-nums", flexShrink: 0, minWidth: 32 }}>
        {formatDuration(duration)}
      </span>

      {/* Controls */}
      {state === "recording" ? (
        <button onClick={stopRecording}
          style={{ width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(239,68,68,0.15)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: "50%", cursor: "pointer", color: "#fca5a5", flexShrink: 0, animation: "recpulse 1.2s ease-in-out infinite" }}>
          <Square size={12} fill="#fca5a5" />
        </button>
      ) : (
        <div style={{ display: "flex", gap: 6 }}>
          <button onClick={togglePlay}
            style={{ width: 30, height: 30, display: "flex", alignItems: "center", justifyContent: "center", background: "var(--surface3)", border: "none", borderRadius: "50%", cursor: "pointer", color: "var(--text3)", flexShrink: 0 }}>
            {isPlaying ? <Pause size={12} /> : <Play size={12} />}
          </button>
          <button onClick={handleSend} disabled={uploading}
            style={{ width: 30, height: 30, display: "flex", alignItems: "center", justifyContent: "center", background: uploading ? "var(--surface3)" : "var(--text)", border: "none", borderRadius: "50%", cursor: uploading ? "not-allowed" : "pointer", color: uploading ? "var(--text5)" : "var(--bg)", flexShrink: 0 }}>
            {uploading ? <span style={{ fontSize: 9 }}>...</span> : <Send size={12} />}
          </button>
        </div>
      )}
      <style>{`@keyframes recpulse { 0%,100%{opacity:1} 50%{opacity:0.5} }`}</style>
    </div>
  );
};

export default VoiceRecorder;
