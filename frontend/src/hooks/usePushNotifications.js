import { useEffect } from "react";
import { useSocket } from "../context/SocketContext.jsx";
import { useAuth } from "../context/AuthContext.jsx";

const requestPermission = async () => {
  if (!("Notification" in window)) return false;
  if (Notification.permission === "granted") return true;
  if (Notification.permission === "denied") return false;
  const permission = await Notification.requestPermission();
  return permission === "granted";
};

const showNotification = (title, body, icon, onClick) => {
  if (Notification.permission !== "granted") return;
  if (document.visibilityState === "visible") return;

  const notification = new Notification(title, {
    body,
    icon: icon || "/favicon.ico",
    badge: "/favicon.ico",
    silent: false,
  });

  notification.onclick = () => {
    window.focus();
    if (onClick) onClick();
    notification.close();
  };

  setTimeout(() => notification.close(), 5000);
};

const usePushNotifications = () => {
  const { socket } = useSocket();
  const { user } = useAuth();

  useEffect(() => {
    requestPermission();
  }, []);

  useEffect(() => {
    if (!socket || !user) return;

    const handleDM = (message) => {
      if (message.senderId === user.id) return;
      showNotification(
        `💬 ${message.sender?.username || "New message"}`,
        message.content || "Sent an attachment",
        message.sender?.avatar || null,
        () => { window.location.href = `/dm/${message.senderId}`; }
      );
    };

    const handleFriendRequest = (request) => {
      showNotification(
        "👥 Friend Request",
        `${request.sender?.username} sent you a friend request`,
        request.sender?.avatar || null,
        () => { window.location.href = "/friends"; }
      );
    };

    const handleNewMessage = (message) => {
      if (message.user?.id === user.id) return;
      if (!message.content?.includes(`@${user.username}`)) return;
      showNotification(
        `🔔 ${message.user?.username} mentioned you`,
        message.content,
        message.user?.avatar || null,
        () => {
          if (message.channelId) {
            window.location.href = `/chat/${message.workspaceId}/${message.channelId}`;
          }
        }
      );
    };

    socket.on("dm_new_message", handleDM);
    socket.on("friend_request_received", handleFriendRequest);
    socket.on("new_message", handleNewMessage);

    return () => {
      socket.off("dm_new_message", handleDM);
      socket.off("friend_request_received", handleFriendRequest);
      socket.off("new_message", handleNewMessage);
    };
  }, [socket, user]);
};

export default usePushNotifications;