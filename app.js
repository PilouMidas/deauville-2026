
const JURY=[
{id:"j1",s:"09:30",e:"09:50",title:"Réunion d'accueil du jury",place:"Le Royal — Salon Cannes",cat:"Jury",jury:true},
{id:"j2",s:"10:30",e:"13:01",title:"Queen at Sea",place:"C.I.D",cat:"Compétition",jury:true,dur:"2h31",syn:"Une œuvre présentée en compétition."},
{id:"j3",s:"14:00",e:"16:12",title:"Everybody Digs Bill Evans",place:"C.I.D",cat:"Compétition",jury:true,dur:"2h12",syn:"Documentaire autour du pianiste Bill Evans."},
{id:"j4",s:"17:00",e:"19:00",title:"Pressure + événement Brendan Fraser",place:"C.I.D",cat:"Jury",jury:true},
{id:"j5",s:"19:30",e:"21:30",title:"L'Invitation + événement Sophie Thatcher",place:"C.I.D",cat:"Jury",jury:true},
{id:"j6",s:"22:00",e:null,title:"Dîner d'ouverture",place:"Casino Barrière",cat:"Jury",jury:true}
];

const OPTIONS=[
{id:"o1",slot:["09:50","10:30"],s:"10:00",e:"10:15",title:"Petit-déjeuner de la presse",place:"Le Royal",cat:"Rencontre",dur:"15 min",before:5,after:5},
{id:"o2",slot:["13:01","14:00"],s:"13:10",e:"13:40",title:"Café & rencontre",place:"Les Planches",cat:"Rencontre",dur:"30 min",before:5,after:5},
{id:"o3",slot:["13:01","14:00"],s:"13:15",e:"13:50",title:"Faye",place:"Casino",cat:"Film",dur:"35 min",before:5,after:5},
{id:"o4",slot:["16:12","17:00"],s:"16:20",e:"16:45",title:"Conversation cinéma",place:"C.I.D",cat:"Rencontre",dur:"25 min",before:5,after:5},
{id:"o5",slot:["19:00","19:30"],s:"19:05",e:"19:15",title:"Dégustation partenaire",place:"Les Planches",cat:"Événement",dur:"10 min",before:2,after:3},
{id:"o6",slot:["21:30","22:00"],s:"21:35",e:"21:45",title:"Cocktail du soir",place:"Casino",cat:"Événement",dur:"10 min",before:3,after:2}
];

const dates=Array.from({length:10},(_,i)=>new Date(2026,8,4+i));
let day=defaultDay(),wishes=load("wishes",[]),planned=load("planned",[]),seen=load("seen",[]),notes=load("notes",{});

function load(k,f){try{return JSON.parse(localStorage.getItem("deauville-"+k))??f}catch{return f}}
function save(k,v){localStorage.setItem("deauville-"+k,JSON.stringify(v))}
function tmin(s){let [h,m]=s.split(":").map(Number);return h*60+m}
function fmt(n){return n>=60?`${Math.floor(n/60)}h${n%60?String(n%60).padStart(2,"0"):""}`:`${n} min`}
function dateLabel(d){return d.toLocaleDateString("fr-FR",{weekday:"long",day:"numeric",month:"long"}).toUpperCase()}
function defaultDay(){const now=new Date();const y=now.getFullYear(),m=now.getMonth(),d=now.getDate();if(y<2026|| (y===2026&&m===8&&d<4))return 0;if(y===2026&&m===8&&d<=13)return d-4;return 9}

