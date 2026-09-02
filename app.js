
const VERSION="0.2.0";
const dates=Array.from({length:10},(_,i)=>`2026-09-${String(i+4).padStart(2,"0")}`);
let DATA=null, day=0, touchX=0;
const KEY="deauville2026-personal-planning-v020";

const pad=n=>String(n).padStart(2,"0");
function mins(h){let [a,b]=h.split(":").map(Number);return a*60+b}
function dateLabel(d){return new Intl.DateTimeFormat("fr-FR",{weekday:"long",day:"numeric",month:"long"}).format(new Date(d+"T12:00:00"))}
function esc(s){return String(s).replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[m]))}
function dur(s,e){
  const sm=typeof s==="number"?s:mins(s), em=typeof e==="number"?e:mins(e);
  let d=em-sm;if(d<0)d+=1440;
  return `${Math.floor(d/60)}h${d%60?pad(d%60):""}`;
}
function loadPlan(){try{return JSON.parse(localStorage.getItem(KEY)||"[]")}catch{return[]}}
function savePlan(){localStorage.setItem(KEY,JSON.stringify(plan))}
let plan=[];

function fixedItems(date){
  return [
    ...DATA.jury.filter(x=>x.date===date).map(x=>({...x,source:"jury",mandatory:true})),
    ...DATA.juryExtra.filter(x=>x.date===date).map(x=>({...x,source:"juryExtra",mandatory:true}))
  ].sort((a,b)=>mins(a.start)-mins(b.start));
}
function allPlanned(date){
  return [...fixedItems(date),...plan.filter(x=>x.date===date)]
    .map(x=>({...x,s:mins(x.start),e:(mins(x.end)<mins(x.start)?mins(x.end)+1440:mins(x.end))}))
    .sort((a,b)=>a.s-b.s);
}
function freeWindows(date){
  const fixed=allPlanned(date);
  let cursor=date==="2026-09-04"?15*60:8*60;
  const boundary=date==="2026-09-13"?12*60+12:24*60;
  const out=[];
  for(const x of fixed){
    const s=Math.max(x.s,cursor), e=Math.min(x.e,boundary);
    if(s>cursor) out.push({start:cursor,end:s});
    cursor=Math.max(cursor,x.e);
  }
  if(cursor<boundary)out.push({start:cursor,end:boundary});
  return out.filter(w=>w.end-w.start>=30);
}
function hh(m){return `${pad(Math.floor(m/60)%24)}:${pad(m%60)}`}
function compatible(date,w){
  return DATA.sessions.filter(s=>{
    if(s.date!==date)return false;
    const ss=mins(s.start), ee=mins(s.end)<ss?mins(s.end)+1440:mins(s.end);
    return ss>=w.start && ee<=w.end;
  }).filter(s=>!plan.some(p=>p.sessionId===s.id));
}
function conflict(s){
  return allPlanned(s.date).some(x=>{
    if(x.id===s.id || x.sessionId===s.id)return false;
    return s.start<undefined ? false : (mins(s.start)<x.e && (mins(s.end)<mins(s.start)?mins(s.end)+1440:mins(s.end))>x.s);
  });
}
function addSession(id){
  const s=DATA.sessions.find(x=>x.id===id); if(!s)return;
  if(plan.some(x=>x.sessionId===id)){toast("Cette séance est déjà dans ton planning");return}
  if(conflict(s)){openSession(id,true);return}
  plan.push({id:"p_"+id,sessionId:id,title:s.title,date:s.date,start:s.start,end:s.end,place:s.place,category:s.category});
  savePlan(); closeModal(); render(); toast("Séance ajoutée à ton planning");
}
function removeSession(pid){
  plan=plan.filter(x=>x.id!==pid);savePlan();closeModal();render();toast("Séance retirée du planning");
}

