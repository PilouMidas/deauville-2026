/* Deauville 2026 · V3.0.16 — clic Explorer fiable, sans doublons */
(function(){
  'use strict';
  const VERSION='V3.0.16';

  function sessions(){
    try{return typeof DATA!=='undefined'&&DATA&&Array.isArray(DATA.sessions)?DATA.sessions:[]}catch{return[]}
  }

  function sessionById(id){
    return sessions().find(s=>String(s.id)===String(id))||null;
  }

  /*
     V3.0.15 ajoutait le lien fiche film plusieurs fois depuis openSession
     (et v38 fait déjà ce travail). Ici on ne touche plus à openSession :
     on sécurise uniquement le clic des cartes Explorer, notamment les Jury.
  */
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
  if(typeof oldRender==='function')window.render=function(...args){
    const r=oldRender.apply(this,args);
    document.querySelectorAll('.version').forEach(el=>el.textContent=VERSION);
    return r;
  };
})();
