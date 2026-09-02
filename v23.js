/* Deauville 2026 · V2.2.20 — suppression de « Envies » */
/* V2.2.20 test deployment */
(function(){
  'use strict';

  function removeWishUI(){
    const selectors = [
      '.wishFilm','.wishIntro','.wishEmpty','.wishHeart','.wishRemove','.wishSession',
      '[data-view="wishes"]','.navWishes','.tabWishes'
    ];
    document.querySelectorAll(selectors.join(',')).forEach(el=>el.remove());

    document.querySelectorAll('button,a,[role="button"]').forEach(el=>{
      const text = ((el.textContent||'')+' '+(el.getAttribute('aria-label')||'')+' '+(el.getAttribute('title')||'')+' '+(el.getAttribute('onclick')||'')).toLowerCase();
      if(/envies|mes envies|togglewish|openwishes|wishlist/.test(text)){
        const target = el.closest('button,a,[role="button"]') || el;
        if(target && target.parentNode) target.remove();
      }
    });
  }

  function disableWishFunctions(){
    window.toggleWish = function(){};
    window.openWishes = function(){
      if(typeof window.closeModal === 'function') window.closeModal();
      if(typeof window.render === 'function') window.render();
    };
    window.wishesView = function(){ return ''; };
  }

  disableWishFunctions();

  let running = false;
  const observer = new MutationObserver(function(){
    if(running) return;
    running = true;
    observer.disconnect();
    try { removeWishUI(); } finally {
      running = false;
      if(document.body) observer.observe(document.body,{childList:true,subtree:true});
    }
  });

  function start(){
    removeWishUI();
    if(document.body) observer.observe(document.body,{childList:true,subtree:true});
  }

  if(document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded',start,{once:true});
  } else {
    start();
  }
})();
