/* Deauville 2026 · V2.2.2 UX layer */
(function(){
  function installClear(){
    const wrap=document.querySelector('.searchWrap');
    const input=document.getElementById('search');
    if(!wrap||!input) return;
    let clear=wrap.querySelector('.searchClear');
    if(!clear){
      clear=document.createElement('button');
      clear.type='button';
      clear.className='searchClear';
      clear.setAttribute('aria-label','Effacer la recherche');
      clear.textContent='×';
      clear.addEventListener('click',function(e){
        e.preventDefault();
        e.stopPropagation();
        input.value='';
        input.dispatchEvent(new Event('input',{bubbles:true}));
      });
      wrap.appendChild(clear);
    }
    clear.style.display=input.value?'flex':'none';
  }

  function sameFilm(a,b){
    if(!a||!b) return false;
    const aa=normTitle(canonicalTitle(a.title));
    const bb=normTitle(canonicalTitle(b.title));
    return aa===bb||aa.includes(bb)||bb.includes(aa);
  }

  function juryFilmSessions(s){
    if(!DATA||!Array.isArray(DATA.jury)) return [];
    return DATA.jury.filter(j=>sameFilm(j,s));
  }

  function exactJurySession(s){
    return juryFilmSessions(s).find(j=>
      j.date===s.date && j.start===s.start && j.end===s.end &&
      normTitle(j.place)===normTitle(s.place)
    )||null;
  }

  function juryFilmAlreadyPlanned(s){
    return juryFilmSessions(s).length>0;
  }

  function alreadyPlanned(s){
    return plan.some(p=>p.sessionId===s.id)||!!exactJurySession(s);
  }

  function existingJuryInfo(s){
    const j=juryFilmSessions(s)[0];
    if(!j) return '';
    return `<div class="existingPlan">Séance déjà prévue le ${dateLabel(j.date)} à ${j.start} · ${esc(j.place)}</div>`;
  }

  const originalConflict=window.conflict;
  const originalConflictItems=window.conflictItems;
  if(typeof originalConflict==='function' && typeof originalConflictItems==='function'){
    window.conflictItems=function(s){
      const items=originalConflictItems(s);
      /* La séance Jury elle-même n'est pas un conflit : elle est déjà au planning.
         Pour les autres séances du même film, on conserve les vrais conflits avec
         les autres créneaux du planning. */
      return items.filter(x=>{
        if((x.source==='jury'||x.source==='juryExtra') && sameFilm(x,s)) return false;
        return true;
      });
    };
    window.conflict=function(s){
      return window.conflictItems(s).length>0;
    };
  }

  const originalCompatibilityLabel=window.compatibilityLabel;
  if(typeof originalCompatibilityLabel==='function'){
    window.compatibilityLabel=function(s){
      const exact=exactJurySession(s);
      if(exact) return '<span class="status planned">✓ SÉANCE DÉJÀ AU PLANNING</span>';
      const base=originalCompatibilityLabel(s);
      return juryFilmAlreadyPlanned(s)
        ? base.replace('</span>',` · ${existingJuryInfo(s)}</span>`)
        : base;
    };
  }

  const originalSessionStatusHtml=window.sessionStatusHtml;
  if(typeof originalSessionStatusHtml==='function'){
    window.sessionStatusHtml=function(s){
      const exact=exactJurySession(s);
      if(exact) return '<div class="wishStatus planned">✓ SÉANCE DÉJÀ AU PLANNING</div>';
      const conflicts=window.conflictItems(s);
      const personal=plan.some(p=>p.sessionId===s.id);
      if(conflicts.length){
        const jury=conflicts.some(x=>x.source==='jury'||x.source==='juryExtra');
        return `<div class="wishStatus bad">⚠️ NON COMPATIBLE${jury?' · CONFLIT JURY':''}</div>`;
      }
      if(personal) return '<div class="wishStatus planned">✓ SÉANCE PLANIFIÉE</div>';
      if(juryFilmAlreadyPlanned(s)) return `<div class="wishStatus good">✓ COMPATIBLE</div>${existingJuryInfo(s)}`;
      return '<div class="wishStatus good">✓ COMPATIBLE</div>';
    };
  }

  /* Empêche tout ajout manuel d'une séance Jury déjà présente au planning. */
  const originalAddSession=window.addSession;
  if(typeof originalAddSession==='function'){
    window.addSession=function(id,force=false){
      const s=DATA&&DATA.sessions.find(x=>x.id===id);
      if(s&&exactJurySession(s)&&!force){
        toast('Cette séance est déjà au planning');
        return;
      }
      return originalAddSession.apply(this,arguments);
    };
  }

  function refineWishStatuses(){
    document.querySelectorAll('.wishFilm').forEach(function(film){
      film.querySelectorAll('.wishStatus.juryPlan').forEach(function(status){
        status.textContent='✓ FILM DÉJÀ PLANIFIÉ';
      });
    });
  }

  function enhance(){
    installClear();
    const version=document.querySelector('.version');
    if(version) version.textContent='V2.2.2';
    refineWishStatuses();
  }

  const originalRender=window.render;
  if(typeof originalRender==='function'){
    window.render=function(){
      const result=originalRender.apply(this,arguments);
      enhance();
      return result;
    };
  }

  const style=document.createElement('style');
  style.textContent=`
    .searchWrap{position:relative}
    .searchWrap input{padding-right:42px}
    .searchClear{position:absolute;right:8px;top:50%;transform:translateY(-50%);width:30px;height:30px;border:0;border-radius:50%;background:#eee9df;color:#191815;font-size:24px;line-height:1;align-items:center;justify-content:center;cursor:pointer;opacity:.8;padding:0;-webkit-tap-highlight-color:transparent}
    .searchClear:hover{opacity:1}
    .existingPlan{margin-top:4px;font-size:11px;line-height:1.25;opacity:.78}
  `;
  document.head.appendChild(style);

  if(document.readyState!=='loading') enhance();
  else document.addEventListener('DOMContentLoaded',enhance);
})();
