const Avatar = ({ username, size = "md" }) => {
  const sizes = { sm: "w-7 h-7 text-xs", md: "w-9 h-9 text-sm", lg: "w-11 h-11 text-base" };
  const colors = ["bg-indigo-600", "bg-purple-600", "bg-pink-600", "bg-blue-600", "bg-teal-600", "bg-green-600"];
  const color = colors[username?.charCodeAt(0) % colors.length] || "bg-indigo-600";
  return (
    <div className={`${sizes[size]} ${color} rounded-full flex items-center justify-center text-white font-semibold flex-shrink-0`}>
      {username?.[0]?.toUpperCase() || "?"}
    </div>
  );
};

export default Avatar;
