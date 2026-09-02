/* Deauville 2026 · V2.2 UX layer */
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
        if(window.filters) window.filters.search='';
        input.value='';
        if(typeof window.render==='function') window.render();
      });
      wrap.appendChild(clear);
    }
    clear.style.display=input.value?'flex':'none';
  }

  function enhance(){
    installClear();
    const version=document.querySelector('.version');
    if(version) version.textContent='V2.2.0';
    document.querySelectorAll('.sheet .btn.primary').forEach(function(b){
      const t=b.textContent.trim();
      if(t==='Ajouter à mon planning') b.textContent='Ajouter cette séance à mon planning';
      if(t==='Ajouter quand même à mon planning') b.textContent='Ajouter cette séance quand même à mon planning';
    });
  }

  /* Hook render itself so the patch survives the app's normal re-renders.
     No MutationObserver: this avoids the V2.2 regression that caused a blank page. */
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
