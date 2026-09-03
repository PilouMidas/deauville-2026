/* Deauville 2026 · V3.0.5 — fiche film simplifiée + notes horodatées */
(function(){
  'use strict';

  const VERSION_LABEL='V3.0.5';
  const NOTES_KEY='deauville2026-session-notes-v301';
  const works=window.DEAUVILLE_DATA&&window.DEAUVILLE_DATA.works;
  if(!Array.isArray(works))return;

  const norm=s=>String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[’']/g,"'").replace(/[^a-z0-9]+/g,' ').trim();
  const findWork=title=>works.find(w=>norm(w.title)===norm(title)||(Array.isArray(w.aliases)&&w.aliases.some(a=>norm(a)===norm(title))))||null;
  const sessionById=id=>window.DATA&&Array.isArray(DATA.sessions)?DATA.sessions.find(s=>String(s.id)===String(id)):null;
  const sessionsForWork=w=>{
    if(!w||!window.DATA||!Array.isArray(DATA.sessions))return[];
    const names=[w.title,...(Array.isArray(w.aliases)?w.aliases:[])].map(norm);
    return DATA.sessions.filter(s=>names.includes(norm(s.title))).sort((a,b)=>a.date.localeCompare(b.date)||mins(a.start)-mins(b.start));
  };

  function readNotes(){
    try{return JSON.parse(localStorage.getItem(NOTES_KEY)||'{}')}catch{return {}}
  }
  function noteText(v){return typeof v==='string'?v:(v&&typeof v.text==='string'?v.text:'')}
  function noteStamp(v){return v&&typeof v==='object'&&v.timestamp?v.timestamp:''}
  function noteFor(id){return noteText(readNotes()[String(id)])}
  function saveNote(id,text){
    const n=readNotes(),key=String(id),value=String(text||'').trim();
    if(value)n[key]={text:value,timestamp:new Date().toISOString()};else delete n[key];
    localStorage.setItem(NOTES_KEY,JSON.stringify(n));
  }
  function formatStamp(iso){
    if(!iso)return '';
    const d=new Date(iso);if(Number.isNaN(d.getTime()))return '';
    return d.toLocaleString('fr-FR',{day:'2-digit',month:'2-digit',year:'numeric',hour:'2-digit',minute:'2-digit'});
  }
  function statusHtml(s){
    if(typeof window.compatibilityLabel==='function')return window.compatibilityLabel(s);
    if(typeof window.sessionStatusHtml==='function')return window.sessionStatusHtml(s);
    return '';
  }
  function planned(s){
    try{return Array.isArray(window.plan)&&window.plan.some(p=>String(p.sessionId||p.id)===String(s.id))}catch{return false}
  }
  function jury(s){return typeof window.isJuryForFilm==='function'&&window.isJuryForFilm(s)}
  function escSafe(v){return typeof window.esc==='function'?esc(v):String(v||'')}

  function refreshVersion(){document.querySelectorAll('.version').forEach(el=>{el.textContent=VERSION_LABEL})}

  function openFilm(work,returnSessionId=null){
    if(!work)return;
    const ss=sessionsForWork(work);
    ss.sort((a,b)=>{
      const ap=planned(a)||jury(a),bp=planned(b)||jury(b);
      if(ap!==bp)return ap?-1:1;
      return a.date.localeCompare(b.date)||mins(a.start)-mins(b.start);
    });
    const cast=work.cast||work.actors||'';
    const credits=work.credits||{};
    const creditRows=Object.entries(credits).filter(([,v])=>v).map(([k,v])=>`<div><b>${escSafe(k)}</b> · ${escSafe(v)}</div>`).join('');
    const noteEntries=ss.map(s=>({s,text:noteFor(s.id),stamp:noteStamp(readNotes()[String(s.id)])})).filter(x=>x.text);
    const notesHtml=noteEntries.length?noteEntries.map(x=>`<div class="v305Note"><div class="v305NoteMeta">${escSafe(dateLabel(x.s.date))} · séance ${escSafe(x.s.id)}${x.stamp?' · '+escSafe(formatStamp(x.stamp)):''}</div><div class="v305NoteText">${escSafe(x.text)}</div></div>`).join(''):'<div class="v305NoNotes">Aucune note pour le moment.</div>';
    const back=returnSessionId?`<button class="v305Back" type="button" data-v305-back="${escSafe(returnSessionId)}">← Retour à la séance</button>`:'';
    openModal(`
      <div class="v305FilmHead">${back}<button class="v305Close" type="button" aria-label="Fermer">×</button></div>
      <div class="section">FICHE FILM</div>
      <h2 class="v3FilmTitle">${escSafe(work.title)}</h2>
      <div class="v305FilmMeta">${escSafe(work.director||'')}${work.year?' · '+escSafe(work.year):''}${work.duration?' · '+escSafe(work.duration)+' min':''}${work.categoryLabel?' · '+escSafe(work.categoryLabel):''}</div>
      ${work.synopsis?`<div class="v3FilmBlock"><div class="v3FilmLabel">SYNOPSIS</div><p>${escSafe(work.synopsis)}</p></div>`:''}
      ${cast?`<div class="v3FilmBlock"><div class="v3FilmLabel">AVEC</div><p>${escSafe(Array.isArray(cast)?cast.join(', '):cast)}</p></div>`:''}
      ${work.language||work.subtitles?`<div class="v3FilmBlock"><div class="v3FilmLabel">INFOS</div><p>${work.language?'Langue · '+escSafe(work.language):''}${work.language&&work.subtitles?' · ':''}${work.subtitles?'Sous-titres · '+escSafe(work.subtitles):''}</p></div>`:''}
      ${creditRows?`<div class="v3FilmBlock"><div class="v3FilmLabel">CRÉDITS</div><div class="v3Credits">${creditRows}</div></div>`:''}
      <div class="v3FilmBlock"><div class="v3FilmLabel">SÉANCES DU FILM · ${ss.length}</div><div class="v305FilmSessions">${ss.map(s=>{const hi=planned(s)||jury(s);return `<button class="v305FilmSession ${hi?'isPlanned':''}" type="button" data-v305-session="${escSafe(s.id)}"><div><b>${escSafe(dateLabel(s.date))}</b><br><small>${escSafe(s.start)}–${escSafe(s.end)} · ${escSafe(s.place)}</small></div><div class="v305SessionRight">${statusHtml(s)}<span class="ecArrow">›</span></div></button>`}).join('')}</div></div>
      <div class="v3FilmBlock"><div class="v3FilmLabel">MES NOTES</div><div class="v305Notes">${notesHtml}</div></div>
    `);
    document.querySelector('.v305Close')?.addEventListener('click',closeModal);
    document.querySelector('[data-v305-back]')?.addEventListener('click',()=>window.openSession(document.querySelector('[data-v305-back]').dataset.v305Back));
    document.querySelectorAll('[data-v305-session]').forEach(b=>b.addEventListener('click',()=>window.openSession(b.dataset.v305Session)));
  }
  window.openFilm=openFilm;

  function addFilmLink(s){
    const sheet=document.getElementById('sheet'),h2=sheet&&sheet.querySelector('h2');
    if(!sheet||!h2)return false;
    const w=findWork(h2.textContent);if(!w)return false;
    sheet.querySelectorAll('.v3FilmAction,.v303FilmLink,.v303FilmAction,.v3FilmLink').forEach(el=>{if(el!==h2)el.remove()});
    if(sheet.querySelector('.v305FilmLink'))return true;
    const b=document.createElement('button');b.type='button';b.className='v305FilmLink';b.textContent='Voir la fiche du film';b.setAttribute('aria-label','Voir la fiche du film');
    b.onclick=e=>{e.preventDefault();e.stopPropagation();openFilm(w,s.id)};
    h2.insertAdjacentElement('afterend',b);return true;
  }

  const oldOpenSession=window.openSession;
  if(typeof oldOpenSession==='function')window.openSession=function(id,...rest){
    oldOpenSession.apply(this,[id,...rest]);
    const s=sessionById(id);if(s)[0,30,100,250,500].forEach(t=>setTimeout(()=>addFilmLink(s),t));
  };

  const oldRender=window.render;
  if(typeof oldRender==='function')window.render=function(...args){const r=oldRender.apply(this,args);refreshVersion();return r};
  refreshVersion();

  const style=document.createElement('style');style.textContent=`
    .v305FilmHead{display:flex;justify-content:space-between;align-items:center;gap:12px;margin-bottom:4px}
    .v305Back{border:0;background:none;color:inherit;padding:4px 0;font:inherit;font-size:13px;font-weight:700;cursor:pointer}
    .v305Close{border:0;background:none;color:inherit;font-size:28px;line-height:1;cursor:pointer;padding:2px 6px}
    .v305FilmLink{display:inline-flex!important;align-items:center;margin:8px 0 2px;padding:8px 12px;border:1px solid rgba(201,162,39,.8);border-radius:999px;background:rgba(201,162,39,.12);color:inherit;font:inherit;font-size:13px;font-weight:700;cursor:pointer;white-space:nowrap}
    .v305FilmMeta{font-size:14px;opacity:.8;margin-top:4px}
    .v305FilmSessions{display:grid;gap:10px}
    .v305FilmSession{width:100%;display:flex;justify-content:space-between;align-items:center;gap:12px;text-align:left;border:1px solid rgba(255,255,255,.12);border-radius:10px;background:transparent;color:inherit;padding:12px;cursor:pointer}
    .v305FilmSession.isPlanned{border:2px solid rgba(201,162,39,.8)}
    .v305SessionRight{display:flex;align-items:center;gap:8px;text-align:right}.v305SessionRight .status{white-space:normal}
    .v305Notes{display:grid;gap:10px}.v305Note{padding:12px;border:1px solid rgba(255,255,255,.12);border-radius:10px;background:rgba(255,255,255,.03)}
    .v305NoteMeta{font-size:12px;font-weight:700;opacity:.7;margin-bottom:6px}.v305NoteText{font-size:14px;line-height:1.5;white-space:pre-wrap}.v305NoNotes{font-size:14px;opacity:.65}
  `;document.head.appendChild(style);

  let busy=false;
  const observer=new MutationObserver(()=>{
    if(busy)return;
    const modal=document.getElementById('modal');if(!modal||modal.getAttribute('aria-hidden')==='true')return;
    const sheet=document.getElementById('sheet'),h2=sheet&&sheet.querySelector('h2');if(!h2)return;
    const s=window.DATA&&Array.isArray(DATA.sessions)?DATA.sessions.find(x=>norm(x.title)===norm(h2.textContent)):null;
    if(!s)return;
    busy=true;try{addFilmLink(s)}finally{busy=false}
  });
  if(document.body)observer.observe(document.body,{childList:true,subtree:true});
})();
