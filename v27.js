/* Deauville 2026 · V2.2.25 — jury event ↔ séance exacte */
(function(){
  'use strict';
  function titleOf(o){return String(o&&o.title||'')}
  function normFilm(s){return normTitle(canonicalTitle(titleOf(s)))}
  function jurySessions(){return [...(Array.isArray(DATA?.jury)?DATA.jury:[]),...(Array.isArray(DATA?.juryExtra)?DATA.juryExtra:[])]}
  function exactFilm(a,b){const aa=normFilm(a),bb=normFilm(b);return !!aa&&!!bb&&aa===bb}
  function exactJury(s){
    if(!s)return null;
    return jurySessions().find(j=>exactFilm(j,s)&&String(j.date)===String(s.date)&&String(j.start)===String(s.start))||null;
  }
  function linkedFilmId(event){return event&&event.sessionId?event.sessionId:(event&&event.filmId?event.filmId:null)}
  function eventContainsFilm(event,s){
    const target=normFilm(s);if(!target||!event)return false;
    const sid=linkedFilmId(event);
    if(sid&&Array.isArray(DATA?.sessions)){
      const linked=DATA.sessions.find(x=>String(x.id)===String(sid));
      if(linked&&exactFilm(linked,s))return true;
    }
    for(const key of ['film','filmTitle','movie','movieTitle','work','workTitle']){
      const v=event[key];
      if(typeof v==='string'&&normTitle(canonicalTitle(v))===target)return true;
      if(v&&typeof v==='object'&&exactFilm(v,s))return true;
    }
    const raw=titleOf(event).trim();if(!raw)return false;
    if(normTitle(canonicalTitle(raw))===target)return true;
    const escaped=String(titleOf(s)).replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
    const re=new RegExp('(?:^|\\s)(?:[+—–·•:|/]\\s*)'+escaped+'(?:\\s|$)','i');
    const reEnd=new RegExp('(?:^|\\s)'+escaped+'(?:\\s*[+—–·•:|/]|\\s*$)','i');
    return re.test(raw)||reEnd.test(raw);
  }
  function plannedEventForFilm(s){
    if(!s||!Array.isArray(plan))return null;
    return plan.find(p=>String(p.sessionId)===String(s.id)||eventContainsFilm(p,s))||null;
  }
  function plannedJuryEventForFilm(s){
    if(!s)return null;
    return jurySessions().find(j=>String(j.date)===String(s.date)&&String(j.start)===String(s.start)&&eventContainsFilm(j,s))||null;
  }
  function personalEventForFilm(s){return plannedEventForFilm(s)||plannedJuryEventForFilm(s)||null}
  const oldConflict=window.conflictItems;
  if(typeof oldConflict==='function')window.conflictItems=function(s){
    const j=plannedJuryEventForFilm(s),p=plannedEventForFilm(s),exact=exactJury(s);
    return oldConflict(s).filter(x=>{
      if(j&&String(x.id)===String(j.id))return false;
      if(p&&String(x.id)===String(p.id))return false;
      if(exact&&(x.source==='jury'||x.source==='juryExtra')&&String(x.id)===String(exact.id))return false;
      return true;
    });
  };
  window.conflict=function(s){return typeof window.conflictItems==='function'&&window.conflictItems(s).length>0};
  function statusFor(s){
    const j=exactJury(s),plannedJury=plannedJuryEventForFilm(s),personal=plannedEventForFilm(s),c=window.conflictItems(s);
    if(j||plannedJury)return 'JURY · OBLIGATOIRE · DANS MON PLANNING';
    if(personal)return 'DANS MON PLANNING';
    if(c.length)return 'NON COMPATIBLE';
    return 'COMPATIBLE';
  }
  window.sessionStatusHtml=function(s){const status=statusFor(s);return '<div class="wishStatus '+(status==='NON COMPATIBLE'?'bad':'planned')+'">'+(status==='NON COMPATIBLE'?'⚠️ ':'✓ ')+status+'</div>'};
  window.compatibilityLabel=function(s){const status=statusFor(s);return '<span class="status '+(status==='NON COMPATIBLE'?'bad':'planned')+'">'+(status==='NON COMPATIBLE'?'⚠️ ':'✓ ')+status+'</span>'};
  window.explorerCard=function(s){
    const status=statusFor(s),star=starsFor(s);
    const badge=status==='JURY · OBLIGATOIRE · DANS MON PLANNING'?'<span class="badge gold">'+status+'</span>':status==='DANS MON PLANNING'?'<span class="badge green">'+status+'</span>':status==='NON COMPATIBLE'?'<span class="badge red">'+status+'</span>':'<span class="badge">'+status+'</span>';
    return `<button class="exploreCard" data-session="${s.id}"><div class="ecTime">${s.start}</div><div class="ecBody"><div class="ecTitle">${esc(s.title)}</div><div class="ecMeta">${esc(s.place)} · ${esc(catLabel(s.category))}</div><div class="ecBadges">${badge}${star?'<span class="badge star">⭐ SÉANCE ÉTOILE</span>':''}</div></div><div class="ecArrow">›</div></button>`;
  };
})();
