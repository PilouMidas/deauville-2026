/* Deauville 2026 · V3.0.6 — fiche film corrigée */
(function(){
  'use strict';
  const VERSION='V3.0.6';
  const KEY='deauville2026-session-notes-v301';
  const works=window.DEAUVILLE_DATA&&window.DEAUVILLE_DATA.works;
  if(!Array.isArray(works))return;

  const norm=s=>String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[’']/g,"'").replace(/[^a-z0-9]+/g,' ').trim();
  const findWork=title=>works.find(w=>norm(w.title)===norm(title)||(Array.isArray(w.aliases)&&w.aliases.some(a=>norm(a)===norm(title))))||null;
  const sessionsForWork=w=>typeof window.filmSessions==='function'?window.filmSessions(w.title):[];
  const isPlanned=s=>typeof window.isInMyPlan==='function'&&window.isInMyPlan(s);
  const isJury=s=>typeof window.isJuryForFilm==='function'&&window.isJuryForFilm(s);
  const status=s=>typeof window.compatibilityLabel==='function'?window.compatibilityLabel(s):'';
  const read=()=>{try{return JSON.parse(localStorage.getItem(KEY)||'{}')}catch{return {}}};
  const text=v=>typeof v==='string'?v:(v&&typeof v.text==='string'?v.text:'');
  const stamp=v=>v&&typeof v==='object'&&v.timestamp?v.timestamp:'';
  const save=(id,value)=>{const n=read(),v=String(value||'').trim();if(v)n[String(id)]={text:v,timestamp:new Date().toISOString()};else delete n[String(id)];localStorage.setItem(KEY,JSON.stringify(n));};
  const fmt=iso=>{if(!iso)return '';const d=new Date(iso);return Number.isNaN(d.getTime())?'':d.toLocaleString('fr-FR',{day:'2-digit',month:'2-digit',year:'numeric',hour:'2-digit',minute:'2-digit'});};
  const escSafe=v=>typeof window.esc==='function'?esc(v):String(v||'');

  function renderFilm(work,returnSessionId){
    let ss=sessionsForWork(work).slice();
    ss.sort((a,b)=>{const ap=isPlanned(a)||isJury(a),bp=isPlanned(b)||isJury(b);if(ap!==bp)return ap?-1:1;return a.date.localeCompare(b.date)||mins(a.start)-mins(b.start);});
    const notes=read();
    const entries=ss.map(s=>({s,t:text(notes[String(s.id)]),ts:stamp(notes[String(s.id)])})).filter(x=>x.t);
    const history=entries.length?entries.map(x=>`<div class="v306Note"><div class="v306NoteMeta">${escSafe(dateLabel(x.s.date))} · séance ${escSafe(x.s.id)}${x.ts?' · '+escSafe(fmt(x.ts)):''}</div><div class="v306NoteText">${escSafe(x.t)}</div></div>`).join(''):'<div class="v306NoNotes">Aucune note pour le moment.</div>';
    const cast=work.cast||work.actors||'';
    const meta=[work.director,work.year,work.duration?`${work.duration} min`:null,work.categoryLabel].filter(Boolean).map(escSafe).join(' · ');
    const sessionsHtml=ss.map(s=>{const hi=isPlanned(s)||isJury(s);return `<button class="v306FilmSession ${hi?'isPlanned':''}" type="button" data-v306-session="${escSafe(s.id)}"><div><b>${escSafe(dateLabel(s.date))}</b><br><small>${escSafe(s.start)}–${escSafe(s.end)} · ${escSafe(s.place)}</small></div><div class="v306SessionRight">${status(s)}<span class="ecArrow">›</span></div></button>`;}).join('');
    const back=returnSessionId?`<button class="v306Back" type="button" data-v306-back="${escSafe(returnSessionId)}">← Retour à la séance</button>`:'';
    openModal(`<div class="v306Head">${back}<button class="v306Close" type="button" aria-label="Fermer">×</button></div><div class="section">FICHE FILM</div><h2 class="v306Title">${escSafe(work.title)}</h2><div class="v306Meta">${meta}</div>${work.synopsis?`<div class="v306Block"><div class="v306Label">SYNOPSIS</div><p>${escSafe(work.synopsis)}</p></div>`:''}${cast?`<div class="v306Block"><div class="v306Label">AVEC</div><p>${escSafe(Array.isArray(cast)?cast.join(', '):cast)}</p></div>`:''}${work.language||work.subtitles?`<div class="v306Block"><div class="v306Label">INFOS</div><p>${work.language?'Langue · '+escSafe(work.language):''}${work.language&&work.subtitles?' · ':''}${work.subtitles?'Sous-titres · '+escSafe(work.subtitles):''}</p></div>`:''}<div class="v306Block"><div class="v306Label">SÉANCES DU FILM · ${ss.length}</div><div class="v306Sessions">${sessionsHtml||'<div class="v306NoNotes">Aucune séance trouvée.</div>'}</div></div><div class="v306Block"><div class="v306Label">MES NOTES</div><div class="v306Notes">${history}</div><div class="v306Add"><select class="v306Select">${ss.map(s=>`<option value="${escSafe(s.id)}">${escSafe(dateLabel(s.date))} · ${escSafe(s.start)} · ${escSafe(s.place)}</option>`).join('')}</select><textarea class="v306Area" placeholder="Ajouter une note sur cette séance…"></textarea><button class="btn primary v306Save" type="button">Enregistrer la note</button></div></div>`);
    document.querySelector('.v306Close')?.addEventListener('click',closeModal);
    document.querySelector('[data-v306-back]')?.addEventListener('click',()=>window.openSession(document.querySelector('[data-v306-back]').dataset.v306Back));
    document.querySelectorAll('[data-v306-session]').forEach(b=>b.addEventListener('click',()=>window.openSession(b.dataset.v306Session)));
    const select=document.querySelector('.v306Select'),area=document.querySelector('.v306Area');
    const load=()=>{const v=read()[String(select?.value||'')];area.value=text(v);};
    select?.addEventListener('change',load);load();
    document.querySelector('.v306Save')?.addEventListener('click',()=>{save(select.value,area.value);renderFilm(work,returnSessionId);});
  }
  window.openFilm=function(work,returnSessionId=null){if(work)renderFilm(work,returnSessionId);};

  function addLink(s){
    const sheet=document.getElementById('sheet'),h2=sheet&&sheet.querySelector('h2');if(!sheet||!h2)return;
    const w=findWork(h2.textContent);if(!w||sheet.querySelector('.v306FilmLink'))return;
    const b=document.createElement('button');b.type='button';b.className='v306FilmLink';b.textContent='Voir la fiche du film';b.onclick=e=>{e.preventDefault();e.stopPropagation();renderFilm(w,s.id)};h2.insertAdjacentElement('afterend',b);
  }
  const oldOpenSession=window.openSession;
  if(typeof oldOpenSession==='function')window.openSession=function(id,...rest){oldOpenSession.apply(this,[id,...rest]);const s=typeof window.filmSessions==='function'?window.DATA?.sessions?.find(x=>String(x.id)===String(id)):null;if(s)[0,30,100,250,500].forEach(t=>setTimeout(()=>addLink(s),t));};
  document.querySelectorAll('.version').forEach(el=>el.textContent=VERSION);
  const oldRender=window.render;if(typeof oldRender==='function')window.render=function(...args){const r=oldRender.apply(this,args);document.querySelectorAll('.version').forEach(el=>el.textContent=VERSION);return r};
  const style=document.createElement('style');style.textContent=`
    .v306Head{display:flex;justify-content:space-between;align-items:center;gap:12px}.v306Back{border:0;background:none;color:inherit;padding:4px 0;font:inherit;font-size:13px;font-weight:700;cursor:pointer}.v306Close{border:0;background:none;color:inherit;font-size:28px;line-height:1;cursor:pointer;padding:2px 6px}.v306FilmLink{display:inline-flex!important;align-items:center;margin:8px 0 2px;padding:8px 12px;border:1px solid rgba(201,162,39,.8);border-radius:999px;background:rgba(201,162,39,.12);color:inherit;font:inherit;font-size:13px;font-weight:700;cursor:pointer;white-space:nowrap}.v306Title{margin-bottom:0}.v306Meta{font-size:14px;opacity:.8;margin-top:4px}.v306Block{margin-top:22px}.v306Label{font-size:12px;letter-spacing:.12em;font-weight:700;margin-bottom:8px}.v306Block p{margin:0;line-height:1.55}.v306Sessions{display:grid;gap:10px}.v306FilmSession{width:100%;display:flex;justify-content:space-between;align-items:center;gap:12px;text-align:left;border:1px solid rgba(255,255,255,.12);border-radius:10px;background:transparent;color:inherit;padding:12px;cursor:pointer}.v306FilmSession.isPlanned{border:2px solid rgba(201,162,39,.8)}.v306SessionRight{display:flex;align-items:center;gap:8px;text-align:right}.v306SessionRight .status{white-space:normal}.v306Notes{display:grid;gap:10px}.v306Note{padding:12px;border:1px solid rgba(255,255,255,.12);border-radius:10px;background:rgba(255,255,255,.03)}.v306NoteMeta{font-size:12px;font-weight:700;opacity:.7;margin-bottom:6px}.v306NoteText{font-size:14px;line-height:1.5;white-space:pre-wrap}.v306NoNotes{font-size:14px;opacity:.65}.v306Add{display:grid;gap:8px;margin-top:12px}.v306Select,.v306Area{width:100%;box-sizing:border-box;border-radius:10px;border:1px solid rgba(255,255,255,.2);background:rgba(255,255,255,.04);color:inherit;padding:10px;font:inherit}.v306Area{min-height:100px;resize:vertical}.v306Save{margin-top:0}
  `;document.head.appendChild(style);
})();
