/* Deauville 2026 · V2.2.19.8 UX layer */
(function(){
  function installClear(){
    const wrap=document.querySelector('.searchWrap');
    const input=document.getElementById('search');
    if(!wrap||!input)return;
    let clear=wrap.querySelector('.searchClear');
    if(!clear){
      clear=document.createElement('button');clear.type='button';clear.className='searchClear';clear.setAttribute('aria-label','Effacer la recherche');clear.textContent='×';
      clear.addEventListener('click',function(e){e.preventDefault();e.stopPropagation();input.value='';input.dispatchEvent(new Event('input',{bubbles:true}));input.focus()});wrap.appendChild(clear);
    }
    clear.style.display=input.value?'flex':'none';
  }
  function removeEnvies(){
    document.querySelectorAll('.wishFilm,.wishIntro,.wishEmpty,.wishHeart,.wishSession,.wishBtn,.wishRemove').forEach(function(el){el.remove()});
    document.querySelectorAll('button,a,[role="button"],.section').forEach(function(el){const t=(el.textContent||'').trim().replace(/\s+/g,' ');if(/^MES ENVIES$|^ENVIES$/i.test(t))el.remove()});
  }
  function enhance(){installClear();removeEnvies();const version=document.querySelector('.version');if(version)version.textContent='V2.2.19.8'}
  const originalRender=window.render;
  if(typeof originalRender==='function')window.render=function(){const result=originalRender.apply(this,arguments);enhance();return result};
  const style=document.createElement('style');style.textContent=`.searchWrap{position:relative}.searchWrap input{padding-right:42px}.searchClear{position:absolute;right:8px;top:50%;transform:translateY(-50%);width:30px;height:30px;border:0;border-radius:50%;background:#eee9df;color:#191815;font-size:24px;line-height:1;align-items:center;justify-content:center;cursor:pointer;opacity:.8;padding:0;-webkit-tap-highlight-color:transparent}.searchClear:hover{opacity:1}`;document.head.appendChild(style);
  if(document.readyState!=='loading')enhance();else document.addEventListener('DOMContentLoaded',enhance);
})();
