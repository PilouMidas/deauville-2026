/* Deauville 2026 · V3.0.0 — fiches films + notes de séances */
(function(){
  'use strict';

  const NOTES_KEY='deauville2026-session-notes-v300';
  const oldOpenSession=window.openSession;

  function notes(){
    try{return JSON.parse(localStorage.getItem(NOTES_KEY)||'{}')}catch{return {}}
  }
  function saveNotes(x){localStorage.setItem(NOTES_KEY,JSON.stringify(x))}
  function noteFor(id){return notes()[String(id)]||''}
  function workForSession(s){
    if(!s||!Array.isArray(DATA?.works))return null;
    const t=normTitle(canonicalTitle(s.title));
    return DATA.works.find(w=>normTitle(canonicalTitle(w.title))===t || (Array.isArray(w.aliases)&&w.aliases.some(a=>normTitle(canonicalTitle(a))===t)))||null;
  }
  function sessionsForWork(w){
    if(!w||!Array.isArray(DATA?.sessions))return [];
    const names=[w.title,...(Array.isArray(w.aliases)?w.aliases:[])].map(x=>normTitle(canonicalTitle(x)));
    return DATA.sessions.filter(s=>names.includes(normTitle(canonicalTitle(s.title))))
      .sort((a,b)=>a.date.localeCompare(b.date)||mins(a.start)-mins(b.start));
  }
  function statusHtml(s){
    if(typeof window.compatibilityLabel==='function')return window.compatibilityLabel(s);
    return typeof window.sessionStatusHtml==='function'?window.sessionStatusHtml(s):'';
  }
  function openFilm(work){
    if(!work)return;
    const ss=sessionsForWork(work);
    const cast=work.cast||work.actors||'';
    const credits=work.credits||{};
    const creditRows=Object.entries(credits).filter(([,v])=>v).map(([k,v])=>`<div><b>${esc(k)}</b> · ${esc(v)}</div>`).join('');
    const noteCount=ss.filter(s=>noteFor(s.id).trim()).length;
    openModal(`
      <div class="v3FilmHead">
        <div class="section">FICHE FILM</div>
        <button class="v3CloseFilm" type="button" aria-label="Fermer">×</button>
      </div>
      <h2 class="v3FilmTitle">${esc(work.title)}</h2>
      <div class="v3FilmMeta">${esc(work.director||'')} ${work.year?'· '+esc(work.year):''} ${work.duration?'· '+esc(work.duration)+' min':''}</div>
      <div class="v3FilmMeta">${esc(work.country||work.nationality||'')} ${work.categoryLabel?'· '+esc(work.categoryLabel):''}</div>
      ${work.synopsis?`<div class="v3FilmBlock"><div class="v3FilmLabel">SYNOPSIS</div><p>${esc(work.synopsis)}</p></div>`:''}
      ${cast?`<div class="v3FilmBlock"><div class="v3FilmLabel">AVEC</div><p>${esc(Array.isArray(cast)?cast.join(', '):cast)}</p></div>`:''}
      ${work.language||work.subtitles?`<div class="v3FilmBlock"><div class="v3FilmLabel">INFOS</div><p>${work.language?'Langue · '+esc(work.language):''}${work.language&&work.subtitles?' · ':''}${work.subtitles?'Sous-titres · '+esc(work.subtitles):''}</p></div>`:''}
      ${creditRows?`<div class="v3FilmBlock"><div class="v3FilmLabel">CRÉDITS</div><div class="v3Credits">${creditRows}</div></div>`:''}
      <div class="v3FilmBlock"><div class="v3FilmLabel">MES SÉANCES · ${ss.length}</div>${noteCount?`<div class="v3NoteSummary">📝 ${noteCount} séance${noteCount>1?'s':''} annotée${noteCount>1?'s':''}</div>`:''}
      <div class="v3FilmSessions">${ss.map(s=>`<button class="v3FilmSession" type="button" data-v3-session="${esc(s.id)}"><div><b>${esc(dateLabel(s.date))}</b><br><small>${esc(s.start)}–${esc(s.end)} · ${esc(s.place)}</small></div><div class="v3FilmSessionRight">${statusHtml(s)}<span class="ecArrow">›</span></div></button>`).join('')}</div></div>
    `);
    document.querySelector('.v3CloseFilm')?.addEventListener('click',closeModal);
    document.querySelectorAll('[data-v3-session]').forEach(b=>b.addEventListener('click',()=>openSession(b.dataset.v3Session)));
  }
  window.openFilm=openFilm;

  function decorateSessionSheet(s){
    const sheet=document.getElementById('sheet');
    if(!sheet)return;
    const h2=sheet.querySelector('h2');
    if(h2&&!h2.dataset.v3FilmBound){
      const w=workForSession(s);
      if(w){
        h2.dataset.v3FilmBound='1';
        h2.classList.add('v3ClickableTitle');
        h2.setAttribute('role','button');
        h2.setAttribute('tabindex','0');
        h2.title='Ouvrir la fiche film';
        h2.addEventListener('click',()=>openFilm(w));
        h2.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();openFilm(w)}});
      }
    }
    let block=sheet.querySelector('.v3SessionNotes');
    if(!block){
      block=document.createElement('div');
      block.className='v3SessionNotes v3FilmBlock';
      block.innerHTML=`<div class="v3FilmLabel">MES NOTES</div><textarea class="v3NotesArea" placeholder="Note cette séance…"></textarea><button class="btn primary v3SaveNote" type="button">Enregistrer mes notes</button>`;
      sheet.appendChild(block);
      const ta=block.querySelector('textarea');
      ta.value=noteFor(s.id);
      block.querySelector('.v3SaveNote').addEventListener('click',()=>{
        const n=notes();
        const value=ta.value.trim();
        if(value)n[String(s.id)]=value;else delete n[String(s.id)];
        saveNotes(n);
        block.querySelector('.v3SaveNote').textContent='✓ Notes enregistrées';
        setTimeout(()=>{if(block.isConnected)block.querySelector('.v3SaveNote').textContent='Enregistrer mes notes'},1200);
      });
    }
  }

  if(typeof oldOpenSession==='function'){
    window.openSession=function(id,...rest){
      oldOpenSession(id,...rest);
      const s=DATA?.sessions?.find(x=>String(x.id)===String(id));
      if(!s)return;
      requestAnimationFrame(()=>decorateSessionSheet(s));
    };
  }

  const style=document.createElement('style');
  style.textContent=`
    .v3FilmHead{display:flex;justify-content:space-between;align-items:center;gap:12px}
    .v3CloseFilm{border:0;background:none;color:inherit;font-size:28px;line-height:1;cursor:pointer;padding:2px 6px}
    .v3FilmTitle{cursor:pointer;text-decoration:underline;text-decoration-color:#c9a227;text-decoration-thickness:2px;text-underline-offset:5px}
    .v3FilmTitle:focus,.v3ClickableTitle:focus{outline:2px solid #c9a227;outline-offset:3px;border-radius:4px}
    .v3FilmMeta{font-size:14px;opacity:.8;margin-top:4px}
    .v3FilmBlock{margin-top:22px}
    .v3FilmLabel{font-size:12px;letter-spacing:.12em;font-weight:700;margin-bottom:8px}
    .v3FilmBlock p{margin:0;line-height:1.55}
    .v3Credits{font-size:14px;line-height:1.6}
    .v3FilmSessions{display:grid;gap:8px}
    .v3FilmSession{width:100%;display:flex;justify-content:space-between;align-items:center;gap:12px;text-align:left;border:1px solid rgba(255,255,255,.12);border-radius:10px;background:transparent;color:inherit;padding:12px;cursor:pointer}
    .v3FilmSessionRight{display:flex;align-items:center;gap:8px;text-align:right}
    .v3FilmSessionRight .status{white-space:normal}
    .v3NoteSummary{font-size:13px;opacity:.75;margin:-2px 0 10px}
    .v3NotesArea{width:100%;min-height:120px;box-sizing:border-box;resize:vertical;border-radius:10px;border:1px solid rgba(255,255,255,.2);background:rgba(255,255,255,.04);color:inherit;padding:12px;font:inherit;line-height:1.5}
    .v3SaveNote{margin-top:8px}
  `;
  document.head.appendChild(style);
})();
