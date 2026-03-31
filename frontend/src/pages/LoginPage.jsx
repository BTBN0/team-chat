import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { GoogleLogin } from "@react-oauth/google";
import { useAuth } from "../context/AuthContext.jsx";
import { useTheme } from "../context/ThemeContext.jsx";
import { useCursor } from "../hooks/useCursor.js";
import api from "../api/axios.js";

const LoginPage = () => {
  const { loginWithToken } = useAuth();
  const { theme, toggle }  = useTheme();
  const navigate = useNavigate();
  useCursor(theme);

  useEffect(() => {
    document.body.classList.add("cursor-none");
    return () => document.body.classList.remove("cursor-none");
  }, []);

  const [email,   setEmail]   = useState("");
  const [error,   setError]   = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const isDark = theme === "dark";

  const P = {
    bg:       isDark ? "#080B2A" : "#F0F0F5",
    surface:  isDark ? "#0D1035" : "#ffffff",
    surface2: isDark ? "#111540" : "#f0f0f8",
    border:   isDark ? "#1B3066" : "#c8c8dc",
    border2:  isDark ? "#2a4080" : "#b0b0cc",
    text:     isDark ? "#F0F0F5" : "#080B2A",
    text2:    isDark ? "#b8bdd8" : "#1B3066",
    muted:    isDark ? "#6B7399" : "#6B7399",
  };

  // Hover state: slate-blue glow #6B7399
  const hoverBg   = isDark ? "rgba(107,115,153,0.18)" : "rgba(107,115,153,0.1)";
  const hoverBd   = "#6B7399";
  const hoverText = isDark ? "#F0F0F5" : "#080B2A";

  const handleGoogleSuccess = async (credentialResponse) => {
    try {
      setError(""); setLoading(true);
      const res = await api.post("/auth/google", { credential: credentialResponse.credential });
      const { token, user } = res.data.data;
      loginWithToken(token, user);
      navigate("/dashboard");
    } catch (err) {
      setError(err.response?.data?.message || "Google нэвтрэлт амжилтгүй");
    } finally { setLoading(false); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(""); setSuccess("");
    if (!email.includes("@")) return setError("Имэйл буруу байна.");
    setLoading(true);
    try {
      const res = await api.post("/auth/login", { email });
      const { token, user } = res.data.data;
      loginWithToken(token, user);
      navigate("/dashboard");
    } catch (err) {
      setError(err.response?.data?.message || "Нэвтрэх амжилтгүй.");
    } finally { setLoading(false); }
  };

  return (
    <div style={{ minHeight:"100dvh", display:"flex", alignItems:"center", justifyContent:"center",
      background: P.bg, padding:16, position:"relative", transition:"background .25s ease" }}>

      {/* Theme toggle */}
      <button onClick={toggle} style={{
        position:"fixed", top:16, right:16, zIndex:50,
        display:"flex", alignItems:"center", gap:8,
        padding:"8px 14px", borderRadius:999,
        background: P.surface, border:`1px solid ${P.border2}`,
        color: P.muted, fontSize:12, fontWeight:500, cursor:"none",
        transition:"all .15s",
      }}
        onMouseEnter={e=>{e.currentTarget.style.borderColor=hoverBd;e.currentTarget.style.color=hoverText;e.currentTarget.style.background=hoverBg;}}
        onMouseLeave={e=>{e.currentTarget.style.borderColor=P.border2;e.currentTarget.style.color=P.muted;e.currentTarget.style.background=P.surface;}}
      >
        {isDark
          ? <><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>Light</>
          : <><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"/></svg>Dark</>
        }
      </button>

      {/* Card */}
      <div style={{
        width:"100%", maxWidth:880, display:"flex",
        borderRadius:18, overflow:"hidden",
        boxShadow: isDark
          ? "0 32px 80px rgba(8,11,42,0.8), 0 0 0 1px rgba(27,48,102,0.5)"
          : "0 8px 48px rgba(8,11,42,0.12), 0 1px 4px rgba(8,11,42,0.06)",
        border:`1px solid ${P.border}`,
        animation:"fadeUp .4s cubic-bezier(0.22,1,0.36,1) both",
      }}>

        {/* Left — branding */}
        <div style={{
          flex:1, display:"flex", flexDirection:"column", justifyContent:"space-between",
          padding:48, position:"relative", overflow:"hidden",
          background:"linear-gradient(145deg,#080B2A 0%,#0D1240 45%,#0a1a50 100%)",
        }}>
          <div style={{position:"absolute",inset:0,pointerEvents:"none"}}>
            <div style={{position:"absolute",top:"10%",left:"15%",width:340,height:340,borderRadius:"50%",background:"radial-gradient(circle,rgba(27,48,102,0.6) 0%,transparent 70%)"}}/>
            <div style={{position:"absolute",bottom:"15%",right:"5%",width:260,height:260,borderRadius:"50%",background:"radial-gradient(circle,rgba(107,115,153,0.2) 0%,transparent 70%)"}}/>
          </div>

          <div style={{position:"relative",zIndex:1}}>
            <div style={{width:56,height:56,borderRadius:14,marginBottom:24,display:"flex",alignItems:"center",justifyContent:"center",
              background:"linear-gradient(135deg,#1B3066,#2a4080,#6B7399)",
              boxShadow:"0 4px 20px rgba(27,48,102,0.5)"}}>
              <svg viewBox="0 0 56 56" width="56" height="56" fill="none">
                <circle cx="28" cy="28" r="11" fill="rgba(240,240,245,0.2)"/>
                <circle cx="28" cy="28" r="5.5" fill="rgba(240,240,245,0.92)"/>
                <circle cx="28" cy="13" r="3" fill="rgba(240,240,245,0.5)"/>
                <circle cx="28" cy="43" r="3" fill="rgba(240,240,245,0.5)"/>
                <circle cx="13" cy="28" r="3" fill="rgba(240,240,245,0.5)"/>
                <circle cx="43" cy="28" r="3" fill="rgba(240,240,245,0.5)"/>
                <circle cx="17.5" cy="17.5" r="2" fill="rgba(240,240,245,0.3)"/>
                <circle cx="38.5" cy="38.5" r="2" fill="rgba(240,240,245,0.3)"/>
                <circle cx="38.5" cy="17.5" r="2" fill="rgba(240,240,245,0.3)"/>
                <circle cx="17.5" cy="38.5" r="2" fill="rgba(240,240,245,0.3)"/>
              </svg>
            </div>
            <h1 style={{fontFamily:"'Syne',sans-serif",fontSize:48,fontWeight:900,letterSpacing:"0.22em",lineHeight:1,color:"#F0F0F5",marginBottom:4}}>
              AURA
            </h1>
            <p style={{fontSize:13,color:"#6B7399"}}>Таны дотоод харилцааны орон зай</p>
          </div>

          <div style={{position:"relative",zIndex:1,animation:"fadeUp .4s ease .5s both"}}>
            <div style={{position:"relative",display:"flex",alignItems:"flex-end",justifyContent:"center",gap:24,marginBottom:16,height:120}}>

              {/* User A */}
              <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:4}}>
                <div style={{position:"relative"}}>
                  <div style={{width:40,height:40,borderRadius:"50%",background:"linear-gradient(135deg,#1B3066,#2a4080)",color:"#F0F0F5",display:"flex",alignItems:"center",justifyContent:"center",fontSize:14,fontWeight:700}}>A</div>
                  <span style={{position:"absolute",bottom:-2,right:-2,width:12,height:12,borderRadius:"50%",background:"#22c55e",border:"2px solid #080B2A"}}/>
                </div>
                <div style={{width:56,height:64,borderRadius:"12px 12px 0 0",display:"flex",alignItems:"center",justifyContent:"center",background:"linear-gradient(180deg,rgba(27,48,102,0.4),rgba(27,48,102,0.05))"}}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="rgba(240,240,245,0.4)" strokeWidth="1.5"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>
                </div>
              </div>

              {/* Messages */}
              <div style={{display:"flex",flexDirection:"column",gap:8,flex:1,maxWidth:140}}>
                <div style={{alignSelf:"flex-start",padding:"6px 12px",borderRadius:"12px 12px 12px 2px",fontSize:12,
                  background:"rgba(27,48,102,0.6)",color:"#F0F0F5",border:"1px solid rgba(107,115,153,0.3)",
                  animation:"fadeUp .4s ease .7s both"}}>Сайн байна уу! 👋</div>
                <div style={{alignSelf:"flex-end",padding:"6px 12px",borderRadius:"12px 12px 2px 12px",fontSize:12,
                  background:"rgba(107,115,153,0.25)",color:"#F0F0F5",border:"1px solid rgba(107,115,153,0.2)",
                  animation:"fadeUp .4s ease .9s both"}}>Сайн! Та яаж байна? 😊</div>
                <div style={{display:"flex",gap:4,paddingLeft:8,animation:"fadeUp .4s ease 1.1s both"}}>
                  {[0,1,2].map(i=><span key={i} style={{width:6,height:6,borderRadius:"50%",background:"#6B7399",animation:`bounce 1s ${i*0.15}s infinite`}}/>)}
                </div>
              </div>

              {/* User B */}
              <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:4}}>
                <div style={{position:"relative"}}>
                  <div style={{width:40,height:40,borderRadius:"50%",background:"linear-gradient(135deg,#6B7399,#1B3066)",color:"#F0F0F5",display:"flex",alignItems:"center",justifyContent:"center",fontSize:14,fontWeight:700}}>B</div>
                  <span style={{position:"absolute",bottom:-2,right:-2,width:12,height:12,borderRadius:"50%",background:"#22c55e",border:"2px solid #080B2A"}}/>
                </div>
                <div style={{width:56,height:64,borderRadius:"12px 12px 0 0",display:"flex",alignItems:"center",justifyContent:"center",background:"linear-gradient(180deg,rgba(107,115,153,0.3),rgba(107,115,153,0.05))"}}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="rgba(240,240,245,0.4)" strokeWidth="1.5"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>
                </div>
              </div>
            </div>
            <p style={{textAlign:"center",fontSize:12,color:"rgba(107,115,153,0.5)"}}>
              AURA — Хаана ч, хэзээ ч холбогдоорой
            </p>
          </div>
        </div>

        {/* Right — form */}
        <div style={{
          width:400, flexShrink:0,
          background: isDark ? "#0D1035" : "#fff",
          display:"flex", alignItems:"center", padding:"40px 40px",
          borderLeft:`1px solid ${P.border}`,
        }}>
          <div style={{width:"100%"}}>

            {/* macOS dots */}
            <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:32}}>
              <div style={{width:12,height:12,borderRadius:"50%",background:"#ff5f56"}}/>
              <div style={{width:12,height:12,borderRadius:"50%",background:"#ffbd2e"}}/>
              <div style={{width:12,height:12,borderRadius:"50%",background:"#27c93f"}}/>
            </div>

            <div style={{marginBottom:28}}>
              <h2 style={{fontFamily:"'Syne',sans-serif",fontSize:24,fontWeight:700,letterSpacing:"-0.02em",color:P.text,marginBottom:4}}>
                Тавтай морил 👋
              </h2>
              <p style={{fontSize:13,color:P.muted}}>Workspace руугаа нэвтрэх</p>
            </div>

            {/* Google Login button */}
            {loading ? (
              <div style={{display:"flex",alignItems:"center",justifyContent:"center",gap:8,
                padding:"12px 16px",borderRadius:12,marginBottom:20,
                border:`1px solid ${P.border2}`,background:isDark?"#111540":"#f5f5f5",
                color:P.muted,fontSize:14,fontWeight:600}}>
                <svg style={{animation:"spinSlow 1.2s linear infinite"}} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" strokeOpacity="0.3"/><path d="M12 2a10 10 0 0110 10"/>
                </svg>
                Нэвтэрч байна…
              </div>
            ) : (
              <div style={{marginBottom:20}}>
                <GoogleLogin
                  onSuccess={handleGoogleSuccess}
                  onError={() => setError("Google нэвтрэлт амжилтгүй")}
                  width={320}
                  theme={isDark ? "filled_black" : "outline"}
                  size="large"
                  text="continue_with"
                  shape="rectangular"
                />
              </div>
            )}

            {/* Divider */}
            <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:20}}>
              <div style={{flex:1,height:1,background:P.border}}/>
              <span style={{fontSize:11,color:P.muted}}>эсвэл имэйлээр</span>
              <div style={{flex:1,height:1,background:P.border}}/>
            </div>

            {/* Email form */}
            <form onSubmit={handleSubmit} style={{display:"flex",flexDirection:"column",gap:14}}>
              <div>
                <label style={{display:"block",fontSize:11,fontWeight:600,letterSpacing:"0.06em",textTransform:"uppercase",color:P.muted,marginBottom:6}}>
                  Имэйл
                </label>
                <div style={{position:"relative"}}>
                  <svg style={{position:"absolute",left:12,top:"50%",transform:"translateY(-50%)",color:P.muted}} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                    <polyline points="22,6 12,13 2,6"/>
                  </svg>
                  <input type="email" placeholder="name@example.com"
                    value={email}
                    onChange={e=>{setEmail(e.target.value);setError("");setSuccess("");}}
                    autoComplete="email"
                    style={{
                      width:"100%", padding:"10px 12px 10px 36px",
                      borderRadius:10, border:`1px solid ${P.border2}`,
                      background:isDark?"#111540":"#F0F0F5",
                      color:P.text, fontSize:14, outline:"none", boxSizing:"border-box",
                      transition:"border-color .15s, box-shadow .15s", cursor:"none",
                    }}
                    onFocus={e=>{e.target.style.borderColor="#6B7399";e.target.style.boxShadow="0 0 0 3px rgba(107,115,153,0.2)";}}
                    onBlur={e=>{e.target.style.borderColor=P.border2;e.target.style.boxShadow="none";}}
                  />
                </div>
              </div>

              {error && (
                <div style={{display:"flex",alignItems:"center",gap:8,padding:"10px 12px",borderRadius:10,
                  background:"rgba(239,68,68,0.08)",border:"1px solid rgba(239,68,68,0.25)",
                  color:"#f87171",fontSize:13,animation:"slideDown .2s ease both"}}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                  {error}
                </div>
              )}
              {success && (
                <div style={{display:"flex",alignItems:"center",gap:8,padding:"10px 12px",borderRadius:10,
                  background:"rgba(34,197,94,0.08)",border:"1px solid rgba(34,197,94,0.25)",
                  color:"#4ade80",fontSize:13,animation:"slideDown .2s ease both"}}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><polyline points="9 12 11 14 15 10"/></svg>
                  {success}
                </div>
              )}

              <button type="submit" disabled={loading} style={{
                display:"flex", alignItems:"center", justifyContent:"center", gap:8,
                padding:"12px 20px", borderRadius:10, border:"none",
                background:"linear-gradient(135deg,#1B3066,#2a4080)",
                color:"#F0F0F5", fontSize:14, fontWeight:600,
                cursor:loading?"not-allowed":"none", opacity:loading?0.5:1,
                transition:"all .2s",
                boxShadow:"0 4px 16px rgba(27,48,102,0.4)",
              }}
                onMouseEnter={e=>{if(!loading){e.currentTarget.style.background="linear-gradient(135deg,#2a4080,#6B7399)";e.currentTarget.style.boxShadow="0 6px 20px rgba(107,115,153,0.4)";e.currentTarget.style.transform="translateY(-1px)";}}}
                onMouseLeave={e=>{e.currentTarget.style.background="linear-gradient(135deg,#1B3066,#2a4080)";e.currentTarget.style.boxShadow="0 4px 16px rgba(27,48,102,0.4)";e.currentTarget.style.transform="none";}}
              >
                {loading
                  ? <><svg style={{animation:"spinSlow 1.2s linear infinite"}} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" strokeOpacity="0.3"/><path d="M12 2a10 10 0 0110 10"/></svg>Түр хүлээнэ үү…</>
                  : <>Нэвтрэх <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg></>
                }
              </button>
            </form>
          </div>
        </div>
      </div>

      <canvas id="particle-canvas" style={{position:"fixed",top:0,left:0,width:"100vw",height:"100vh",pointerEvents:"none",zIndex:99999,display:"block"}}/>
    </div>
  );
};

export default LoginPage;
