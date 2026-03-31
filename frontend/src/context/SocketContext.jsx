import { createContext, useContext, useEffect, useState } from "react";
import { io } from "socket.io-client";
import { useAuth } from "./AuthContext.jsx";

const SocketContext = createContext(null);

export const SocketProvider = ({ children }) => {
  const { token } = useAuth();
  const [socket, setSocket] = useState(null);
  const [onlineUsers, setOnlineUsers] = useState([]);

  useEffect(() => {
    if (!token) return;

    const newSocket = io("http://localhost:3001", { auth: { token } });

    newSocket.on("connect", () => console.log("Socket connected"));

    newSocket.on("user_online", ({ userId }) => {
      setOnlineUsers((prev) => [...new Set([...prev, userId])]);
    });

    newSocket.on("user_offline", ({ userId }) => {
      setOnlineUsers((prev) => prev.filter((id) => id !== userId));
    });

    // Kicked from workspace
    newSocket.on("kicked_from_workspace", ({ workspaceId, message }) => {
      alert(`You have been banned from this workspace.\n\nReason: ${message}`);
      window.location.href = "/dashboard";
    });

    // Session expired — logged in from another device
    newSocket.on("session_expired", ({ message }) => {
      localStorage.removeItem("token");
      alert(`Session expired: ${message}`);
      window.location.href = "/login";
    });

    setSocket(newSocket);
    return () => newSocket.disconnect();
  }, [token]);

  return (
    <SocketContext.Provider value={{ socket, onlineUsers }}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => useContext(SocketContext);