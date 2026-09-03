/* Deauville 2026 · V3.0.10 — liens fiche film fiables depuis toutes les séances */
(function(){
  'use strict';
  const VERSION='V3.0.10';
  const KEY='deauville2026-session-notes-v301';
  const works=window.DEAUVILLE_DATA&&window.DEAUVILLE_DATA.works;
  if(!Array.isArray(works))return;
  const norm=s=>String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[’']/g,"'").replace(/[^a-z0-9]+/g,' ').trim();
  const findWork=title=>works.find(w=>norm(w.title)===norm(title)||(Array.isArray(w.aliases)&&w.aliases.some(a=>norm(a)===norm(title))))||null;
  const findWorkById=id=>works.find(w=>String(w.id)===String(id))||null;
  const getSession=id=>window.DATA&&Array.isArray(DATA.sessions)?DATA.sessions.find(s=>String(s.id)===String(id)):null;
  const workForSession=id=>{const s=getSession(id);if(!s)return null;const byId=findWorkById(s.workId||s.filmId);return byId||findWork(s.title)};
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

  function renderFilm(work,returnSessionId){
    let ss=sessionsForWork(work);
    ss.sort((a,b)=>{const ap=isPlanned(a)||isJurySession(a),bp=isPlanned(b)||isJurySession(b);if(ap!==bp)return ap?-1:1;return String(a.date).localeCompare(String(b.date))||mins(a.start)-mins(b.start);});
    const notes=read(),entries=[];
    ss.forEach(s=>noteList(notes[String(s.id)]).forEach((n,i)=>entries.push({s,t:n.text,ts:n.timestamp||'',i})));
    entries.sort((a,b)=>{if(a.ts&&b.ts)return new Date(b.ts)-new Date(a.ts);if(a.ts)return -1;if(b.ts)return 1;return String(a.s.date).localeCompare(String(b.s.date))||mins(a.s.start)-mins(b.s.start)||a.i-b.i;});
    const history=entries.length?entries.map(x=>`<div class="v310Note"><div class="v310NoteMeta">${escSafe(dateLabel(x.s.date))} · ${escSafe(x.s.start)} · ${escSafe(x.s.place)}${x.ts?' · '+escSafe(fmt(x.ts)):''}</div><div class="v310NoteText">${escSafe(x.t)}</div></div>`).join(''):'<div class="v310NoNotes">Aucune note pour le moment.</div>';
    const cast=work.cast||work.actors||'';
    const meta=[work.director,work.year,work.duration?`${work.duration} min`:null,work.categoryLabel].filter(Boolean).map(escSafe).join(' · ');
    const sessionsHtml=ss.map(s=>{const hi=isPlanned(s)||isJurySession(s);return `<button class="v310FilmSession ${hi?'isPlanned':''}" type="button" data-v310-session="${escSafe(s.id)}"><div><b>${escSafe(dateLabel(s.date))}</b><br><small>${escSafe(s.start)}–${escSafe(s.end)} · ${escSafe(s.place)}</small></div><div class="v310SessionRight">${status(s)}<span class="ecArrow">›</span></div></button>`;}).join('');
    const back=returnSessionId?`<button class="v310Back" type="button" data-v310-back="${escSafe(returnSessionId)}">← Retour à la séance</button>`:'';
    const selectHtml=ss.map(s=>`<option value="${escSafe(s.id)}">${escSafe(dateLabel(s.date))} · ${escSafe(s.start)} · ${escSafe(s.place)}</option>`).join('');
    openModal(`<div class="v310Head">${back}<button class="v310Close" type="button" aria-label="Fermer">×</button></div><div class="section">FICHE FILM</div><h2 class="v310Title">${escSafe(work.title)}</h2><div class="v310Meta">${meta}</div>${work.synopsis?`<div class="v310Block"><div class="v310Label">SYNOPSIS</div><p>${escSafe(work.synopsis)}</p></div>`:''}${cast?`<div class="v310Block"><div class="v310Label">AVEC</div><p>${escSafe(Array.isArray(cast)?cast.join(', '):cast)}</p></div>`:''}${work.language||work.subtitles?`<div class="v310Block"><div class="v310Label">INFOS</div><p>${work.language?'Langue · '+escSafe(work.language):''}${work.language&&work.subtitles?' · ':''}${work.subtitles?'Sous-titres · '+escSafe(work.subtitles):''}</p></div>`:''}<div class="v310Block"><div class="v310Label">SÉANCES DU FILM · ${ss.length}</div><div class="v310Sessions">${sessionsHtml||'<div class="v310NoNotes">Aucune séance trouvée.</div>'}</div></div><div class="v310Block"><div class="v310Label">MES NOTES</div><div class="v310Notes">${history}</div><div class="v310Add">${selectHtml?`<select class="v310Select" aria-label="Séance à noter">${selectHtml}</select><textarea class="v310Area" placeholder="Ajouter une note sur cette séance…"></textarea><button class="btn primary v310Save" type="button">Enregistrer la note</button>`:'<div class="v310NoNotes">Aucune séance disponible pour prendre une note.</div>'}</div></div>`);
    document.querySelector('.v310Close')?.addEventListener('click',closeModal);
    document.querySelector('[data-v310-back]')?.addEventListener('click',()=>window.openSession(document.querySelector('[data-v310-back]').dataset.v310Back));
    document.querySelectorAll('[data-v310-session]').forEach(b=>b.addEventListener('click',()=>window.openSession(b.dataset.v310Session)));
    const select=document.querySelector('.v310Select'),area=document.querySelector('.v310Area');
    if(select&&area)document.querySelector('.v310Save')?.addEventListener('click',()=>{if(save(select.value,area.value))renderFilm(work,returnSessionId);});
  }
  window.openFilm=function(work,returnSessionId=null){if(work)renderFilm(work,returnSessionId);};

  function injectFilmLink(id){
    const sheet=document.getElementById('sheet');if(!sheet)return;
    const w=workForSession(id);if(!w)return;
    sheet.querySelectorAll('.v3FilmAction,.v303FilmLink,.v303FilmAction,.v3FilmLink,.v305FilmLink,.v306FilmLink,.v307FilmLink,.v308FilmLink,.v309FilmLink,.v309JuryFilmLink,.v310FilmLink').forEach(el=>el.remove());
    const b=document.createElement('button');b.type='button';b.className='v310FilmLink btn';b.textContent='Voir la fiche du film';b.setAttribute('aria-label','Voir la fiche du film');b.onclick=e=>{e.preventDefault();e.stopPropagation();renderFilm(w,id)};
    const h2=sheet.querySelector('h2');if(h2)h2.insertAdjacentElement('afterend',b);else sheet.appendChild(b);
  }
  const oldOpenSession=window.openSession;
  if(typeof oldOpenSession==='function')window.openSession=function(id,...rest){oldOpenSession.apply(this,[id,...rest]);[0,30,100,250,500].forEach(t=>setTimeout(()=>injectFilmLink(id),t));};
  const oldOpenJury=window.openJury;
  if(typeof oldOpenJury==='function')window.openJury=function(id){oldOpenJury.apply(this,arguments);[0,30,100,250].forEach(t=>setTimeout(()=>injectFilmLink(id),t));};
  document.querySelectorAll('.version').forEach(el=>el.textContent=VERSION);
  const oldRender=window.render;if(typeof oldRender==='function')window.render=function(...args){const r=oldRender.apply(this,args);document.querySelectorAll('.version').forEach(el=>el.textContent=VERSION);return r};
  const style=document.createElement('style');style.textContent=`.v310Head{display:flex;justify-content:space-between;align-items:center;gap:12px}.v310Back{border:0;background:none;color:inherit;padding:4px 0;font:inherit;font-size:13px;font-weight:700;cursor:pointer}.v310Close{border:0;background:none;color:inherit;font-size:28px;line-height:1;cursor:pointer;padding:2px 6px}.v310FilmLink{display:inline-flex!important;align-items:center;margin:8px 0 2px;padding:8px 12px;border:1px solid rgba(201,162,39,.8);border-radius:999px;background:rgba(201,162,39,.12);color:inherit;font:inherit;font-size:13px;font-weight:700;cursor:pointer;white-space:nowrap}.v310Title{margin-bottom:0}.v310Meta{font-size:14px;opacity:.8;margin-top:4px}.v310Block{margin-top:22px}.v310Label{font-size:12px;letter-spacing:.12em;font-weight:700;margin-bottom:8px}.v310Block p{margin:0;line-height:1.55}.v310Sessions{display:grid;gap:10px}.v310FilmSession{width:100%;display:flex;justify-content:space-between;align-items:center;gap:12px;text-align:left;border:1px solid rgba(255,255,255,.12);border-radius:10px;background:transparent;color:inherit;padding:12px;cursor:pointer}.v310FilmSession.isPlanned{border:2px solid rgba(201,162,39,.8)}.v310SessionRight{display:flex;align-items:center;gap:8px;text-align:right}.v310SessionRight .status{white-space:normal}.v310Notes{display:grid;gap:10px}.v310Note{padding:12px;border:1px solid rgba(255,255,255,.12);border-radius:10px;background:rgba(255,255,255,.03)}.v310NoteMeta{font-size:12px;font-weight:700;opacity:.7;margin-bottom:6px}.v310NoteText{font-size:14px;line-height:1.5;white-space:pre-wrap}.v310NoNotes{font-size:14px;opacity:.65}.v310Add{display:grid;gap:8px;margin-top:12px}.v310Select,.v310Area{width:100%;box-sizing:border-box;border-radius:10px;border:1px solid rgba(255,255,255,.2);background:rgba(255,255,255,.04);color:inherit;padding:10px;font:inherit}.v310Area{min-height:100px;resize:vertical}.v310Save{margin-top:0}`;document.head.appendChild(style);
})();