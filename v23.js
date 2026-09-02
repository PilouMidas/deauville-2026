/* Deauville 2026 · V2.2.20 — suppression complète de « Envies » */
(function(){
  const VERSION='V2.2.20';
  function disableWishFunctions(){
    window.toggleWish=function(){};
    window.openWishes=function(){
      if(typeof window.closeModal==='function')window.closeModal();
      if(typeof window.render==='function')window.render();
    };
    window.wishesView=function(){return '';};
  }
  function removeWishUI(){
    const nodes=document.querySelectorAll('button,a,[role="button"],input,[data-action],[onclick],[aria-label],[title]');
    nodes.forEach(el=>{
      const text=((el.textContent||'')+' '+(el.getAttribute('aria-label')||'')+' '+(el.getAttribute('title')||'')+' '+(el.getAttribute('onclick')||'')).toLowerCase();
      if(/envie|togglewish|openwishes|wishlist/.test(text)){
        const target=el.closest('button,a,[role="button"]')||el;
        if(target && target.parentNode) target.remove();
      }
    });
    document.querySelectorAll('.wishFilm,.wishIntro,.wishEmpty,.wishHeart,.wishRemove,.wishSession').forEach(el=>el.remove());
    document.querySelectorAll('.version').forEach(el=>el.textContent=VERSION);
  }
  disableWishFunctions();
  const oldRender=window.render;
  if(typeof oldRender==='function'){
    window.render=function(){const r=oldRender.apply(this,arguments);removeWishUI();return r};
  }
  const observer=new MutationObserver(removeWishUI);
  function start(){
    removeWishUI();
    if(document.body)observer.observe(document.body,{childList:true,subtree:true});
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();
