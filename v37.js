/* Deauville 2026 · V3.0.8 — fiche film nettoyée */
(function(){
  'use strict';
  const VERSION='V3.0.8';
  const KEY='deauville2026-session-notes-v301';
  const works=window.DEAUVILLE_DATA&&window.DEAUVILLE_DATA.works;
  if(!Array.isArray(works))return;

  const norm=s=>String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[’']/g,"'").replace(/[^a-z0-9]+/g,' ').trim();
  const findWork=title=>works.find(w=>norm(w.title)===norm(title)||(Array.isArray(w.aliases)&&w.aliases.some(a=>norm(a)===norm(title))))||null;
  const sessionsForWork=w=>{if(typeof window.filmSessions!=='function')return[];try{return window.filmSessions(w.title).slice()}catch{return[]}};
  const isPlanned=s=>typeof window.isInMyPlan==='function'&&window.isInMyPlan(s);
  const status=s=>typeof window.compatibilityLabel==='function'?window.compatibilityLabel(s):'';
  const isJurySession=s=>status(s).includes('JURY · OBLIGATOIRE · DANS MON PLANNING');
  const read=()=>{try{return JSON.parse(localStorage.getItem(KEY)||'{}')}catch{return {}}};
  const text=v=>typeof v==='string'?v:(v&&typeof v.text==='string'?v.text:'');
  const stamp=v=>v&&typeof v==='object'&&v.timestamp?v.timestamp:'';
  const save=(id,value)=>{const n=read(),v=String(value||'').trim();if(v)n[String(id)]={text:v,timestamp:new Date().toISOString()};else delete n[String(id)];localStorage.setItem(KEY,JSON.stringify(n));};
  const fmt=iso=>{if(!iso)return '';const d=new Date(iso);return Number.isNaN(d.getTime())?'':d.toLocaleString('fr-FR',{day:'2-digit',month:'2-digit',year:'numeric',hour:'2-digit',minute:'2-digit'});};
  const escSafe=v=>typeof window.esc==='function'?esc(v):String(v||'');
  const findSession=title=>{const target=norm(title);for(const w of works){for(const s of sessionsForWork(w)){if(norm(s.title)===target)return s}}return null};

  function renderFilm(work,returnSessionId){
    let ss=sessionsForWork(work);
    ss.sort((a,b)=>{const ap=isPlanned(a)||isJurySession(a),bp=isPlanned(b)||isJurySession(b);if(ap!==bp)return ap?-1:1;return String(a.date).localeCompare(String(b.date))||mins(a.start)-mins(b.start);});
    const notes=read();
    const entries=ss.map(s=>({s,t:text(notes[String(s.id)]),ts:stamp(notes[String(s.id)])})).filter(x=>x.t);
    const history=entries.length?entries.map(x=>`<div class="v308Note"><div class="v308NoteMeta">${escSafe(dateLabel(x.s.date))} · ${escSafe(x.s.start)} · ${escSafe(x.s.place)}${x.ts?' · '+escSafe(fmt(x.ts)):''}</div><div class="v308NoteText">${escSafe(x.t)}</div></div>`).join(''):'<div class="v308NoNotes">Aucune note pour le moment.</div>';
    const cast=work.cast||work.actors||'';
    const meta=[work.director,work.year,work.duration?`${work.duration} min`:null,work.categoryLabel].filter(Boolean).map(escSafe).join(' · ');
    const sessionsHtml=ss.map(s=>{const hi=isPlanned(s)||isJurySession(s);return `<button class="v308FilmSession ${hi?'isPlanned':''}" type="button" data-v308-session="${escSafe(s.id)}"><div><b>${escSafe(dateLabel(s.date))}</b><br><small>${escSafe(s.start)}–${escSafe(s.end)} · ${escSafe(s.place)}</small></div><div class="v308SessionRight">${status(s)}<span class="ecArrow">›</span></div></button>`;}).join('');
    const back=returnSessionId?`<button class="v308Back" type="button" data-v308-back="${escSafe(returnSessionId)}">← Retour à la séance</button>`:'';
    const selectHtml=ss.map(s=>`<option value="${escSafe(s.id)}">${escSafe(dateLabel(s.date))} · ${escSafe(s.start)} · ${escSafe(s.place)}</option>`).join('');
    openModal(`<div class="v308Head">${back}<button class="v308Close" type="button" aria-label="Fermer">×</button></div><div class="section">FICHE FILM</div><h2 class="v308Title">${escSafe(work.title)}</h2><div class="v308Meta">${meta}</div>${work.synopsis?`<div class="v308Block"><div class="v308Label">SYNOPSIS</div><p>${escSafe(work.synopsis)}</p></div>`:''}${cast?`<div class="v308Block"><div class="v308Label">AVEC</div><p>${escSafe(Array.isArray(cast)?cast.join(', '):cast)}</p></div>`:''}${work.language||work.subtitles?`<div class="v308Block"><div class="v308Label">INFOS</div><p>${work.language?'Langue · '+escSafe(work.language):''}${work.language&&work.subtitles?' · ':''}${work.subtitles?'Sous-titres · '+escSafe(work.subtitles):''}</p></div>`:''}<div class="v308Block"><div class="v308Label">SÉANCES DU FILM · ${ss.length}</div><div class="v308Sessions">${sessionsHtml||'<div class="v308NoNotes">Aucune séance trouvée.</div>'}</div></div><div class="v308Block"><div class="v308Label">MES NOTES</div><div class="v308Notes">${history}</div><div class="v308Add">${selectHtml?`<select class="v308Select" aria-label="Séance à noter">${selectHtml}</select><textarea class="v308Area" placeholder="Ajouter une note sur cette séance…"></textarea><button class="btn primary v308Save" type="button">Enregistrer la note</button>`:'<div class="v308NoNotes">Aucune séance disponible pour prendre une note.</div>'}</div></div>`);
    document.querySelector('.v308Close')?.addEventListener('click',closeModal);
    document.querySelector('[data-v308-back]')?.addEventListener('click',()=>window.openSession(document.querySelector('[data-v308-back]').dataset.v308Back));
    document.querySelectorAll('[data-v308-session]').forEach(b=>b.addEventListener('click',()=>window.openSession(b.dataset.v308Session)));
    const select=document.querySelector('.v308Select'),area=document.querySelector('.v308Area');
    if(select&&area){area.value='';select.addEventListener('change',()=>{area.value=''});document.querySelector('.v308Save')?.addEventListener('click',()=>{save(select.value,area.value);renderFilm(work,returnSessionId);});}
  }
  window.openFilm=function(work,returnSessionId=null){if(work)renderFilm(work,returnSessionId);};

  function addLink(){
    const sheet=document.getElementById('sheet'),h2=sheet&&sheet.querySelector('h2');if(!sheet||!h2)return;
    const w=findWork(h2.textContent);if(!w||sheet.querySelector('.v308FilmLink'))return;
    sheet.querySelectorAll('.v3FilmAction,.v303FilmLink,.v303FilmAction,.v3FilmLink,.v305FilmLink,.v306FilmLink,.v307FilmLink').forEach(el=>el.remove());
    const s=findSession(h2.textContent);if(!s)return;
    const b=document.createElement('button');b.type='button';b.className='v308FilmLink';b.textContent='Voir la fiche du film';b.setAttribute('aria-label','Voir la fiche du film');b.onclick=e=>{e.preventDefault();e.stopPropagation();renderFilm(w,s.id)};h2.insertAdjacentElement('afterend',b);
  }
  const oldOpenSession=window.openSession;
  if(typeof oldOpenSession==='function')window.openSession=function(id,...rest){oldOpenSession.apply(this,[id,...rest]);[0,30,100,250,500].forEach(t=>setTimeout(addLink,t));};
  document.querySelectorAll('.version').forEach(el=>el.textContent=VERSION);
  const oldRender=window.render;if(typeof oldRender==='function')window.render=function(...args){const r=oldRender.apply(this,args);document.querySelectorAll('.version').forEach(el=>el.textContent=VERSION);return r};
  const style=document.createElement('style');style.textContent=`
    .v308Head{display:flex;justify-content:space-between;align-items:center;gap:12px}.v308Back{border:0;background:none;color:inherit;padding:4px 0;font:inherit;font-size:13px;font-weight:700;cursor:pointer}.v308Close{border:0;background:none;color:inherit;font-size:28px;line-height:1;cursor:pointer;padding:2px 6px}.v308FilmLink{display:inline-flex!important;align-items:center;margin:8px 0 2px;padding:8px 12px;border:1px solid rgba(201,162,39,.8);border-radius:999px;background:rgba(201,162,39,.12);color:inherit;font:inherit;font-size:13px;font-weight:700;cursor:pointer;white-space:nowrap}.v308Title{margin-bottom:0}.v308Meta{font-size:14px;opacity:.8;margin-top:4px}.v308Block{margin-top:22px}.v308Label{font-size:12px;letter-spacing:.12em;font-weight:700;margin-bottom:8px}.v308Block p{margin:0;line-height:1.55}.v308Sessions{display:grid;gap:10px}.v308FilmSession{width:100%;display:flex;justify-content:space-between;align-items:center;gap:12px;text-align:left;border:1px solid rgba(255,255,255,.12);border-radius:10px;background:transparent;color:inherit;padding:12px;cursor:pointer}.v308FilmSession.isPlanned{border:2px solid rgba(201,162,39,.8)}.v308SessionRight{display:flex;align-items:center;gap:8px;text-align:right}.v308SessionRight .status{white-space:normal}.v308Notes{display:grid;gap:10px}.v308Note{padding:12px;border:1px solid rgba(255,255,255,.12);border-radius:10px;background:rgba(255,255,255,.03)}.v308NoteMeta{font-size:12px;font-weight:700;opacity:.7;margin-bottom:6px}.v308NoteText{font-size:14px;line-height:1.5;white-space:pre-wrap}.v308NoNotes{font-size:14px;opacity:.65}.v308Add{display:grid;gap:8px;margin-top:12px}.v308Select,.v308Area{width:100%;box-sizing:border-box;border-radius:10px;border:1px solid rgba(255,255,255,.2);background:rgba(255,255,255,.04);color:inherit;padding:10px;font:inherit}.v308Area{min-height:100px;resize:vertical}.v308Save{margin-top:0}
  `;document.head.appendChild(style);
})();
