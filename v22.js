/* Deauville 2026 · V2.2.4 UX layer */
(function(){
  function installClear(){
    const wrap=document.querySelector('.searchWrap'),input=document.getElementById('search');
    if(!wrap||!input)return;
    let clear=wrap.querySelector('.searchClear');
    if(!clear){
      clear=document.createElement('button');clear.type='button';clear.className='searchClear';clear.setAttribute('aria-label','Effacer la recherche');clear.textContent='×';
      clear.addEventListener('click',function(e){e.preventDefault();e.stopPropagation();input.value='';input.dispatchEvent(new Event('input',{bubbles:true}));});
      wrap.appendChild(clear);
    }
    clear.style.display=input.value?'flex':'none';
  }
  function sameFilm(a,b){if(!a||!b)return false;const aa=normTitle(canonicalTitle(a.title)),bb=normTitle(canonicalTitle(b.title));return aa===bb||aa.includes(bb)||bb.includes(aa)}
  function juryFilmSessions(s){return DATA&&Array.isArray(DATA.jury)?DATA.jury.filter(j=>sameFilm(j,s)):[]}
  function exactJurySession(s){return juryFilmSessions(s).find(j=>j.date===s.date&&j.start===s.start&&j.end===s.end&&(!j.place||!s.place||normTitle(j.place)===normTitle(s.place)))||null}
  function alreadyPlanned(s){return plan.some(p=>p.sessionId===s.id)||!!exactJurySession(s)}
  function existingJuryInfo(s){const j=juryFilmSessions(s)[0];return j?`<div class="existingPlan">Séance Jury prévue le ${dateLabel(j.date)} à ${j.start}${j.place?' · '+esc(j.place):''}</div>`:''}

  const originalConflict=window.conflict,originalConflictItems=window.conflictItems;
  if(typeof originalConflict==='function'&&typeof originalConflictItems==='function'){
    window.conflictItems=function(s){
      const exact=exactJurySession(s);
      return originalConflictItems(s).filter(x=>!(exact&&(x.source==='jury'||x.source==='juryExtra')&&sameFilm(x,s)));
    };
    window.conflict=function(s){return window.conflictItems(s).length>0;};
  }

  const originalCompatibilityLabel=window.compatibilityLabel;
  if(typeof originalCompatibilityLabel==='function'){
    window.compatibilityLabel=function(s){if(exactJurySession(s))return '<span class="status planned">✓ PLANIFIÉ</span>';return originalCompatibilityLabel(s);};
  }
  const originalSessionStatusHtml=window.sessionStatusHtml;
  if(typeof originalSessionStatusHtml==='function'){
    window.sessionStatusHtml=function(s){
      if(exactJurySession(s))return '<div class="wishStatus planned">✓ PLANIFIÉ</div>';
      const conflicts=window.conflictItems(s),personal=plan.some(p=>p.sessionId===s.id);
      if(conflicts.length){const jury=conflicts.some(x=>x.source==='jury'||x.source==='juryExtra');return `<div class="wishStatus bad">⚠️ NON COMPATIBLE${jury?' · CONFLIT JURY':''}</div>`;}
      if(personal)return '<div class="wishStatus planned">✓ PLANIFIÉ</div>';
      return '<div class="wishStatus good">✓ COMPATIBLE</div>';
    };
  }
  const originalOpenSession=window.openSession;
  if(typeof originalOpenSession==='function')window.openSession=function(id){const s=DATA&&DATA.sessions.find(x=>x.id===id),exact=s&&exactJurySession(s);if(exact){openModal(`<div class="section">JURY · DÉJÀ AU PLANNING</div><h2>${esc(s.title)}</h2><div class="info">📅 ${dateLabel(s.date)}<br>🕘 ${s.start}–${s.end}<br>📍 ${esc(s.place)}</div><div class="notice jury">✓ SÉANCE DÉJÀ AU PLANNING</div><p>Cette séance fait partie de tes obligations Jury et est déjà inscrite dans ton planning.</p>`);return;}return originalOpenSession.apply(this,arguments);};
  const originalAddSession=window.addSession;
  if(typeof originalAddSession==='function')window.addSession=function(id,force=false){const s=DATA&&DATA.sessions.find(x=>x.id===id);if(s&&exactJurySession(s)){toast('Cette séance est déjà au planning');return;}return originalAddSession.apply(this,arguments);};

  /* Le badge JURY identifie uniquement la séance du PDF Jury, jamais toutes les séances du même film. */
  const originalExplorerCard=window.explorerCard;
  if(typeof originalExplorerCard==='function')window.explorerCard=function(s){
    if(exactJurySession(s))return originalExplorerCard.apply(this,arguments);
    const html=originalExplorerCard.apply(this,arguments);
    return html.replace('<span class="badge gold">JURY · DÉJÀ AU PLANNING</span>','');
  };

  function enhance(){installClear();const version=document.querySelector('.version');if(version)version.textContent='V2.2.4';}
  const originalRender=window.render;
  if(typeof originalRender==='function')window.render=function(){const result=originalRender.apply(this,arguments);enhance();return result;};
  const style=document.createElement('style');style.textContent=`.searchWrap{position:relative}.searchWrap input{padding-right:42px}.searchClear{position:absolute;right:8px;top:50%;transform:translateY(-50%);width:30px;height:30px;border:0;border-radius:50%;background:#eee9df;color:#191815;font-size:24px;line-height:1;align-items:center;justify-content:center;cursor:pointer;opacity:.8;padding:0;-webkit-tap-highlight-color:transparent}.searchClear:hover{opacity:1}.existingPlan{margin-top:4px;font-size:11px;line-height:1.25;opacity:.78}`;document.head.appendChild(style);
  if(document.readyState!=='loading')enhance();else document.addEventListener('DOMContentLoaded',enhance);
})();
