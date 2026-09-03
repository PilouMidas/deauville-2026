/* Deauville 2026 · V2.2.28 — correctif Jury sécurisé */
(function(){
  'use strict';
  const STATUS='JURY · OBLIGATOIRE · DANS MON PLANNING';
  function init(){
    try{
      const norm=s=>typeof window.normTitle==='function'?window.normTitle(String(s||'')):String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();
      const juryItems=()=>[...(Array.isArray(window.DATA?.jury)?window.DATA.jury:[]),...(Array.isArray(window.DATA?.juryExtra)?window.DATA.juryExtra:[])];
      const splitTitle=t=>String(t||'').split(/\s*(?:\+|·|•|—|–|:|\||\/)\s*/).map(norm).filter(Boolean);
      const sameSlot=(a,b)=>a&&b&&String(a.date)===String(b.date)&&String(a.start)===String(b.start);
      const juryForSession=s=>{
        const target=norm(s&&s.title); if(!target)return null;
        return juryItems().find(j=>sameSlot(j,s)&&splitTitle(j.title).some(part=>part===target))||null;
      };
      const oldConflict=window.conflictItems;
      if(typeof oldConflict==='function') window.conflictItems=function(s){
        const j=juryForSession(s);
        return oldConflict(s).filter(x=>!(j&&String(x.id)===String(j.id)));
      };
      const statusFor=s=>{
        if(juryForSession(s))return STATUS;
        if(Array.isArray(window.plan)&&window.plan.some(p=>String(p.sessionId)===String(s.id)))return 'DANS MON PLANNING';
        return typeof window.conflictItems==='function'&&window.conflictItems(s).length?'NON COMPATIBLE':'COMPATIBLE';
      };
      window.conflict=function(s){return typeof window.conflictItems==='function'&&window.conflictItems(s).length>0};
      window.sessionStatusHtml=function(s){const st=statusFor(s);return '<div class="wishStatus '+(st==='NON COMPATIBLE'?'bad':'planned')+'">'+(st==='NON COMPATIBLE'?'⚠️ ':'✓ ')+st+'</div>';};
      window.compatibilityLabel=function(s){const st=statusFor(s);return '<span class="status '+(st==='NON COMPATIBLE'?'bad':'planned')+'">'+(st==='NON COMPATIBLE'?'⚠️ ':'✓ ')+st+'</span>';};
      window.explorerCard=function(s){
        const st=statusFor(s),star=typeof window.starsFor==='function'&&window.starsFor(s);
        const badge=st===STATUS?'<span class="badge gold">'+STATUS+'</span>':st==='DANS MON PLANNING'?'<span class="badge green">'+st+'</span>':st==='NON COMPATIBLE'?'<span class="badge red">'+st+'</span>':'<span class="badge">'+st+'</span>';
        return `<button class="exploreCard" data-session="${s.id}"><div class="ecTime">${s.start}</div><div class="ecBody"><div class="ecTitle">${typeof window.esc==='function'?window.esc(s.title):String(s.title||'')}</div><div class="ecMeta">${typeof window.esc==='function'?window.esc(s.place):String(s.place||'')} · ${typeof window.esc==='function'?window.esc(window.catLabel(s.category)):String(s.category||'')}</div><div class="ecBadges">${badge}${star?'<span class="badge star">⭐ SÉANCE ÉTOILE</span>':''}</div></div><div class="ecArrow">›</div></button>`;
      };
    }catch(e){console.error('V2.2.28 Jury patch',e);}
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else setTimeout(init,0);
})();
