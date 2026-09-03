/* Deauville 2026 · V3.0.18 — toute séance ouvre sa fiche film, un seul bouton */
(function(){
  'use strict';
  const VERSION='V3.0.18';
  const works=window.DEAUVILLE_DATA&&window.DEAUVILLE_DATA.works;
  if(!Array.isArray(works))return;
  const norm=s=>String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[’']/g,"'").replace(/[^a-z0-9]+/g,' ').trim();
  const findWorkById=id=>works.find(w=>String(w.id)===String(id))||null;
  const findWork=title=>works.find(w=>norm(w.title)===norm(title)||(Array.isArray(w.aliases)&&w.aliases.some(a=>norm(a)===norm(title))))||null;
  const sessions=()=>{try{return typeof DATA!=='undefined'&&DATA&&Array.isArray(DATA.sessions)?DATA.sessions:[]}catch{return[]}};
  const sessionById=id=>sessions().find(s=>String(s.id)===String(id))||null;
  const workForSession=id=>{const s=sessionById(id);return s&&(findWorkById(s.workId||s.filmId)||findWork(s.title))};
  let activeSessionId=null;
  function cleanFilmLinks(sheet){
    if(!sheet)return;
    sheet.querySelectorAll('button').forEach(b=>{if(b.textContent.trim()==='Voir la fiche du film')b.remove()});
    sheet.querySelectorAll('[class*="FilmLink"],[class*="FilmAction"]').forEach(el=>el.remove());
  }
  function ensureSessionFilmLink(id){
    const s=sessionById(id),sheet=document.getElementById('sheet'),h2=sheet&&sheet.querySelector('h2');
    if(!s||!sheet||!h2)return;
    const work=workForSession(id)||findWork(h2.textContent);
    if(!work||typeof window.openFilm!=='function')return;
    cleanFilmLinks(sheet);
    const b=document.createElement('button');
    b.type='button';b.className='v318FilmLink';b.textContent='Voir la fiche du film';b.setAttribute('aria-label','Voir la fiche du film');
    b.onclick=e=>{e.preventDefault();e.stopPropagation();window.openFilm(work,id)};
    h2.insertAdjacentElement('afterend',b);
  }
  function repair(id){[0,30,80,150,300,600,1000].forEach(t=>setTimeout(()=>ensureSessionFilmLink(id),t));}
  const oldSession=window.openSession;
  if(typeof oldSession==='function')window.openSession=function(id,...rest){activeSessionId=id;oldSession.apply(this,[id,...rest]);repair(id)};
  const oldPlan=window.openPlan;
  if(typeof oldPlan==='function')window.openPlan=function(id,...rest){oldPlan.apply(this,[id,...rest]);let p=null;try{p=typeof plan!=='undefined'&&Array.isArray(plan)?plan.find(x=>String(x.id)===String(id)):null}catch{};if(p&&p.sessionId){activeSessionId=p.sessionId;repair(p.sessionId)}};
  document.addEventListener('click',function(e){
    const card=e.target&&e.target.closest?e.target.closest('.exploreCard[data-session]'):null;
    if(!card)return;
    const id=card.getAttribute('data-session');
    if(!sessionById(id))return;
    e.preventDefault();e.stopImmediatePropagation();
    if(typeof window.openSession==='function')window.openSession(id);
  },true);
  document.querySelectorAll('.version').forEach(el=>el.textContent=VERSION);
  const oldRender=window.render;
  if(typeof oldRender==='function')window.render=function(...args){const r=oldRender.apply(this,args);document.querySelectorAll('.version').forEach(el=>el.textContent=VERSION);return r};
  const style=document.createElement('style');style.textContent='.v318FilmLink{display:inline-flex!important;align-items:center;margin:8px 0 2px;padding:8px 12px;border:1px solid rgba(201,162,39,.8);border-radius:999px;background:rgba(201,162,39,.12);color:inherit;font:inherit;font-size:13px;font-weight:700;cursor:pointer;white-space:nowrap}';document.head.appendChild(style);
})();
