import { useState, useRef } from "react";
import { useStory } from "../../context/StoryContext.jsx";
import { useAuth } from "../../context/AuthContext.jsx";
import { useTheme } from "../../context/ThemeContext.jsx";

const GRADIENTS = [
  { label:"Navy",    css:"linear-gradient(135deg,#080B2A,#1B3066,#2a4080)", tw:"from-[#080B2A] via-[#1B3066] to-[#2a4080]" },
  { label:"Slate",   css:"linear-gradient(135deg,#1B3066,#6B7399,#b8bdd8)", tw:"from-[#1B3066] via-[#6B7399] to-[#b8bdd8]" },
  { label:"Violet",  css:"linear-gradient(135deg,#7c3aed,#a855f7,#c026d3)", tw:"from-violet-600 via-purple-500 to-fuchsia-600" },
  { label:"Ocean",   css:"linear-gradient(135deg,#0ea5e9,#22d3ee,#14b8a6)", tw:"from-blue-500 via-cyan-400 to-teal-500" },
  { label:"Sunset",  css:"linear-gradient(135deg,#fb923c,#ec4899,#e11d48)", tw:"from-orange-400 via-pink-500 to-rose-600" },
  { label:"Forest",  css:"linear-gradient(135deg,#22c55e,#34d399,#14b8a6)", tw:"from-green-500 via-emerald-400 to-teal-500" },
  { label:"Fire",    css:"linear-gradient(135deg,#facc15,#f97316,#dc2626)", tw:"from-yellow-400 via-orange-500 to-red-600" },
  { label:"Rose",    css:"linear-gradient(135deg,#f472b6,#fb7185,#f87171)", tw:"from-pink-400 via-rose-400 to-red-400" },
];

const SKINS = [
  {bg:"#FDDBB4",fg:"#8B5E3C"},{bg:"#F5C99A",fg:"#7A4A2A"},
  {bg:"#E8A87C",fg:"#6B3820"},{bg:"#C68642",fg:"#3E1F00"},
  {bg:"#8D5524",fg:"#FFD5A8"},{bg:"#4A2912",fg:"#F5C99A"},
  {bg:"#DBEAFE",fg:"#1D4ED8"},{bg:"#EDE9FE",fg:"#7C3AED"},
  {bg:"#FCE7F3",fg:"#BE185D"},{bg:"#D1FAE5",fg:"#065F46"},
];

