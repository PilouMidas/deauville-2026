/* Deauville 2026 · V2.2.26 — correction Jury finale */
(function(){
  'use strict';
  const STATUS='JURY · OBLIGATOIRE · DANS MON PLANNING';
  function key(s){return normTitle(canonicalTitle(String(s&&s.title||'')))}
  function jury(){return [...(Array.isArray(DATA?.jury)?DATA.jury:[]),...(Array.isArray(DATA?.juryExtra)?DATA.juryExtra:[])]}
  function parts(t){return String(t||'').split(/\s*(?:\+|·|•|—|–|:|\||\/)\s*/).map(x=>normTitle(canonicalTitle(x))).filter(Boolean)}
  function juryFor(s){
    const k=key(s);if(!k)return null;
    return jury().find(j=>String(j.date)===String(s.date)&&String(j.start)===String(s.start)&&parts(j.title).indexOf(k)!==-1)||null;
  }
  function status(s){
    if(juryFor(s))return STATUS;
    if(Array.isArray(plan)&&plan.some(p=>String(p.sessionId)===String(s.id)))return 'DANS MON PLANNING';
    return window.conflictItems(s).length?'NON COMPATIBLE':'COMPATIBLE';
  }
  const oldConflict=window.conflictItems;
  if(typeof oldConflict==='function')window.conflictItems=function(s){
    const j=juryFor(s);
    return oldConflict(s).filter(x=>!(j&&String(x.id)===String(j.id)));
  };
  window.conflict=function(s){return window.conflictItems(s).length>0};
  window.sessionStatusHtml=function(s){const st=status(s);return '<div class="wishStatus '+(st==='NON COMPATIBLE'?'bad':'planned')+'">'+(st==='NON COMPATIBLE'?'⚠️ ':'✓ ')+st+'</div>';};
  window.compatibilityLabel=function(s){const st=status(s);return '<span class="status '+(st==='NON COMPATIBLE'?'bad':'planned')+'">'+(st==='NON COMPATIBLE'?'⚠️ ':'✓ ')+st+'</span>';};
  window.explorerCard=function(s){
    const st=status(s),star=starsFor(s);
    const badge=st===STATUS?'<span class="badge gold">'+STATUS+'</span>':st==='DANS MON PLANNING'?'<span class="badge green">'+st+'</span>':st==='NON COMPATIBLE'?'<span class="badge red">'+st+'</span>':'<span class="badge">'+st+'</span>';
    return `<button class="exploreCard" data-session="${s.id}"><div class="ecTime">${s.start}</div><div class="ecBody"><div class="ecTitle">${esc(s.title)}</div><div class="ecMeta">${esc(s.place)} · ${esc(catLabel(s.category))}</div><div class="ecBadges">${badge}${star?'<span class="badge star">⭐ SÉANCE ÉTOILE</span>':''}</div></div><div class="ecArrow">›</div></button>`;
  };
})();
