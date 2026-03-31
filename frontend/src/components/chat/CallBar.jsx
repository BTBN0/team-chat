const CallBar = ({ inCall, isMuted, callParticipants, onJoin, onLeave, onToggleMute }) => {
  if (!inCall) {
    return (
      <div className="px-6 py-2 bg-[#080B2A] border-b border-[#1B3066] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-slate-500" />
          <span className="text-slate-500 text-xs">No active call</span>
        </div>
        <button
          onClick={onJoin}
          className="px-3 py-1 bg-green-600 hover:bg-green-500 text-white text-xs font-medium rounded-lg transition"
        >
          📞 Start Call
        </button>
      </div>
    );
  }

  return (
    <div className="px-6 py-2 bg-green-900/20 border-b border-green-700/30 flex items-center justify-between">
      {/* Left — call status + participants */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
          <span className="text-green-400 text-xs font-medium">Call active</span>
        </div>

        {callParticipants.length > 0 && (
          <div className="flex items-center gap-1">
            {callParticipants.map((p) => (
              <span
                key={p.socketId}
                className="text-xs px-2 py-0.5 bg-green-800/40 text-green-300 rounded-full"
              >
                {p.username}
              </span>
            ))}
          </div>
        )}

        {callParticipants.length === 0 && (
          <span className="text-slate-500 text-xs">Waiting for others...</span>
        )}
      </div>

      {/* Right — controls */}
      <div className="flex items-center gap-2">
        <button
          onClick={onToggleMute}
          className={`px-3 py-1 text-xs font-medium rounded-lg transition ${
            isMuted
              ? "bg-red-600/20 border border-red-500/50 text-red-400 hover:bg-red-600/30"
              : "bg-[#1B3066] text-[#b8bdd8] hover:bg-[#2a4080]"
          }`}
        >
          {isMuted ? "🔇 Unmute" : "🎙️ Mute"}
        </button>

        <button
          onClick={onLeave}
          className="px-3 py-1 bg-red-600 hover:bg-red-500 text-white text-xs font-medium rounded-lg transition"
        >
          📵 Leave
        </button>
      </div>
    </div>
  );
};

export default CallBar;