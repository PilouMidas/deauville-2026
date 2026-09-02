/* Deauville 2026 · V2.2.1 UX layer */
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

  const originalConflict=window.conflict;
  const originalConflictItems=window.conflictItems;
  if(typeof originalConflict==='function' && typeof originalConflictItems==='function'){
    window.conflictItems=function(s){
      const items=originalConflictItems(s);
      if(typeof window.juryFilmAlreadyPlanned==='function' && window.juryFilmAlreadyPlanned(s)){
        return items.filter(x=>x.source!=='jury'&&x.source!=='juryExtra');
      }
      return items;
    };
    window.conflict=function(s){
      if(typeof window.juryFilmAlreadyPlanned==='function' && window.juryFilmAlreadyPlanned(s)){
        return window.conflictItems(s).length>0;
      }
      return originalConflict(s);
    };
  }

  const originalCompatibilityLabel=window.compatibilityLabel;
  if(typeof originalCompatibilityLabel==='function'){
    window.compatibilityLabel=function(s){
      if(typeof window.juryFilmAlreadyPlanned==='function' && window.juryFilmAlreadyPlanned(s)){
        return '<span class="status good">✓ FILM DÉJÀ PLANIFIÉ</span>';
      }
      return originalCompatibilityLabel(s);
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
    if(version) version.textContent='V2.2.1';
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
  `;
  document.head.appendChild(style);

  if(document.readyState!=='loading') enhance();
  else document.addEventListener('DOMContentLoaded',enhance);
})();
