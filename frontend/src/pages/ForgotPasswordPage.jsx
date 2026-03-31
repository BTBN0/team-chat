import { useState } from "react";
import { Link } from "react-router-dom";
import api from "../api/axios.js";

const ForgotPasswordPage = () => {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [resetLink, setResetLink] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");
    setResetLink("");
    setLoading(true);

    try {
      const res = await api.post("/auth/forgot-password", { email });
      setMessage(res.data.message || "Reset link generated");
      setResetLink(res.data?.data?.resetLink || "");
    } catch (err) {
      setError(err.response?.data?.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center px-4">
      <div className="w-full max-w-md border border-zinc-800 bg-zinc-950 p-6 rounded-2xl shadow-xl">
        <h1 className="text-2xl font-bold mb-2">Forgot Password</h1>
        <p className="text-zinc-400 mb-6 text-sm">
          Email хаягаа оруул. Хүмүүс юмаа мартдаг, систем нь араас нь цэвэрлэдэг.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="email"
            placeholder="Enter your email"
            className="w-full rounded-xl bg-zinc-900 border border-zinc-800 px-4 py-3 outline-none focus:border-zinc-600"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-white text-black font-semibold py-3 disabled:opacity-60"
          >
            {loading ? "Sending..." : "Send Reset Link"}
          </button>
        </form>

        {message && (
          <div className="mt-4 rounded-xl border border-green-800 bg-green-950/40 p-3 text-green-300 text-sm">
            {message}
          </div>
        )}

        {resetLink && (
          <div className="mt-4 rounded-xl border border-zinc-800 bg-zinc-900 p-3 text-sm break-all">
            <p className="text-zinc-400 mb-2">Test reset link:</p>
            <a
              href={resetLink}
              className="text-blue-400 underline"
            >
              {resetLink}
            </a>
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

export default ForgotPasswordPage;