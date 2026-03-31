import { useMemo, useState } from "react";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import api from "../api/axios.js";

const ResetPasswordPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const token = useMemo(() => searchParams.get("token") || "", [searchParams]);

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");

    if (!token) {
      setError("Reset token not found");
      return;
    }

    if (!password || !confirmPassword) {
      setError("All fields are required");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setLoading(true);

    try {
      const res = await api.post("/auth/reset-password", {
        token,
        password,
      });

      setMessage(res.data.message || "Password reset successfully");

      setTimeout(() => {
        navigate("/login");
      }, 1500);
    } catch (err) {
      setError(err.response?.data?.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center px-4">
      <div className="w-full max-w-md border border-zinc-800 bg-zinc-950 p-6 rounded-2xl shadow-xl">
        <h1 className="text-2xl font-bold mb-2">Reset Password</h1>
        <p className="text-zinc-400 mb-6 text-sm">
          Шинэ password оруул. Энэ удаа марталгүй хадгалж үзээрэй, хүн төрөлхтөнд хэцүү л дээ.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="password"
            placeholder="New password"
            className="w-full rounded-xl bg-zinc-900 border border-zinc-800 px-4 py-3 outline-none focus:border-zinc-600"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          <input
            type="password"
            placeholder="Confirm new password"
            className="w-full rounded-xl bg-zinc-900 border border-zinc-800 px-4 py-3 outline-none focus:border-zinc-600"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
          />

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-white text-black font-semibold py-3 disabled:opacity-60"
          >
            {loading ? "Resetting..." : "Reset Password"}
          </button>
        </form>

        {message && (
          <div className="mt-4 rounded-xl border border-green-800 bg-green-950/40 p-3 text-green-300 text-sm">
            {message}
          </div>
        )}

        {error && (
          <div className="mt-4 rounded-xl border border-red-800 bg-red-950/40 p-3 text-red-300 text-sm">
            {error}
          </div>
        )}

        <div className="mt-6 text-sm text-zinc-400">
          <Link to="/login" className="text-white underline">
            Back to login
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ResetPasswordPage;