function personal(){return planned.filter(x=>x.day===day)}
function conflicts(o){return JURY.some(j=>tmin(o.s)<(j.e?tmin(j.e):1440)&&tmin(o.e)>tmin(j.s))||planned.some(p=>p.day===day&&tmin(o.s)<(p.e?tmin(p.e):1440)&&tmin(o.e)>tmin(p.s))}
function compatible(o){
 if(seen.includes(o.id)||conflicts(o))return false;
 const b=tmin(o.s)-o.before,a=tmin(o.e)+o.after;
 const prev=JURY.filter(x=>x.e&&tmin(x.e)<=tmin(o.s)).sort((x,y)=>tmin(y.e)-tmin(x.e))[0];
 const next=JURY.filter(x=>tmin(x.s)>=tmin(o.e)).sort((x,y)=>tmin(x.s)-tmin(y.s))[0];
 return (!prev||b>=tmin(prev.e))&&(!next||a<=tmin(next.s)-10);
}
function freeWindows(){
 const anchors=[...JURY,...personal()].sort((a,b)=>tmin(a.s)-tmin(b.s));let cur="08:00",out=[];
 anchors.forEach(a=>{if(tmin(a.s)>tmin(cur))out.push({s:cur,e:a.s});cur=a.e||"24:00"});
 if(tmin(cur)<1439)out.push({s:cur,e:"23:59"});
 return out.filter(w=>tmin(w.e)-tmin(w.s)>=10)
}
function opts(w){return OPTIONS.filter(o=>o.slot[0]===w.s&&o.slot[1]===w.e&&compatible(o))}
function rows(){const a=[...JURY,...personal()].sort((x,y)=>tmin(x.s)-tmin(y.s));let out=[],cur="08:00";a.forEach(x=>{if(tmin(x.s)>tmin(cur))out.push({type:"free",s:cur,e:x.s,options:opts({s:cur,e:x.s})});out.push({type:x.jury?"jury":"planned",x});cur=x.e||"24:00"});if(tmin(cur)<1439)out.push({type:"free",s:cur,e:"23:59",options:opts({s:cur,e:"23:59"})});return out}
function isPast(x){if(day!==defaultDay())return false;return x.e?tmin(x.e)<=nowMinutes():tmin(x.s)<nowMinutes()}
function nowMinutes(){const n=new Date();return n.getHours()*60+n.getMinutes()}

