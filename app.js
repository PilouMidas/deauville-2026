/* Deauville 2026 — V2.0.0
   Reconstruction from official Festival Guide + Jury CANAL+ PDF.
   The data model separates works, sessions, public events and locked Jury items.
*/
(() => {
  'use strict';
  const DATA = window.DEAUVILLE_DATA;
  const DAYS = DATA.days;
  const WORKS = DATA.works;
  const SESSIONS = DATA.sessions;
  const EVENTS = DATA.events;
  const JURY = DATA.jury;
  const WORK_BY_ID = new Map(WORKS.map(w => [w.id, w]));
  const WORK_ALIASES = new Map();
  WORKS.forEach(w => [w.title, ...(w.aliases || [])].forEach(a => WORK_ALIASES.set(normalize(a), w.id)));

  const state = {
    day: defaultDay(),
    view: 'planning',
    filter: 'all',
    search: '',
    wishes: load('wishes', []),
    seen: load('seen', []),
    planned: load('planned', []),
    notes: load('notes', {}),
    modalContext: null
  };

  state.wishes = canonicalIds(state.wishes);
  state.seen = canonicalIds(state.seen);
  state.planned = state.planned.filter(validPlanned);
  persist();

  function normalize(s) {
    return String(s || '').toLowerCase().replace(/[’‘]/g,"'").normalize('NFKD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,' ').trim().replace(/\s+/g,' ');
  }
  function workIdFromTitle(title) {
    const n = normalize(title);
    if (WORK_ALIASES.has(n)) return WORK_ALIASES.get(n);
    return WORKS.find(w => normalize(w.title) === n)?.id || null;
  }
  function canonicalIds(ids) {
    const out = [];
    (ids || []).forEach(x => {
      if (typeof x === 'string' && WORK_BY_ID.has(x) && !out.includes(x)) out.push(x);
      else if (typeof x === 'number') { const w = WORKS[x]; if (w && !out.includes(w.id)) out.push(w.id); }
    });
    return out;
  }
  function load(k, fallback) { try { return JSON.parse(localStorage.getItem('deauville-v2-'+k)) ?? fallback; } catch { return fallback; } }
  function save(k, v) { localStorage.setItem('deauville-v2-'+k, JSON.stringify(v)); }
  function persist() { save('wishes',state.wishes); save('seen',state.seen); save('planned',state.planned); save('notes',state.notes); }
  function tm(s) { const [h,m] = String(s || '').split(':').map(Number); return h*60+m; }
  function fmtMin(n) { if (n == null || Number.isNaN(n)) return '—'; return n < 60 ? `${n} min` : `${Math.floor(n/60)}h${n%60 ? String(n%60).padStart(2,'0') : ''}`; }
  function fmtTime(n) { n=((n%1440)+1440)%1440; return `${String(Math.floor(n/60)).padStart(2,'0')}:${String(n%60).padStart(2,'0')}`; }
  function dateLabel(d) { return new Date(`${d}T12:00:00`).toLocaleDateString('fr-FR',{weekday:'long',day:'numeric',month:'long'}).toUpperCase(); }
  function shortDate(d) { return new Date(`${d}T12:00:00`).toLocaleDateString('fr-FR',{weekday:'short',day:'numeric',month:'short'}); }
  function defaultDay() { const today=new Date(); const d=today.getFullYear()+'-'+String(today.getMonth()+1).padStart(2,'0')+'-'+String(today.getDate()).padStart(2,'0'); const i=DAYS.indexOf(d); return i>=0?i:(d<DAYS[0]?0:DAYS.length-1); }
  function showToast(msg) { const t=document.getElementById('toast'); if(!t)return; t.textContent=msg; t.hidden=false; clearTimeout(window.__toast); window.__toast=setTimeout(()=>t.hidden=true,1800); }
  function esc(s) { return String(s ?? '').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }
  function currentDate(){ return DAYS[state.day]; }
  function workSessions(id){ return SESSIONS.filter(s=>s.workId===id); }
  function workById(id){ return WORK_BY_ID.get(id); }
  function durationOfSession(s){ const w=workById(s.workId); return w?.duration ?? null; }
  function sessionEnd(s){ return s.end ? tm(s.end) : (durationOfSession(s) == null ? null : tm(s.start)+durationOfSession(s)); }
  function itemEnd(x){ if(!x)return null; const st=tm(x.start); if(Number.isNaN(st))return null; if(x.end){ const e=tm(x.end); return e < st ? e+1440 : e; } return x.duration == null ? null : st+Number(x.duration); }
  function sessionKey(s){ return `${s.date}|${s.start}|${s.place}|${s.workId}`; }
  function sameSession(a,b){ return !!a && !!b && a.type!=='event' && b.type!=='event' && a.date===b.date && a.start===b.start && a.place===b.place && a.workId===b.workId; }
  function overlaps(aStart,aEnd,bStart,bEnd){ return aEnd != null && bEnd != null && aStart < bEnd && bStart < aEnd; }

  function lockedForDate(date) { return JURY.filter(x=>x.date===date).sort((a,b)=>tm(a.start)-tm(b.start)); }
  function plannedForDate(date) { return state.planned.filter(x=>x.date===date).sort((a,b)=>tm(a.start)-tm(b.start)); }
  function allBusy(date) { return [...lockedForDate(date),...plannedForDate(date)].sort((a,b)=>tm(a.start)-tm(b.start)); }
  function plannedEntryFromSession(s) {
    const w=workById(s.workId);
    return {type:'session',id:`plan-${sessionKey(s)}`,date:s.date,start:s.start,end:s.end||null,duration:w?.duration??null,place:s.place,workId:s.workId,title:w?.title||s.title,category:w?.category||'session',locked:false};
  }
  function plannedEntryFromEvent(e) { return {type:'event',id:`plan-${e.id}`,date:e.date,start:e.start,end:e.end||null,place:e.place,title:e.title,workId:e.workId||null,category:e.kind,locked:false}; }
  function validPlanned(x){ return x && x.date && x.start && x.title; }
  function isPlannedSession(s){ return state.planned.some(x=>x.type==='session' && sameSession(x,{date:s.date,start:s.start,place:s.place,workId:s.workId})); }
  function plannedWork(id){ return state.planned.filter(x=>x.workId===id); }
  function conflictWithPlanned(s){
    const se=sessionEnd(s); if(se==null)return [];
    return state.planned.filter(x=>x.date===s.date && !sameSession(x,s)).filter(x=>overlaps(tm(s.start),se,tm(x.start),itemEnd(x)));
  }
  function conflictWithJury(s){
    const se=sessionEnd(s); if(se==null)return [];
    return lockedForDate(s.date).filter(x=>overlaps(tm(s.start),se,tm(x.start),itemEnd(x)));
  }
  function sessionStatus(s){
    if(isPlannedSession(s)) return {key:'planned',label:'Déjà au planning'};
    const conflicts=[...conflictWithJury(s),...conflictWithPlanned(s)];
    if(conflicts.length) return {key:'bad',label:'Conflit'};
    return {key:'good',label:'Compatible'};
  }
  function compatibleSessions(date,start,end){
    const ws=tm(start), we=tm(end), seen=new Set();
    return SESSIONS.filter(s=>s.date===date).filter(s=>{
      const se=sessionEnd(s); if(se==null || tm(s.start)<ws || se>we) return false;
      if(conflictWithJury(s).length || conflictWithPlanned(s).length) return false;
      const k=sessionKey(s); if(seen.has(k)) return false; seen.add(k); return true;
    }).sort((a,b)=>tm(a.start)-tm(b.start)||a.place.localeCompare(b.place,'fr'));
  }
  function freeWindows(date){
    const busy=allBusy(date).map(x=>({s:tm(x.start),e:itemEnd(x)})).filter(x=>x.e!=null).sort((a,b)=>a.s-b.s);
    if(!busy.length)return [];
    const out=[]; let cursor=busy[0].s;
    // Deliberately no artificial free time before the first fixed item.
    for(const b of busy){
      if(b.s>cursor) out.push({date,s:fmtTime(cursor),e:fmtTime(b.s)});
      cursor=Math.max(cursor,b.e);
    }
    // Never invent a post-departure free block on 13 September.
    if(date!==DAYS[DAYS.length-1] && cursor<1440) out.push({date,s:fmtTime(cursor),e:'23:59'});
    return out.filter(w=>tm(w.e)-tm(w.s)>=15);
  }
  function render(){
    document.getElementById('app').innerHTML=`<div class="app"><header class="header">
      <div class="brandRow"><div><div class="brand">DEAUVILLE <span class="version">V2.0.0</span></div><div class="sub">FESTIVAL DU CINÉMA AMÉRICAIN · 4—13 SEPTEMBRE 2026</div></div><button class="iconBtn" onclick="app.openSearch()" aria-label="Rechercher">⌕</button></div>
      <div class="datebar"><button class="arrow" onclick="app.move(-1)" ${state.day===0?'disabled':''}>‹</button><button class="dateBtn" onclick="app.pickDate()"><b>${dateLabel(currentDate())}</b><small>Toucher pour choisir la journée</small></button><button class="arrow" onclick="app.move(1)" ${state.day===DAYS.length-1?'disabled':''}>›</button></div>
      <nav class="mainnav"><button class="${state.view==='planning'?'on':''}" onclick="app.setView('planning')">🗓 Planning</button><button class="${state.view==='explore'?'on':''}" onclick="app.setView('explore')">🎬 Programme</button><button class="${state.view==='wishes'?'on':''}" onclick="app.setView('wishes')">⭐ Envies</button></nav>
    </header><main>${state.view==='planning'?planningView():state.view==='explore'?exploreView():wishesView()}</main>
    <div id="modal" class="modal" hidden onclick="if(event.target===this)app.close()"><div class="sheet"><button class="close" onclick="app.close()">×</button><div class="handle"></div><div id="sheet"></div></div></div><div id="toast" class="toast" hidden></div></div>`;
    installSwipe();
  }
  function planningView(){
    const date=currentDate(), busy=allBusy(date), free=freeWindows(date);
    let items=[];
    busy.forEach(x=>items.push({kind:'busy',x}));
    free.forEach(w=>items.push({kind:'free',x:w}));
    items.sort((a,b)=>tm(a.x.start||a.x.s)-tm(b.x.start||b.x.s));
    return `<div class="sectionHead"><div><div class="eyebrow">MON PLANNING</div><h1>${dateLabel(date)}</h1></div><span class="pill">${busy.length} fixe${busy.length>1?'s':''}</span></div>
      ${items.length?items.map(i=>i.kind==='free'?freeCard(i.x):busyCard(i.x)).join(''):'<div class="empty">Aucun élément programmé.</div>'}
      <div class="hint">Les éléments du Jury, les trajets et le check-in sont verrouillés selon le planning officiel fourni.</div>`;
  }
  function busyCard(x){
    const locked=!!x.locked, planned=state.planned.some(p=>p.id===x.id || (p.date===x.date&&p.start===x.start&&p.title===x.title&&p.place===x.place));
    const label=x.type==='session'?'SÉANCE':(x.kind==='hotel'?'HÔTEL':x.kind==='transport'?'TRANSPORT':locked?'JURY':'ÉVÉNEMENT');
    const clickable=locked||planned;
    return `<button class="card busy ${locked?'juryCard':''}" onclick='app.openBusy(${JSON.stringify(x)})'><span class="time">${esc(x.start)}${x.end?`<br>– ${esc(x.end)}`:''}</span><span class="cardBody"><b>${esc(x.title)}</b><small>${esc(x.place)} · ${label}</small>${locked?'<em class="gold">JURY</em>':''}</span><span class="chev">›</span></button>`;
  }
  function freeCard(w){ const opts=compatibleSessions(w.date,w.s,w.e); return `<button class="card freeCard" onclick='app.openFree(${JSON.stringify(w)})'><span class="time">${w.s}<br>– ${w.e}</span><span class="cardBody"><b>Temps libre · ${fmtMin(tm(w.e)-tm(w.s))}</b><small>${opts.length?`${opts.length} séance${opts.length>1?'s':''} compatible${opts.length>1?'s':''}`:'Aucune séance compatible'}</small><em class="green">LIBRE</em></span><span class="chev">›</span></button>`; }
  function exploreView(){
    const date=currentDate(), ss=SESSIONS.filter(s=>s.date===date).sort((a,b)=>tm(a.start)-tm(b.start));
    const ev=EVENTS.filter(e=>e.date===date).sort((a,b)=>tm(a.start)-tm(b.start));
    const combined=[...ss.map(s=>({kind:'session',time:s.start,obj:s})),...ev.map(e=>({kind:'event',time:e.start,obj:e}))].sort((a,b)=>tm(a.time)-tm(b.time));
    return `<div class="sectionHead"><div><div class="eyebrow">PROGRAMME OFFICIEL</div><h1>${shortDate(date)}</h1></div><button class="pillBtn" onclick="app.openJury()">Jury</button></div>` +
      `<div class="filterRow"><button class="filter ${state.filter==='all'?'on':''}" onclick="app.filter('all')">Tout</button><button class="filter ${state.filter==='competition'?'on':''}" onclick="app.filter('competition')">Compétition</button><button class="filter ${state.filter==='premieres'?'on':''}" onclick="app.filter('premieres')">Premières</button><button class="filter ${state.filter==='doc'?'on':''}" onclick="app.filter('doc')">Doc</button><button class="filter ${state.filter==='250'?'on':''}" onclick="app.filter('250')">250</button></div>
      ${combined.filter(x=>state.filter==='all'||x.kind==='event'||workById(x.obj.workId)?.category===state.filter).map(x=>x.kind==='session'?sessionCard(x.obj):eventCard(x.obj)).join('')||'<div class="empty">Aucun rendez-vous dans ce filtre.</div>'}`;
  }
  function sessionCard(s){ const w=workById(s.workId), st=sessionStatus(s); return `<button class="card sessionCard ${st.key}" onclick='app.openSession(${JSON.stringify(s)})'><span class="time">${esc(s.start)}<br><small>${w?.duration?fmtMin(w.duration):''}</small></span><span class="cardBody"><b>${esc(w?.title||s.title)}</b><small>${esc(s.place)} · ${esc(w?.categoryLabel||'')}</small>${st.key==='planned'?'<em class="neutral">DÉJÀ AU PLANNING</em>':st.key==='bad'?'<em class="redish">CONFLIT</em>':'<em class="green">COMPATIBLE</em>'}</span><span class="chev">›</span></button>`; }
  function eventCard(e){ return `<button class="card eventCard" onclick='app.openEvent(${JSON.stringify(e)})'><span class="time">${esc(e.start)}${e.end?`<br>– ${esc(e.end)}`:''}</span><span class="cardBody"><b>${esc(e.title)}</b><small>${esc(e.place)} · ÉVÉNEMENT</small></span><span class="chev">›</span></button>`; }
  function wishesView(){
    const wish=state.wishes.map(workById).filter(Boolean), seen=state.seen.map(workById).filter(Boolean);
    return `<div class="sectionHead"><div><div class="eyebrow">PERSONNEL</div><h1>Mes envies</h1></div><span class="pill">${wish.length}</span></div>
      <div class="listTitle">⭐ À VOIR</div>${wish.map(w=>workListRow(w,'wish')).join('')||'<div class="empty">Aucune envie pour le moment.</div>'}
      <div class="listTitle">👀 VUS</div>${seen.map(w=>workListRow(w,'seen')).join('')||'<div class="empty">Aucun film marqué comme vu.</div>'}`;
  }
  function workListRow(w,type){ const next=workSessions(w.id)[0]; return `<button class="workRow" onclick="app.openWork('${w.id}')"><span class="miniIcon">${type==='seen'?'👀':'⭐'}</span><span><b>${esc(w.title)}</b><small>${esc(w.director||'')} · ${w.duration?fmtMin(w.duration):''}${next?` · prochaine séance ${next.date.slice(8)} sept. ${next.start}`:''}</small></span><span>›</span></button>`; }

  function openModal(html, context){ state.modalContext=context||null; const m=document.getElementById('modal'); if(!m)return; document.getElementById('sheet').innerHTML=html; m.hidden=false; }
  function close(){ const m=document.getElementById('modal'); if(m)m.hidden=true; state.modalContext=null; }
  function route(place){ const dest=encodeURIComponent(`${place}, Deauville, France`); return {g:`https://www.google.com/maps/dir/?api=1&destination=${dest}&travelmode=walking`,a:`https://maps.apple.com/?daddr=${dest}&dirflg=w`}; }
  function routeHtml(place){ const r=route(place); return `<div class="routeBtns"><a href="${r.g}" target="_blank" rel="noopener">🗺 Google Maps</a><a href="${r.a}" target="_blank" rel="noopener">🍎 Plans</a></div>`; }
  function workMeta(w){ return `<div class="facts">${w.year?`<span>📅 ${w.year}</span>`:''}${w.duration?`<span>⏱ ${fmtMin(w.duration)}</span>`:''}${w.country?`<span>🌍 ${esc(w.country)}</span>`:''}</div>`; }
  function workPage(w){
    const sessions=workSessions(w.id), planned=plannedWork(w.id), wish=state.wishes.includes(w.id), seen=state.seen.includes(w.id);
    return `<div class="eyebrow">FICHE FILM · ${esc(w.categoryLabel)}</div><h2>${esc(w.title)}</h2>${w.aliases?.length?`<div class="alias">Titre(s) associé(s) : ${w.aliases.filter(a=>normalize(a)!==normalize(w.title)).map(esc).join(' · ')}</div>`:''}
      ${workMeta(w)}<p class="director"><b>Réalisation :</b> ${esc(w.director||'—')}</p>${w.synopsis?`<p class="synopsis">${esc(w.synopsis)}</p>`:''}${w.cast?`<p><b>Avec :</b> ${esc(w.cast)}</p>`:''}
      ${planned.length?`<div class="plannedBox"><b>📅 Film déjà au planning</b>${planned.map(p=>`<button class="innerLink" onclick='app.openBusy(${JSON.stringify(p)})'>${esc(p.date.slice(8))} sept. · ${esc(p.start)} · ${esc(p.place)}</button>`).join('')}</div>`:''}
      <div class="sectionMini">SÉANCES · ${sessions.length}</div>${sessions.map(s=>sessionDetailRow(s)).join('')||'<div class="info">Aucune séance trouvée dans le programme officiel.</div>'}
      <div class="actionGrid"><button class="btn" onclick="app.toggleWish('${w.id}')">${wish?'☆ Retirer des envies':'⭐ Ajouter aux envies'}</button><button class="btn" onclick="app.toggleSeen('${w.id}')">${seen?'✓ Vu':'👀 Marquer comme vu'}</button></div><button class="btn" onclick="app.editNote('${w.id}')">📝 ${state.notes[w.id]?'Modifier ma note':'Ajouter une note'}</button>
      ${w.url?`<a class="btn primary linkBtn" href="${esc(w.url)}" target="_blank" rel="noopener">↗ Fiche officielle du festival</a>`:''}`;
  }
  function sessionDetailRow(s){ const w=workById(s.workId), st=sessionStatus(s), p=plannedWork(s.workId); return `<button class="sessionDetail ${st.key}" onclick='app.openSession(${JSON.stringify(s)})'><span><b>${dateLabel(s.date)}</b><small>${esc(s.start)} · ${esc(s.place)}</small></span><em>${st.label}</em></button>`; }
  function sessionPage(s){
    const w=workById(s.workId), st=sessionStatus(s), p=plannedWork(s.workId), exact=isPlannedSession(s), conflicts=[...conflictWithJury(s),...conflictWithPlanned(s)];
    const other=p.filter(x=>x.date!==s.date||x.start!==s.start||x.place!==s.place);
    return `<div class="eyebrow">SÉANCE · ${esc(w?.categoryLabel||'PROGRAMME')}</div><h2>${esc(w?.title||s.title)}</h2><div class="info"><b>${dateLabel(s.date)}</b><br>🕘 ${esc(s.start)}${s.end?`–${esc(s.end)}`:w?.duration?` · ${fmtMin(w.duration)}`:''}<br>📍 ${esc(s.place)}${w?.director?`<br>🎬 ${esc(w.director)}`:''}</div>
      ${exact?'<div class="statusBox neutral">📅 Cette séance est déjà dans ton planning.</div>':p.length?`<div class="plannedBox"><b>📅 Ce film est déjà au planning sur une autre séance</b>${other.map(x=>`<button class="innerLink" onclick='app.openBusy(${JSON.stringify(x)})'>${x.date.slice(8)} sept. · ${esc(x.start)} · ${esc(x.place)}</button>`).join('')}</div>`:''}
      ${conflicts.length?`<div class="conflictBox"><b>⚠️ Cette séance est incompatible</b><p>Elle chevauche :</p>${conflicts.map(x=>conflictLink(x)).join('')}</div>`:'<div class="statusBox good">✓ Cette séance est compatible avec ton planning actuel.</div>'}
      ${!exact?`<button class="btn primary" onclick="app.addSession(${JSON.stringify(s)})">📅 Ajouter cette séance au planning</button>`:''}
      ${routeHtml(s.place)}<button class="btn" onclick="app.openWork('${w.id}')">← Fiche du film</button>`;
  }
  function conflictLink(x){ return `<button class="conflictLink" onclick='app.openBusy(${JSON.stringify(x)})'><span>${esc(x.start)}${x.end?`–${esc(x.end)}`:''}</span><b>${esc(x.title)}</b><small>${esc(x.place)}</small></button>`; }
  function eventPage(e){ const related=e.workId?workById(e.workId):null; const planned=state.planned.some(x=>x.id===`plan-${e.id}`); return `<div class="eyebrow">ÉVÉNEMENT OFFICIEL</div><h2>${esc(e.title)}</h2><div class="info"><b>${dateLabel(e.date)}</b><br>🕘 ${esc(e.start)}${e.end?`–${esc(e.end)}`:''}<br>📍 ${esc(e.place)}</div>${e.description?`<p class="synopsis">${esc(e.description)}</p>`:''}${related?`<button class="btn" onclick="app.openWork('${related.id}')">🎬 Voir ${esc(related.title)}</button>`:''}${planned?'<div class="statusBox neutral">📅 Déjà dans ton planning.</div>':`<button class="btn primary" onclick="app.addEvent(${JSON.stringify(e)})">📅 Ajouter au planning</button>`}${routeHtml(e.place)}`; }
  function busyPage(x){ const planned=x.type?true:state.planned.some(p=>p.id===x.id); return `<div class="eyebrow">${x.locked?'JURY / PLANNING FIXE':'MON PLANNING'}</div><h2>${esc(x.title)}</h2><div class="info"><b>${dateLabel(x.date)}</b><br>🕘 ${esc(x.start)}${x.end?`–${esc(x.end)}`:''}<br>📍 ${esc(x.place)}</div>${x.workId?`<button class="btn" onclick="app.openWork('${x.workId}')">🎬 Voir la fiche du film</button>`:''}${x.locked?'<div class="statusBox neutral">🔒 Élément verrouillé par le planning Jury officiel.</div>':`<button class="btn" onclick="app.removePlan('${esc(x.id)}')">🗑 Retirer du planning</button>`}${routeHtml(x.place)}`; }
  function freePage(w){ const opts=compatibleSessions(w.date,w.s,w.e); return `<div class="eyebrow">TEMPS LIBRE</div><h2>${esc(w.s)} → ${esc(w.e)}</h2><p><b>${fmtMin(tm(w.e)-tm(w.s))}</b> disponibles</p><div class="sectionMini">SÉANCES COMPATIBLES · ${opts.length}</div>${opts.map(s=>sessionDetailRow(s)).join('')||'<div class="info">Aucune séance compatible sur ce créneau.</div>'}`; }
  function pickDate(){ const mid=Math.ceil(DAYS.length/2); const cols=[DAYS.slice(0,mid),DAYS.slice(mid)]; openModal(`<div class="eyebrow">CHOISIR UNE JOURNÉE</div><h2>Mon festival</h2><div class="dateGrid">${cols.map(c=>`<div>${c.map(d=>{const i=DAYS.indexOf(d);return `<button class="datePick ${i===state.day?'sel':''}" onclick="app.goDay(${i})">${dateLabel(d)}</button>`}).join('')}</div>`).join('')}</div>`); }
  function searchModal(){ openModal(`<div class="eyebrow">EXPLORER</div><h2>Rechercher</h2><input id="searchInput" class="search" value="${esc(state.search)}" placeholder="Film, réalisateur, titre alternatif…" oninput="app.search(this.value)"><div id="searchResults"></div>`); search(state.search); setTimeout(()=>document.getElementById('searchInput')?.focus(),30); }
  function search(q){ state.search=q; const box=document.getElementById('searchResults'); if(!box)return; const n=normalize(q); if(!n){box.innerHTML='<div class="info">Recherche dans les films, titres associés et réalisateurs.</div>';return;} const res=WORKS.filter(w=>normalize([w.title,...(w.aliases||[]),w.director,w.cast||'',w.synopsis||''].join(' ')).includes(n)).slice(0,40); box.innerHTML=res.map(w=>`<button class="searchResult" onclick="app.openWork('${w.id}')"><b>${esc(w.title)}</b><small>${esc(w.director||'')} · ${esc(w.categoryLabel)}</small></button>`).join('')||'<div class="info">Aucun résultat.</div>'; }
  function installSwipe(){ const main=document.querySelector('main'); if(!main)return; let x0=0,y0=0; main.addEventListener('touchstart',e=>{if(e.touches.length===1){x0=e.touches[0].clientX;y0=e.touches[0].clientY;}},{passive:true}); main.addEventListener('touchend',e=>{if(!x0)return; const dx=e.changedTouches[0].clientX-x0,dy=e.changedTouches[0].clientY-y0;x0=0;y0=0;if(Math.abs(dx)>55&&Math.abs(dx)>Math.abs(dy)*1.3)move(dx<0?1:-1);},{passive:true}); }
  function move(n){ const d=Math.max(0,Math.min(DAYS.length-1,state.day+Number(n))); if(d!==state.day){state.day=d;render();} }
  function setView(v){state.view=v;render();}
  function filter(v){state.filter=v;render();}
  function goDay(i){state.day=Math.max(0,Math.min(DAYS.length-1,Number(i)));close();render();}
  function addSession(s){ if(isPlannedSession(s)){showToast('Cette séance est déjà au planning');return;} const conflicts=[...conflictWithJury(s),...conflictWithPlanned(s)]; if(conflicts.length){showToast('Séance incompatible');return;} state.planned.push(plannedEntryFromSession(s)); state.wishes=state.wishes.filter(id=>id!==s.workId); persist(); showToast('📅 Séance ajoutée'); close(); setTimeout(()=>openSession(s),0); }
  function addEvent(e){ if(state.planned.some(x=>x.id===`plan-${e.id}`)){showToast('Déjà au planning');return;} const end=itemEnd(e); const conflicts=allBusy(e.date).filter(x=>overlaps(tm(e.start),end,tm(x.start),itemEnd(x))); if(conflicts.length){showToast('Événement en conflit');return;} state.planned.push(plannedEntryFromEvent(e)); persist(); showToast('📅 Événement ajouté'); close(); setTimeout(()=>openEvent(e),0); }
  function removePlan(id){ const i=state.planned.findIndex(x=>x.id===id); if(i<0)return; const x=state.planned[i]; if(x.locked)return; const alternatives=x.workId?workSessions(x.workId).filter(s=>!isPlannedSession(s)&&!conflictWithJury(s).length&&!conflictWithPlanned(s).length):[]; openModal(`<div class="eyebrow">RETIRER DU PLANNING</div><h2>${esc(x.title)}</h2><div class="info">Que veux-tu faire de cet élément ?</div><button class="btn primary" onclick="app.removePlanAndWish('${esc(id)}')">⭐ Remettre dans mes envies</button>${alternatives.length?`<div class="sectionMini" style="margin-top:16px">AUTRES SÉANCES COMPATIBLES</div>${alternatives.slice(0,8).map(s=>`<button class="innerLink" onclick="app.replacePlan('${esc(id)}','${esc(s.date)}','${esc(s.start)}','${esc(s.place)}','${esc(s.workId)}')">${esc(shortDate(s.date))} · ${esc(s.start)} · ${esc(s.place)}</button>`).join('')}`:''}<button class="btn" onclick="app.removePlanOnly('${esc(id)}')">Retirer sans remettre dans les envies</button>`); }
  function removePlanAndWish(id){ const i=state.planned.findIndex(x=>x.id===id); if(i<0)return; const x=state.planned[i]; if(x.workId&&!state.wishes.includes(x.workId))state.wishes.push(x.workId); state.planned.splice(i,1); persist(); close(); render(); showToast('🗑 Retiré · remis dans les envies'); }
  function removePlanOnly(id){ const i=state.planned.findIndex(x=>x.id===id); if(i<0)return; state.planned.splice(i,1); persist(); close(); render(); showToast('🗑 Retiré du planning'); }
  function replacePlan(id,date,start,place,workId){ const i=state.planned.findIndex(x=>x.id===id); const s=SESSIONS.find(x=>x.date===date&&x.start===start&&x.place===place&&x.workId===workId); if(i<0||!s)return; state.planned[i]=plannedEntryFromSession(s); state.wishes=state.wishes.filter(x=>x!==workId); persist(); close(); render(); showToast('📅 Séance déplacée'); }
  function toggleWish(id){ if(state.wishes.includes(id))state.wishes=state.wishes.filter(x=>x!==id); else state.wishes.push(id); persist(); render(); showToast(state.wishes.includes(id)?'⭐ Ajouté aux envies':'☆ Retiré des envies'); }
  function toggleSeen(id){ if(state.seen.includes(id))state.seen=state.seen.filter(x=>x!==id); else state.seen.push(id); if(state.seen.includes(id))state.wishes=state.wishes.filter(x=>x!==id); persist(); render(); showToast(state.seen.includes(id)?'👀 Marqué comme vu':'Marquage retiré'); }
  function editNote(id){ const w=workById(id); if(!w)return; openModal(`<div class="eyebrow">NOTE PERSONNELLE</div><h2>${esc(w.title)}</h2><textarea id="noteInput" class="noteArea" placeholder="Ton avis, tes repères…">${esc(state.notes[id]||'')}</textarea><button class="btn primary" onclick="app.saveNote('${id}')">Enregistrer</button>`); }
  function saveNote(id){ const el=document.getElementById('noteInput'); state.notes[id]=el?.value||''; persist(); close(); showToast('📝 Note enregistrée'); } 
  function openWork(id){ const w=workById(id); if(w)openModal(workPage(w),{type:'work',id}); }
  function openSession(s){ openModal(sessionPage(s),{type:'session',session:s}); }
  function openEvent(e){ openModal(eventPage(e),{type:'event',event:e}); }
  function openBusy(x){ openModal(busyPage(x),{type:'busy',item:x}); }
  function openFree(w){ openModal(freePage(w),{type:'free'}); }
  
  function openJury(){
    const groups=DATA.juryPeople||{};
    const list=(groups.jury||[]).map(p=>`<div class="juryPerson"><b>${esc(p.name)}</b><small>${esc([p.role,p.profile].filter(Boolean).join(' · '))}</small></div>`).join('');
    const rev=(groups.revelation||[]).map(p=>`<div class="juryPerson"><b>${esc(p.name)}</b><small>${esc([p.role,p.profile].filter(Boolean).join(' · '))}</small></div>`).join('');
    openModal(`<div class="eyebrow">JURY OFFICIEL</div><h2>Jury du Festival</h2><div class="sectionMini">JURY</div>${list}<div class="sectionMini" style="margin-top:16px">JURY DE LA RÉVÉLATION</div>${rev}<div class="info">Le planning Jury CANAL+ est intégré séparément et verrouillé dans Mon planning.</div>`);
  }

  function openSearch(){ searchModal(); }
  window.app={move,setView,filter,pickDate,goDay,openWork,openSession,openEvent,openBusy,openFree,openSearch,openJury,search,close,addSession,addEvent,removePlan,removePlanAndWish,removePlanOnly,replacePlan,toggleWish,toggleSeen,editNote,saveNote};
  window.addEventListener('load',()=>{ const v=document.querySelector('meta[name="app-version"]'); if(v)v.content='2.0.0'; });
  render();
})();
