import { useState, useEffect, useRef, useCallback } from "react";
import { useStory } from "../../context/StoryContext.jsx";
import { useAuth } from "../../context/AuthContext.jsx";

const DURATION = 5000;

function TimeAgo({ ts }) {
  const d = Date.now() - ts;
  if (d < 60000) return <span>Саяхан</span>;
  if (d < 3600000) return <span>{Math.floor(d/60000)}м өмнө</span>;
  return <span>{Math.floor(d/3600000)}ц өмнө</span>;
}

function ProgressBars({ total, current, progress, paused }) {
  return (
    <div style={{ display:"flex", gap:3, padding:"12px 14px 6px" }}>
      {Array.from({ length: total }).map((_, i) => (
        <div key={i} style={{
          flex:1, height:3, borderRadius:2,
          background:"rgba(255,255,255,0.25)", overflow:"hidden",
        }}>
          <div style={{
            height:"100%", borderRadius:2, background:"#fff",
            width: i < current ? "100%" : i === current ? `${progress}%` : "0%",
            transition: i === current && !paused ? `width ${DURATION}ms linear` : "none",
          }}/>
        </div>
      ))}
    </div>
  );
}

export default function StoryViewer({ userId, onClose }) {
  const { allStories, markSeen } = useStory();
  const { user: me } = useAuth();

  const groups = allStories.filter(g => g.stories?.length > 0);
  const [groupIdx, setGroupIdx] = useState(() => Math.max(0, groups.findIndex(g => g.userId === userId)));
  const [storyIdx, setStoryIdx] = useState(0);
  const [progress, setProgress] = useState(0);
  const [paused, setPaused]     = useState(false);
  const [entering, setEntering] = useState(true);
  const [replyText, setReplyText] = useState("");

  const rafRef   = useRef(null);
  const startRef = useRef(Date.now());
  const elRef    = useRef(0);

  const group  = groups[groupIdx];
  const stories = group?.stories || [];
  const story   = stories[storyIdx];

  useEffect(() => {
    const t = setTimeout(() => setEntering(false), 20);
    return () => clearTimeout(t);
  }, []);

  const goNext = useCallback(() => {
    if (storyIdx < stories.length - 1) {
      setStoryIdx(i => i+1); setProgress(0); elRef.current = 0;
    } else if (groupIdx < groups.length - 1) {
      markSeen(group?.userId);
      setGroupIdx(i => i+1); setStoryIdx(0); setProgress(0); elRef.current = 0;
    } else {
      markSeen(group?.userId); onClose();
    }
  }, [storyIdx, stories.length, groupIdx, groups.length, group, markSeen, onClose]);

  const goPrev = useCallback(() => {
    if (storyIdx > 0) { setStoryIdx(i=>i-1); setProgress(0); elRef.current=0; }
    else if (groupIdx > 0) { setGroupIdx(i=>i-1); setStoryIdx(0); setProgress(0); elRef.current=0; }
  }, [storyIdx, groupIdx]);

  useEffect(() => {
    if (paused || !story) return;
    startRef.current = Date.now() - elRef.current;
    const tick = () => {
      const el = Date.now() - startRef.current;
      elRef.current = el;
      const pct = Math.min((el / DURATION) * 100, 100);
      setProgress(pct);
      if (pct < 100) rafRef.current = requestAnimationFrame(tick);
      else goNext();
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [storyIdx, groupIdx, paused, story, goNext]);

  useEffect(() => {
    const fn = e => {
      if (e.key === "ArrowRight") goNext();
      if (e.key === "ArrowLeft")  goPrev();
      if (e.key === "Escape")     onClose();
    };
    window.addEventListener("keydown", fn);
    return () => window.removeEventListener("keydown", fn);
  }, [goNext, goPrev, onClose]);

  if (!group || !story) return null;
  const isMe = group.userId === String(me?.id);

  // Parse tailwind gradient from story bg to actual CSS
  const bgMap = {
    "from-pink-500 to-rose-600":      "linear-gradient(135deg,#ec4899,#e11d48)",
    "from-violet-500 to-purple-600":  "linear-gradient(135deg,#8b5cf6,#9333ea)",
    "from-blue-500 to-cyan-600":      "linear-gradient(135deg,#3b82f6,#0891b2)",
    "from-emerald-500 to-teal-600":   "linear-gradient(135deg,#10b981,#0d9488)",
    "from-orange-400 via-pink-500 to-rose-600": "linear-gradient(135deg,#fb923c,#ec4899,#e11d48)",
    "from-blue-500 via-cyan-400 to-teal-500":   "linear-gradient(135deg,#3b82f6,#22d3ee,#14b8a6)",
    "from-green-500 via-emerald-400 to-teal-500":"linear-gradient(135deg,#22c55e,#34d399,#14b8a6)",
    "from-violet-600 via-purple-500 to-fuchsia-600":"linear-gradient(135deg,#7c3aed,#a855f7,#c026d3)",
    "from-yellow-400 via-orange-500 to-red-600":"linear-gradient(135deg,#facc15,#f97316,#dc2626)",
    "from-slate-800 via-blue-900 to-slate-900":  "linear-gradient(135deg,#1e293b,#1e3a8a,#0f172a)",
    "from-pink-400 via-rose-400 to-red-400":     "linear-gradient(135deg,#f472b6,#fb7185,#f87171)",
    "from-green-400 via-teal-300 to-cyan-500":   "linear-gradient(135deg,#4ade80,#5eead4,#06b6d4)",
  };
  const bgStyle = bgMap[story.bg] || story.bg || "linear-gradient(135deg,#080B2A,#1B3066)";

  return (
    <div
      onClick={onClose}
      style={{
        position:"fixed", inset:0, zIndex:200,
        display:"flex", alignItems:"center", justifyContent:"center",
        background:"rgba(8,11,42,0.92)",
        backdropFilter:"blur(20px)",
        opacity: entering ? 0 : 1,
        transition:"opacity .2s ease",
      }}
    >
      {/* Prev group */}
      {groupIdx > 0 && (
        <button onClick={e=>{e.stopPropagation();setGroupIdx(i=>i-1);setStoryIdx(0);setProgress(0);}} style={{
          position:"absolute", left:16, top:"50%", transform:"translateY(-50%)",
          width:40, height:40, borderRadius:"50%",
          background:"rgba(240,240,245,0.12)", border:"1px solid rgba(240,240,245,0.2)",
          display:"flex", alignItems:"center", justifyContent:"center",
          color:"#F0F0F5", cursor:"pointer", transition:"background .15s",
          backdropFilter:"blur(8px)",
        }}
          onMouseEnter={e=>e.currentTarget.style.background="rgba(240,240,245,0.22)"}
          onMouseLeave={e=>e.currentTarget.style.background="rgba(240,240,245,0.12)"}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="15 18 9 12 15 6"/></svg>
        </button>
      )}
      {/* Next group */}
      {groupIdx < groups.length - 1 && (
        <button onClick={e=>{e.stopPropagation();setGroupIdx(i=>i+1);setStoryIdx(0);setProgress(0);}} style={{
          position:"absolute", right:16, top:"50%", transform:"translateY(-50%)",
          width:40, height:40, borderRadius:"50%",
          background:"rgba(240,240,245,0.12)", border:"1px solid rgba(240,240,245,0.2)",
          display:"flex", alignItems:"center", justifyContent:"center",
          color:"#F0F0F5", cursor:"pointer", transition:"background .15s",
          backdropFilter:"blur(8px)",
        }}
          onMouseEnter={e=>e.currentTarget.style.background="rgba(240,240,245,0.22)"}
          onMouseLeave={e=>e.currentTarget.style.background="rgba(240,240,245,0.12)"}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="9 18 15 12 9 6"/></svg>
        </button>
      )}

      {/* Story card */}
      <div
        onClick={e=>e.stopPropagation()}
        onMouseDown={()=>{setPaused(true);elRef.current=Date.now()-startRef.current;}}
        onMouseUp={()=>setPaused(false)}
        onTouchStart={()=>setPaused(true)}
        onTouchEnd={()=>setPaused(false)}
        style={{
          position:"relative",
          width:"min(390px,100vw)", height:"min(700px,100dvh)",
          borderRadius:22, overflow:"hidden",
          boxShadow:"0 32px 80px rgba(8,11,42,0.7)",
          transform: entering ? "scale(0.9)" : "scale(1)",
          transition:"transform .3s cubic-bezier(0.34,1.56,0.64,1)",
          background: bgStyle,
        }}
      >
        {/* BG image */}
        {story.image && (
          <img src={story.image} alt="" style={{position:"absolute",inset:0,width:"100%",height:"100%",objectFit:"cover"}}/>
        )}
        {/* Vignette */}
        <div style={{position:"absolute",inset:0,background:"linear-gradient(to bottom,rgba(8,11,42,0.45) 0%,transparent 30%,transparent 60%,rgba(8,11,42,0.65) 100%)"}}/>

        {/* Progress bars */}
        <div style={{position:"relative",zIndex:10}}>
          <ProgressBars total={stories.length} current={storyIdx} progress={progress} paused={paused}/>
        </div>

        {/* Header */}
        <div style={{position:"relative",zIndex:10,display:"flex",alignItems:"center",gap:10,padding:"6px 14px 10px"}}>
          <div style={{
            width:36, height:36, borderRadius:"50%", flexShrink:0,
            background:group.userBg, border:"2px solid rgba(240,240,245,0.6)",
            display:"flex", alignItems:"center", justifyContent:"center",
            fontSize:13, fontWeight:700, color:group.userColor,
          }}>
            {group.userInitials}
          </div>
          <div style={{flex:1,minWidth:0}}>
            <p style={{fontSize:13,fontWeight:700,color:"#F0F0F5",margin:0,lineHeight:1.2}}>{group.userName}</p>
            <p style={{fontSize:11,color:"rgba(240,240,245,0.55)",margin:0}}>
              <TimeAgo ts={story.createdAt}/>
            </p>
          </div>
          {paused && (
            <div style={{width:28,height:28,borderRadius:"50%",background:"rgba(240,240,245,0.2)",display:"flex",alignItems:"center",justifyContent:"center"}}>
              <svg width="11" height="11" viewBox="0 0 24 24" fill="rgba(240,240,245,0.9)">
                <rect x="6" y="4" width="4" height="16" rx="1"/><rect x="14" y="4" width="4" height="16" rx="1"/>
              </svg>
            </div>
          )}
          <button onClick={onClose} style={{
            width:32,height:32,borderRadius:"50%",background:"rgba(240,240,245,0.15)",
            border:"none",cursor:"pointer",color:"rgba(240,240,245,0.8)",
            display:"flex",alignItems:"center",justifyContent:"center",transition:"background .15s",
          }}
            onMouseEnter={e=>e.currentTarget.style.background="rgba(240,240,245,0.25)"}
            onMouseLeave={e=>e.currentTarget.style.background="rgba(240,240,245,0.15)"}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        {/* Content */}
        {!story.image && (
          <div style={{position:"absolute",inset:0,display:"flex",alignItems:"center",justifyContent:"center",padding:"0 32px 80px 32px",paddingTop:100}}>
            <p style={{fontSize:26,fontWeight:900,color:"#F0F0F5",textAlign:"center",lineHeight:1.3,letterSpacing:"-0.02em",textShadow:"0 2px 20px rgba(8,11,42,0.5)"}}>
              {story.content}
            </p>
          </div>
        )}

        {/* Bottom */}
        <div style={{position:"absolute",bottom:0,left:0,right:0,zIndex:10,padding:"8px 14px 22px"}}>
          {!isMe ? (
            <div style={{display:"flex",alignItems:"center",gap:8}}>
              <input
                value={replyText}
                onChange={e=>setReplyText(e.target.value)}
                onClick={e=>e.stopPropagation()}
                onMouseDown={e=>e.stopPropagation()}
                placeholder={`${group.userName.split(" ")[0]}-д хариулах…`}
                style={{
                  flex:1, background:"rgba(240,240,245,0.15)",
                  backdropFilter:"blur(8px)",
                  border:"1px solid rgba(240,240,245,0.25)",
                  borderRadius:999, padding:"10px 16px",
                  fontSize:13, color:"#F0F0F5", outline:"none",
                  fontFamily:"inherit",
                }}
                onFocus={e=>{e.target.style.background="rgba(240,240,245,0.22)";e.target.style.borderColor="rgba(240,240,245,0.4)";}}
                onBlur={e=>{e.target.style.background="rgba(240,240,245,0.15)";e.target.style.borderColor="rgba(240,240,245,0.25)";}}
              />
              {["❤️","✈️"].map((icon,i) => (
                <button key={i} onClick={e=>e.stopPropagation()} style={{
                  width:40,height:40,borderRadius:"50%",flexShrink:0,
                  background:"rgba(240,240,245,0.15)",
                  border:"1px solid rgba(240,240,245,0.25)",
                  cursor:"pointer",fontSize:16,transition:"background .15s",
                }}
                  onMouseEnter={e=>e.currentTarget.style.background="rgba(240,240,245,0.25)"}
                  onMouseLeave={e=>e.currentTarget.style.background="rgba(240,240,245,0.15)"}>
                  {icon}
                </button>
              ))}
            </div>
          ) : (
            <div style={{display:"flex",justifyContent:"center"}}>
              <div style={{
                display:"flex",alignItems:"center",gap:12,
                background:"rgba(8,11,42,0.4)",backdropFilter:"blur(8px)",
                border:"1px solid rgba(107,115,153,0.3)",
                borderRadius:20,padding:"8px 18px",
              }}>
                <span style={{fontSize:12,color:"rgba(240,240,245,0.6)"}}>👁 {Math.floor(Math.random()*12)+2} харсан</span>
                <span style={{color:"rgba(107,115,153,0.5)"}}>·</span>
                <span style={{fontSize:12,color:"rgba(240,240,245,0.6)"}}>❤️ {Math.floor(Math.random()*8)} хариу</span>
              </div>
            </div>
          )}
        </div>

        {/* Tap zones */}
        <div style={{position:"absolute",inset:0,display:"flex",top:80,bottom:80}}>
          <div style={{flex:1,cursor:"pointer"}} onClick={e=>{e.stopPropagation();goPrev();}}/>
          <div style={{flex:1,cursor:"pointer"}} onClick={e=>{e.stopPropagation();goNext();}}/>
        </div>
      </div>
    </div>
  );
}
