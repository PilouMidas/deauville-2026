/* Deauville 2026 · V2.2.27 — correspondance Jury fiable */
(function(){
  'use strict';
  const STATUS='JURY · OBLIGATOIRE · DANS MON PLANNING';
  function norm(s){return normTitle(canonicalTitle(String(s||'')))}
  function juryItems(){return [...(Array.isArray(DATA?.jury)?DATA.jury:[]),...(Array.isArray(DATA?.juryExtra)?DATA.juryExtra:[])]}
  function splitTitle(t){return String(t||'').split(/\s*(?:\+|·|•|—|–|:|\||\/)\s*/).map(x=>norm(x)).filter(Boolean)}
  function sameSlot(a,b){return a&&b&&String(a.date)===String(b.date)&&String(a.start)===String(b.start)}
  function juryForSession(s){
    const target=norm(s&&s.title);
    if(!target)return null;
    return juryItems().find(j=>sameSlot(j,s)&&splitTitle(j.title).some(part=>part===target))||null;
  }
  function isJurySession(s){return !!juryForSession(s)}
  function statusFor(s){
    if(isJurySession(s))return STATUS;
    if(Array.isArray(plan)&&plan.some(p=>String(p.sessionId)===String(s.id)))return 'DANS MON PLANNING';
    return window.conflictItems(s).length?'NON COMPATIBLE':'COMPATIBLE';
  }
  const oldConflictItems=window.conflictItems;
  if(typeof oldConflictItems==='function'){
    window.conflictItems=function(s){
      const j=juryForSession(s);
      return oldConflictItems(s).filter(x=>!(j&&String(x.id)===String(j.id)));
    };
  }
  window.conflict=function(s){return typeof window.conflictItems==='function'&&window.conflictItems(s).length>0};
  window.sessionStatusHtml=function(s){
    const st=statusFor(s);
    return '<div class="wishStatus '+(st==='NON COMPATIBLE'?'bad':'planned')+'">'+(st==='NON COMPATIBLE'?'⚠️ ':'✓ ')+st+'</div>';
  };
  window.compatibilityLabel=function(s){
    const st=statusFor(s);
    return '<span class="status '+(st==='NON COMPATIBLE'?'bad':'planned')+'">'+(st==='NON COMPATIBLE'?'⚠️ ':'✓ ')+st+'</span>';
  };
  window.explorerCard=function(s){
    const st=statusFor(s),star=starsFor(s);
    const badge=st===STATUS?'<span class="badge gold">'+STATUS+'</span>':st==='DANS MON PLANNING'?'<span class="badge green">'+st+'</span>':st==='NON COMPATIBLE'?'<span class="badge red">'+st+'</span>':'<span class="badge">'+st+'</span>';
    return `<button type="button" class="exploreCard" data-session="${esc(s.id)}" onclick="openSession('${String(s.id).replace(/'/g,"\\'")}')"><div class="ecTime">${s.start}</div><div class="ecBody"><div class="ecTitle">${esc(s.title)}</div><div class="ecMeta">${esc(s.place)} · ${esc(catLabel(s.category))}</div><div class="ecBadges">${badge}${star?'<span class="badge star">⭐ SÉANCE ÉTOILE</span>':''}</div></div><div class="ecArrow">›</div></button>`;
  };
})();
