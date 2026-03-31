import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios.js";
import { useAuth } from "../context/AuthContext.jsx";
import { useSocket } from "../context/SocketContext.jsx";

const UserAvatar = ({ user, size = "md" }) => {
  const sizes = { sm: "w-7 h-7 text-xs", md: "w-10 h-10 text-sm" };
  const colors = ["bg-indigo-600", "bg-purple-600", "bg-pink-600", "bg-blue-600"];
  const color = colors[user?.username?.charCodeAt(0) % colors.length] || "bg-indigo-600";
  if (user?.avatar) {
    return <img src={user.avatar} alt={user.username} className={`${sizes[size]} rounded-full object-cover flex-shrink-0`} />;
  }
  return (
    <div className={`${sizes[size]} ${color} rounded-full flex items-center justify-center text-white font-semibold flex-shrink-0`}>
      {user?.username?.[0]?.toUpperCase() || "?"}
    </div>
  );
};

const FriendsPage = () => {
  const { user } = useAuth();
  const { socket, onlineUsers } = useSocket();
  const navigate = useNavigate();

  const [friends, setFriends] = useState([]);
  const [requests, setRequests] = useState([]);
  const [tab, setTab] = useState("friends");
  const [username, setUsername] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAll();
  }, []);

  useEffect(() => {
    if (!socket) return;

    const handleRequestReceived = (request) => {
      setRequests((prev) => [request, ...prev]);
    };

    const handleFriendAccepted = ({ userId, username }) => {
      setFriends((prev) => [...prev, { id: userId, username }]);
    };

    socket.on("friend_request_received", handleRequestReceived);
    socket.on("friend_accepted", handleFriendAccepted);

    return () => {
      socket.off("friend_request_received", handleRequestReceived);
      socket.off("friend_accepted", handleFriendAccepted);
    };
  }, [socket]);

  const fetchAll = async () => {
    try {
      const [friendsRes, requestsRes] = await Promise.all([
        api.get("/friends"),
        api.get("/friends/requests"),
      ]);
      setFriends(friendsRes.data.data || []);
      setRequests(requestsRes.data.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSendRequest = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    try {
      const res = await api.post("/friends/request", { username });
      socket?.emit("friend_request_sent", {
        toUserId: res.data.data.receiverId,
        request: res.data.data,
      });
      setSuccess(`Friend request sent to @${username}`);
      setUsername("");
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to send request");
    }
  };

  const handleAccept = async (request) => {
    try {
      await api.post(`/friends/accept/${request.id}`);
      setRequests((prev) => prev.filter((r) => r.id !== request.id));
      setFriends((prev) => [...prev, request.sender]);
      socket?.emit("friend_request_accepted", { toUserId: request.senderId });
    } catch (err) {
      console.error(err);
    }
  };

  const handleDecline = async (requestId) => {
    try {
      await api.post(`/friends/decline/${requestId}`);
      setRequests((prev) => prev.filter((r) => r.id !== requestId));
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="min-h-screen bg-[#080B2A] text-white">
      {/* Header */}
      <div className="border-b border-[#1B3066] px-8 py-4 flex items-center gap-4">
        <button onClick={() => navigate(-1)} className="text-[#6B7399] hover:text-white transition text-sm">← Back</button>
        <h1 className="text-lg font-semibold">Friends</h1>
        {requests.length > 0 && (
          <span className="px-2 py-0.5 bg-indigo-600 text-white text-xs rounded-full font-medium">
            {requests.length} pending
          </span>
        )}
      </div>

      <div className="max-w-2xl mx-auto px-8 py-8">
        {/* Add friend form */}
        <div className="mb-8 p-5 bg-[#0D1035] border border-[#1B3066] rounded-xl">
          <h2 className="text-sm font-semibold text-white mb-3">Add Friend</h2>
          <p className="text-[#6B7399] text-xs mb-4">Add someone by their exact username.</p>
          {error && <div className="mb-3 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">{error}</div>}
          {success && <div className="mb-3 p-3 bg-green-500/10 border border-green-500/30 rounded-lg text-green-400 text-sm">{success}</div>}
          <form onSubmit={handleSendRequest} className="flex gap-3">
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              placeholder="Enter username"
              className="flex-1 px-4 py-2 bg-[#080B2A] border border-[#1B3066] rounded-lg text-white placeholder-[#6B7399] focus:outline-none focus:border-[#a855f7] transition text-sm"
            />
            <button type="submit"
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 rounded-lg text-sm font-medium transition">
              Send Request
            </button>
          </form>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-6 bg-[#0D1035] p-1 rounded-lg border border-[#1B3066]">
          <button
            onClick={() => setTab("friends")}
            className={`flex-1 py-2 text-sm font-medium rounded-md transition ${tab === "friends" ? "bg-indigo-600 text-white" : "text-[#6B7399] hover:text-white"}`}
          >
            Friends {friends.length > 0 && `(${friends.length})`}
          </button>
          <button
            onClick={() => setTab("requests")}
            className={`flex-1 py-2 text-sm font-medium rounded-md transition ${tab === "requests" ? "bg-indigo-600 text-white" : "text-[#6B7399] hover:text-white"}`}
          >
            Pending {requests.length > 0 && `(${requests.length})`}
          </button>
        </div>

        {loading ? (
          <p className="text-[#6B7399] text-sm">Loading...</p>
        ) : tab === "friends" ? (
          friends.length === 0 ? (
            <div className="text-center py-16 text-[#6B7399]">
              <p className="text-3xl mb-3">👥</p>
              <p className="text-sm">No friends yet — add someone above!</p>
            </div>
          ) : (
            <div className="space-y-2">
              {friends.map((friend) => (
                <div key={friend.id}
                  className="flex items-center gap-3 p-4 bg-[#0D1035] border border-[#1B3066] rounded-xl hover:border-[#6B7399] transition">
                  <div className="relative">
                    <UserAvatar user={friend} />
                    <span className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-[#0D1035] ${onlineUsers.includes(friend.id) ? "bg-green-400" : "bg-[#3d4670]"}`} />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-white">{friend.username}</p>
                    <p className="text-xs text-[#6B7399]">{onlineUsers.includes(friend.id) ? "Online" : "Offline"}</p>
                  </div>
                  <button
                    onClick={() => navigate(`/dm/${friend.id}`)}
                    className="px-3 py-1.5 bg-[#1B3066]/30 hover:bg-[#2a4080] text-[#b8bdd8] hover:text-white border border-[#a855f7]/30 hover:border-[#a855f7] rounded-lg text-xs font-medium transition"
                  >
                    Message
                  </button>
                </div>
              ))}
            </div>
          )
        ) : (
          requests.length === 0 ? (
            <div className="text-center py-16 text-[#6B7399]">
              <p className="text-3xl mb-3">📬</p>
              <p className="text-sm">No pending requests</p>
            </div>
          ) : (
            <div className="space-y-2">
              {requests.map((request) => (
                <div key={request.id}
                  className="flex items-center gap-3 p-4 bg-[#0D1035] border border-[#1B3066] rounded-xl">
                  <UserAvatar user={request.sender} />
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-white">{request.sender.username}</p>
                    <p className="text-xs text-[#6B7399]">Sent you a friend request</p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleAccept(request)}
                      className="px-3 py-1.5 bg-green-600 hover:bg-green-500 text-white rounded-lg text-xs font-medium transition"
                    >
                      Accept
                    </button>
                    <button
                      onClick={() => handleDecline(request.id)}
                      className="px-3 py-1.5 bg-[#111540] hover:bg-red-600/20 text-[#6B7399] hover:text-red-400 rounded-lg text-xs font-medium transition"
                    >
                      Decline
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )
        )}
      </div>
    </div>
  );
};

export default FriendsPage;