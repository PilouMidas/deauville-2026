const C="deauville-planning-2.2.5";
const A=["./","./index.html","./style.css?v=2.1.0","./app.js?v=2.1.0","./v21.js?v=2.1.0","./v22.js?v=2.2.5","./data.json","./manifest.json?v=2.1.0","./icon.svg"];
self.addEventListener("install",event=>event.waitUntil(caches.open(C).then(cache=>cache.addAll(A)).then(()=>self.skipWaiting())));
self.addEventListener("activate",event=>event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==C).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));
self.addEventListener("fetch",event=>{
  if(event.request.method!=="GET") return;
  event.respondWith(fetch(event.request).then(response=>{
    const copy=response.clone();
    caches.open(C).then(cache=>cache.put(event.request,copy)).catch(()=>{});
    return response;
  }).catch(()=>caches.match(event.request).then(r=>r||caches.match("./index.html"))));
});
