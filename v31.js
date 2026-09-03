/* Deauville 2026 · V3.0.2 — fiches films + notes de séances */
(function(){
  'use strict';

  const VERSION_LABEL='V3.0.2';
  const NOTES_KEY='deauville2026-session-notes-v301';

  function refreshVersion(){document.querySelectorAll('.version').forEach(el=>{el.textContent=VERSION_LABEL})}
  function notes(){try{return JSON.parse(localStorage.getItem(NOTES_KEY)||'{}')}catch{return {}}}
  function saveNotes(x){localStorage.setItem(NOTES_KEY,JSON.stringify(x))}
  function noteFor(id){return notes()[String(id)]||''}
  function workForSession(s){
    if(!s||!Array.isArray(DATA?.works))return null;
    const t=normTitle(canonicalTitle(s.title));
    return DATA.works.find(w=>normTitle(canonicalTitle(w.title))===t||(Array.isArray(w.aliases)&&w.aliases.some(a=>normTitle(canonicalTitle(a))===t)))||null;
  }
  function sessionsForWork(w){
    if(!w||!Array.isArray(DATA?.sessions))return [];
    const names=[w.title,...(Array.isArray(w.aliases)?w.aliases:[])].map(x=>normTitle(canonicalTitle(x)));
    return DATA.sessions.filter(s=>names.includes(normTitle(canonicalTitle(s.title)))).sort((a,b)=>a.date.localeCompare(b.date)||mins(a.start)-mins(b.start));
  }
  function statusHtml(s){
    if(typeof window.compatibilityLabel==='function')return window.compatibilityLabel(s);
    return typeof window.sessionStatusHtml==='function'?window.sessionStatusHtml(s):'';
  }
  function saveNote(id,ta,button){
    const n=notes(),value=ta.value.trim();
    if(value)n[String(id)]=value;else delete n[String(id)];
    saveNotes(n);button.textContent='✓ Notes enregistrées';
    setTimeout(()=>{if(button.isConnected)button.textContent='Enregistrer'},1200);
  }

  function openFilm(work){
    if(!work)return;
    const ss=sessionsForWork(work);
    const cast=work.cast||work.actors||'';
    const credits=work.credits||{};
    const creditRows=Object.entries(credits).filter(([,v])=>v).map(([k,v])=>`<div><b>${esc(k)}</b> · ${esc(v)}</div>`).join('');
    openModal(`
      <div class="v3FilmHead"><div class="section">FICHE FILM</div><button class="v3CloseFilm" type="button" aria-label="Fermer">×</button></div>
      <h2 class="v3FilmTitle">${esc(work.title)}</h2>
      <div class="v3FilmMeta">${esc(work.director||'')} ${work.year?'· '+esc(work.year):''} ${work.duration?'· '+esc(work.duration)+' min':''}</div>
      <div class="v3FilmMeta">${esc(work.country||work.nationality||'')} ${work.categoryLabel?'· '+esc(work.categoryLabel):''}</div>
      ${work.synopsis?`<div class="v3FilmBlock"><div class="v3FilmLabel">SYNOPSIS</div><p>${esc(work.synopsis)}</p></div>`:''}
      ${cast?`<div class="v3FilmBlock"><div class="v3FilmLabel">AVEC</div><p>${esc(Array.isArray(cast)?cast.join(', '):cast)}</p></div>`:''}
      ${work.language||work.subtitles?`<div class="v3FilmBlock"><div class="v3FilmLabel">INFOS</div><p>${work.language?'Langue · '+esc(work.language):''}${work.language&&work.subtitles?' · ':''}${work.subtitles?'Sous-titres · '+esc(work.subtitles):''}</p></div>`:''}
      ${creditRows?`<div class="v3FilmBlock"><div class="v3FilmLabel">CRÉDITS</div><div class="v3Credits">${creditRows}</div></div>`:''}
      <div class="v3FilmBlock"><div class="v3FilmLabel">MES SÉANCES · ${ss.length}</div>
        <div class="v3FilmSessions">${ss.map(s=>`<div class="v3FilmSessionWrap">
          <button class="v3FilmSession" type="button" data-v3-session="${esc(s.id)}"><div><b>${esc(dateLabel(s.date))}</b><br><small>${esc(s.start)}–${esc(s.end)} · ${esc(s.place)}</small></div><div class="v3FilmSessionRight">${statusHtml(s)}<span class="ecArrow">›</span></div></button>
          <div class="v3FilmInlineNotes"><textarea data-v3-note="${esc(s.id)}" placeholder="Mes notes sur cette séance…">${esc(noteFor(s.id))}</textarea><button class="btn primary v3SaveFilmNote" type="button" data-v3-save-note="${esc(s.id)}">Enregistrer</button></div>
        </div>`).join('')}</div>
      </div>`);
    document.querySelector('.v3CloseFilm')?.addEventListener('click',closeModal);
    document.querySelectorAll('[data-v3-session]').forEach(b=>b.addEventListener('click',()=>window.openSession(b.dataset.v3Session)));
    document.querySelectorAll('[data-v3-save-note]').forEach(b=>b.addEventListener('click',()=>saveNote(b.dataset.v3SaveNote,document.querySelector(`[data-v3-note="${b.dataset.v3SaveNote}"]`),b)));
  }
  window.openFilm=openFilm;

  function addFilmLink(s){
    const sheet=document.getElementById('sheet');
    if(!sheet)return false;
    const h2=sheet.querySelector('h2');
    const w=workForSession(s);
    if(!h2||!w)return false;
    if(sheet.querySelector('.v3FilmAction'))return true;
    const row=document.createElement('div');row.className='v3FilmAction';
    const button=document.createElement('button');button.type='button';button.className='v3FilmLink';button.textContent='Voir la fiche du film';
    button.setAttribute('aria-label','Voir la fiche du film');
    button.addEventListener('click',e=>{e.preventDefault();e.stopPropagation();openFilm(w)});
    row.appendChild(button);h2.insertAdjacentElement('afterend',row);return true;
  }

  function addSessionNotes(s){
    const sheet=document.getElementById('sheet');
    if(!sheet||sheet.querySelector('.v3SessionNotes'))return;
    const block=document.createElement('div');block.className='v3SessionNotes v3FilmBlock';
    block.innerHTML=`<div class="v3FilmLabel">MES NOTES</div><textarea class="v3NotesArea" placeholder="Note cette séance…">${esc(noteFor(s.id))}</textarea><button class="btn primary v3SaveNote" type="button">Enregistrer mes notes</button>`;
    sheet.appendChild(block);
    const ta=block.querySelector('textarea'),button=block.querySelector('.v3SaveNote');
    button.addEventListener('click',()=>saveNote(s.id,ta,button));
  }

  function decorateSessionSheet(s){addFilmLink(s);addSessionNotes(s)}

  const oldOpenSession=window.openSession;
  if(typeof oldOpenSession==='function'){
    window.openSession=function(id,...rest){
      oldOpenSession.apply(this,[id,...rest]);
      const s=DATA?.sessions?.find(x=>String(x.id)===String(id));
      if(s){decorateSessionSheet(s);[30,100,250,500].forEach(ms=>setTimeout(()=>decorateSessionSheet(s),ms))}
    };
  }

  const oldRender=window.render;
  if(typeof oldRender==='function'){
    window.render=function(...args){const result=oldRender.apply(this,args);refreshVersion();return result};
  }

  const style=document.createElement('style');style.textContent=`
    .v3FilmHead{display:flex;justify-content:space-between;align-items:center;gap:12px}
    .v3CloseFilm{border:0;background:none;color:inherit;font-size:28px;line-height:1;cursor:pointer;padding:2px 6px}
    .v3FilmAction{display:block;margin:8px 0 2px}
    .v3FilmLink{display:inline-flex!important;align-items:center;padding:8px 12px;border:1px solid rgba(201,162,39,.8);border-radius:999px;background:rgba(201,162,39,.12);color:inherit;font:inherit;font-size:13px;font-weight:700;cursor:pointer;white-space:nowrap}
    .v3FilmLink:hover{background:rgba(201,162,39,.2)}
    .v3FilmTitle{margin-bottom:0}
    .v3FilmMeta{font-size:14px;opacity:.8;margin-top:4px}
    .v3FilmBlock{margin-top:22px}.v3FilmLabel{font-size:12px;letter-spacing:.12em;font-weight:700;margin-bottom:8px}.v3FilmBlock p{margin:0;line-height:1.55}
    .v3Credits{font-size:14px;line-height:1.6}.v3FilmSessions{display:grid;gap:10px}.v3FilmSessionWrap{display:grid;gap:6px}
    .v3FilmSession{width:100%;display:flex;justify-content:space-between;align-items:center;gap:12px;text-align:left;border:1px solid rgba(255,255,255,.12);border-radius:10px;background:transparent;color:inherit;padding:12px;cursor:pointer}
    .v3FilmSessionRight{display:flex;align-items:center;gap:8px;text-align:right}.v3FilmSessionRight .status{white-space:normal}
    .v3NotesArea,.v3FilmInlineNotes textarea{width:100%;min-height:100px;box-sizing:border-box;resize:vertical;border-radius:10px;border:1px solid rgba(255,255,255,.2);background:rgba(255,255,255,.04);color:inherit;padding:12px;font:inherit;line-height:1.5}
    .v3SaveNote,.v3SaveFilmNote{margin-top:6px}.v3FilmInlineNotes{padding:0 2px 4px}
  `;document.head.appendChild(style);
  refreshVersion();

  /* Filet de sécurité V3.0.2 : si l’ouverture de séance est reconstruite après le hook,
     on réinjecte le lien et les notes dès que #sheet change. L’observer ne modifie jamais
     le texte du DOM, afin d’éviter la boucle MutationObserver rencontrée précédemment. */
  let observerBusy=false;
  const observer=new MutationObserver(()=>{
    if(observerBusy)return;
    const modal=document.getElementById('modal');
    if(!modal||modal.getAttribute('aria-hidden')==='true')return;
    const sheet=document.getElementById('sheet');
    if(!sheet)return;
    const h2=sheet.querySelector('h2');
    if(!h2)return;
    const cleanTitle=(h2.textContent||'').replace(/Voir la fiche du film/g,'').trim();
    const s=DATA?.sessions?.find(x=>normTitle(canonicalTitle(x.title))===normTitle(canonicalTitle(cleanTitle)));
    if(!s)return;
    observerBusy=true;
    try{decorateSessionSheet(s)}finally{observerBusy=false}
  });
  if(document.body)observer.observe(document.body,{childList:true,subtree:true});
})();
