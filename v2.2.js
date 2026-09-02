/* Deauville 2026 — V2.2 UX patch */
(function(){
  const VERSION='2.2.0';
  function patch(){
    document.querySelectorAll('.version').forEach(el=>{el.textContent='v'+VERSION});
    const input=document.getElementById('search');
    if(input && !input.parentElement.querySelector('.searchClear')){
      const wrap=input.parentElement;
      const btn=document.createElement('button');
      btn.type='button';
      btn.className='searchClear';
      btn.setAttribute('aria-label','Effacer la recherche');
      btn.textContent='×';
      btn.onclick=function(e){
        e.preventDefault();
        e.stopPropagation();
        input.value='';
        input.dispatchEvent(new Event('input',{bubbles:true}));
      };
      wrap.appendChild(btn);
    }
    if(input){
      const btn=input.parentElement.querySelector('.searchClear');
      if(btn)btn.style.display=input.value?'flex':'none';
    }
  }
  const observer=new MutationObserver(patch);
  observer.observe(document.documentElement,{childList:true,subtree:true});
  patch();
})();
