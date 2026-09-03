const C="deauville-planning-2.2.23";
const A=["./","./index.html","./style.css?v=2.1.0","./app.js?v=2.0.0","./data.js?v=3.0.5","./v21.js?v=2.1.0","./v22.js?v=2.2.19","./v22fix.js?v=2.2.19.1","./v23.js?v=2.2.20","./v24.js?v=2.2.22","./v25.js?v=2.2.23","./v26.js?v=2.2.24","./v27.js?v=2.2.25","./v28.js?v=2.2.26","./v29.js?v=2.2.27","./v38.js?v=3.0.15","./v311.js?v=3.0.20","./v40.js?v=3.0.21","./manifest.json?v=3.0.21","./icon.svg"];
self.addEventListener("install",event=>event.waitUntil(caches.open(C).then(cache=>cache.addAll(A)).then(()=>self.skipWaiting())));
self.addEventListener("activate",event=>event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==C).map(k=>caches.delete(k))).then(()=>self.clients.claim()))));
self.addEventListener("fetch",event=>{
  if(event.request.method!=="GET") return;
  event.respondWith(fetch(event.request).then(response=>{
    const copy=response.clone();
    caches.open(C).then(cache=>cache.put(event.request,copy)).catch(()=>{});
    return response;
  }).catch(()=>caches.match(event.request).then(r=>r||caches.match("./index.html"))));
});
