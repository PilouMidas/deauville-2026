/* Deauville 2026 · V3.0.14 — fiche film depuis toutes les séances */
(function(){
  'use strict';
  const VERSION='V3.0.14';
  const KEY='deauville2026-session-notes-v301';
  const works=window.DEAUVILLE_DATA&&window.DEAUVILLE_DATA.works;
  if(!Array.isArray(works))return;

  const norm=s=>String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[’']/g,"'").replace(/[^a-z0-9]+/g,' ').trim();
  const findWork=title=>works.find(w=>norm(w.title)===norm(title)||(Array.isArray(w.aliases)&&w.aliases.some(a=>norm(a)===norm(title))))||null;
  const findWorkById=id=>works.find(w=>String(w.id)===String(id))||null;
  const sessionsForWork=w=>{if(typeof window.filmSessions!=='function')return[];try{return window.filmSessions(w.title).slice()}catch{return[]}};
  const isPlanned=s=>typeof window.isInMyPlan==='function'&&window.isInMyPlan(s);
  const status=s=>typeof window.compatibilityLabel==='function'?window.compatibilityLabel(s):'';
  const isJurySession=s=>status(s).includes('JURY · OBLIGATOIRE · DANS MON PLANNING');
  const readRaw=()=>{try{return JSON.parse(localStorage.getItem(KEY)||'{}')}catch{return {}}};
  const noteList=v=>{if(Array.isArray(v))return v.map(x=>typeof x==='string'?{text:x,timestamp:''}:x&&typeof x.text==='string'?{text:x.text,timestamp:x.timestamp||''}:null).filter(Boolean);if(typeof v==='string'&&v.trim())return[{text:v,timestamp:''}];if(v&&typeof v.text==='string'&&v.text.trim())return[{text:v.text,timestamp:v.timestamp||''}];return[]};
  const read=()=>{const raw=readRaw(),out={};Object.keys(raw).forEach(k=>{const a=noteList(raw[k]);if(a.length)out[k]=a});return out};
  const save=(id,value)=>{const n=readRaw(),v=String(value||'').trim();if(!v)return false;const current=noteList(n[String(id)]);current.push({text:v,timestamp:new Date().toISOString()});n[String(id)]=current;localStorage.setItem(KEY,JSON.stringify(n));return true;};
  const fmt=iso=>{if(!iso)return '';const d=new Date(iso);return Number.isNaN(d.getTime())?'':d.toLocaleString('fr-FR',{day:'2-digit',month:'2-digit',year:'numeric',hour:'2-digit',minute:'2-digit'});};
  const escSafe=v=>typeof window.esc==='function'?esc(v):String(v||'');
  const allSessions=()=>{try{return typeof DATA!=='undefined'&&DATA&&Array.isArray(DATA.sessions)?DATA.sessions:[]}catch{return[]}};
  const sessionById=id=>allSessions().find(s=>String(s.id)===String(id))||null;
  const findSession=id=>sessionById(id);

  function renderFilm(work,returnSessionId){
    let ss=sessionsForWork(work);
    ss.sort((a,b)=>{const ap=isPlanned(a)||isJurySession(a),bp=isPlanned(b)||isJurySession(b);if(ap!==bp)return ap?-1:1;return String(a.date).localeCompare(String(b.date))||mins(a.start)-mins(b.start);});
    const notes=read();
    const entries=[];
    ss.forEach(s=>{noteList(notes[String(s.id)]).forEach((n,i)=>entries.push({s,t:n.text,ts:n.timestamp||'',i}))});
    entries.sort((a,b)=>{if(a.ts&&b.ts)return new Date(b.ts)-new Date(a.ts);if(a.ts)return -1;if(b.ts)return 1;return String(a.s.date).localeCompare(String(b.s.date))||mins(a.s.start)-mins(b.s.start)||a.i-b.i;});
    const history=entries.length?entries.map(x=>`<div class="v309Note"><div class="v309NoteMeta">${escSafe(dateLabel(x.s.date))} · ${escSafe(x.s.start)} · ${escSafe(x.s.place)}${x.ts?' · '+escSafe(fmt(x.ts)):''}</div><div class="v309NoteText">${escSafe(x.t)}</div></div>`).join(''):'<div class="v309NoNotes">Aucune note pour le moment.</div>';
    const cast=work.cast||work.actors||'';
    const meta=[work.director,work.year,work.duration?`${work.duration} min`:null,work.categoryLabel].filter(Boolean).map(escSafe).join(' · ');
    const sessionsHtml=ss.map(s=>{const hi=isPlanned(s)||isJurySession(s);return `<button class="v309FilmSession ${hi?'isPlanned':''}" type="button" data-v309-session="${escSafe(s.id)}"><div><b>${escSafe(dateLabel(s.date))}</b><br><small>${escSafe(s.start)}–${escSafe(s.end)} · ${escSafe(s.place)}</small></div><div class="v309SessionRight">${status(s)}<span class="ecArrow">›</span></div></button>`;}).join('');
    const back=returnSessionId?`<button class="v309Back" type="button" data-v309-back="${escSafe(returnSessionId)}">← Retour à la séance</button>`:'';
    const selectHtml=ss.map(s=>`<option value="${escSafe(s.id)}">${escSafe(dateLabel(s.date))} · ${escSafe(s.start)} · ${escSafe(s.place)}</option>`).join('');
    openModal(`<div class="v309Head">${back}<button class="v309Close" type="button" aria-label="Fermer">×</button></div><div class="section">FICHE FILM</div><h2 class="v309Title">${escSafe(work.title)}</h2><div class="v309Meta">${meta}</div>${work.synopsis?`<div class="v309Block"><div class="v309Label">SYNOPSIS</div><p>${escSafe(work.synopsis)}</p></div>`:''}${cast?`<div class="v309Block"><div class="v309Label">AVEC</div><p>${escSafe(Array.isArray(cast)?cast.join(', '):cast)}</p></div>`:''}${work.language||work.subtitles?`<div class="v309Block"><div class="v309Label">INFOS</div><p>${work.language?'Langue · '+escSafe(work.language):''}${work.language&&work.subtitles?' · ':''}${work.subtitles?'Sous-titres · '+escSafe(work.subtitles):''}</p></div>`:''}<div class="v309Block"><div class="v309Label">SÉANCES DU FILM · ${ss.length}</div><div class="v309Sessions">${sessionsHtml||'<div class="v309NoNotes">Aucune séance trouvée.</div>'}</div></div><div class="v309Block"><div class="v309Label">MES NOTES</div><div class="v309Notes">${history}</div><div class="v309Add">${selectHtml?`<select class="v309Select" aria-label="Séance à noter">${selectHtml}</select><textarea class="v309Area" placeholder="Ajouter une note sur cette séance…"></textarea><button class="btn primary v309Save" type="button">Enregistrer la note</button>`:'<div class="v309NoNotes">Aucune séance disponible pour prendre une note.</div>'}</div></div>`);
    document.querySelector('.v309Close')?.addEventListener('click',closeModal);
    document.querySelector('[data-v309-back]')?.addEventListener('click',()=>window.openSession(document.querySelector('[data-v309-back]').dataset.v309Back));
    document.querySelectorAll('[data-v309-session]').forEach(b=>b.addEventListener('click',()=>window.openSession(b.dataset.v309Session)));
    const select=document.querySelector('.v309Select'),area=document.querySelector('.v309Area');
    if(select&&area){document.querySelector('.v309Save')?.addEventListener('click',()=>{if(save(select.value,area.value))renderFilm(work,returnSessionId);});}
  }
  window.openFilm=function(work,returnSessionId=null){if(work)renderFilm(work,returnSessionId);};

  function addLink(id){
    const sheet=document.getElementById('sheet'),h2=sheet&&sheet.querySelector('h2');if(!sheet||!h2)return;
    const s=sessionById(id);
    const w=(s&&(findWorkById(s.workId||s.filmId)||findWork(s.title)))||findWork(h2.textContent);
    if(!w||sheet.querySelector('.v309FilmLink'))return;
    sheet.querySelectorAll('[class*="FilmLink"],[class*="FilmAction"]').forEach(el=>el.remove());
    const b=document.createElement('button');b.type='button';b.className='v309FilmLink';b.textContent='Voir la fiche du film';b.setAttribute('aria-label','Voir la fiche du film');b.onclick=e=>{e.preventDefault();e.stopPropagation();renderFilm(w,s?s.id:null)};h2.insertAdjacentElement('afterend',b);
  }
  function addJuryFilmLink(id){
    const s=sessionById(id);
    if(s)return addLink(id);
    let x=null;try{x=typeof DATA!=='undefined'&&DATA?[...(Array.isArray(DATA.jury)?DATA.jury:[]),...(Array.isArray(DATA.juryExtra)?DATA.juryExtra:[])].find(a=>String(a.id)===String(id)):null}catch{}
    if(!x)return;
    const w=findWorkById(x.workId)||findWork(x.title);const sheet=document.getElementById('sheet');if(!w||!sheet||sheet.querySelector('.v309JuryFilmLink'))return;
    const b=document.createElement('button');b.type='button';b.className='btn v309JuryFilmLink';b.textContent='Voir la fiche du film';b.setAttribute('aria-label','Voir la fiche du film');b.onclick=e=>{e.preventDefault();e.stopPropagation();renderFilm(w)};sheet.appendChild(b);
  }
  const oldOpenSession=window.openSession;
  if(typeof oldOpenSession==='function')window.openSession=function(id,...rest){oldOpenSession.apply(this,[id,...rest]);[0,30,100,250,500].forEach(t=>setTimeout(()=>addLink(id),t));};
  const oldOpenJury=window.openJury;
  if(typeof oldOpenJury==='function')window.openJury=function(id){oldOpenJury.apply(this,arguments);[0,30,100,250].forEach(t=>setTimeout(()=>addJuryFilmLink(id),t));};
  document.querySelectorAll('.version').forEach(el=>el.textContent=VERSION);
  const oldRender=window.render;if(typeof oldRender==='function')window.render=function(...args){const r=oldRender.apply(this,args);document.querySelectorAll('.version').forEach(el=>el.textContent=VERSION);return r};
  const style=document.createElement('style');style.textContent=`
    .v309Head{display:flex;justify-content:space-between;align-items:center;gap:12px}.v309Back{border:0;background:none;color:inherit;padding:4px 0;font:inherit;font-size:13px;font-weight:700;cursor:pointer}.v309Close{border:0;background:none;color:inherit;font-size:28px;line-height:1;cursor:pointer;padding:2px 6px}.v309FilmLink{display:inline-flex!important;align-items:center;margin:8px 0 2px;padding:8px 12px;border:1px solid rgba(201,162,39,.8);border-radius:999px;background:rgba(201,162,39,.12);color:inherit;font:inherit;font-size:13px;font-weight:700;cursor:pointer;white-space:nowrap}.v309JuryFilmLink{margin-top:18px}.v309Title{margin-bottom:0}.v309Meta{font-size:14px;opacity:.8;margin-top:4px}.v309Block{margin-top:22px}.v309Label{font-size:12px;letter-spacing:.12em;font-weight:700;margin-bottom:8px}.v309Block p{margin:0;line-height:1.55}.v309Sessions{display:grid;gap:10px}.v309FilmSession{width:100%;display:flex;justify-content:space-between;align-items:center;gap:12px;text-align:left;border:1px solid rgba(255,255,255,.12);border-radius:10px;background:transparent;color:inherit;padding:12px;cursor:pointer}.v309FilmSession.isPlanned{border:2px solid rgba(201,162,39,.8)}.v309SessionRight{display:flex;align-items:center;gap:8px;text-align:right}.v309SessionRight .status{white-space:normal}.v309Notes{display:grid;gap:10px}.v309Note{padding:12px;border:1px solid rgba(255,255,255,.12);border-radius:10px;background:rgba(255,255,255,.03)}.v309NoteMeta{font-size:12px;font-weight:700;opacity:.7;margin-bottom:6px}.v309NoteText{font-size:14px;line-height:1.5;white-space:pre-wrap}.v309NoNotes{font-size:14px;opacity:.65}.v309Add{display:grid;gap:8px;margin-top:12px}.v309Select,.v309Area{width:100%;box-sizing:border-box;border-radius:10px;border:1px solid rgba(255,255,255,.2);background:rgba(255,255,255,.04);color:inherit;padding:10px;font:inherit}.v309Area{min-height:100px;resize:vertical}.v309Save{margin-top:0}
  `;document.head.appendChild(style);
})();
