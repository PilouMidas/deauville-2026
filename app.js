
const VERSION="1.4.0";
const dates=Array.from({length:10},(_,i)=>`2026-09-${String(i+4).padStart(2,"0")}`);
let DATA=null, day=0, touchX=0;
const KEY="deauville2026-personal-planning-v110";
const LEGACY_KEYS=["deauville2026-personal-planning-v100","deauville2026-personal-planning-v080","deauville2026-personal-planning-v070","deauville2026-personal-planning-v060","deauville2026-personal-planning-v020","deauville2026-personal-planning-v030","deauville2026-personal-planning-v040","deauville2026-personal-planning-v050"];

const pad=n=>String(n).padStart(2,"0");
function mins(h){let [a,b]=h.split(":").map(Number);return a*60+b}
function dateLabel(d){return new Intl.DateTimeFormat("fr-FR",{weekday:"long",day:"numeric",month:"long"}).format(new Date(d+"T12:00:00"))}
function esc(s){return String(s).replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[m]))}
function dur(a,b){
  const sm=typeof a==="number"?a:mins(a);
  const em=typeof b==="number"?b:mins(b);
  let d=em-sm;
  if(d<0)d+=1440;
  return `${Math.floor(d/60)}h${d%60?pad(d%60):""}`;
}
function loadPlan(){
  try{
    const current=localStorage.getItem(KEY);
    if(current) return JSON.parse(current);
    for(const k of LEGACY_KEYS){
      const raw=localStorage.getItem(k);
      if(raw){
        const parsed=JSON.parse(raw);
        localStorage.setItem(KEY,JSON.stringify(parsed));
        return parsed;
      }
    }
    return [];
  }catch{return[]}
}
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
  // Compare everything on the same minute timeline. A free window may end at
  // 24:00 (1440), while sessions remain expressed as HH:MM.
  const ws=Number(w.start), we=Number(w.end);
  return DATA.sessions.filter(s=>{
    if(s.date!==date)return false;
    const ss=mins(s.start);
    const rawEnd=mins(s.end);
    const ee=rawEnd<ss?rawEnd+1440:rawEnd;
    return ss>=ws && ee<=we;
  });
}
function normTitle(s){return String(s||"").normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase().replace(/[’']/g,"'").replace(/[^a-z0-9]+/g," ").trim()}
const JURY_FILMS=[
  "Les Contrebandiers","Queen at Sea","Everybody Digs Bill Evans","Pressure","L'Invitation",
  "Mouse","Méli-Mélo","If I Go Will They Miss Me","Here I'm Alive","A Prayer for the Dying",
  "I'll Be Gone in June","The Last Pickpocket in New York","Test","Party USA","The Man I Love",
  "The Liberation of Rita Cooper","Company","The Accompanist","Club Kid","Burgundy"
].map(normTitle);
function juryFilmAlreadyPlanned(s){
  const t=normTitle(s.title);
  return JURY_FILMS.includes(t) && DATA.jury.some(j=>{
    const jt=normTitle(j.title);
    return jt===t || jt.includes(t);
  });
}
function alreadyPlanned(s){
  return plan.some(p=>p.sessionId===s.id) || juryFilmAlreadyPlanned(s);
}
function conflict(s){
  const ss=mins(s.start);
  const ee=mins(s.end)<ss?mins(s.end)+1440:mins(s.end);
  return allPlanned(s.date).some(x=>{
    if(x.id===s.id || x.sessionId===s.id)return false;
    return ss<x.e && ee>x.s;
  });
}
function addSession(id,force=false){
  const s=DATA.sessions.find(x=>x.id===id); if(!s)return;
  if(alreadyPlanned(s) && !force){toast("Cette séance est déjà dans ton planning");return}
  if(conflict(s)){openSession(id,true);return}
  plan.push({id:"p_"+id,sessionId:id,title:s.title,date:s.date,start:s.start,end:s.end,place:s.place,category:s.category});
  savePlan(); closeModal(); render(); toast("Séance ajoutée à ton planning");
}
function removeSession(pid){
  plan=plan.filter(x=>x.id!==pid);savePlan();closeModal();render();toast("Séance retirée du planning");
}

const CAT_LABEL={COMP:"Compétition",PREM:"Premières",DOC:"American Doc Stories",POV:"Prix d'Ornano-Valenti",BF:"Deauville Talent Award — Brendan Fraser",EH:"Deauville Talent Award — Ethan Hawke",250:"Once Upon a Time (In) America"};
const PLACES=["Tous les lieux","CID","Casino","Morny 1","Morny 2","Morny 3"];
let view="planning", filters={place:"Tous les lieux",category:"Toutes les catégories",collection:"Toutes les collections",search:""};
function catLabel(c){return CAT_LABEL[c]||c||""}
function isInMyPlan(s){return plan.some(p=>p.sessionId===s.id)}
function isJuryForFilm(s){return juryFilmAlreadyPlanned(s)}
function starsFor(s){return !!s.star || !!s.etoile || !!s.étoile || !!s.seanceEtoile}
function collectionLabel(s){return s.category==="250"?"Once Upon a Time (In) America":""}
function sessionMatches(s){
  if(filters.place!=="Tous les lieux" && s.place!==filters.place)return false;
  if(filters.category!=="Toutes les catégories" && catLabel(s.category)!==filters.category)return false;
  if(filters.collection!=="Toutes les collections" && collectionLabel(s)!==filters.collection)return false;
  if(filters.star && !starsFor(s))return false;
  const q=normTitle(filters.search);
  if(q && !normTitle(s.title).includes(q))return false;
  return true;
}
function filteredAllSessions(){
  return DATA.sessions.filter(sessionMatches).sort((a,b)=>a.date.localeCompare(b.date)||mins(a.start)-mins(b.start)||a.title.localeCompare(b.title,"fr"));
}
function sortedSessions(date){return DATA.sessions.filter(s=>s.date===date && sessionMatches(s)).sort((a,b)=>mins(a.start)-mins(b.start)||a.title.localeCompare(b.title,"fr"))}
function dayCount(){return DATA.sessions.filter(s=>s.date===dates[day]).length}
function otherFilmSessions(s){
  const t=normTitle(s.title);
  return DATA.sessions.filter(x=>x.id!==s.id && normTitle(x.title)===t).sort((a,b)=>a.date.localeCompare(b.date)||mins(a.start)-mins(b.start));
}
function explorerView(date){
  const searching=!!normTitle(filters.search);
  const sessions=searching?filteredAllSessions():sortedSessions(date);
  const cats=["Toutes les catégories",...Object.values(CAT_LABEL).filter((v,i,a)=>a.indexOf(v)===i)];
  const collections=["Toutes les collections","Once Upon a Time (In) America"];
  const hasStars=DATA.sessions.some(starsFor);
  const heading=searching?`RECHERCHE · ${sessions.length} RÉSULTAT${sessions.length>1?'S':''}`:`EXPLORER · ${sessions.length} SÉANCE${sessions.length>1?'S':''}`;
  let cards='';
  if(searching){
    const groups=dates.map(d=>({date:d,items:sessions.filter(s=>s.date===d)})).filter(g=>g.items.length);
    cards=groups.map(g=>`<div class="searchDay"><div class="searchDate"><span>${dateLabel(g.date)}</span>${g.date===date?'<b>· JOUR SÉLECTIONNÉ</b>':''}</div>${g.items.map(explorerCard).join('')}</div>`).join('');
  } else cards=sessions.map(explorerCard).join('');
  return `<div class="section">${heading}</div>
  <div class="filters"><div class="searchWrap"><span>⌕</span><input id="search" value="${esc(filters.search)}" placeholder="Rechercher un film…" autocomplete="off" inputmode="search"></div>
  <div class="filterRow"><select data-filter-place>${PLACES.map(x=>`<option ${filters.place===x?'selected':''}>${x}</option>`).join('')}</select><select data-filter-cat>${cats.map(x=>`<option ${filters.category===x?'selected':''}>${x}</option>`).join('')}</select></div>
  <div class="filterRow"><select data-filter-col>${collections.map(x=>`<option ${filters.collection===x?'selected':''}>${x}</option>`).join('')}</select>${hasStars?`<button type="button" class="starFilter ${filters.star?'active':''}" id="starFilter">⭐ Séances étoile</button>`:''}</div></div>
  ${cards||`<div class="empty">${searching?`Aucune séance ne correspond à « ${esc(filters.search)} ». <br><small>La recherche porte sur tout le Festival.</small>`:'Aucune séance ne correspond à ces filtres.'}</div>`}`;
}
function explorerCard(s){
  const jury=isJuryForFilm(s), personal=isInMyPlan(s), star=starsFor(s);
  return `<button class="exploreCard" data-session="${s.id}"><div class="ecTime">${s.start}</div><div class="ecBody"><div class="ecTitle">${esc(s.title)}</div><div class="ecMeta">${esc(s.place)} · ${esc(catLabel(s.category))}</div><div class="ecBadges">${jury?'<span class="badge gold">JURY · DÉJÀ AU PLANNING</span>':''}${personal?'<span class="badge green">MON PLANNING</span>':''}${star?'<span class="badge star">⭐ SÉANCE ÉTOILE</span>':''}</div></div><div class="ecArrow">›</div></button>`;
}
function attachSwipe(){
  const target=document.querySelector('.app');let sx=null,sy=null;
  target.addEventListener('touchstart',e=>{if(e.touches.length===1){sx=e.touches[0].clientX;sy=e.touches[0].clientY}},{passive:true});
  target.addEventListener('touchend',e=>{if(sx===null)return;const dx=e.changedTouches[0].clientX-sx,dy=e.changedTouches[0].clientY-sy;if(Math.abs(dx)>=55&&Math.abs(dx)>Math.abs(dy)*1.35)move(dx<0?1:-1);sx=sy=null},{passive:true});
}
function move(n){day=Math.max(0,Math.min(9,day+n));render();window.scrollTo({top:0,behavior:'smooth'})}
function closeModal(){const m=document.getElementById('modal');if(m){m.style.display='none';m.setAttribute('aria-hidden','true')}}
function openModal(c){const m=document.getElementById('modal');document.getElementById('sheet').innerHTML=c;m.style.display='flex';m.setAttribute('aria-hidden','false')}
function pickDate(){openModal(`<div class="section">CHOISIR UNE DATE</div><h2>${view==='explorer'?'Explorer':'Mon planning'}</h2><div class="datepick">${dates.map((d,i)=>`<button class="${i===day?'sel':''}" data-d="${i}">${dateLabel(d)}</button>`).join('')}</div>`);document.querySelectorAll('[data-d]').forEach(b=>b.onclick=()=>{day=+b.dataset.d;closeModal();render()})}
function openJury(id){const x=[...DATA.jury,...DATA.juryExtra].find(a=>a.id===id);if(!x)return;openModal(`<div class="section">JURY · OBLIGATOIRE</div><h2>${esc(x.title)}</h2><div class="info">📅 ${dateLabel(x.date)}<br>🕘 ${x.start}–${x.end}<br>📍 ${esc(x.place)}</div><p>Ce créneau est une contrainte fixe de ton planning Jury.</p>`)}
function openPlan(id){const x=plan.find(a=>a.id===id);if(!x)return;openModal(`<div class="section">MON PLANNING</div><h2>${esc(x.title)}</h2><div class="info">📅 ${dateLabel(x.date)}<br>🕘 ${x.start}–${x.end}<br>📍 ${esc(x.place)}</div><button class="btn" onclick="removeSession('${x.id}')">Retirer de mon planning</button>`)}
function openFree(start,end){const sm=Number(start),em=Number(end),opts=compatible(dates[day],{start:sm,end:em});openModal(`<div class="section">CRÉNEAU LIBRE</div><h2>🟢 ${hh(sm)} → ${hh(em)}</h2><div class="info"><b>${dur(sm,em)} disponibles</b><br>Aucune obligation Jury dans cette plage.</div><div class="section">SÉANCES COMPATIBLES</div>${opts.length?opts.map(o=>{const ap=alreadyPlanned(o);return `<button class="compat ${ap?'already':''}" onclick="openSession('${o.id}',false,${sm},${em})"><b>${esc(o.title)}</b>${ap?'<br><span class="alreadyLabel">✓ DÉJÀ DANS TON PLANNING · OBLIGATION JURY</span>':''}<br><small>${o.start}–${o.end} · ${esc(o.place)} · ${esc(catLabel(o.category))}</small></button>`}).join(''):'<div class="info">Aucune séance ne tient entièrement dans ce créneau.</div>'}`)}
function compatibilityLabel(s){
  const incompatible=conflict(s);
  const already=alreadyPlanned(s);
  if(incompatible) return '<span class="status bad">⚠️ NON COMPATIBLE</span>';
  if(already) return '<span class="status good">✓ COMPATIBLE · DÉJÀ AU PLANNING</span>';
  return '<span class="status good">✓ COMPATIBLE</span>';
}
function openSession(id,blocked=false,backStart=null,backEnd=null,backSessionId=null){
  const s=DATA.sessions.find(x=>x.id===id);if(!s)return;
  const already=alreadyPlanned(s);
  let back='';
  if(backSessionId){
    back=`<button class="backBtn" onclick="openSession('${backSessionId}',false,${backStart!==null?Number(backStart):'null'},${backEnd!==null?Number(backEnd):'null'},null)">← Retour à la séance précédente</button>`;
  } else if(backStart!==null&&backEnd!==null){
    back=`<button class="backBtn" onclick="openFree(${Number(backStart)},${Number(backEnd)})">← Retour aux séances compatibles</button>`;
  }
  const jury=isJuryForFilm(s);
  const incompatible=conflict(s);
  const alternatives=otherFilmSessions(s);
  let notice='';
  if(incompatible){
    notice+=`<div class="notice warn"><b>⚠️ Cette séance n'est pas compatible avec ton planning.</b><br>Elle entre en conflit avec un événement obligatoire ou déjà planifié.</div>`;
  }
  if(alternatives.length){
    notice+=`<div class="section">AUTRES SÉANCES DE CE FILM</div>${alternatives.map(o=>{
      const status=compatibilityLabel(o);
      return `<button class="compat" onclick="openSession('${o.id}',false,${backStart!==null?Number(backStart):'null'},${backEnd!==null?Number(backEnd):'null'},'${s.id}')"><b>${o.date===s.date?'Même jour · ':''}${dateLabel(o.date)}</b><br><small>${o.start}–${o.end} · ${esc(o.place)}</small><br>${status}</button>`;
    }).join('')}`;
  } else {
    notice+=`<div class="info"><b>Aucune autre séance de ce film n'est programmée.</b></div>`;
  }
  openModal(`${back}<div class="section">SÉANCE</div><h2>${esc(s.title)}</h2><div class="info">📅 ${dateLabel(s.date)}<br>🕘 ${s.start}–${s.end}<br>📍 ${esc(s.place)}<br>🏷️ ${esc(catLabel(s.category))}${starsFor(s)?'<br>⭐ Séance étoile':''}</div>${jury?'<div class="notice">Cette œuvre figure déjà dans ton planning, car elle fait partie de tes obligations Jury.</div>':''}${already&&!jury?'<div class="notice">Cette séance est déjà dans ton planning.</div>':''}${notice}${incompatible?`<button class="btn primary" onclick="addSession('${s.id}',true)">Forcer : ajouter quand même à mon planning</button>`:(already||jury)?`<button class="btn primary" onclick="addSession('${s.id}',true)">Ajouter quand même à mon planning</button>`:`<button class="btn primary" onclick="addSession('${s.id}')">Ajouter à mon planning</button>`}`);
}
function render(){
  const date=dates[day];
  if(view==='explorer'){
    document.getElementById('app').innerHTML=`<div class="app">
      <header><div class="topline"><div><div class="brand">DEAUVILLE</div><div class="sub">FESTIVAL DU CINÉMA AMÉRICAIN · 2026</div></div><div class="version">v${VERSION}</div></div>
      <div class="datebar"><button class="arrow" id="prev">‹</button><div class="date" id="pick"><b>${dateLabel(date)}</b><small>4—13 septembre</small></div><button class="arrow" id="next">›</button></div>
      <div class="hint">Glisser pour changer de jour</div></header>
      <main><div class="exploreSwitch"><button class="tab" id="tabPlanning">Planning</button><button class="tab sel">Explorer</button></div>${explorerView(date)}</main>
      </div><nav class="bottom"><button id="navPlanning">Planning</button><button class="active">Explorer</button><button onclick="toast('Mes envies arrive à l’étape suivante')">Envies</button></nav>
      <div class="modal" id="modal" aria-hidden="true"><div class="sheet" role="dialog" aria-modal="true"><div id="sheet"></div></div></div>`;
  } else {
    const fixed=fixedItems(date), rows=[];
    allPlanned(date).forEach(x=>rows.push({type:(x.source==='jury'||x.source==='juryExtra')?'jury':'personal',s:x.s,x}));
    freeWindows(date).forEach(w=>rows.push({type:'free',s:w.start,w})); rows.sort((a,b)=>a.s-b.s);
    const body=rows.map(r=>{if(r.type==='free'){const opts=compatible(date,r.w);return `<div class="item free ${opts.length?'click':''}" data-free="${r.w.start}|${r.w.end}"><div class="time">${hh(r.w.start)}<br><span class="timeSep">→</span><br>${hh(r.w.end)}</div><div class="content"><div class="title freeTitle">Créneau libre</div><div class="meta"><span class="freeText">${dur(r.w.start,r.w.end)} disponibles</span>${opts.length?`<span class="badge">${opts.length} séance${opts.length>1?'s':''} compatible${opts.length>1?'s':''}</span>`:''}</div></div></div>`}const x=r.x,personal=r.type==='personal';return `<div class="item ${personal?'personal':'jury'}" data-${personal?'plan':'jury'}="${x.id}"><div class="time">${x.start}–${x.end}</div><div class="content"><div class="title">${esc(x.title)}</div><div class="meta"><span>${esc(x.place)}</span><span class="badge ${personal?'green':'gold'}">${personal?'MON PLANNING':'JURY · OBLIGATOIRE'}</span></div></div></div>`}).join('');
    document.getElementById('app').innerHTML=`<div class="app"><header><div class="topline"><div><div class="brand">DEAUVILLE</div><div class="sub">FESTIVAL DU CINÉMA AMÉRICAIN · 2026</div></div><div class="version">v${VERSION}</div></div><div class="datebar"><button class="arrow" id="prev">‹</button><div class="date" id="pick"><b>${dateLabel(date)}</b><small>4—13 septembre</small></div><button class="arrow" id="next">›</button></div><div class="hint">Glisser pour changer de jour</div></header><main><div class="exploreSwitch"><button class="tab sel">Planning</button><button class="tab" id="tabExplorer">Explorer</button></div><div class="section">MON PLANNING</div>${body||'<div class="empty">Aucune contrainte ce jour.<br>La journée est entièrement disponible.</div>'}</main></div><nav class="bottom"><button class="active">Planning</button><button id="navExplorer">Explorer</button><button onclick="toast('Mes envies arrive à l’étape suivante')">Envies</button></nav><div class="modal" id="modal" aria-hidden="true"><div class="sheet" role="dialog" aria-modal="true"><div id="sheet"></div></div></div>`;
  }
  const modal=document.getElementById('modal'),sheet=document.getElementById('sheet');
  document.getElementById('prev').onclick=()=>move(-1);document.getElementById('next').onclick=()=>move(1);document.getElementById('pick').onclick=pickDate;
  const np=document.getElementById('navPlanning'), ne=document.getElementById('navExplorer'), tp=document.getElementById('tabPlanning'), te=document.getElementById('tabExplorer');
  if(np)np.onclick=()=>{view='planning';render()}; if(ne)ne.onclick=()=>{view='explorer';render()}; if(tp)tp.onclick=()=>{view='planning';render()}; if(te)te.onclick=()=>{view='explorer';render()};
  if(view==='explorer'){
    const search=document.getElementById('search'); if(search){search.addEventListener('input',e=>{filters.search=e.target.value;render();const q=document.getElementById('search');q.focus();q.setSelectionRange(q.value.length,q.value.length)})}
    const fp=document.querySelector('[data-filter-place]'),fc=document.querySelector('[data-filter-cat]'),fl=document.querySelector('[data-filter-col]'),fs=document.getElementById('starFilter');
    if(fp)fp.onchange=e=>{filters.place=e.target.value;render()};if(fc)fc.onchange=e=>{filters.category=e.target.value;render()};if(fl)fl.onchange=e=>{filters.collection=e.target.value;render()};if(fs)fs.onclick=()=>{filters.star=!filters.star;render()};
    document.querySelectorAll('[data-session]').forEach(e=>e.onclick=()=>openSession(e.dataset.session,false));
  }
  document.querySelectorAll('[data-jury]').forEach(e=>e.onclick=()=>openJury(e.dataset.jury));document.querySelectorAll('[data-plan]').forEach(e=>e.onclick=()=>openPlan(e.dataset.plan));document.querySelectorAll('[data-free]').forEach(e=>e.onclick=()=>{let [a,b]=e.dataset.free.split('|');openFree(a,b)});
  if(modal){modal.addEventListener('click',e=>{if(e.target===modal){e.preventDefault();e.stopPropagation();closeModal()}});sheet.addEventListener('click',e=>e.stopPropagation())}
  document.onkeydown=e=>{if(e.key==='Escape'&&modal&&modal.style.display!=='none')closeModal()};
  attachSwipe();
}
function toast(t){let x=document.querySelector('.toast');if(!x){x=document.createElement('div');x.className='toast';document.body.appendChild(x)}x.textContent=t;x.classList.add('show');setTimeout(()=>x.classList.remove('show'),1800)}
fetch('data.json').then(r=>r.json()).then(d=>{DATA=d;plan=loadPlan();render();if('serviceWorker'in navigator)navigator.serviceWorker.register('sw.js',{updateViaCache:'none'}).then(r=>r.update()).catch(()=>{})});
