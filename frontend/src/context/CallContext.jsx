import { createContext, useContext, useState, useEffect } from "react";
import { useSocket } from "./SocketContext.jsx";

const CallContext = createContext(null);

export const CallProvider = ({ children }) => {
  const { socket } = useSocket();
  const [incomingCall, setIncomingCall] = useState(null);

  useEffect(() => {
    if (!socket) return;

    const handleDMCallOffer = ({ offer, fromSocketId, fromUserId, fromUsername }) => {
      setIncomingCall({ offer, fromSocketId, fromUserId, fromUsername });
    };

    const handleDMCallEnded = () => {
      setIncomingCall(null);
    };

    socket.on("dm_call_offer", handleDMCallOffer);
    socket.on("dm_call_ended", handleDMCallEnded);

    return () => {
      socket.off("dm_call_offer", handleDMCallOffer);
      socket.off("dm_call_ended", handleDMCallEnded);
    };
  }, [socket]);

  const clearIncomingCall = () => setIncomingCall(null);

  return (
    <CallContext.Provider value={{ incomingCall, clearIncomingCall }}>
      {children}
    </CallContext.Provider>
  );
};

export const useCall = () => useContext(CallContext);