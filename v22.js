/* Deauville 2026 · V2.2 UX layer */
(function(){
  function installClear(){
    const wrap=document.querySelector('.searchWrap');
    const input=document.getElementById('search');
    if(!wrap||!input) return;
    if(!wrap.querySelector('.searchClear')){
      const clear=document.createElement('button');
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
      input.addEventListener('input',function(){
        clear.style.display=input.value?'flex':'none';
      });
    }
    const clear=wrap.querySelector('.searchClear');
    clear.style.display=input.value?'flex':'none';
  }

  function enhance(){
    installClear();
    document.querySelectorAll('.sheet .btn.primary').forEach(function(b){
      const t=b.textContent.trim();
      if(t==='Ajouter à mon planning') b.textContent='Ajouter cette séance à mon planning';
      if(t==='Ajouter quand même à mon planning') b.textContent='Ajouter cette séance quand même à mon planning';
    });
  }

  if(document.readyState!=='loading') enhance();
  else document.addEventListener('DOMContentLoaded',enhance);

  /* Event delegation survives Explorer re-renders without observing the DOM. */
  document.addEventListener('click',function(e){
    if(e.target.closest('.searchWrap')) installClear();
  },true);
  document.addEventListener('input',function(e){
    if(e.target && e.target.id==='search') installClear();
  },true);
})();
