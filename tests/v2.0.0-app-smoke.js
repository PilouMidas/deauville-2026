const fs=require('fs'),vm=require('vm'),assert=require('assert');
const data=JSON.parse(fs.readFileSync(__dirname+'/../data.json','utf8'));
const els={};
function makeEl(id){return els[id] ||= {id,innerHTML:'',hidden:false,style:{display:''},value:'',addEventListener(){},querySelectorAll(){return[]}}}
const document={
  _app:{_html:'',set innerHTML(v){this._html=v; const ids=[...v.matchAll(/id="([^"]+)"/g)].map(m=>m[1]); ids.forEach(makeEl)},get innerHTML(){return this._html}},
  getElementById(id){return makeEl(id)},
  querySelector(){return {addEventListener(){}}},
  querySelectorAll(){return []}
};
document._app.id='app'; els.app=document._app;
const storage={};
const localStorage={getItem:k=>storage[k]??null,setItem:(k,v)=>storage[k]=String(v)};
const context={window:{DEAUVILLE_DATA:data},document,localStorage,navigator:{serviceWorker:{register(){return Promise.resolve()}}},console,setTimeout,clearTimeout,Date};
context.window.localStorage=localStorage; context.window.document=document; context.window.navigator=context.navigator; context.window.setTimeout=setTimeout; context.window.clearTimeout=clearTimeout; context.window.addEventListener=()=>{};
vm.createContext(context); vm.runInContext(fs.readFileSync(__dirname+'/../data.js','utf8'),context); vm.runInContext(fs.readFileSync(__dirname+'/../app.js','utf8'),context);
assert.ok(context.window.app,'app API');
// Work detail + Gremlins identity
context.window.app.openWork('gremlins-doc');
assert.ok(els.sheet.innerHTML.includes('American Nightmare'));
context.window.app.openWork('gremlins-2');
assert.ok(els.sheet.innerHTML.includes('Gremlins 2 : La nouvelle génération'));
assert.ok(!els.sheet.innerHTML.includes('American Nightmare'));
// Add a genuinely compatible session and verify normalized planning schema.
const before=data.sessions.find(s=>s.workId==='her-private-hell'&&s.date==='2026-09-05');
context.window.app.addSession(before);
const planned=JSON.parse(storage['deauville-v2-planned']);
assert.ok(planned.some(x=>x.workId==='her-private-hell'&&x.start==='22:00'&&x.date==='2026-09-05'));
assert.ok(!planned.some(x=>String(x.start).includes('NaN')));
// A Jury-fixed session cannot be added.
const queen=data.sessions.find(s=>s.workId==='queen-at-sea'&&s.date==='2026-09-05');
const count=planned.length; context.window.app.addSession(queen);
assert.strictEqual(JSON.parse(storage['deauville-v2-planned']).length,count);
console.log('V2.0.0 app smoke tests: OK');
