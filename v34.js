/* Deauville 2026 · V3.0.5 — saisie de note depuis la fiche film */
(function(){
  'use strict';
  const KEY='deauville2026-session-notes-v301';
  const oldOpenFilm=window.openFilm;
  if(typeof oldOpenFilm!=='function')return;
  function read(){try{return JSON.parse(localStorage.getItem(KEY)||'{}')}catch{return {}}}
  function save(id,text){const n=read(),v=String(text||'').trim();if(v)n[String(id)]={text:v,timestamp:new Date().toISOString()};else delete n[String(id)];localStorage.setItem(KEY,JSON.stringify(n))}
  function addDirectNote(){
    const sheet=document.getElementById('sheet');if(!sheet||sheet.querySelector('.v305DirectNote'))return;
    const cards=[...sheet.querySelectorAll('[data-v305-session]')];if(!cards.length)return;
    const block=document.createElement('div');block.className='v305DirectNote v3FilmBlock';
    block.innerHTML='<div class="v3FilmLabel">AJOUTER UNE NOTE</div><select class="v305DirectSelect"></select><textarea class="v305DirectArea" placeholder="Note sur cette séance…"></textarea><button class="btn primary v305DirectSave" type="button">Enregistrer</button>';
    const select=block.querySelector('select');
    cards.forEach(card=>{const id=card.dataset.v305Session;const s=window.DATA&&Array.isArray(DATA.sessions)?DATA.sessions.find(x=>String(x.id)===String(id)):null;if(s){const o=document.createElement('option');o.value=id;o.textContent=`${dateLabel(s.date)} · ${s.start} · ${s.place}`;select.appendChild(o)}});
    const area=block.querySelector('textarea');
    function load(){const v=read()[String(select.value)];area.value=typeof v==='string'?v:(v&&v.text)||''}
    select.addEventListener('change',load);load();
    block.querySelector('.v305DirectSave').addEventListener('click',()=>{save(select.value,area.value);oldOpenFilm.apply(window,[...arguments]);window.openFilm(currentWork,currentReturn)});
    sheet.appendChild(block);
  }
  let currentWork=null,currentReturn=null;
  window.openFilm=function(work,returnSessionId=null){currentWork=work;currentReturn=returnSessionId;oldOpenFilm.apply(this,arguments);setTimeout(addDirectNote,0)};
  const oldOpenSession=window.openSession;
  function findWork(title){const works=window.DEAUVILLE_DATA&&window.DEAUVILLE_DATA.works;if(!Array.isArray(works))return null;const n=String(title||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[’']/g,"'").replace(/[^a-z0-9]+/g,' ').trim();return works.find(w=>{const wn=String(w.title||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[’']/g,"'").replace(/[^a-z0-9]+/g,' ').trim();return wn===n||(Array.isArray(w.aliases)&&w.aliases.some(a=>String(a).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[’']/g,"'").replace(/[^a-z0-9]+/g,' ').trim()===n))})||null}
  function addLink(){const sheet=document.getElementById('sheet'),h2=sheet&&sheet.querySelector('h2');if(!sheet||!h2||sheet.querySelector('.v305FilmLink'))return;const s=window.DATA&&Array.isArray(DATA.sessions)?DATA.sessions.find(x=>String(x.title).trim()===String(h2.textContent).trim()):null;if(!s)return;const w=findWork(s.title);if(!w)return;const b=document.createElement('button');b.type='button';b.className='v305FilmLink';b.textContent='Voir la fiche du film';b.onclick=e=>{e.preventDefault();e.stopPropagation();window.openFilm(w,s.id)};h2.insertAdjacentElement('afterend',b)}
  if(typeof oldOpenSession==='function')window.openSession=function(id,...rest){oldOpenSession.apply(this,[id,...rest]);[0,50,150,300,600].forEach(t=>setTimeout(addLink,t))};
  const style=document.createElement('style');style.textContent='.v305DirectNote{display:grid;gap:8px}.v305DirectSelect,.v305DirectArea{width:100%;box-sizing:border-box;border-radius:10px;border:1px solid rgba(255,255,255,.2);background:rgba(255,255,255,.04);color:inherit;padding:10px;font:inherit}.v305DirectArea{min-height:110px;resize:vertical}.v305DirectSave{margin-top:0}.v305FilmSession.isPlanned{border:2px solid rgba(201,162,39,.8)}';document.head.appendChild(style);
  const oldRender=window.render;if(typeof oldRender==='function')window.render=function(...args){const r=oldRender.apply(this,args);document.querySelectorAll('.version').forEach(el=>el.textContent='V3.0.5');return r};
  document.querySelectorAll('.version').forEach(el=>el.textContent='V3.0.5');
})();
