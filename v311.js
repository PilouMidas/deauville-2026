/* Deauville 2026 · V3.0.11 — fiche film garantie depuis planning + Jury */
(function(){
  'use strict';
  const VERSION='V3.0.11';
  const works=window.DEAUVILLE_DATA&&window.DEAUVILLE_DATA.works;
  if(!Array.isArray(works))return;
  const norm=s=>String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[’']/g,"'").replace(/[^a-z0-9]+/g,' ').trim();
  const findWorkById=id=>works.find(w=>String(w.id)===String(id))||null;
  const findWork=title=>works.find(w=>norm(w.title)===norm(title)||(Array.isArray(w.aliases)&&w.aliases.some(a=>norm(a)===norm(title))))||null;
  function sessionById(id){
    if(typeof DATA!=='undefined'&&DATA&&Array.isArray(DATA.sessions))return DATA.sessions.find(s=>String(s.id)===String(id))||null;
    return null;
  }
  function juryById(id){
    if(typeof DATA!=='undefined'&&DATA){
      return [...(Array.isArray(DATA.jury)?DATA.jury:[]),...(Array.isArray(DATA.juryExtra)?DATA.juryExtra:[])].find(j=>String(j.id)===String(id))||null;
    }
    return null;
  }
  function workForSession(id){
    const s=sessionById(id);if(!s)return null;
    return findWorkById(s.workId||s.filmId)||findWork(s.title);
  }
  function workForJury(id){
    const j=juryById(id);return j?findWorkById(j.workId)||findWork(j.title):null;
  }
  function cleanOld(){
    const sheet=document.getElementById('sheet');if(!sheet)return;
    sheet.querySelectorAll('.v3FilmAction,.v303FilmLink,.v303FilmAction,.v3FilmLink,.v305FilmLink,.v306FilmLink,.v307FilmLink,.v308FilmLink,.v309FilmLink,.v309JuryFilmLink,.v310FilmLink,.v311FilmLink').forEach(el=>el.remove());
  }
  function inject(work,returnSessionId){
    const sheet=document.getElementById('sheet');if(!sheet||!work)return;
    if(sheet.querySelector('.v311FilmLink'))return;
    cleanOld();
    const b=document.createElement('button');b.type='button';b.className='v311FilmLink btn';b.textContent='Voir la fiche du film';b.setAttribute('aria-label','Voir la fiche du film');
    b.onclick=e=>{e.preventDefault();e.stopPropagation();if(typeof window.openFilm==='function')window.openFilm(work,returnSessionId||null);};
    const h2=sheet.querySelector('h2');if(h2)h2.insertAdjacentElement('afterend',b);else sheet.appendChild(b);
  }
  function injectSession(id){inject(workForSession(id),id)}
  function injectJury(id){inject(workForJury(id),null)}
  const oldOpenSession=window.openSession;
  if(typeof oldOpenSession==='function')window.openSession=function(id,...rest){oldOpenSession.apply(this,[id,...rest]);[0,30,100,250,500,900].forEach(t=>setTimeout(()=>injectSession(id),t));};
  const oldOpenJury=window.openJury;
  if(typeof oldOpenJury==='function')window.openJury=function(id){oldOpenJury.apply(this,arguments);[0,30,100,250,500,900].forEach(t=>setTimeout(()=>injectJury(id),t));};
  const oldOpenFilm=window.openFilm;
  if(typeof oldOpenFilm==='function')window.openFilm=function(work,returnSessionId){return oldOpenFilm.apply(this,[work,returnSessionId]);};
  const oldRender=window.render;
  if(typeof oldRender==='function')window.render=function(...args){const r=oldRender.apply(this,args);document.querySelectorAll('.version').forEach(el=>el.textContent=VERSION);return r};
  document.querySelectorAll('.version').forEach(el=>el.textContent=VERSION);
  const style=document.createElement('style');style.textContent=`.v311FilmLink{display:inline-flex!important;align-items:center;margin:8px 0 2px;padding:8px 12px;border:1px solid rgba(201,162,39,.8);border-radius:999px;background:rgba(201,162,39,.12);color:inherit;font:inherit;font-size:13px;font-weight:700;cursor:pointer;white-space:nowrap}`;document.head.appendChild(style);
})();