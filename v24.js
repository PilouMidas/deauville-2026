/* Deauville 2026 · V2.2.22 — planning statuses + film/event matching */
(function(){
  'use strict';
  function titleOf(o){return String(o&&o.title||'')}
  function exactFilm(a,b){
    if(!a||!b)return false;
    const aa=normTitle(canonicalTitle(titleOf(a))),bb=normTitle(canonicalTitle(titleOf(b)));
    return !!aa&&!!bb&&aa===bb;
  }
  function exactJury(s){
    if(!s||!DATA)return null;
    return [...(Array.isArray(DATA.jury)?DATA.jury:[]),...(Array.isArray(DATA.juryExtra)?DATA.juryExtra:[])]
      .find(j=>exactFilm(j,s)&&String(j.date)===String(s.date)&&String(j.start)===String(s.start))||null;
  }
  function personalEventForFilm(s){
    if(!s||!Array.isArray(plan))return null;
    const direct=plan.find(p=>p.sessionId===s.id);
    if(direct)return direct;
    const target=normTitle(canonicalTitle(titleOf(s)));
    return plan.find(p=>{
      const raw=titleOf(p).trim();
      const parts=raw.split(/\s+[—–-]\s+/);
      return parts.length>1&&normTitle(canonicalTitle(parts[parts.length-1]))===target;
    })||null;
  }
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
  window.sessionStatusHtml=function(s){
    const j=exactJury(s),p=personalEventForFilm(s),c=window.conflictItems(s);
    if(j)return `<div class="wishStatus planned">📅 JURY · OBLIGATOIRE · DANS MON PLANNING</div>`;
    if(p)return `<div class="wishStatus planned">✓ DANS MON PLANNING</div>`;
    if(c.length)return `<div class="wishStatus bad">⚠️ NON COMPATIBLE</div>`;
    return `<div class="wishStatus good">✓ COMPATIBLE</div>`;
  };
  window.compatibilityLabel=function(s){
    const j=exactJury(s),p=personalEventForFilm(s),c=window.conflictItems(s);
    if(j)return '<span class="status planned">✓ JURY · OBLIGATOIRE · DANS MON PLANNING</span>';
    if(p)return '<span class="status planned">✓ DANS MON PLANNING</span>';
    if(c.length)return '<span class="status bad">⚠️ NON COMPATIBLE</span>';
    return '<span class="status good">✓ COMPATIBLE</span>';
  };
  window.explorerCard=function(s){
    const j=exactJury(s),p=personalEventForFilm(s),c=window.conflictItems(s),star=starsFor(s);
    const status=j?'<span class="badge gold">JURY · OBLIGATOIRE · DANS MON PLANNING</span>':p?'<span class="badge green">DANS MON PLANNING</span>':c.length?'<span class="badge red">NON COMPATIBLE</span>':'<span class="badge">COMPATIBLE</span>';
    return `<button class="exploreCard" data-session="${s.id}"><div class="ecTime">${s.start}</div><div class="ecBody"><div class="ecTitle">${esc(s.title)}</div><div class="ecMeta">${esc(s.place)} · ${esc(catLabel(s.category))}</div><div class="ecBadges">${status}${star?'<span class="badge star">⭐ SÉANCE ÉTOILE</span>':''}</div></div><div class="ecArrow">›</div></button>`;
  };
  const oldOpenFree=window.openFree;
  if(typeof oldOpenFree==='function')window.openFree=function(start,end){
    const sm=Number(start),em=Number(end),date=dates[day],opts=compatible(date,{start:sm,end:em});
    const cards=opts.length?opts.map(o=>{
      const j=exactJury(o),p=personalEventForFilm(o),c=window.conflictItems(o);
      const status=j?'JURY · OBLIGATOIRE · DANS MON PLANNING':p?'DANS MON PLANNING':c.length?'NON COMPATIBLE':'COMPATIBLE';
      const cls=j?'jury':p?'planned':c.length?'bad':'good';
      return `<button class="compat ${cls}" onclick="openSession('${o.id}',false,${sm},${em})"><b>${esc(o.title)}</b><br><span class="freeStatus">${status}</span><br><small>${o.start}–${o.end} · ${esc(o.place)} · ${esc(catLabel(o.category))}</small></button>`;
    }).join(''):'<div class="info">Aucune séance ne tient entièrement dans ce créneau.</div>';
    openModal(`<div class="section">CRÉNEAU LIBRE</div><h2>🟢 ${dateLabel(date)}</h2><div class="freeSlotTime">${hh(sm)} → ${hh(em)}</div><div class="info"><b>${dur(sm,em)} disponibles</b><br>Aucune obligation Jury dans cette plage.</div><div class="section">SÉANCES COMPATIBLES</div>${cards}`);
  };
  const style=document.createElement('style');
  style.textContent='.freeStatus{display:block;font-size:9px;font-weight:700;margin-top:3px}.compat.jury{border-left:3px solid #c9a227}.compat.planned{border-left:3px solid var(--green)}.compat.bad{border-left:3px solid #b94a48}.badge.red{background:#f4dddd;color:#8c2f2f}.badge.gold{font-weight:700}';
  document.head.appendChild(style);
})();
