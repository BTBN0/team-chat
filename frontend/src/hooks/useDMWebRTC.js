import { useRef, useState, useEffect } from "react";

const useDMWebRTC = (socket, targetUserId) => {
  const [inCall, setInCall] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [callStatus, setCallStatus] = useState(null);

  const localStreamRef = useRef(null);
  const peerRef = useRef(null);
  const remoteSocketIdRef = useRef(null);

  const createPeer = (stream) => {
    const peer = new RTCPeerConnection({
      iceServers: [
        { urls: "stun:stun.l.google.com:19302" },
        { urls: "stun:stun1.l.google.com:19302" },
      ],
    });

    stream.getTracks().forEach((track) => peer.addTrack(track, stream));

    peer.onicecandidate = (e) => {
      if (e.candidate && remoteSocketIdRef.current) {
        socket.emit("dm_call_ice_candidate", {
          candidate: e.candidate,
          toSocketId: remoteSocketIdRef.current,
        });
      }
    };

    peer.ontrack = (e) => {
      const audio = new Audio();
      audio.srcObject = e.streams[0];
      audio.play().catch(console.error);
    };

    return peer;
  };

  const startCall = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
      localStreamRef.current = stream;

      const peer = createPeer(stream);
      peerRef.current = peer;

      const offer = await peer.createOffer();
      await peer.setLocalDescription(offer);

      socket.emit("dm_call_offer", { offer, toUserId: targetUserId });
      setCallStatus("calling");
      setInCall(true);
    } catch (err) {
      console.error("Mic access denied:", err);
      alert("Microphone access is required for calls.");
    }
  };

  const endCall = () => {
    localStreamRef.current?.getTracks().forEach((t) => t.stop());
    localStreamRef.current = null;
    peerRef.current?.close();
    peerRef.current = null;
    remoteSocketIdRef.current = null;

    socket?.emit("dm_call_end", { toUserId: targetUserId });
    setInCall(false);
    setIsMuted(false);
    setCallStatus(null);
  };

  const toggleMute = () => {
    if (!localStreamRef.current) return;
    const audioTrack = localStreamRef.current.getAudioTracks()[0];
    if (audioTrack) {
      audioTrack.enabled = !audioTrack.enabled;
      setIsMuted(!audioTrack.enabled);
    }
  };

  useEffect(() => {
    if (!socket) return;

    // Handle answer from remote peer
    const handleAnswer = async ({ answer, fromSocketId }) => {
      remoteSocketIdRef.current = fromSocketId;
      if (peerRef.current) {
        await peerRef.current.setRemoteDescription(new RTCSessionDescription(answer));
        setCallStatus("active");
      }
    };

    const handleIceCandidate = async ({ candidate }) => {
      if (peerRef.current) {
        await peerRef.current.addIceCandidate(new RTCIceCandidate(candidate));
      }
    };

    const handleCallEnded = () => {
      localStreamRef.current?.getTracks().forEach((t) => t.stop());
      localStreamRef.current = null;
      peerRef.current?.close();
      peerRef.current = null;
      remoteSocketIdRef.current = null;
      setInCall(false);
      setIsMuted(false);
      setCallStatus(null);
    };

    socket.on("dm_call_answer", handleAnswer);
    socket.on("dm_call_ice_candidate", handleIceCandidate);
    socket.on("dm_call_ended", handleCallEnded);

    return () => {
      socket.off("dm_call_answer", handleAnswer);
      socket.off("dm_call_ice_candidate", handleIceCandidate);
      socket.off("dm_call_ended", handleCallEnded);
    };
  }, [socket, targetUserId]);

  useEffect(() => {
    return () => {
      if (inCall) endCall();
    };
  }, []);

  return {
    inCall,
    isMuted,
    callStatus,
    incomingCall: null,
    startCall,
    answerCall: () => {},
    rejectCall: () => {},
    endCall,
    toggleMute,
  };
};

export default useDMWebRTC;