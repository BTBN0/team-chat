import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

const features = [
  { icon: "💬", title: "Real-time messaging", desc: "Instant messages with reactions, edits, pins and file sharing" },
  { icon: "📞", title: "Voice calls", desc: "Crystal clear audio calls — channel or direct, no lag" },
  { icon: "👥", title: "Team workspaces", desc: "Organize your team with channels, roles and invite codes" },
  { icon: "🔔", title: "Smart notifications", desc: "Native push alerts, DM toasts and mention highlights" },
];

const LandingPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [visible, setVisible] = useState(false);
  const [featuresVisible, setFeaturesVisible] = useState(false);

  useEffect(() => {
    if (user) { navigate("/dashboard"); return; }
    const t1 = setTimeout(() => setVisible(true), 100);
    const t2 = setTimeout(() => setFeaturesVisible(true), 600);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [user]);

  return (
    <div style={{ background: "var(--bg)", minHeight: "100vh", overflowY: "auto", overflowX: "hidden" }}>
      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-12px); }
        }
        @keyframes pulse-ring {
          0% { transform: scale(0.8); opacity: 1; }
          100% { transform: scale(2); opacity: 0; }
        }
        @keyframes shimmer {
          0% { background-position: -200% center; }
          100% { background-position: 200% center; }
        }
        @keyframes slide-up {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .feature-card {
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: 14px;
          padding: 20px;
          transition: all 0.2s;
        }
        .feature-card:hover {
          background: var(--surface2);
          border-color: var(--border2);
          transform: translateY(-3px);
          box-shadow: 0 12px 32px rgba(0,0,0,0.3);
        }
        .btn-primary {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 12px 24px;
          background: var(--text);
          color: var(--bg);
          border: none;
          border-radius: 10px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          font-family: 'Inter', sans-serif;
          transition: all 0.15s;
        }
        .btn-primary:hover { opacity: 0.9; transform: translateY(-1px); box-shadow: 0 8px 24px rgba(255,255,255,0.1); }
        .btn-secondary {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 12px 24px;
          background: transparent;
          color: var(--text3);
          border: 1px solid var(--border2);
          border-radius: 10px;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          font-family: 'Inter', sans-serif;
          transition: all 0.15s;
        }
        .btn-secondary:hover { border-color: var(--text5); color: var(--text); }
        .mock-msg {
          display: flex;
          align-items: flex-start;
          gap: 10px;
          padding: 6px 0;
          animation: slide-up 0.4s ease forwards;
          opacity: 0;
        }
      `}</style>

      {/* Nav */}
      <nav style={{ position: "fixed", top: 0, left: 0, right: 0, zIndex: 50, height: 56, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 40px", background: "rgba(9,9,11,0.8)", backdropFilter: "blur(20px)", borderBottom: "1px solid var(--border)", transition: "all 0.3s", opacity: visible ? 1 : 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 30, height: 30, borderRadius: 9, background: "linear-gradient(135deg,#1B3066,#2a4080)", border: "1px solid var(--border2)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: "var(--text)" }}>AS</span>
          </div>
          <span style={{ fontSize: 15, fontWeight: 700, color: "var(--text)", letterSpacing: -0.3 }}>AuraSync</span>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button className="btn-secondary" style={{ padding: "7px 16px", fontSize: 13 }} onClick={() => navigate("/login")}>Sign in</button>
          <button className="btn-primary" style={{ padding: "7px 16px", fontSize: 13 }} onClick={() => navigate("/register")}>Get started →</button>
        </div>
      </nav>

      {/* Hero */}
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "80px 24px 40px", position: "relative", overflow: "hidden" }}>
        {/* Background orbs */}
        <div style={{ position: "absolute", inset: 0, overflow: "hidden", pointerEvents: "none" }}>
          <div style={{ position: "absolute", width: 600, height: 600, borderRadius: "50%", background: "radial-gradient(circle,rgba(255,255,255,0.02) 0%,transparent 70%)", top: "10%", left: "50%", transform: "translateX(-50%)" }} />
          <div style={{ position: "absolute", width: 1, height: "100%", background: "linear-gradient(to bottom, transparent, rgba(255,255,255,0.03), transparent)", left: "50%", top: 0 }} />
        </div>

        <div style={{ textAlign: "center", maxWidth: 640, position: "relative", zIndex: 1 }}>
          {/* Badge */}
          <div style={{ display: "inline-flex", alignItems: "center", gap: 7, padding: "5px 12px", background: "var(--surface2)", border: "1px solid var(--border2)", borderRadius: 20, marginBottom: 28, opacity: visible ? 1 : 0, transform: visible ? "translateY(0)" : "translateY(20px)", transition: "all 0.5s ease 0.1s" }}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--green)", animation: "pulse-ring 1.5s ease-out infinite", display: "inline-block" }} />
            <span style={{ fontSize: 12, color: "var(--text3)", fontWeight: 500 }}>Now in beta — join for free</span>
          </div>

          {/* Headline */}
          <h1 style={{ fontSize: 56, fontWeight: 700, color: "var(--text)", lineHeight: 1.1, letterSpacing: -2, marginBottom: 20, opacity: visible ? 1 : 0, transform: visible ? "translateY(0)" : "translateY(30px)", transition: "all 0.6s ease 0.2s" }}>
            Where teams{" "}
            <span style={{ background: "linear-gradient(135deg, var(--text), var(--text3))", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
              actually talk
            </span>
          </h1>

          <p style={{ fontSize: 17, color: "var(--text4)", lineHeight: 1.7, marginBottom: 36, opacity: visible ? 1 : 0, transform: visible ? "translateY(0)" : "translateY(30px)", transition: "all 0.6s ease 0.3s" }}>
            AuraSync brings your team together — real-time messaging, voice calls, and smart notifications. No bloat. Just flow.
          </p>

          {/* CTAs */}
          <div style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap", marginBottom: 60, opacity: visible ? 1 : 0, transform: visible ? "translateY(0)" : "translateY(30px)", transition: "all 0.6s ease 0.4s" }}>
            <button className="btn-primary" onClick={() => navigate("/register")}>
              Start for free →
            </button>
            <button className="btn-secondary" onClick={() => navigate("/login")}>
              Sign in
            </button>
          </div>

          {/* Mock chat preview */}
          <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 16, overflow: "hidden", textAlign: "left", opacity: visible ? 1 : 0, transform: visible ? "translateY(0) scale(1)" : "translateY(40px) scale(0.96)", transition: "all 0.7s ease 0.5s", boxShadow: "0 32px 80px rgba(0,0,0,0.5)" }}>
            {/* Mock title bar */}
            <div style={{ height: 38, background: "var(--surface)", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", padding: "0 14px", gap: 7 }}>
              <div style={{ width: 11, height: 11, borderRadius: "50%", background: "#ff5f56" }} />
              <div style={{ width: 11, height: 11, borderRadius: "50%", background: "#ffbd2e" }} />
              <div style={{ width: 11, height: 11, borderRadius: "50%", background: "#27c93f" }} />
              <span style={{ flex: 1, textAlign: "center", fontSize: 11, color: "var(--text5)", marginRight: 46 }}># general</span>
            </div>
            {/* Mock messages */}
            <div style={{ padding: "16px 18px", display: "flex", flexDirection: "column", gap: 2 }}>
              {[
                { user: "bilguun", color: "linear-gradient(135deg,#3b82f6,#6366f1)", msg: "yo this new ui looks clean 🔥", delay: "0.7s" },
                { user: "gank1234", color: "linear-gradient(135deg,#8b5cf6,#ec4899)", msg: "zinc dark goes different ngl", delay: "0.9s" },
                { user: "bilguun", color: "linear-gradient(135deg,#3b82f6,#6366f1)", msg: "shipping this today 🚀", delay: "1.1s" },
              ].map((m, i) => (
                <div key={i} className="mock-msg" style={{ animationDelay: m.delay }}>
                  <div style={{ width: 28, height: 28, borderRadius: "50%", background: m.color, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, color: "#fff", flexShrink: 0 }}>
                    {m.user[0].toUpperCase()}
                  </div>
                  <div>
                    <span style={{ fontSize: 12, fontWeight: 600, color: "var(--text)", marginRight: 8 }}>{m.user}</span>
                    <span style={{ fontSize: 11, color: "var(--text5)" }}>today</span>
                    <p style={{ fontSize: 13, color: "var(--text3)", marginTop: 1 }}>{m.msg}</p>
                  </div>
                </div>
              ))}
            </div>
            {/* Mock input */}
            <div style={{ padding: "10px 14px", borderTop: "1px solid var(--border)", display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ flex: 1, background: "var(--surface2)", border: "1px solid var(--border2)", borderRadius: 8, padding: "7px 12px", fontSize: 12, color: "var(--text5)" }}>
                Message #general
              </div>
              <div style={{ padding: "7px 12px", background: "var(--text)", borderRadius: 8, fontSize: 12, fontWeight: 600, color: "var(--bg)" }}>Send</div>
            </div>
          </div>
        </div>
      </div>

      {/* Features */}
      <div style={{ maxWidth: 800, margin: "0 auto", padding: "40px 24px 80px" }}>
        <h2 style={{ fontSize: 28, fontWeight: 700, color: "var(--text)", textAlign: "center", marginBottom: 8, opacity: featuresVisible ? 1 : 0, transform: featuresVisible ? "translateY(0)" : "translateY(20px)", transition: "all 0.5s ease" }}>
          Everything your team needs
        </h2>
        <p style={{ fontSize: 14, color: "var(--text4)", textAlign: "center", marginBottom: 36, opacity: featuresVisible ? 1 : 0, transition: "all 0.5s ease 0.1s" }}>
          Built from the ground up for real collaboration
        </p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 12 }}>
          {features.map((f, i) => (
            <div
              key={i}
              className="feature-card"
              style={{ opacity: featuresVisible ? 1 : 0, transform: featuresVisible ? "translateY(0)" : "translateY(20px)", transition: `all 0.5s ease ${0.1 + i * 0.1}s` }}
            >
              <div style={{ fontSize: 24, marginBottom: 10 }}>{f.icon}</div>
              <h3 style={{ fontSize: 14, fontWeight: 600, color: "var(--text)", marginBottom: 5 }}>{f.title}</h3>
              <p style={{ fontSize: 12, color: "var(--text4)", lineHeight: 1.6 }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* CTA section */}
      <div style={{ borderTop: "1px solid var(--border)", padding: "60px 24px", textAlign: "center", opacity: featuresVisible ? 1 : 0, transition: "all 0.5s ease 0.5s" }}>
        <h2 style={{ fontSize: 28, fontWeight: 700, color: "var(--text)", marginBottom: 10 }}>Ready to sync up?</h2>
        <p style={{ fontSize: 14, color: "var(--text4)", marginBottom: 24 }}>Create your workspace in seconds. No credit card required.</p>
        <button className="btn-primary" onClick={() => navigate("/register")} style={{ fontSize: 14, padding: "12px 28px" }}>
          Create free account →
        </button>
      </div>

      {/* Footer */}
      <div style={{ borderTop: "1px solid var(--border)", padding: "20px 40px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ width: 22, height: 22, borderRadius: 6, background: "var(--surface2)", border: "1px solid var(--border2)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <span style={{ fontSize: 8, fontWeight: 700, color: "var(--text)" }}>AS</span>
          </div>
          <span style={{ fontSize: 12, color: "var(--text5)" }}>AuraSync</span>
        </div>
        <span style={{ fontSize: 11, color: "var(--text5)" }}>Built with ❤️</span>
      </div>
    </div>
  );
};

export default LandingPage;
