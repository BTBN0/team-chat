import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { createServer } from "http";
import { fileURLToPath } from "url";
import path from "path";

import authRoutes from "./routes/auth.routes.js";
import workspaceRoutes from "./routes/workspace.routes.js";
import channelRoutes from "./routes/channel.routes.js";
import messageRoutes from "./routes/message.routes.js";
import uploadRoutes from "./routes/upload.routes.js";
import reactionRoutes from "./routes/reaction.routes.js";

import { errorHandler } from "./middleware/errorHandler.js";
import { notFound } from "./middleware/notFound.js";
import { initSocket } from "./socket/index.js";
import dmRoutes from "./routes/dm.routes.js";
import friendRoutes from "./routes/friend.routes.js";
import blockRoutes from "./routes/block.routes.js";
import banRoutes from "./routes/ban.routes.js";


dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const httpServer = createServer(app);

app.use(cors());
app.use(express.json());

// Serve uploaded files
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Health check
app.get("/", (req, res) => {
  res.json({ ok: true, message: "Server is running" });
});

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/workspaces", workspaceRoutes);
app.use("/api/channels", channelRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/upload", uploadRoutes);
app.use("/api/reactions", reactionRoutes);
app.use("/api/dm", dmRoutes);
app.use("/api/friends", friendRoutes);
app.use("/api/blocks", blockRoutes);
app.use("/api/bans", banRoutes);

// Middleware
app.use(notFound);
app.use(errorHandler);

// Init Socket.IO
initSocket(httpServer);

const PORT = process.env.PORT || 3001;
httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

export default app;