function render(){
  const date=dates[day], fixed=fixedItems(date), personal=plan.filter(x=>x.date===date), rows=[];
  allPlanned(date).forEach(x=>{
    if(x.source==="jury"||x.source==="juryExtra") rows.push({type:"jury",s:x.s,x});
    else rows.push({type:"personal",s:x.s,x});
  });
  freeWindows(date).forEach(w=>rows.push({type:"free",s:w.start,w}));
  rows.sort((a,b)=>a.s-b.s);

  const body=rows.map(r=>{
    if(r.type==="free"){
      const opts=compatible(date,r.w);
      return `<div class="item free ${opts.length?"click":""}" data-free="${r.w.start}|${r.w.end}">
        <div class="time">${hh(r.w.start)}–${hh(r.w.end)}</div>
        <div class="content"><div class="title freeTitle">Créneau libre</div>
        <div class="meta"><span class="freeText">${dur(r.w.start,r.w.end)} disponibles</span>
        ${opts.length?`<span class="badge">${opts.length} séance${opts.length>1?"s":""} compatible${opts.length>1?"s":""}</span>`:""}</div></div></div>`;
    }
    const x=r.x;
    const personal=r.type==="personal";
    return `<div class="item ${personal?"personal":"jury"}" data-${personal?"plan":"jury"}="${x.id}">
      <div class="time">${x.start}–${x.end}</div><div class="content">
      <div class="title">${esc(x.title)}</div><div class="meta"><span>${esc(x.place)}</span>
      <span class="badge ${personal?"green":"gold"}">${personal?"MON PLANNING":"JURY · OBLIGATOIRE"}</span></div></div></div>`;
  }).join("");

  document.getElementById("app").innerHTML=`<div class="app">
  <header><div class="topline"><div><div class="brand">DEAUVILLE</div><div class="sub">FESTIVAL DU CINÉMA AMÉRICAIN · 2026</div></div><div class="version">v${VERSION}</div></div>
  <div class="datebar"><button class="arrow" id="prev">‹</button><div class="date" id="pick"><b>${dateLabel(date)}</b><small>4—13 septembre</small></div><button class="arrow" id="next">›</button></div>
  <div class="hint">Glisser pour changer de jour</div></header>
  <main><div class="section">MON PLANNING</div>${body||`<div class="empty">Aucune contrainte ce jour.<br>La journée est entièrement disponible.</div>`}</main></div>
  <nav class="bottom"><button class="active">Planning</button><button onclick="toast('Explorer arrive à l’étape suivante')">Explorer</button><button onclick="toast('Mes envies arrive à l’étape suivante')">Envies</button></nav>
  <div class="modal" id="modal"><div class="sheet"><button class="close" id="close">×</button><div class="handle"></div><div id="sheet"></div></div></div>`;

  prev.onclick=()=>move(-1);next.onclick=()=>move(1);pick.onclick=pickDate;close.onclick=closeModal;
  modal.onclick=e=>{if(e.target===modal)closeModal()};
  document.querySelectorAll("[data-jury]").forEach(e=>e.onclick=()=>openJury(e.dataset.jury));
  document.querySelectorAll("[data-plan]").forEach(e=>e.onclick=()=>openPlan(e.dataset.plan));
  document.querySelectorAll("[data-free]").forEach(e=>e.onclick=()=>{let [s,en]=e.dataset.free.split("|");openFree(s,en)});
  const swipeTarget=document.querySelector(".app");
  swipeTarget.addEventListener("touchstart",e=>{touchX=e.changedTouches[0].clientX},{passive:true});
  swipeTarget.addEventListener("touchend",e=>{
    const dx=e.changedTouches[0].clientX-touchX;
    if(Math.abs(dx)>45) move(dx<0?1:-1);
  },{passive:true});
  let pointerStart=null;
  swipeTarget.addEventListener("pointerdown",e=>{pointerStart=e.clientX});
  swipeTarget.addEventListener("pointerup",e=>{
    if(pointerStart===null)return;
    const dx=e.clientX-pointerStart; pointerStart=null;
    if(Math.abs(dx)>60) move(dx<0?1:-1);
  });
}
function move(n){day=Math.max(0,Math.min(9,day+n));render();window.scrollTo({top:0,behavior:"smooth"})}
function closeModal(){modal.style.display="none"}
function openModal(c){sheet.innerHTML=c;modal.style.display="flex"}
function pickDate(){openModal(`<div class="section">CHOISIR UNE DATE</div><h2>Mon planning</h2><div class="datepick">${dates.map((d,i)=>`<button class="${i===day?"sel":""}" data-d="${i}">${dateLabel(d)}</button>`).join("")}</div>`);document.querySelectorAll("[data-d]").forEach(b=>b.onclick=()=>{day=+b.dataset.d;closeModal();render()})}
function openJury(id){const x=[...DATA.jury,...DATA.juryExtra].find(a=>a.id===id);if(!x)return;openModal(`<div class="section">JURY · OBLIGATOIRE</div><h2>${esc(x.title)}</h2><div class="info">📅 ${dateLabel(x.date)}<br>🕘 ${x.start}–${x.end}<br>📍 ${esc(x.place)}</div><p>Ce créneau est une contrainte fixe de ton planning Jury.</p>`)}
function openPlan(id){const x=plan.find(a=>a.id===id);if(!x)return;openModal(`<div class="section">MON PLANNING</div><h2>${esc(x.title)}</h2><div class="info">📅 ${dateLabel(x.date)}<br>🕘 ${x.start}–${x.end}<br>📍 ${esc(x.place)}</div><button class="btn" onclick="removeSession('${x.id}')">Retirer de mon planning</button>`)}
function openFree(start,end){
 const w={start:mins(start),end:mins(end)}, opts=compatible(dates[day],w);
 openModal(`<div class="section">CRÉNEAU LIBRE</div><h2>🟢 ${start} → ${end}</h2><div class="info"><b>${dur(start,end)} disponibles</b><br>Aucune obligation Jury dans cette plage.</div>
 <div class="section">SÉANCES COMPATIBLES</div>
 ${opts.length?opts.map(o=>`<button class="compat" onclick="openSession('${o.id}')"><b>${esc(o.title)}</b><br><small>${o.start}–${o.end} · ${esc(o.place)} · ${esc(o.category)}</small></button>`).join(""):`<div class="info">Aucune séance ne tient entièrement dans ce créneau.</div>`}`);
}
function openSession(id,blocked=false){
 const s=DATA.sessions.find(x=>x.id===id);if(!s)return;
 const already=plan.some(p=>p.sessionId===id);
 openModal(`<div class="section">SÉANCE</div><h2>${esc(s.title)}</h2><div class="info">📅 ${dateLabel(s.date)}<br>🕘 ${s.start}–${s.end}<br>📍 ${esc(s.place)}<br>🏷️ ${esc(s.category)}</div>
 ${already?'<div class="notice">Cette séance est déjà dans ton planning.</div>':blocked?'<div class="notice warn">Cette séance entre en conflit avec un élément obligatoire ou déjà planifié.</div>':`<button class="btn primary" onclick="addSession('${s.id}')">Ajouter à mon planning</button>`}`);
}
function toast(t){let x=document.querySelector(".toast");if(!x){x=document.createElement("div");x.className="toast";document.body.appendChild(x)}x.textContent=t;x.classList.add("show");setTimeout(()=>x.classList.remove("show"),1800)}
fetch("data.json").then(r=>r.json()).then(d=>{DATA=d;plan=loadPlan();render();if("serviceWorker"in navigator)navigator.serviceWorker.register("sw.js")});
