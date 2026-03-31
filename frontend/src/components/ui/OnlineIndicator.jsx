const OnlineIndicator = ({ isOnline }) => (
  <span className={`inline-block w-2.5 h-2.5 rounded-full flex-shrink-0 ${isOnline ? "bg-green-400" : "bg-slate-500"}`} />
);

export default OnlineIndicator;
