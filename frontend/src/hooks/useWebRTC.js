import { useRef, useState, useEffect, useCallback } from "react";

const ICE_SERVERS = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
  ],
};

const useWebRTC = (socket, channelId) => {
  const [inCall, setInCall] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isCameraOff, setIsCameraOff] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [localStream, setLocalStream] = useState(null);
  const [screenStream, setScreenStream] = useState(null);
  const [participants, setParticipants] = useState([]);

  const localStreamRef = useRef(null);
  const screenStreamRef = useRef(null);
  const peersRef = useRef({});
  const participantsRef = useRef([]);

  // Keep participantsRef in sync
  useEffect(() => {
    participantsRef.current = participants;
  }, [participants]);

  const addOrUpdateParticipant = useCallback((socketId, data) => {
    setParticipants((prev) => {
      const existing = prev.find((p) => p.socketId === socketId);
      if (existing) {
        return prev.map((p) => p.socketId === socketId ? { ...p, ...data } : p);
      }
      return [...prev, { socketId, userId: null, username: "User", stream: null, ...data }];
    });
  }, []);

  const createPeer = useCallback((socketId, stream) => {
    // Close existing peer if any
    if (peersRef.current[socketId]) {
      peersRef.current[socketId].close();
    }

    const peer = new RTCPeerConnection(ICE_SERVERS);

    stream.getTracks().forEach((track) => peer.addTrack(track, stream));

    peer.onicecandidate = (e) => {
      if (e.candidate) {
        socket.emit("call_ice_candidate", { candidate: e.candidate, toSocketId: socketId });
      }
    };

    peer.ontrack = (e) => {
      console.log("ontrack fired for socketId:", socketId, e.streams);
      const incomingStream = e.streams[0];
      if (incomingStream) {
        addOrUpdateParticipant(socketId, { stream: incomingStream });
      }
    };

    peer.onconnectionstatechange = () => {
      console.log(`Peer ${socketId} state:`, peer.connectionState);
      if (peer.connectionState === "disconnected" || peer.connectionState === "failed") {
        peer.close();
        delete peersRef.current[socketId];
        setParticipants((prev) => prev.filter((p) => p.socketId !== socketId));
      }
    };

    return peer;
  }, [socket, addOrUpdateParticipant]);

  const joinCall = async (withVideo = true) => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: withVideo,
      });
      localStreamRef.current = stream;
      setLocalStream(stream);
      setInCall(true);
      // Emit join — server will notify others with our username
      socket.emit("call_join", { channelId, withVideo });
    } catch (err) {
      console.error("Media error:", err);
      alert("Camera/microphone access is required.");
    }
  };

  const leaveCall = useCallback(() => {
    localStreamRef.current?.getTracks().forEach((t) => t.stop());
    screenStreamRef.current?.getTracks().forEach((t) => t.stop());
    localStreamRef.current = null;
    screenStreamRef.current = null;
    Object.values(peersRef.current).forEach((p) => p.close());
    peersRef.current = {};
    socket?.emit("call_leave", { channelId });
    setInCall(false);
    setIsMuted(false);
    setIsCameraOff(false);
    setIsScreenSharing(false);
    setLocalStream(null);
    setScreenStream(null);
    setParticipants([]);
  }, [socket, channelId]);

  const toggleMute = () => {
    if (!localStreamRef.current) return;
    const track = localStreamRef.current.getAudioTracks()[0];
    if (track) { track.enabled = !track.enabled; setIsMuted(!track.enabled); }
  };

  const toggleCamera = () => {
    if (!localStreamRef.current) return;
    const track = localStreamRef.current.getVideoTracks()[0];
    if (track) { track.enabled = !track.enabled; setIsCameraOff(!track.enabled); }
  };

  const toggleScreenShare = async () => {
    if (isScreenSharing) {
      screenStreamRef.current?.getTracks().forEach((t) => t.stop());
      screenStreamRef.current = null;
      setScreenStream(null);
      const cameraTrack = localStreamRef.current?.getVideoTracks()[0];
      if (cameraTrack) {
        for (const peer of Object.values(peersRef.current)) {
          const sender = peer.getSenders().find((s) => s.track?.kind === "video");
          if (sender) await sender.replaceTrack(cameraTrack);
        }
      }
      setIsScreenSharing(false);
    } else {
      try {
        const scrStream = await navigator.mediaDevices.getDisplayMedia({
          video: { cursor: "always" },
          audio: false,
        });
        screenStreamRef.current = scrStream;
        setScreenStream(scrStream);
        const screenTrack = scrStream.getVideoTracks()[0];
        for (const peer of Object.values(peersRef.current)) {
          const sender = peer.getSenders().find((s) => s.track?.kind === "video");
          if (sender) await sender.replaceTrack(screenTrack);
        }
        screenTrack.onended = () => {
          setIsScreenSharing(false);
          setScreenStream(null);
          screenStreamRef.current = null;
          const camTrack = localStreamRef.current?.getVideoTracks()[0];
          if (camTrack) {
            for (const peer of Object.values(peersRef.current)) {
              const sender = peer.getSenders().find((s) => s.track?.kind === "video");
              if (sender) sender.replaceTrack(camTrack);
            }
          }
        };
        setIsScreenSharing(true);
      } catch (err) {
        console.error("Screen share failed:", err);
      }
    }
  };

  useEffect(() => {
    if (!socket) return;

    // Another user joined — we send them an offer
    const handleUserJoined = async ({ userId, username, socketId }) => {
      if (!localStreamRef.current) return;
      console.log("User joined:", username, socketId);

      // Add with real username immediately
      addOrUpdateParticipant(socketId, { userId, username, stream: null });

      const peer = createPeer(socketId, localStreamRef.current);
      peersRef.current[socketId] = peer;

      try {
        const offer = await peer.createOffer();
        await peer.setLocalDescription(offer);
        socket.emit("call_offer", { offer, toSocketId: socketId });
      } catch (err) {
        console.error("Error creating offer:", err);
      }
    };

    // We received an offer — send answer
    const handleOffer = async ({ offer, fromSocketId, username, userId }) => {
      if (!localStreamRef.current) return;
      console.log("Received offer from:", username, fromSocketId);

      // Add participant with username from offer
      addOrUpdateParticipant(fromSocketId, { userId, username, stream: null });

      const peer = createPeer(fromSocketId, localStreamRef.current);
      peersRef.current[fromSocketId] = peer;

      try {
        await peer.setRemoteDescription(new RTCSessionDescription(offer));
        const answer = await peer.createAnswer();
        await peer.setLocalDescription(answer);
        socket.emit("call_answer", { answer, toSocketId: fromSocketId });
      } catch (err) {
        console.error("Error creating answer:", err);
      }
    };

    // Got answer — complete the connection
    const handleAnswer = async ({ answer, fromSocketId, username, userId }) => {
      const peer = peersRef.current[fromSocketId];
      if (!peer) return;
      console.log("Received answer from:", fromSocketId);
      try {
        await peer.setRemoteDescription(new RTCSessionDescription(answer));
        // Update username if we have it
        if (username) addOrUpdateParticipant(fromSocketId, { username, userId });
      } catch (err) {
        console.error("Error setting answer:", err);
      }
    };

    const handleIce = async ({ candidate, fromSocketId }) => {
      const peer = peersRef.current[fromSocketId];
      if (peer && peer.remoteDescription) {
        try {
          await peer.addIceCandidate(new RTCIceCandidate(candidate));
        } catch (err) {
          console.error("ICE error:", err);
        }
      }
    };

    const handleUserLeft = ({ userId, username }) => {
      console.log("User left:", username);
      setParticipants((prev) => {
        const leaving = prev.find((p) => p.userId === userId);
        if (leaving) {
          peersRef.current[leaving.socketId]?.close();
          delete peersRef.current[leaving.socketId];
        }
        return prev.filter((p) => p.userId !== userId);
      });
    };

    socket.on("call_user_joined", handleUserJoined);
    socket.on("call_offer", handleOffer);
    socket.on("call_answer", handleAnswer);
    socket.on("call_ice_candidate", handleIce);
    socket.on("call_user_left", handleUserLeft);

    return () => {
      socket.off("call_user_joined", handleUserJoined);
      socket.off("call_offer", handleOffer);
      socket.off("call_answer", handleAnswer);
      socket.off("call_ice_candidate", handleIce);
      socket.off("call_user_left", handleUserLeft);
    };
  }, [socket, channelId, createPeer, addOrUpdateParticipant]);

  useEffect(() => {
    return () => { if (inCall) leaveCall(); };
  }, []);

  return {
    inCall, isMuted, isCameraOff, isScreenSharing,
    localStream, screenStream, participants,
    joinCall, leaveCall,
    toggleMute, toggleCamera, toggleScreenShare,
  };
};

export default useWebRTC;
