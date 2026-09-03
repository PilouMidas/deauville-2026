/* Deauville 2026 · V3.0.17 — fiche film universelle depuis toute séance */
(function(){
  'use strict';
  const VERSION='V3.0.17';
  const works=window.DEAUVILLE_DATA&&window.DEAUVILLE_DATA.works;
  if(!Array.isArray(works))return;

  const norm=s=>String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[’']/g,"'").replace(/[^a-z0-9]+/g,' ').trim();
  const findWorkById=id=>works.find(w=>String(w.id)===String(id))||null;
  const findWork=title=>works.find(w=>norm(w.title)===norm(title)||(Array.isArray(w.aliases)&&w.aliases.some(a=>norm(a)===norm(title))))||null;
  const workFromText=text=>findWork(text)||String(text||'').split(/\s*(?:\+|·|•|—|–|:|\||\/)\s*/).map(findWork).find(Boolean)||null;
  const sessions=()=>{try{return typeof DATA!=='undefined'&&DATA&&Array.isArray(DATA.sessions)?DATA.sessions:[]}catch{return[]}};
  const juries=()=>{try{return typeof DATA!=='undefined'&&DATA?[...(Array.isArray(DATA.jury)?DATA.jury:[]),...(Array.isArray(DATA.juryExtra)?DATA.juryExtra:[])]:[]}catch{return[]}};
  const sessionById=id=>sessions().find(s=>String(s.id)===String(id))||null;
  const workForSession=id=>{const s=sessionById(id);return s&&(findWorkById(s.workId||s.filmId)||findWork(s.title))};
  const workForJury=id=>{const j=juries().find(x=>String(x.id)===String(id));return j&&(findWorkById(j.workId||j.filmId)||workFromText(j.title))};

  function addFilmLink(work,returnSessionId){
    const sheet=document.getElementById('sheet'),h2=sheet&&sheet.querySelector('h2');
    if(!sheet||!h2||!work||typeof window.openFilm!=='function')return;
    if(sheet.querySelector('.v309FilmLink'))return;
    const b=document.createElement('button');
    b.type='button';b.className='v309FilmLink';b.textContent='Voir la fiche du film';b.setAttribute('aria-label','Voir la fiche du film');
    b.onclick=e=>{e.preventDefault();e.stopPropagation();window.openFilm(work,returnSessionId||null)};
    h2.insertAdjacentElement('afterend',b);
  }

  function repairSession(id){
    const w=workForSession(id);
    [0,20,60,120,250,500,900].forEach(t=>setTimeout(()=>addFilmLink(w,id),t));
  }
  function repairPlan(planId){
    let p=null;try{p=typeof plan!=='undefined'&&Array.isArray(plan)?plan.find(x=>String(x.id)===String(planId)):null}catch{}
    const w=p&&(workForSession(p.sessionId)||findWork(p.title));
    [0,20,60,120,250,500,900].forEach(t=>setTimeout(()=>addFilmLink(w,p&&p.sessionId),t));
  }
  function repairJury(id){
    const w=workForJury(id);
    [0,20,60,120,250,500,900].forEach(t=>setTimeout(()=>addFilmLink(w,null),t));
  }

  const oldSession=window.openSession;
  if(typeof oldSession==='function')window.openSession=function(id,...rest){oldSession.apply(this,[id,...rest]);repairSession(id);};
  const oldPlan=window.openPlan;
  if(typeof oldPlan==='function')window.openPlan=function(id,...rest){oldPlan.apply(this,[id,...rest]);repairPlan(id);};
  const oldJury=window.openJury;
  if(typeof oldJury==='function')window.openJury=function(id,...rest){oldJury.apply(this,[id,...rest]);repairJury(id);};

  /* Explorer : une carte est toujours une séance, donc même chemin que Planning. */
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
  if(typeof oldRender==='function')window.render=function(...args){const r=oldRender.apply(this,args);document.querySelectorAll('.version').forEach(el=>el.textContent=VERSION);return r;};
})();
