/* Deauville 2026 · V3.0.21 — fiches film fiables + Explorer Films */
(function(){
  'use strict';
  const VERSION='V3.0.21';
  const works=window.DEAUVILLE_DATA&&window.DEAUVILLE_DATA.works;
  if(!Array.isArray(works))return;
  const norm=s=>String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[’']/g,"'").replace(/[^a-z0-9]+/g,' ').trim();
  const sessions=()=>{try{return typeof DATA!=='undefined'&&DATA&&Array.isArray(DATA.sessions)?DATA.sessions:[]}catch{return[]}};
  const sessionById=id=>sessions().find(s=>String(s.id)===String(id))||null;
  const workBySession=id=>{const s=sessionById(id);if(!s)return null;return works.find(w=>String(w.id)===String(s.workId||s.filmId))||works.find(w=>norm(w.title)===norm(s.title)||(Array.isArray(w.aliases)&&w.aliases.some(a=>norm(a)===norm(s.title))))||null};
  const notesKey='deauville2026-session-notes-v301';
  const noteCount=id=>{try{const x=JSON.parse(localStorage.getItem(notesKey)||'{}')[String(id)];return Array.isArray(x)?x.length:(x&&typeof x.text==='string'?1:(typeof x==='string'&&x.trim()?1:0))}catch{return 0}};
  function cleanFilmLinks(sheet){if(!sheet)return;sheet.querySelectorAll('button').forEach(b=>{if(b.textContent.trim()==='Voir la fiche du film')b.remove()});sheet.querySelectorAll('[class*="FilmLink"],[class*="FilmAction"]').forEach(el=>el.remove())}
  function addFilmLink(id){
    const s=sessionById(id),sheet=document.getElementById('sheet'),h2=sheet&&sheet.querySelector('h2');
    if(!s||!sheet||!h2||typeof window.openFilm!=='function')return false;
    const w=workBySession(id);if(!w)return false;
    cleanFilmLinks(sheet);
    const b=document.createElement('button');b.type='button';b.className='v321FilmLink';b.textContent='Voir la fiche du film';b.setAttribute('aria-label','Voir la fiche du film');
    b.onclick=e=>{e.preventDefault();e.stopPropagation();window.openFilm(w,id)};
    h2.insertAdjacentElement('afterend',b);return true;
  }
  let pendingSessionId=null;
  document.addEventListener('click',e=>{const c=e.target&&e.target.closest?e.target.closest('.exploreCard[data-session]'):null;if(c)pendingSessionId=c.getAttribute('data-session')},true);
  const sheet=document.getElementById('sheet');
  if(sheet){const obs=new MutationObserver(()=>{if(pendingSessionId)addFilmLink(pendingSessionId)});obs.observe(sheet,{childList:true,subtree:true});}
  const oldSession=window.openSession;
  if(typeof oldSession==='function')window.openSession=function(id,...rest){pendingSessionId=String(id);oldSession.apply(this,[id,...rest]);[0,50,150,300,600].forEach(t=>setTimeout(()=>addFilmLink(id),t));};

  let filmMode=false;
  let filmSearch='';
  function competitionWorks(){
    const ids=new Set(sessions().filter(s=>String(s.category||'').toUpperCase()==='COMP').map(s=>String(s.workId||s.filmId||'')));
    return works.filter(w=>ids.has(String(w.id))||sessions().some(s=>String(s.category||'').toUpperCase()==='COMP'&&(norm(s.title)===norm(w.title)||(Array.isArray(w.aliases)&&w.aliases.some(a=>norm(a)===norm(s.title))))));
  }
  function renderFilms(){
    const root=document.querySelector('.filters');if(!root)return;
    let box=document.getElementById('v321Films');
    if(!box){box=document.createElement('div');box.id='v321Films';root.insertAdjacentElement('afterend',box)}
    const q=norm(filmSearch), list=competitionWorks().filter(w=>!q||norm(w.title).includes(q)).sort((a,b)=>a.title.localeCompare(b.title,'fr'));
    box.innerHTML=`<div class="v321FilmSearch"><span>⌕</span><input id="v321FilmSearchInput" value="${esc(w=>filmSearch)}" placeholder="Rechercher parmi les films…" autocomplete="off"></div><div class="v321FilmCount">${list.length} film${list.length>1?'s':''} en compétition</div>${list.map(w=>`<button type="button" class="v321FilmCard" data-film-id="${esc(w.id)}"><div><b>${esc(w.title)}</b>${w.director?`<small>${esc(w.director)}</small>`:''}${noteCountForWork(w)?`<span class="v321FilmNotes">📝 ${noteCountForWork(w)} note${noteCountForWork(w)>1?'s':''}</span>`:''}</div><span>›</span></button>`).join('')||'<div class="empty">Aucun film ne correspond.</div>'}`;
    box.querySelector('#v321FilmSearchInput')?.addEventListener('input',e=>{filmSearch=e.target.value;renderFilms()});
    box.querySelectorAll('[data-film-id]').forEach(b=>b.addEventListener('click',()=>{const w=works.find(x=>String(x.id)===String(b.dataset.filmId));if(w&&typeof window.openFilm==='function')window.openFilm(w,null)}));
  }
  function noteCountForWork(w){return sessions().filter(s=>norm(s.title)===norm(w.title)||(Array.isArray(w.aliases)&&w.aliases.some(a=>norm(a)===norm(s.title)))).reduce((n,s)=>n+noteCount(s.id),0)}
  function installExplorerModes(){
    if(typeof view==='undefined'||view!=='explorer')return;
    const root=document.querySelector('.filters');if(!root)return;
    let modes=document.getElementById('v321ExplorerModes');
    if(!modes){modes=document.createElement('div');modes.id='v321ExplorerModes';modes.innerHTML='<button type="button" class="v321Mode active" data-mode="sessions">SÉANCES</button><button type="button" class="v321Mode" data-mode="films">FILMS</button>';root.prepend(modes);modes.querySelectorAll('[data-mode]').forEach(b=>b.addEventListener('click',()=>{filmMode=b.dataset.mode==='films';modes.querySelectorAll('.v321Mode').forEach(x=>x.classList.toggle('active',x===b));const searchWrap=root.querySelector('.searchWrap');const rows=root.querySelectorAll('.filterRow');if(searchWrap)searchWrap.style.display=filmMode?'none':'';rows.forEach(r=>r.style.display=filmMode?'none':'');document.querySelectorAll('.exploreCard,.searchDay,.empty').forEach(x=>{if(x.id!=='v321Films')x.style.display=filmMode?'none':''});if(filmMode)renderFilms();else{document.getElementById('v321Films')?.remove();}}));}
    const searchWrap=root.querySelector('.searchWrap');const rows=root.querySelectorAll('.filterRow');if(searchWrap)searchWrap.style.display=filmMode?'none':'';rows.forEach(r=>r.style.display=filmMode?'none':'');if(filmMode){document.querySelectorAll('.exploreCard,.searchDay').forEach(x=>x.style.display='none');renderFilms();}
  }
  const oldRender=window.render;
  if(typeof oldRender==='function')window.render=function(...args){const r=oldRender.apply(this,args);setTimeout(installExplorerModes,0);document.querySelectorAll('.version').forEach(el=>el.textContent=VERSION);return r};
  document.querySelectorAll('.version').forEach(el=>el.textContent=VERSION);
  const style=document.createElement('style');style.textContent=`#v321ExplorerModes{display:flex;gap:8px;margin-bottom:10px}.v321Mode{border:1px solid rgba(255,255,255,.18);background:transparent;color:inherit;border-radius:999px;padding:8px 14px;font:inherit;font-size:12px;font-weight:700;cursor:pointer}.v321Mode.active{background:rgba(201,162,39,.16);border-color:rgba(201,162,39,.8)}#v321Films{margin-top:12px}.v321FilmSearch{display:flex;align-items:center;gap:8px;border:1px solid rgba(255,255,255,.16);border-radius:10px;padding:9px 12px;margin-bottom:10px}.v321FilmSearch input{width:100%;border:0;outline:0;background:transparent;color:inherit;font:inherit}.v321FilmCount{font-size:12px;opacity:.65;margin:0 0 10px}.v321FilmCard{width:100%;display:flex;justify-content:space-between;align-items:center;text-align:left;border:1px solid rgba(255,255,255,.12);border-radius:10px;background:transparent;color:inherit;padding:13px;margin-bottom:8px;cursor:pointer}.v321FilmCard b{display:block;font-size:15px}.v321FilmCard small{display:block;opacity:.65;margin-top:3px}.v321FilmNotes{display:block;font-size:11px;opacity:.7;margin-top:5px}.v321FilmCard>span{font-size:24px;opacity:.5}.v321FilmLink{display:inline-flex!important;align-items:center;margin:8px 0 2px;padding:8px 12px;border:1px solid rgba(201,162,39,.8);border-radius:999px;background:rgba(201,162,39,.12);color:inherit;font:inherit;font-size:13px;font-weight:700;cursor:pointer;white-space:nowrap}`;document.head.appendChild(style);
})();
