/* Deauville 2026 · V2.2.19 free-slot planning detail fix */
(function(){
  function filmTitle(o){return String(o&&o.title||'')}
  function sameFilm(a,b){
    if(!a||!b)return false;
    const aa=normTitle(canonicalTitle(filmTitle(a))),bb=normTitle(canonicalTitle(filmTitle(b)));
    return !!aa&&!!bb&&(aa===bb||aa.includes(bb)||bb.includes(aa));
  }
  function juryForFilm(s){
    if(!s||!DATA)return null;
    const t=normTitle(canonicalTitle(filmTitle(s)));
    return (Array.isArray(DATA.jury)?DATA.jury:[]).find(j=>{
      const jt=normTitle(canonicalTitle(filmTitle(j)));
      return jt===t||jt.includes(t)||t.includes(jt);
    })||null;
  }
  function personalForFilm(s){
    if(!s||!Array.isArray(plan))return null;
    const p=plan.find(x=>x.sessionId===s.id);
    if(p)return p;
    const p2=plan.find(x=>sameFilm(x,s));
    return p2||null;
  }
  function plannedReference(s){
    const j=juryForFilm(s);
    if(j)return {label:'OBLIGATION JURY',date:j.date,start:j.start,place:j.place};
    const p=personalForFilm(s);
    if(p)return {label:'DANS TON PLANNING',date:p.date,start:p.start,place:p.place};
    return null;
  }
  const oldOpenFree=window.openFree;
  if(typeof oldOpenFree!=='function')return;
  window.openFree=function(start,end){
    const sm=Number(start),em=Number(end);
    const date=dates[day];
    const opts=compatible(date,{start:sm,end:em});
    const cards=opts.length?opts.map(o=>{
      const ref=plannedReference(o);
      const status=ref?`<span class="alreadyLabel">✓ DÉJÀ DANS TON PLANNING · ${ref.label}</span><span class="plannedWhen">Séance prévue : ${dateLabel(ref.date)} · ${ref.start} · ${esc(ref.place)}</span>`:'';
      return `<button class="compat ${ref?'already':''}" onclick="openSession('${o.id}',false,${sm},${em})"><b>${esc(o.title)}</b>${status?'<br>'+status:''}<br><small>${o.start}–${o.end} · ${esc(o.place)} · ${esc(catLabel(o.category))}</small></button>`;
    }).join(''):'<div class="info">Aucune séance ne tient entièrement dans ce créneau.</div>';
    openModal(`<div class="section">CRÉNEAU LIBRE</div><h2>🟢 ${hh(sm)} → ${hh(em)}</h2><div class="info"><b>${dur(sm,em)} disponibles</b><br>Aucune obligation Jury dans cette plage.</div><div class="section">SÉANCES COMPATIBLES</div>${cards}`);
  };
  const style=document.createElement('style');
  style.textContent='.plannedWhen{display:block;font-size:9px;color:var(--muted);margin-top:2px;line-height:1.35}.alreadyLabel{display:block;font-size:9px;margin-top:3px}.compat.already{border-left:3px solid var(--green)}';
  document.head.appendChild(style);
})();
