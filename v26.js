/* Deauville 2026 · V2.2.24 — invitations/events + visible version */
(function(){
  'use strict';
  const VERSION_LABEL='V2.2.24';
  function titleOf(o){return String(o&&o.title||'')}
  function normFilm(s){return normTitle(canonicalTitle(titleOf(s)))}
  function jurySessions(){return [...(Array.isArray(DATA?.jury)?DATA.jury:[]),...(Array.isArray(DATA?.juryExtra)?DATA.juryExtra:[])]}
  function exactFilm(a,b){const aa=normFilm(a),bb=normFilm(b);return !!aa&&!!bb&&aa===bb}
  function exactJury(s){if(!s)return null;return jurySessions().find(j=>exactFilm(j,s)&&String(j.date)===String(s.date)&&String(j.start)===String(s.start))||null}
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
    const parts=raw.split(/\s*(?:—|–|·|•|:|\||\/)\s*/).map(x=>normTitle(canonicalTitle(x))).filter(Boolean);
    return parts.some(p=>p===target);
  }
  function plannedEventForFilm(s){
    if(!s||!Array.isArray(plan))return null;
    return plan.find(p=>String(p.sessionId)===String(s.id)||eventContainsFilm(p,s))||null;
  }
  function plannedJuryEventForFilm(s){
    if(!s)return null;
    return jurySessions().find(j=>String(j.date)===String(s.date)&&eventContainsFilm(j,s))||null;
  }
  function personalEventForFilm(s){return plannedEventForFilm(s)||plannedJuryEventForFilm(s)||null}
  const oldConflict=window.conflictItems;
  if(typeof oldConflict==='function')window.conflictItems=function(s){
    const j=exactJury(s),p=personalEventForFilm(s);
    return oldConflict(s).filter(x=>{
      if(j&&(x.source==='jury'||x.source==='juryExtra')&&String(x.id)===String(j.id))return false;
      if(p&&String(x.id)===String(p.id))return false;
      return true;
    });
  };
  window.conflict=function(s){return typeof window.conflictItems==='function'&&window.conflictItems(s).length>0};
  function statusFor(s){
    const j=exactJury(s),p=personalEventForFilm(s),c=window.conflictItems(s);
    if(j)return 'JURY · OBLIGATOIRE · DANS MON PLANNING';
    if(p)return 'DANS MON PLANNING';
    if(c.length)return 'NON COMPATIBLE';
    return 'COMPATIBLE';
  }
  window.sessionStatusHtml=function(s){const status=statusFor(s);if(status==='NON COMPATIBLE')return '<div class="wishStatus bad">⚠️ '+status+'</div>';return '<div class="wishStatus planned">✓ '+status+'</div>'};
  window.compatibilityLabel=function(s){const status=statusFor(s);return '<span class="status '+(status==='NON COMPATIBLE'?'bad':'planned')+'">'+(status==='NON COMPATIBLE'?'⚠️ ':'✓ ')+status+'</span>'};
  window.explorerCard=function(s){
    const status=statusFor(s),star=starsFor(s);
    const juryRequired=status==='JURY · OBLIGATOIRE · DANS MON PLANNING';
    const badge=juryRequired?'<span class="badge gold">'+status+'</span>':status==='DANS MON PLANNING'?'<span class="badge green">'+status+'</span>':status==='NON COMPATIBLE'?'<span class="badge red">'+status+'</span>':'<span class="badge">'+status+'</span>';
    return `<button class="exploreCard${juryRequired?' juryRequired':''}" data-session="${s.id}"><div class="ecTime">${s.start}</div><div class="ecBody"><div class="ecTitle">${esc(s.title)}</div><div class="ecMeta">${esc(s.place)} · ${esc(catLabel(s.category))}</div><div class="ecBadges">${badge}${star?'<span class="badge star">⭐ SÉANCE ÉTOILE</span>':''}</div></div><div class="ecArrow">›</div></button>`;
  };
  const oldOpenFree=window.openFree;
  if(typeof oldOpenFree==='function')window.openFree=function(start,end){
    const sm=Number(start),em=Number(end),date=dates[day],opts=compatible(date,{start:sm,end:em});
    const cards=opts.length?opts.map(o=>{const status=statusFor(o),cls=status==='JURY · OBLIGATOIRE · DANS MON PLANNING'?'jury':status==='DANS MON PLANNING'?'planned':status==='NON COMPATIBLE'?'bad':'good';return `<button class="compat ${cls}" onclick="openSession('${o.id}',false,${sm},${em})"><b>${esc(o.title)}</b><br><span class="freeStatus">${status}</span><br><small>${o.start}–${o.end} · ${esc(o.place)} · ${esc(catLabel(o.category))}</small></button>`}).join(''):'<div class="info">Aucune séance ne tient entièrement dans ce créneau.</div>';
    openModal(`<div class="section">CRÉNEAU LIBRE</div><h2>🟢 ${dateLabel(date)}</h2><div class="freeSlotTime">${hh(sm)} → ${hh(em)}</div><div class="info"><b>${dur(sm,em)} disponibles</b><br>Aucune obligation Jury dans cette plage.</div><div class="section">SÉANCES COMPATIBLES</div>${cards}`);
  };
  function refreshVersion(){
    document.querySelectorAll('.version').forEach(el=>{el.textContent=VERSION_LABEL});
    // Intentionally no global MutationObserver: observing the whole body while rewriting text can create a mutation loop and prevent the app from settling.
  }
  const style=document.createElement('style');style.textContent='.freeStatus{display:block;font-size:9px;font-weight:700;margin-top:3px}.compat.jury{border-left:3px solid #c9a227}.compat.planned{border-left:3px solid var(--green)}.compat.bad{border-left:3px solid #b94a48}.badge.red{background:#f4dddd;color:#8c2f2f}.badge.gold{font-weight:700}.exploreCard.juryRequired{border-left:4px solid #c9a227 !important;box-shadow:inset 4px 0 0 #c9a227 !important}';document.head.appendChild(style);
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',refreshVersion,{once:true});else refreshVersion();
})();
