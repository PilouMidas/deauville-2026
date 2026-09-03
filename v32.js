/* Deauville 2026 · V3.0.4 — fiches films */
(function(){
  'use strict';
  const works=window.DEAUVILLE_DATA&&window.DEAUVILLE_DATA.works;
  const VERSION_LABEL='V3.0.4';
  document.querySelectorAll('.version').forEach(el=>{el.textContent='v'+VERSION_LABEL});
  if(!Array.isArray(works))return;
  const norm=s=>String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[’']/g,"'").replace(/[^a-z0-9]+/g,' ').trim();
  const findWork=title=>works.find(w=>norm(w.title)===norm(title)||(Array.isArray(w.aliases)&&w.aliases.some(a=>norm(a)===norm(title))))||null;
  function add(){
    const sheet=document.getElementById('sheet'),h2=sheet&&sheet.querySelector('h2');
    if(!h2||!window.openFilm||sheet.querySelector('.v304FilmLink'))return false;
    const w=findWork(h2.textContent);if(!w)return false;
    const b=document.createElement('button');b.type='button';b.className='v304FilmLink';b.textContent='Voir la fiche du film';
    b.setAttribute('aria-label','Voir la fiche du film');
    b.onclick=e=>{e.preventDefault();e.stopPropagation();window.openFilm(w)};
    h2.insertAdjacentElement('afterend',b);return true;
  }
  const old=window.openSession;
  if(typeof old==='function')window.openSession=function(id){old.apply(this,arguments);[0,50,150,300,600].forEach(t=>setTimeout(add,t))};
  const observer=new MutationObserver(add);
  if(document.body)observer.observe(document.body,{childList:true,subtree:true});
  const oldRender=window.render;
  if(typeof oldRender==='function')window.render=function(){const r=oldRender.apply(this,arguments);document.querySelectorAll('.version').forEach(el=>{el.textContent='v'+VERSION_LABEL});return r};
  const style=document.createElement('style');style.textContent='.v304FilmLink{display:inline-flex!important;margin:8px 0 2px;padding:8px 12px;border:1px solid rgba(201,162,39,.8);border-radius:999px;background:rgba(201,162,39,.12);color:inherit;font:inherit;font-size:13px;font-weight:700;cursor:pointer}';document.head.appendChild(style);
})();
