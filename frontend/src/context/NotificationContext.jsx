import { createContext, useContext, useState, useEffect } from "react";
import { useSocket } from "./SocketContext.jsx";
import { useAuth } from "./AuthContext.jsx";

const NotificationContext = createContext(null);

export const NotificationProvider = ({ children }) => {
  const { socket } = useSocket();
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);

  const addNotification = (notification) => {
    setNotifications((prev) => [
      { ...notification, id: Date.now(), read: false },
      ...prev,
    ]);
  };

  const markAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const markRead = (id) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  };

  const clearAll = () => setNotifications([]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  useEffect(() => {
    if (!socket || !user) return;

    // Friend request received
    const handleFriendRequest = (request) => {
      addNotification({
        type: "friend_request",
        title: "Friend Request",
        message: `${request.sender?.username} sent you a friend request`,
        link: "/friends",
        avatar: request.sender?.avatar,
        username: request.sender?.username,
      });
    };

    // Friend request accepted
    const handleFriendAccepted = ({ username }) => {
      addNotification({
        type: "friend_accepted",
        title: "Friend Request Accepted",
        message: `${username} accepted your friend request`,
        link: "/friends",
        username,
      });
    };

    // New DM received
    const handleDMReceived = (message) => {
      if (message.senderId === user.id) return;
      addNotification({
        type: "dm",
        title: "New Message",
        message: `${message.sender?.username}: ${message.content || "Sent an attachment"}`,
        link: `/dm/${message.senderId}`,
        avatar: message.sender?.avatar,
        username: message.sender?.username,
      });
    };

    // Channel mention
    const handleNewMessage = (message) => {
      if (message.user?.id === user.id) return;
      if (message.content?.includes(`@${user.username}`)) {
        addNotification({
          type: "mention",
          title: "You were mentioned",
          message: `${message.user?.username} mentioned you in #${message.channelName || "a channel"}`,
          link: `/chat/${message.workspaceId}/${message.channelId}`,
          username: message.user?.username,
        });
      }
    };

    socket.on("friend_request_received", handleFriendRequest);
    socket.on("friend_accepted", handleFriendAccepted);
    socket.on("dm_new_message", handleDMReceived);
    socket.on("new_message", handleNewMessage);

    return () => {
      socket.off("friend_request_received", handleFriendRequest);
      socket.off("friend_accepted", handleFriendAccepted);
      socket.off("dm_new_message", handleDMReceived);
      socket.off("new_message", handleNewMessage);
    };
  }, [socket, user]);

  return (
    <NotificationContext.Provider value={{
      notifications,
      unreadCount,
      markRead,
      markAllRead,
      clearAll,
    }}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => useContext(NotificationContext);