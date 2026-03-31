import { Server } from "socket.io";
import { verifyToken } from "../config/jwt.js";
import { setUserOnline, setUserOffline, getExistingSocket } from "./presence.js";
import { setIO } from "./socket.js";
import prisma from "../lib/prisma.js";

// Safely extract username from decoded JWT — handles multiple field name conventions
const extractUsername = (decoded) => {
  return (
    decoded.username ||
    decoded.name ||
    decoded.displayName ||
    decoded.email?.split("@")[0] ||
    `user_${decoded.id?.slice(0, 6)}` ||
    "Unknown"
  );
};

export const initSocket = (httpServer) => {
  const io = new Server(httpServer, {
    cors: { origin: "*", methods: ["GET", "POST"] },
  });

  setIO(io);

  io.use((socket, next) => {
    const token = socket.handshake.auth.token;
    if (!token) return next(new Error("No token provided"));
    try {
      const decoded = verifyToken(token);
      // Debug — remove this after confirming username works
      console.log("decoded token fields:", Object.keys(decoded));
      // Normalize — always have username on socket.user
      socket.user = {
        ...decoded,
        username: extractUsername(decoded),
      };
      next();
    } catch (err) {
      next(new Error("Invalid token"));
    }
  });

  io.on("connection", async (socket) => {
    const user = socket.user;
    console.log(`User connected: ${user.username} (${socket.id})`);

    // Single session enforcement
    const existingSocketId = getExistingSocket(user.id);
    if (existingSocketId && existingSocketId !== socket.id) {
      const existingSocket = io.sockets.sockets.get(existingSocketId);
      if (existingSocket) {
        existingSocket.emit("session_expired", { message: "You logged in from another device." });
        existingSocket.disconnect(true);
      }
    }

    setUserOnline(user.id, socket.id);
    io.emit("user_online", { userId: user.id });

    await prisma.user.update({
      where: { id: user.id },
      data: { lastSeen: new Date() },
    }).catch(() => {});

    socket.on("join_workspace", (workspaceId) => {
      socket.join(`workspace:${workspaceId}`);
    });

    socket.on("join_channel", (channelId) => {
      socket.join(`channel:${channelId}`);
    });

    socket.on("send_message", (message) => {
      io.to(`channel:${message.channelId}`).emit("new_message", message);
    });

    socket.on("delete_message", ({ messageId, channelId }) => {
      io.to(`channel:${channelId}`).emit("message_deleted", { messageId });
    });

    socket.on("message_edited", ({ message, channelId }) => {
      io.to(`channel:${channelId}`).emit("message_edited", { message, channelId });
    });

    socket.on("message_pinned", ({ message, channelId }) => {
      io.to(`channel:${channelId}`).emit("message_pinned", { message, channelId });
    });

    socket.on("reaction_updated", ({ messageId, channelId, reactions }) => {
      io.to(`channel:${channelId}`).emit("reaction_updated", { messageId, reactions });
    });

    socket.on("typing_start", ({ channelId }) => {
      socket.to(`channel:${channelId}`).emit("user_typing", {
        userId: user.id,
        username: user.username,
        typing: true,
      });
    });

    socket.on("typing_stop", ({ channelId }) => {
      socket.to(`channel:${channelId}`).emit("user_typing", {
        userId: user.id,
        username: user.username,
        typing: false,
      });
    });

    // ── Channel calls ──────────────────────────────────────────────
    socket.on("call_join", ({ channelId }) => {
      socket.join(`channel:${channelId}`);
      socket.to(`channel:${channelId}`).emit("call_user_joined", {
        userId: user.id,
        username: user.username,
        socketId: socket.id,
      });
      console.log(`${user.username} joined call in channel:${channelId}`);
    });

    socket.on("call_leave", ({ channelId }) => {
      socket.to(`channel:${channelId}`).emit("call_user_left", {
        userId: user.id,
        username: user.username,
      });
    });

    socket.on("call_offer", ({ offer, toSocketId }) => {
      io.to(toSocketId).emit("call_offer", {
        offer,
        fromSocketId: socket.id,
        username: user.username,
        userId: user.id,
      });
    });

    socket.on("call_answer", ({ answer, toSocketId }) => {
      io.to(toSocketId).emit("call_answer", {
        answer,
        fromSocketId: socket.id,
        username: user.username,
        userId: user.id,
      });
    });

    socket.on("call_ice_candidate", ({ candidate, toSocketId }) => {
      io.to(toSocketId).emit("call_ice_candidate", {
        candidate,
        fromSocketId: socket.id,
      });
    });

    // ── DM calls ───────────────────────────────────────────────────
    socket.on("dm_send", ({ toUserId, message }) => {
      const targetSocket = [...io.sockets.sockets.values()].find(
        (s) => s.user?.id === toUserId
      );
      if (targetSocket) targetSocket.emit("dm_new_message", message);
    });

    socket.on("dm_call_offer", ({ offer, toUserId, withVideo }) => {
      const targetSocket = [...io.sockets.sockets.values()].find(
        (s) => s.user?.id === toUserId
      );
      if (targetSocket) {
        targetSocket.emit("dm_call_offer", {
          offer,
          fromSocketId: socket.id,
          fromUserId: user.id,
          fromUsername: user.username,
          withVideo: withVideo || false,
        });
      }
    });

    socket.on("dm_call_answer", ({ answer, toSocketId }) => {
      io.to(toSocketId).emit("dm_call_answer", {
        answer,
        fromSocketId: socket.id,
      });
    });

    socket.on("dm_call_ice_candidate", ({ candidate, toSocketId }) => {
      io.to(toSocketId).emit("dm_call_ice_candidate", {
        candidate,
        fromSocketId: socket.id,
      });
    });

    socket.on("dm_call_end", ({ toUserId }) => {
      const targetSocket = [...io.sockets.sockets.values()].find(
        (s) => s.user?.id === toUserId
      );
      if (targetSocket) targetSocket.emit("dm_call_ended", { fromUserId: user.id });
    });

    // ── Friends ────────────────────────────────────────────────────
    socket.on("friend_request_sent", ({ toUserId, request }) => {
      const targetSocket = [...io.sockets.sockets.values()].find(
        (s) => s.user?.id === toUserId
      );
      if (targetSocket) targetSocket.emit("friend_request_received", request);
    });

    socket.on("friend_request_accepted", ({ toUserId }) => {
      const targetSocket = [...io.sockets.sockets.values()].find(
        (s) => s.user?.id === toUserId
      );
      if (targetSocket) {
        targetSocket.emit("friend_accepted", {
          userId: user.id,
          username: user.username,
        });
      }
    });

    socket.on("disconnect", async () => {
      console.log(`User disconnected: ${user.username}`);
      setUserOffline(user.id);
      io.emit("user_offline", { userId: user.id });
      await prisma.user.update({
        where: { id: user.id },
        data: { lastSeen: new Date() },
      }).catch(() => {});
    });
  });

  return io;
};
