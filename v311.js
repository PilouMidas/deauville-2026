/* Deauville 2026 · V3.0.11 — lien fiche film aussi depuis Explorer/Jury */
(function(){
'use strict';
const VERSION='V3.0.11';
const works=window.DEAUVILLE_DATA&&window.DEAUVILLE_DATA.works;
if(!Array.isArray(works))return;
const norm=s=>String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[’']/g,"'").replace(/[^a-z0-9]+/g,' ').trim();
const findWork=title=>works.find(w=>norm(w.title)===norm(title)||(Array.isArray(w.aliases)&&w.aliases.some(a=>norm(a)===norm(title))))||null;
const findWorkById=id=>works.find(w=>String(w.id)===String(id))||null;
const sessions=()=>{try{return typeof DATA!=='undefined'&&DATA&&Array.isArray(DATA.sessions)?DATA.sessions:[]}catch{return[]}};
const jury=()=>{try{return typeof DATA!=='undefined'&&DATA?[...(Array.isArray(DATA.jury)?DATA.jury:[]),...(Array.isArray(DATA.juryExtra)?DATA.juryExtra:[])]:[]}catch{return[]}};
const sessionById=id=>sessions().find(s=>String(s.id)===String(id))||null;
const workBySessionId=id=>{const s=sessionById(id);if(!s)return null;return findWorkById(s.workId||s.filmId)||findWork(s.title)};
const workByJuryId=id=>{const j=jury().find(x=>String(x.id)===String(id));if(!j)return null;return findWorkById(j.workId)||findWork(j.title)};
function inject(work,returnId){const sheet=document.getElementById('sheet');if(!sheet||!work)return;sheet.querySelectorAll('[class*="FilmLink"],[class*="FilmAction"]').forEach(el=>el.remove());const b=document.createElement('button');b.type='button';b.className='v311FilmLink btn';b.textContent='Voir la fiche du film';b.onclick=e=>{e.preventDefault();e.stopPropagation();window.openFilm(work,returnId||null)};const h2=sheet.querySelector('h2');if(h2)h2.insertAdjacentElement('afterend',b);else sheet.prepend(b)}
function injectSession(id){const w=workBySessionId(id);if(w)inject(w,id)}
function injectJury(id){const w=workByJuryId(id);if(w)inject(w,null)}
const oldSession=window.openSession;
if(typeof oldSession==='function')window.openSession=function(id,...rest){oldSession.apply(this,[id,...rest]);[0,20,50,100,200,400,800].forEach(t=>setTimeout(()=>injectSession(id),t));};
const oldJury=window.openJury;
if(typeof oldJury==='function')window.openJury=function(id){oldJury.apply(this,arguments);[0,20,50,100,200,400].forEach(t=>setTimeout(()=>injectJury(id),t));};
const oldExplorer=window.explorerCard;
if(typeof oldExplorer==='function')window.explorerCard=function(s){const r=oldExplorer.apply(this,arguments);return r};
document.querySelectorAll('.version').forEach(el=>el.textContent=VERSION);
const style=document.createElement('style');style.textContent='.v311FilmLink{display:inline-flex!important;align-items:center;margin:8px 0 2px;padding:8px 12px;border:1px solid rgba(201,162,39,.8);border-radius:999px;background:rgba(201,162,39,.12);color:inherit;font:inherit;font-size:13px;font-weight:700;cursor:pointer;white-space:nowrap}';document.head.appendChild(style);
})();