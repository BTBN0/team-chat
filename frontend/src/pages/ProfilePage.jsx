import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { useTheme } from "../context/ThemeContext.jsx";

const STATUSES = [
  { key:"online",  label:"Online",  dot:"#22c55e", bg:"rgba(34,197,94,0.12)",  bd:"rgba(34,197,94,0.3)" },
  { key:"away",    label:"Away",    dot:"#f59e0b", bg:"rgba(245,158,11,0.12)", bd:"rgba(245,158,11,0.3)" },
  { key:"busy",    label:"Busy",    dot:"#ef4444", bg:"rgba(239,68,68,0.12)",  bd:"rgba(239,68,68,0.3)" },
  { key:"offline", label:"Offline", dot:"#6B7399", bg:"rgba(107,115,153,0.1)", bd:"rgba(107,115,153,0.25)" },
];

const COVERS = [
  { id:"navy",   v:"linear-gradient(135deg,#080B2A,#1B3066,#2a4080)" },
  { id:"slate",  v:"linear-gradient(135deg,#1B3066,#6B7399,#b8bdd8)" },
  { id:"violet", v:"linear-gradient(135deg,#4c1d95,#7c3aed,#a855f7)" },
  { id:"ocean",  v:"linear-gradient(135deg,#0c4a6e,#0ea5e9,#38bdf8)" },
  { id:"forest", v:"linear-gradient(135deg,#14532d,#16a34a,#4ade80)" },
  { id:"fire",   v:"linear-gradient(135deg,#7c2d12,#f97316,#fbbf24)" },
  { id:"rose",   v:"linear-gradient(135deg,#881337,#f43f5e,#fb7185)" },
  { id:"aurora", v:"linear-gradient(135deg,#1B3066,#6B7399,#f0abfc)" },
];

const SKINS = [
  {bg:"#FDDBB4",fg:"#8B5E3C"},{bg:"#F5C99A",fg:"#7A4A2A"},
  {bg:"#E8A87C",fg:"#6B3820"},{bg:"#C68642",fg:"#3E1F00"},
  {bg:"#8D5524",fg:"#FFD5A8"},{bg:"#4A2912",fg:"#F5C99A"},
  {bg:"#DBEAFE",fg:"#1D4ED8"},{bg:"#EDE9FE",fg:"#7C3AED"},
  {bg:"#FCE7F3",fg:"#BE185D"},{bg:"#D1FAE5",fg:"#065F46"},
];

const API_BASE = (import.meta.env.VITE_API_URL||"http://localhost:3001/api").replace("/api","");