function render(){
 const d=dates[day],r=rows(),current=day===defaultDay();
 document.getElementById("app").innerHTML=`<div class="app"><header>
 <div class="brand">DEAUVILLE</div><div class="sub">FESTIVAL DU CINÉMA AMÉRICAIN · 2026</div>
 <div class="datebar"><button class="arrow" onclick="move(-1)">‹</button><div class="date" onclick="pickDate()"><b>${dateLabel(d)}</b><small>4—13 septembre · toucher pour choisir</small></div><button class="arrow" onclick="move(1)">›</button></div>
 </header><main><div class="section">MON PLANNING</div>${r.map((x,i)=>row(x,i,current)).join("")}</main>
 <div class="bottom"><button onclick="showLists()">⭐ Envies · ${wishes.length} &nbsp; · &nbsp; 👀 Vus · ${seen.length}</button></div></div>
 <div class="modal" id="modal" onclick="if(event.target===this)closeM()"><div class="sheet"><button class="close" onclick="closeM()">×</button><div class="handle"></div><div id="sheet"></div></div></div><div class="toast" id="toast"></div>`;
}
function row(r,i,current){
 if(r.type==="free"){
   return `<div class="free" onclick='openFree("${r.s}","${r.e}")'><div class="time">${r.s}–${r.e}</div><div class="content"><div class="title">🟢 ${fmt(tmin(r.e)-tmin(r.s))} libres</div><div class="meta">${r.options.length?r.options.length+" possibilité"+(r.options.length>1?"s":"")+" compatible"+(r.options.length>1?"s":""):"Aucun événement compatible"}<span class="tag green">Libre</span></div></div></div>`;
 }
 const x=r.x;
 return `<div class="event ${isPast(x)?"past":""}" onclick="eventDetail('${x.id}')"><div class="time">${x.s}${x.e?"–"+x.e:""}</div><div class="content"><div class="title">${x.jury?"🔴":(seen.includes(x.id)?"👀":"📅")} ${x.title}</div><div class="meta"><span>${x.place}</span><span>·</span><span class="tag ${x.jury?"red":""}">${x.cat}</span></div></div></div>`;
}
function move(n){day=Math.max(0,Math.min(9,day+n));render()}
function pickDate(){open(`<div class="section">CHOISIR UNE DATE</div><h2>Mon planning</h2><div class="datepick">${dates.map((d,i)=>`<button class="${i===day?"sel":""}" onclick="day=${i};closeM();render()">${dateLabel(d)}</button>`).join("")}</div>`)}
function eventDetail(id){
 const x=[...JURY,...planned].find(e=>e.id===id);if(!x)return;
 open(`<div class="section">${x.jury?"🔴 JURY · OBLIGATOIRE":"📅 PLANIFIÉ"}</div><h2>${x.title}</h2><div class="info">📅 ${dateLabel(dates[day])}<br>🕘 ${x.s}${x.e?"–"+x.e:""}<br>📍 ${x.place}${x.dur?"<br>⏱ "+x.dur:""}</div>${x.syn?`<p>${x.syn}</p>`:""}${x.jury?'<button class="btn" onclick="toast(\'🔒 Le planning Jury est verrouillé\')">🔒 Planning Jury verrouillé</button>':'<button class="btn" onclick="removePlan(\''+x.id+'\')">Retirer de mon planning</button>'}<button class="btn" onclick="toast(\'🗺️ Itinéraire — bientôt disponible\')">🗺️ Itinéraire</button>`);
}
function openFree(s,e){
 const os=opts({s,e});
 open(`<div class="section">CRÉNEAU LIBRE</div><h2>🟢 ${s} → ${e}</h2><p><b>${fmt(tmin(e)-tmin(s))} disponibles</b></p><div class="section">SÉANCES COMPATIBLES</div>${os.length?os.map(o=>`<div class="compat" onclick="film('${o.id}')">🎬 <b>${o.title}</b><br><small>${o.s}–${o.e} · ${o.place} · ${o.dur}</small></div>`).join(""):'<div class="info">Aucun événement compatible pour cette fenêtre.</div>'}<button class="btn" onclick="toast(\'Les séances incompatibles restent masquées par défaut\')">Voir les séances incompatibles</button>`);
}
function film(id){
 const o=OPTIONS.find(x=>x.id===id);if(!o)return;
 open(`<div class="section">${o.cat.toUpperCase()} · SÉANCE COMPATIBLE</div><h2>${o.title}</h2><div class="info">📅 ${dateLabel(dates[day])}<br>🕘 ${o.s}–${o.e} · ${o.dur}<br>📍 ${o.place}<br>🚶 Trajets estimés : ${o.before} min avant · ${o.after} min après<br>✓ Marge de 10 min avant l'événement suivant prise en compte</div><p>Événement fictif de démonstration. Il est proposé uniquement parce qu'il tient entièrement dans le créneau.</p><button class="btn" onclick="wish('${o.id}')">⭐ Ajouter aux envies</button><button class="btn primary" onclick="plan('${o.id}')">📅 Ajouter à mon planning</button><button class="btn" onclick="view('${o.id}')">👀 Marquer comme vu</button><button class="btn" onclick="note('${o.id}')">📝 Ajouter une note</button><button class="btn" onclick="toast('🗺️ Itinéraire — bientôt disponible')">🗺️ Itinéraire</button>`);
}
function wish(id){if(!wishes.includes(id))wishes.push(id);save("wishes",wishes);toast("⭐ Ajouté aux envies")}
function plan(id){const o=OPTIONS.find(x=>x.id===id);if(!o)return;if(!compatible(o)){toast("⚠️ Ce choix entre en conflit avec le Jury");return}if(!planned.some(x=>x.id===id))planned.push({...o,day});save("planned",planned);toast("📅 Ajouté à mon planning");closeM();render()}
function view(id){if(!seen.includes(id))seen.push(id);wishes=wishes.filter(x=>x!==id);save("seen",seen);save("wishes",wishes);toast("👀 Marqué comme vu");closeM();render()}
function note(id){open(`<div class="section">NOTE PERSONNELLE</div><h2>📝 ${OPTIONS.find(x=>x.id===id)?.title||"Événement"}</h2><textarea class="note" id="note">${notes[id]||""}</textarea><button class="btn primary" onclick="saveNote('${id}')">Enregistrer la note</button>`)}
function saveNote(id){notes[id]=document.getElementById("note").value;save("notes",notes);toast("📝 Note enregistrée");closeM()}
function removePlan(id){planned=planned.filter(x=>x.id!==id);save("planned",planned);toast("Événement retiré");closeM();render()}
function showLists(){open(`<div class="section">PERSONNEL</div><h2>Mes envies & films vus</h2><div class="info">⭐ <b>Mes envies</b><br>${wishes.length?wishes.map(id=>OPTIONS.find(o=>o.id===id)?.title||id).join("<br>"):"Aucune envie pour le moment."}<br><br>👀 <b>Films vus</b><br>${seen.length?seen.map(id=>OPTIONS.find(o=>o.id===id)?.title||id).join("<br>"):"Aucun film marqué comme vu."}</div>`)}
function open(h){document.getElementById("modal").style.display="flex";document.getElementById("sheet").innerHTML=h}
function closeM(){document.getElementById("modal").style.display="none"}
function toast(t){const x=document.getElementById("toast");x.textContent=t;x.style.display="block";clearTimeout(window.__toast);window.__toast=setTimeout(()=>x.style.display="none",1800)}
if("serviceWorker" in navigator)window.addEventListener("load",()=>navigator.serviceWorker.register("sw.js").catch(()=>{}));
render();