export default function StoryCreator({ onClose }) {
  const { addStory } = useStory();
  const { user, profile } = useAuth();
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const [text,     setText]     = useState("");
  const [bgIdx,    setBgIdx]    = useState(0);
  const [fontSize, setFontSize] = useState(26);
  const [imgPrev,  setImgPrev]  = useState(null);
  const [posting,  setPosting]  = useState(false);
  const fileRef = useRef(null);

  const skin = SKINS[profile?.skinIdx ?? 0] || SKINS[0];
  const bg   = GRADIENTS[bgIdx];

  const P = {
    panel:  isDark ? "#0D1035" : "#ffffff",
    panel2: isDark ? "#111540" : "#f4f4fb",
    border: isDark ? "#1B3066" : "#c8c8dc",
    text:   isDark ? "#F0F0F5" : "#080B2A",
    muted:  isDark ? "#6B7399" : "#6B7399",
  };

  const handleImg = e => {
    const f = e.target.files?.[0]; if (!f) return;
    setImgPrev(URL.createObjectURL(f)); setText("");
  };

  const handlePost = async () => {
    if (!text.trim() && !imgPrev) return;
    setPosting(true);
    await new Promise(r => setTimeout(r, 350));
    addStory({ type: imgPrev ? "image" : "text", content: text, bg: bg.tw, image: imgPrev });
    setPosting(false); onClose();
  };

  return (
    <div
      onClick={onClose}
      style={{
        position:"fixed", inset:0, zIndex:150,
        background:"rgba(8,11,42,0.85)",
        backdropFilter:"blur(16px)",
        display:"flex", alignItems:"center", justifyContent:"center",
        animation:"fadeIn .15s ease both",
      }}
    >
      <div
        onClick={e=>e.stopPropagation()}
        style={{
          width:"min(380px,95vw)",
          borderRadius:24, overflow:"hidden",
          boxShadow:"0 32px 80px rgba(8,11,42,0.7)",
          animation:"fadeUp .25s cubic-bezier(0.22,1,0.36,1) both",
        }}
      >
        {/* Preview */}
        <div style={{
          position:"relative", height:"min(500px,65vh)",
          background: imgPrev ? "#000" : bg.css,
          display:"flex", alignItems:"center", justifyContent:"center",
        }}>
          {imgPrev && (
            <img src={imgPrev} alt="" style={{position:"absolute",inset:0,width:"100%",height:"100%",objectFit:"cover"}}/>
          )}
          <div style={{position:"absolute",inset:0,background:"linear-gradient(to bottom,rgba(8,11,42,0.45) 0%,transparent 35%,transparent 65%,rgba(8,11,42,0.5) 100%)"}}/>

          {/* Top bar */}
          <div style={{position:"absolute",top:0,left:0,right:0,display:"flex",alignItems:"center",justifyContent:"space-between",padding:"14px 16px",zIndex:10}}>
            <div style={{display:"flex",alignItems:"center",gap:8}}>
              <div style={{width:32,height:32,borderRadius:"50%",background:skin.bg,border:"2px solid rgba(240,240,245,0.5)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,fontWeight:700,color:skin.fg}}>
                {user?.username?.slice(0,2).toUpperCase()}
              </div>
              <span style={{fontSize:13,fontWeight:600,color:"#F0F0F5",textShadow:"0 1px 4px rgba(8,11,42,0.5)"}}>{user?.username}</span>
            </div>
            <button onClick={onClose} style={{width:30,height:30,borderRadius:"50%",background:"rgba(8,11,42,0.4)",border:"none",cursor:"pointer",color:"rgba(240,240,245,0.8)",display:"flex",alignItems:"center",justifyContent:"center"}}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          </div>

          {/* Text preview */}
          {!imgPrev && (
            <p style={{fontSize:fontSize,fontWeight:900,color:"#F0F0F5",textAlign:"center",padding:"0 28px",lineHeight:1.3,letterSpacing:"-0.02em",textShadow:"0 2px 20px rgba(8,11,42,0.5)",position:"relative",zIndex:2}}>
              {text || <span style={{opacity:0.4,fontSize:18,fontWeight:500}}>Текст бичих…</span>}
            </p>
          )}

          {/* Photo button */}
          <button onClick={()=>fileRef.current?.click()} style={{
            position:"absolute",bottom:12,right:12,
            width:38,height:38,borderRadius:"50%",
            background:"rgba(8,11,42,0.4)",backdropFilter:"blur(8px)",
            border:"1px solid rgba(240,240,245,0.25)",
            cursor:"pointer",color:"rgba(240,240,245,0.85)",
            display:"flex",alignItems:"center",justifyContent:"center",
            transition:"background .15s",
          }}
            onMouseEnter={e=>e.currentTarget.style.background="rgba(8,11,42,0.6)"}
            onMouseLeave={e=>e.currentTarget.style.background="rgba(8,11,42,0.4)"}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z"/><circle cx="12" cy="13" r="4"/></svg>
          </button>
          <input ref={fileRef} type="file" accept="image/*" style={{display:"none"}} onChange={handleImg}/>
        </div>

        {/* Controls */}
        <div style={{background:P.panel, padding:"16px", display:"flex", flexDirection:"column", gap:14}}>

          {/* Text input */}
          {!imgPrev && (
            <textarea
              placeholder="Story текст бичих…"
              rows={2} value={text} maxLength={120}
              onChange={e=>setText(e.target.value)}
              autoFocus
              style={{
                width:"100%", padding:"10px 14px", borderRadius:12, boxSizing:"border-box",
                border:`1px solid ${P.border}`, background:P.panel2, color:P.text,
                fontSize:14, resize:"none", outline:"none", fontFamily:"inherit",
                transition:"border-color .15s",
              }}
              onFocus={e=>{e.target.style.borderColor="#6B7399";}}
              onBlur={e=>{e.target.style.borderColor=P.border;}}
            />
          )}

          {/* Font size + bg picker row */}
          {!imgPrev && (
            <div style={{display:"flex",alignItems:"center",gap:12}}>
              {/* Font size */}
              <div style={{display:"flex",gap:4}}>
                {[20,26,34].map((s,i)=>["S","M","L"].map((l,j)=> i===j && (
                  <button key={s} onClick={()=>setFontSize(s)} style={{
                    width:30,height:30,borderRadius:8,fontSize:11,fontWeight:700,
                    border:"none",cursor:"pointer",transition:"all .15s",
                    background: fontSize===s ? "linear-gradient(135deg,#1B3066,#2a4080)" : P.panel2,
                    color: fontSize===s ? "#F0F0F5" : P.muted,
                  }}>{l}</button>
                )))}
              </div>
              <div style={{width:1,height:24,background:P.border}}/>
              {/* BG picker */}
              <div style={{display:"flex",gap:5,flex:1,overflowX:"auto",scrollbarWidth:"none"}}>
                {GRADIENTS.map((g,i)=>(
                  <button key={g.label} onClick={()=>setBgIdx(i)} style={{
                    width:26,height:26,borderRadius:"50%",flexShrink:0,
                    background:g.css,
                    border:`2px solid ${i===bgIdx?"#F0F0F5":"transparent"}`,
                    cursor:"pointer",transition:"transform .15s",
                    transform:i===bgIdx?"scale(1.25)":"scale(1)",
                  }}/>
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          <div style={{display:"flex",gap:8}}>
            {imgPrev && (
              <button onClick={()=>setImgPrev(null)} style={{
                display:"flex",alignItems:"center",gap:6,padding:"9px 14px",
                borderRadius:10,border:`1px solid ${P.border}`,
                background:"transparent",color:P.muted,fontSize:12,cursor:"pointer",
                transition:"all .15s",
              }}
                onMouseEnter={e=>{e.currentTarget.style.borderColor="#6B7399";e.currentTarget.style.color=P.text;}}
                onMouseLeave={e=>{e.currentTarget.style.borderColor=P.border;e.currentTarget.style.color=P.muted;}}>
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                Устгах
              </button>
            )}
            <button
              onClick={handlePost}
              disabled={(!text.trim() && !imgPrev) || posting}
              style={{
                flex:1,display:"flex",alignItems:"center",justifyContent:"center",gap:8,
                padding:"10px",borderRadius:12,border:"none",
                background:"linear-gradient(135deg,#1B3066,#2a4080,#6B7399)",
                color:"#F0F0F5",fontSize:13,fontWeight:700,
                cursor:(!text.trim()&&!imgPrev)||posting?"not-allowed":"pointer",
                opacity:(!text.trim()&&!imgPrev)||posting?0.5:1,
                transition:"all .15s",
                boxShadow:"0 4px 16px rgba(27,48,102,0.4)",
              }}
              onMouseEnter={e=>{if(text.trim()||imgPrev){e.currentTarget.style.boxShadow="0 6px 24px rgba(107,115,153,0.4)";}}}
              onMouseLeave={e=>e.currentTarget.style.boxShadow="0 4px 16px rgba(27,48,102,0.4)"}>
              {posting
                ? <svg style={{animation:"spinSlow 1.2s linear infinite"}} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" strokeOpacity=".3"/><path d="M12 2a10 10 0 0110 10"/></svg>
                : <><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>Story нийтлэх</>
              }
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