export default function ProfilePage({ onClose }) {
  const { user, logout, profile, saveProfile, updateProfile, updateAvatar } = useAuth();
  const { theme, toggle } = useTheme();
  const navigate = useNavigate();

  // close: use onClose prop if provided (modal mode), else navigate back (route mode)
  const handleClose = () => onClose ? onClose() : navigate(-1);
  const isDark = theme === "dark";

  const [username, setUsername] = useState(user?.username??"");
  const [bio,      setBio]      = useState(profile.bio??"");
  const [status,   setStatus]   = useState(profile.status??"online");
  const [coverId,  setCoverId]  = useState(profile.coverId??"navy");
  const [skinIdx,  setSkinIdx]  = useState(profile.skinIdx??0);
  const [avatarUrl,setAvatarUrl]= useState(
    user?.avatar?(user.avatar.startsWith("http")?user.avatar:API_BASE+user.avatar):null
  );
  const [editing,  setEditing]  = useState(false);
  const [saving,   setSaving]   = useState(false);
  const [saved,    setSaved]    = useState(false);
  const [showSkins,setShowSkins]= useState(false);
  const [error,    setError]    = useState("");
  const avatarRef = useRef(null);

  useEffect(()=>{ if(user?.username) setUsername(user.username); },[user?.username]);

  const skin  = SKINS[skinIdx]||SKINS[0];
  const cover = COVERS.find(c=>c.id===coverId)?.v||COVERS[0].v;
  const stObj = STATUSES.find(s=>s.key===status)||STATUSES[0];
  const initials = user?.username?.slice(0,2).toUpperCase()||"??";

  // Dark/Light palette
  const P = {
    bg:       isDark ? "#080B2A"   : "#F0F0F5",
    card:     isDark ? "#0D1035"   : "#ffffff",
    card2:    isDark ? "#111540"   : "#f4f4fb",
    border:   isDark ? "#1B3066"   : "#c8c8dc",
    border2:  isDark ? "#2a4080"   : "#b0b0cc",
    text:     isDark ? "#F0F0F5"   : "#080B2A",
    text2:    isDark ? "#b8bdd8"   : "#1B3066",
    muted:    isDark ? "#6B7399"   : "#6B7399",
    inputBg:  isDark ? "#080B2A"   : "#F0F0F5",
    hoverBg:  isDark ? "rgba(107,115,153,0.15)" : "rgba(27,48,102,0.07)",
    shadow:   isDark
      ? "0 32px 80px rgba(8,11,42,0.8), 0 0 0 1px rgba(27,48,102,0.4)"
      : "0 8px 48px rgba(8,11,42,0.12), 0 1px 4px rgba(8,11,42,0.06)",
  };

  const inputStyle = {
    width:"100%", padding:"9px 12px", borderRadius:10, boxSizing:"border-box",
    border:`1px solid ${P.border2}`, background:P.inputBg, color:P.text,
    fontSize:13, outline:"none", transition:"border-color .15s, box-shadow .15s",
    fontFamily:"inherit",
  };
  const labelStyle = {
    fontSize:10, fontWeight:700, letterSpacing:"0.07em",
    textTransform:"uppercase", color:P.muted, marginBottom:6, display:"block",
  };
  const onFocus = e=>{ e.target.style.borderColor="#6B7399"; e.target.style.boxShadow="0 0 0 3px rgba(107,115,153,0.15)"; };
  const onBlur  = e=>{ e.target.style.borderColor=P.border2; e.target.style.boxShadow="none"; };

  const handleAvatarChange = async (e) => {
    const file = e.target.files?.[0]; if(!file) return;
    setAvatarUrl(URL.createObjectURL(file));
    const r = await updateAvatar(file);
    if(r.ok&&r.avatarUrl) setAvatarUrl(r.avatarUrl.startsWith("http")?r.avatarUrl:API_BASE+r.avatarUrl);
  };

  const handleSave = async (e) => {
    e.preventDefault(); setError(""); setSaving(true);
    try {
      if(username.trim()&&username.trim()!==user?.username){
        const r = await updateProfile({username:username.trim()});
        if(!r.ok){ setError(r.error); return; }
      }
      saveProfile({bio,status,coverId,skinIdx});
      await new Promise(r=>setTimeout(r,250));
      setSaved(true); setEditing(false);
      setTimeout(()=>setSaved(false),2000);
    } finally { setSaving(false); }
  };

  return (
    <div style={{
      position:"fixed", inset:0, zIndex:200,
      display:"flex", alignItems:"center", justifyContent:"center",
      background: isDark ? "rgba(8,11,42,0.75)" : "rgba(8,11,42,0.4)",
      backdropFilter:"blur(6px)",
      animation:"fadeIn .2s ease both",
      padding:16,
    }}
      onClick={e=>{ if(e.target===e.currentTarget) handleClose(); }}
    >
      <div style={{
        width:"100%", maxWidth:400, borderRadius:24,
        background:P.card, border:`1px solid ${P.border}`,
        boxShadow:P.shadow,
        maxHeight:"92vh", display:"flex", flexDirection:"column",
        animation:"fadeUp .3s cubic-bezier(0.22,1,0.36,1) both",
        overflow:"hidden",
      }}>

        {/* Top bar */}
        <div style={{
          display:"flex", alignItems:"center", gap:10,
          padding:"14px 18px 10px",
          borderBottom:`1px solid ${P.border}`, flexShrink:0,
        }}>
          <button onClick={handleClose} style={{
            display:"flex", alignItems:"center", gap:6,
            background:"none", border:"none", cursor:"pointer",
            color:P.muted, fontSize:12, padding:"4px 8px",
            borderRadius:8, transition:"all .15s",
          }}
            onMouseEnter={e=>{e.currentTarget.style.color=P.text;e.currentTarget.style.background=P.hoverBg;}}
            onMouseLeave={e=>{e.currentTarget.style.color=P.muted;e.currentTarget.style.background="none";}}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/>
            </svg>
            Буцах
          </button>
          <span style={{fontSize:13,fontWeight:600,color:P.text,flex:1}}>Профайл</span>
          {/* Theme toggle */}
          <button onClick={toggle} style={{
            display:"flex", alignItems:"center", gap:6,
            background:P.hoverBg, border:`1px solid ${P.border}`,
            color:P.muted, fontSize:11, fontWeight:500,
            padding:"5px 10px", borderRadius:20, cursor:"pointer",
            transition:"all .15s",
          }}
            onMouseEnter={e=>{e.currentTarget.style.borderColor="#6B7399";e.currentTarget.style.color=P.text;}}
            onMouseLeave={e=>{e.currentTarget.style.borderColor=P.border;e.currentTarget.style.color=P.muted;}}>
            {isDark
              ? <><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>Light</>
              : <><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"/></svg>Dark</>
            }
          </button>
          {/* macOS dots */}
          <div style={{display:"flex",gap:5,marginLeft:4}}>
            {["#ff5f56","#ffbd2e","#27c93f"].map(c=>(
              <div key={c} style={{width:10,height:10,borderRadius:"50%",background:c}}/>
            ))}
          </div>
        </div>

        {/* Cover */}
        <div style={{position:"relative",height:96,background:cover,flexShrink:0}}>
          <div style={{position:"absolute",inset:0,
            backgroundImage:"radial-gradient(circle,rgba(240,240,245,0.15) 1px,transparent 1px)",
            backgroundSize:"18px 18px"}}/>
          {editing && (
            <div style={{position:"absolute",bottom:8,right:12,display:"flex",gap:5,zIndex:10}}>
              {COVERS.map(c=>(
                <button key={c.id} onClick={()=>setCoverId(c.id)} style={{
                  width:20,height:20,borderRadius:"50%",background:c.v,
                  border:coverId===c.id?"2.5px solid #F0F0F5":"2px solid transparent",
                  cursor:"pointer",transition:"transform .15s",
                  transform:coverId===c.id?"scale(1.3)":"scale(1)",
                }}/>
              ))}
            </div>
          )}
          {/* Avatar */}
          <div style={{position:"absolute",left:18,bottom:-40,zIndex:20}}>
            <div style={{position:"relative"}}>
              <div style={{
                width:80,height:80,borderRadius:"50%",overflow:"hidden",
                border:`4px solid ${P.card}`,
                boxShadow:`0 0 0 2px ${P.border}, 0 4px 20px rgba(8,11,42,0.4)`,
                background:avatarUrl?"transparent":skin.bg,
                display:"flex",alignItems:"center",justifyContent:"center",
              }}>
                {avatarUrl
                  ? <img src={avatarUrl} alt="" style={{width:"100%",height:"100%",objectFit:"cover"}}/>
                  : <span style={{fontSize:24,fontWeight:900,color:skin.fg,lineHeight:1}}>{initials}</span>
                }
              </div>
              {/* Camera overlay */}
              <button onClick={()=>avatarRef.current?.click()} style={{
                position:"absolute",inset:0,borderRadius:"50%",
                background:"rgba(8,11,42,0.6)",display:"flex",
                alignItems:"center",justifyContent:"center",
                border:"none",cursor:"pointer",opacity:0,transition:"opacity .15s",
              }}
                onMouseEnter={e=>e.currentTarget.style.opacity=1}
                onMouseLeave={e=>e.currentTarget.style.opacity=0}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#F0F0F5" strokeWidth="2">
                  <path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z"/>
                  <circle cx="12" cy="13" r="4"/>
                </svg>
              </button>
              <input ref={avatarRef} type="file" accept="image/*" style={{display:"none"}} onChange={handleAvatarChange}/>
              {!avatarUrl&&(
                <button onClick={()=>setShowSkins(v=>!v)} style={{
                  position:"absolute",bottom:-2,right:-2,
                  width:22,height:22,borderRadius:"50%",
                  background:skin.bg,border:`2px solid ${P.card}`,
                  cursor:"pointer",transition:"transform .15s",
                }}
                  onMouseEnter={e=>e.currentTarget.style.transform="scale(1.2)"}
                  onMouseLeave={e=>e.currentTarget.style.transform="scale(1)"}/>
              )}
              <span style={{
                position:"absolute",bottom:2,right:16,
                width:14,height:14,borderRadius:"50%",
                background:stObj.dot,border:`3px solid ${P.card}`,zIndex:30,
              }}/>
            </div>
            {showSkins&&(
              <div style={{
                position:"absolute",top:"calc(100% + 8px)",left:0,zIndex:50,
                background:P.card2,border:`1px solid ${P.border}`,borderRadius:14,
                padding:12,boxShadow:P.shadow,
                animation:"popIn .18s cubic-bezier(0.22,1,0.36,1) both",
              }}>
                <p style={{fontSize:9,fontWeight:700,letterSpacing:"0.1em",textTransform:"uppercase",color:P.muted,marginBottom:8}}>Skin өнгө</p>
                <div style={{display:"grid",gridTemplateColumns:"repeat(5,1fr)",gap:6}}>
                  {SKINS.map((s,i)=>(
                    <button key={i} onClick={()=>{setSkinIdx(i);setShowSkins(false);}} style={{
                      width:28,height:28,borderRadius:"50%",background:s.bg,
                      border:`2px solid ${i===skinIdx?"#6B7399":s.fg+"44"}`,
                      cursor:"pointer",transition:"transform .15s",
                      transform:i===skinIdx?"scale(1.2)":"scale(1)",
                    }}/>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Scrollable body */}
        <div style={{flex:1,overflowY:"auto",padding:"0 18px 18px",scrollbarWidth:"none"}}>
          {/* Edit toggle */}
          <div style={{display:"flex",justifyContent:"flex-end",paddingTop:50,marginBottom:4}}>
            <button onClick={()=>setEditing(v=>!v)} style={{
              display:"flex",alignItems:"center",gap:6,
              padding:"6px 14px",borderRadius:10,fontSize:12,fontWeight:600,
              border:`1px solid ${editing?P.border:"transparent"}`,cursor:"pointer",transition:"all .15s",
              background:editing?P.card2:isDark?"#F0F0F5":"#080B2A",
              color:editing?P.muted:isDark?"#080B2A":"#F0F0F5",
            }}
              onMouseEnter={e=>{if(!editing){e.currentTarget.style.opacity="0.85";}else{e.currentTarget.style.borderColor="#6B7399";}}}
              onMouseLeave={e=>{e.currentTarget.style.opacity="1";if(editing)e.currentTarget.style.borderColor=P.border;}}>
              {editing
                ? <><svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>Болих</>
                : <><svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4z"/></svg>Засах</>
              }
            </button>
          </div>

          {/* Name + status */}
          <div style={{marginBottom:14}}>
            <div style={{display:"flex",alignItems:"center",gap:8,flexWrap:"wrap",marginBottom:4}}>
              <h2 style={{fontSize:16,fontWeight:700,color:P.text,margin:0}}>{user?.username}</h2>
              <span style={{
                display:"inline-flex",alignItems:"center",gap:5,
                fontSize:11,fontWeight:600,padding:"3px 8px",borderRadius:20,
                background:stObj.bg,border:`1px solid ${stObj.bd}`,color:stObj.dot,
              }}>
                <span style={{width:6,height:6,borderRadius:"50%",background:stObj.dot}}/>
                {stObj.label}
              </span>
            </div>
            <p style={{fontSize:12,color:P.muted,margin:0}}>{user?.email}</p>
            {bio&&<p style={{fontSize:12,color:P.text2,marginTop:6,lineHeight:1.6}}>{bio}</p>}
          </div>

          {/* Account info */}
          {!editing&&(
            <div style={{
              background:P.card2,border:`1px solid ${P.border}`,
              borderRadius:14,padding:14,marginBottom:12,
              animation:"fadeUp .2s ease both",
            }}>
              <p style={{...labelStyle,marginBottom:10}}>Дансны мэдээлэл</p>
              {[
                {label:"Бүртгүүлсэн", val: user?.createdAt?new Date(user.createdAt).toLocaleDateString("mn-MN"):"—"},
                {label:"User ID",     val: user?.id, mono:true},
              ].map(({label,val,mono})=>(
                <div key={label} style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
                  <span style={{fontSize:12,color:P.muted}}>{label}</span>
                  <span style={{fontSize:mono?10:12,color:P.text2,fontFamily:mono?"monospace":"inherit",
                    maxWidth:180,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{val}</span>
                </div>
              ))}
            </div>
          )}

          {/* Edit form */}
          {editing&&(
            <form onSubmit={handleSave} style={{
              background:P.card2,border:`1px solid ${P.border}`,
              borderRadius:14,padding:14,marginBottom:12,
              display:"flex",flexDirection:"column",gap:12,
              animation:"fadeUp .2s ease both",
            }}>
              <div>
                <span style={labelStyle}>Хэрэглэгчийн нэр</span>
                <input style={inputStyle} type="text" value={username}
                  onChange={e=>setUsername(e.target.value)} onFocus={onFocus} onBlur={onBlur}/>
              </div>
              <div>
                <span style={labelStyle}>Имэйл</span>
                <input style={{...inputStyle,color:P.muted,cursor:"not-allowed",opacity:0.6}} type="text" value={user?.email||""} disabled/>
              </div>
              <div>
                <span style={labelStyle}>Био</span>
                <textarea style={{...inputStyle,resize:"none",lineHeight:1.5}} rows={2}
                  value={bio} onChange={e=>setBio(e.target.value)}
                  placeholder="Өөрийгөө танилцуулах…" onFocus={onFocus} onBlur={onBlur}/>
              </div>
              <div>
                <span style={labelStyle}>Статус</span>
                <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:6}}>
                  {STATUSES.map(s=>(
                    <button key={s.key} type="button" onClick={()=>setStatus(s.key)} style={{
                      display:"flex",flexDirection:"column",alignItems:"center",gap:4,
                      padding:"8px 4px",borderRadius:10,fontSize:10,fontWeight:600,
                      border:`1px solid ${status===s.key?s.bd:P.border}`,
                      background:status===s.key?s.bg:"transparent",
                      color:status===s.key?s.dot:P.muted,
                      cursor:"pointer",transition:"all .15s",
                    }}>
                      <span style={{width:8,height:8,borderRadius:"50%",background:s.dot}}/>
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>
              {error&&<p style={{fontSize:12,color:"#f87171",margin:0}}>{error}</p>}
              <button type="submit" disabled={saving} style={{
                display:"flex",alignItems:"center",justifyContent:"center",gap:8,
                padding:"10px",borderRadius:10,border:"none",
                background:saved?"rgba(34,197,94,0.15)":"linear-gradient(135deg,#1B3066,#2a4080)",
                color:saved?"#4ade80":"#F0F0F5",
                border:saved?"1px solid rgba(34,197,94,0.3)":"none",
                fontSize:13,fontWeight:600,cursor:saving?"not-allowed":"pointer",
                opacity:saving?0.6:1,transition:"all .2s",
                boxShadow:saved?"none":"0 4px 14px rgba(27,48,102,0.4)",
              }}
                onMouseEnter={e=>{if(!saving&&!saved){e.currentTarget.style.background="linear-gradient(135deg,#2a4080,#6B7399)";e.currentTarget.style.boxShadow="0 6px 20px rgba(107,115,153,0.35)";}}}
                onMouseLeave={e=>{if(!saving&&!saved){e.currentTarget.style.background="linear-gradient(135deg,#1B3066,#2a4080)";e.currentTarget.style.boxShadow="0 4px 14px rgba(27,48,102,0.4)";}}}
              >
                {saving?"Хадгалж байна…":saved?"✓ Хадгаллаа!":"Хадгалах"}
              </button>
            </form>
          )}

          {/* Logout */}
          <button onClick={logout} style={{
            width:"100%",display:"flex",alignItems:"center",justifyContent:"center",gap:8,
            padding:"10px",borderRadius:12,
            border:"1px solid rgba(239,68,68,0.25)",
            background:"transparent",color:"#f87171",
            fontSize:13,fontWeight:600,cursor:"pointer",transition:"all .15s",
          }}
            onMouseEnter={e=>{e.currentTarget.style.background="rgba(239,68,68,0.08)";e.currentTarget.style.borderColor="rgba(239,68,68,0.4)";}}
            onMouseLeave={e=>{e.currentTarget.style.background="transparent";e.currentTarget.style.borderColor="rgba(239,68,68,0.25)";}}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/>
              <polyline points="16 17 21 12 16 7"/>
              <line x1="21" y1="12" x2="9" y2="12"/>
            </svg>
            Гарах
          </button>
        </div>
      </div>
    </div>
  );
}
