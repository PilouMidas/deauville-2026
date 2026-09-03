/* Deauville 2026 · V3.0.14 — sécuriser l’accès fiche film depuis Explorer */
(function(){
  'use strict';
  const VERSION='V3.0.14';
  const works=window.DEAUVILLE_DATA&&window.DEAUVILLE_DATA.works;
  if(!Array.isArray(works))return;
  const norm=s=>String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[’']/g,"'").replace(/[^a-z0-9]+/g,' ').trim();
  const findWorkById=id=>works.find(w=>String(w.id)===String(id))||null;
  const findWork=title=>works.find(w=>norm(w.title)===norm(title)||(Array.isArray(w.aliases)&&w.aliases.some(a=>norm(a)===norm(title))))||null;
  const sessions=()=>{try{return typeof DATA!=='undefined'&&DATA&&Array.isArray(DATA.sessions)?DATA.sessions:[]}catch{return[]}};
  const sessionById=id=>sessions().find(s=>String(s.id)===String(id))||null;
  const workForSession=id=>{const s=sessionById(id);return s&&(findWorkById(s.workId||s.filmId)||findWork(s.title))};
  const wireExplorerCard=()=>{
    const old=window.explorerCard;
    if(typeof old!=='function')return;
    window.explorerCard=function(s){
      let html=old.apply(this,arguments);
      const id=String(s&&s.id||'').replace(/'/g,"\\'");
      const marker=`<button class="exploreCard" data-session="${s.id}">`;
      if(id&&html.includes(marker)){
        html=html.replace(marker,`<button class="exploreCard" data-session="${s.id}" onclick="event.stopImmediatePropagation();openSession('${id}')">`);
      }
      return html;
    };
  };
  wireExplorerCard();
  document.querySelectorAll('.version').forEach(el=>el.textContent=VERSION);
  const style=document.createElement('style');style.textContent='.v313FilmLink{display:inline-flex!important;align-items:center;margin:8px 0 2px;padding:8px 12px;border:1px solid rgba(201,162,39,.8);border-radius:999px;background:rgba(201,162,39,.12);color:inherit;font:inherit;font-size:13px;font-weight:700;cursor:pointer;white-space:nowrap}';document.head.appendChild(style);
})();
