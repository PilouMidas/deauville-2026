/* Deauville 2026 · V3.0.22 — purge locale de test */
(function(){
'use strict';
const VERSION='V3.0.22',works=window.DEAUVILLE_DATA&&window.DEAUVILLE_DATA.works;
if(!Array.isArray(works))return;
const purgeKeys=['deauville2026-personal-planning-v110','deauville2026-personal-planning-v100','deauville2026-personal-planning-v080','deauville2026-personal-planning-v070','deauville2026-personal-planning-v060','deauville2026-personal-planning-v020','deauville2026-personal-planning-v030','deauville2026-personal-planning-v040','deauville2026-personal-planning-v050','deauville2026-wishlist-v200','deauville2026-session-notes-v301'];
function purge(){purgeKeys.forEach(k=>{try{localStorage.removeItem(k)}catch{}});try{if(Array.isArray(window.plan))window.plan=[]}catch{}try{if(typeof wishes!=='undefined')wishes=[]}catch{}alert('Données de test Deauville supprimées.');location.reload()}
function install(){if(document.getElementById('v322Purge'))return;const b=document.createElement('button');b.id='v322Purge';b.type='button';b.textContent='🧹 PURGER LES DONNÉES DE TEST';b.onclick=()=>{if(confirm('Supprimer le planning, les notes et les envies locales de test sur cet appareil ?'))purge()};b.style.cssText='position:fixed;z-index:99999;bottom:18px;left:50%;transform:translateX(-50%);padding:12px 16px;border-radius:999px;border:1px solid #c9a227;background:#191815;color:#fff;font:700 13px system-ui;box-shadow:0 4px 20px rgba(0,0,0,.35)';document.body.appendChild(b)}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install);else install();
document.querySelectorAll('.version').forEach(el=>el.textContent=VERSION);
})();
