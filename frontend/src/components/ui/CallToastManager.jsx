import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useSocket } from "../../context/SocketContext.jsx";
import { useAuth } from "../../context/AuthContext.jsx";
import { useCall } from "../../context/CallContext.jsx";

const IncomingCallToast = ({ call, onAnswer, onDecline }) => {
  const [visible, setVisible] = useState(false);
  const [pulse, setPulse] = useState(true);

  useEffect(() => {
    requestAnimationFrame(() => setVisible(true));
    const interval = setInterval(() => setPulse((p) => !p), 1000);
    return () => clearInterval(interval);
  }, []);

  const colors = ["bg-indigo-600", "bg-purple-600", "bg-pink-600", "bg-blue-600"];
  const color = colors[call.fromUsername?.charCodeAt(0) % colors.length] || "bg-indigo-600";

  return (
    <div
      style={{
        transform: visible ? "translateX(0)" : "translateX(120%)",
        opacity: visible ? 1 : 0,
        transition: "transform 0.3s ease, opacity 0.3s ease",
      }}
      className="w-80 bg-[#0D1035] border border-green-500/40 rounded-xl shadow-2xl overflow-hidden"
    >
      <div className={`h-1 bg-green-500 transition-opacity duration-500 ${pulse ? "opacity-100" : "opacity-40"}`} />

      <div className="p-4">
        <div className="flex items-center gap-3 mb-4">
          <div className="relative flex-shrink-0">
            {call.fromAvatar ? (
              <img src={call.fromAvatar} alt={call.fromUsername}
                className="w-11 h-11 rounded-full object-cover" />
            ) : (
              <div className={`w-11 h-11 ${color} rounded-full flex items-center justify-center text-white font-bold text-lg`}>
                {call.fromUsername?.[0]?.toUpperCase()}
              </div>
            )}
            <span className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-green-400 rounded-full border-2 border-[#0D1035] transition-opacity duration-500 ${pulse ? "opacity-100" : "opacity-50"}`} />
          </div>

          <div className="flex-1 min-w-0">
            <p className="text-xs text-green-400 font-medium">Incoming call</p>
            <p className="text-sm font-semibold text-white truncate">{call.fromUsername}</p>
          </div>

          <div className={`text-2xl transition-transform duration-300 ${pulse ? "rotate-12" : "-rotate-12"}`}>
            📞
          </div>
        </div>

        <div className="flex gap-2">
          <button
            onClick={onDecline}
            className="flex-1 py-2 bg-red-600/20 hover:bg-red-600 border border-red-500/30 hover:border-red-500 text-red-400 hover:text-white text-xs font-medium rounded-lg transition flex items-center justify-center gap-1.5"
          >
            📵 Decline
          </button>
          <button
            onClick={onAnswer}
            className="flex-1 py-2 bg-green-600 hover:bg-green-500 text-white text-xs font-medium rounded-lg transition flex items-center justify-center gap-1.5"
          >
            📞 Answer
          </button>
        </div>
      </div>
    </div>
  );
};

const CallToastManager = () => {
  const { socket } = useSocket();
  const { user } = useAuth();
  const { incomingCall, clearIncomingCall } = useCall();
  const navigate = useNavigate();

  const handleAnswer = async () => {
    if (!incomingCall || !socket) return;

    try {
      // Get mic access
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });

      // Create peer connection
      const peer = new RTCPeerConnection({
        iceServers: [
          { urls: "stun:stun.l.google.com:19302" },
          { urls: "stun:stun1.l.google.com:19302" },
        ],
      });

      stream.getTracks().forEach((track) => peer.addTrack(track, stream));

      peer.onicecandidate = (e) => {
        if (e.candidate) {
          socket.emit("dm_call_ice_candidate", {
            candidate: e.candidate,
            toSocketId: incomingCall.fromSocketId,
          });
        }
      };

      peer.ontrack = (e) => {
        const audio = new Audio();
        audio.srcObject = e.streams[0];
        audio.play().catch(console.error);
      };

      await peer.setRemoteDescription(new RTCSessionDescription(incomingCall.offer));
      const answer = await peer.createAnswer();
      await peer.setLocalDescription(answer);

      socket.emit("dm_call_answer", {
        answer,
        toSocketId: incomingCall.fromSocketId,
      });

      clearIncomingCall();

      // Navigate to DM page
      navigate(`/dm/${incomingCall.fromUserId}`);
    } catch (err) {
      console.error("Failed to answer call:", err);
      alert("Microphone access is required to answer calls.");
      clearIncomingCall();
    }
  };

  const handleDecline = () => {
    if (!incomingCall) return;
    socket?.emit("dm_call_end", { toUserId: incomingCall.fromUserId });
    clearIncomingCall();
  };

  if (!incomingCall) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <IncomingCallToast
        call={incomingCall}
        onAnswer={handleAnswer}
        onDecline={handleDecline}
      />
    </div>
  );
};

export default CallToastManager;