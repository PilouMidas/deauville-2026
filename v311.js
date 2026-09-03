/* Deauville 2026 · V3.0.15 — fiche film depuis toutes les séances */
(function(){
  'use strict';
  const VERSION='V3.0.15';
  const works=window.DEAUVILLE_DATA&&window.DEAUVILLE_DATA.works;
  if(!Array.isArray(works))return;
  const norm=s=>String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[’']/g,"'").replace(/[^a-z0-9]+/g,' ').trim();
  const findWorkById=id=>works.find(w=>String(w.id)===String(id))||null;
  const findWork=title=>works.find(w=>norm(w.title)===norm(title)||(Array.isArray(w.aliases)&&w.aliases.some(a=>norm(a)===norm(title))))||null;
  const sessions=()=>{try{return typeof DATA!=='undefined'&&DATA&&Array.isArray(DATA.sessions)?DATA.sessions:[]}catch{return[]}};
  const sessionById=id=>sessions().find(s=>String(s.id)===String(id))||null;
  const workForSession=id=>{const s=sessionById(id);if(!s)return null;return findWorkById(s.workId||s.filmId)||findWork(s.title)};

  function ensureFilmLink(id){
    const sheet=document.getElementById('sheet');
    if(!sheet)return;
    const s=sessionById(id);
    const h2=sheet.querySelector('h2');
    const w=workForSession(id)||(h2&&findWork(h2.textContent));
    if(!s||!w||!h2)return;
    sheet.querySelectorAll('.v314FilmLink,.v313FilmLink').forEach(el=>el.remove());
    const b=document.createElement('button');
    b.type='button';
    b.className='v315FilmLink btn';
    b.textContent='Voir la fiche du film';
    b.setAttribute('aria-label','Voir la fiche du film');
    b.onclick=e=>{e.preventDefault();e.stopPropagation();if(typeof window.openFilm==='function')window.openFilm(w,id);};
    h2.insertAdjacentElement('afterend',b);
  }
  const repair=id=>[0,20,60,120,250,500,900].forEach(t=>setTimeout(()=>ensureFilmLink(id),t));

  const oldSession=window.openSession;
  if(typeof oldSession==='function'){
    window.openSession=function(id,...rest){oldSession.apply(this,[id,...rest]);repair(id);};
  }

  /* Toutes les cartes Explorer ouvrent leur séance normalement, sans exception Jury. */
  document.addEventListener('click',function(e){
    const card=e.target&&e.target.closest?e.target.closest('.exploreCard[data-session]'):null;
    if(!card)return;
    const id=card.getAttribute('data-session');
    if(!sessionById(id))return;
    e.preventDefault();
    e.stopImmediatePropagation();
    if(typeof window.openSession==='function')window.openSession(id);
  },true);

  document.querySelectorAll('.version').forEach(el=>el.textContent=VERSION);
  const oldRender=window.render;
  if(typeof oldRender==='function')window.render=function(...args){const r=oldRender.apply(this,args);document.querySelectorAll('.version').forEach(el=>el.textContent=VERSION);return r};
  const style=document.createElement('style');
  style.textContent='.v315FilmLink{display:inline-flex!important;align-items:center;margin:8px 0 2px;padding:8px 12px;border:1px solid rgba(201,162,39,.8);border-radius:999px;background:rgba(201,162,39,.12);color:inherit;font:inherit;font-size:13px;font-weight:700;cursor:pointer;white-space:nowrap}';
  document.head.appendChild(style);
})();
