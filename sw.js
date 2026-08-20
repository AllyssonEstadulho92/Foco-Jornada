const CACHE='foco-jornada-v4-2-0-audit-handlers1';
const ASSETS=[
  './','./index.html',
  './styles.css','./ux.css','./features.css','./hub.css','./hub-about.css','./settings-controller.css',
  './shift-planner.css','./shift-mobile.css','./shift-compact.css','./runtime-fixes.css','./interaction-fixes.css',
  './professional.css','./productivity.css','./focus-mode.css','./install-app.css','./stability-ui.css',
  './core.js','./productivity-core.js','./focus-mode-core.js','./focus-mode.js','./persistence.js','./boot-recovery.js','./install-app.js','./app.js','./stability.js','./ux.js',
  './features-core.js','./features.js','./hub.js','./hub-help.js','./hub-about.js','./controls.js','./settings-controller.js',
  './shift-planner-core.js','./shift-planner.js','./shift-advanced-core.js','./shift-advanced.js','./shift-reports.js','./shift-mobile-interactions.js',
  './app-links.js','./interaction-fixes.js','./runtime-fixes.js','./summary-guard.js','./professional-core.js','./professional-ui.js','./couple.js',
  './manifest.webmanifest','./icon.svg','./apple-touch-icon.png','./icon-192.png','./icon-512.png','./.nojekyll'
];
const INDEX_URL=new URL('./index.html',self.location.href).href;
self.addEventListener('install',event=>event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(ASSETS)).then(()=>self.skipWaiting())));
self.addEventListener('activate',event=>event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(key=>key!==CACHE).map(key=>caches.delete(key)))).then(()=>self.clients.claim())));
self.addEventListener('message',event=>{if(event.data?.type==='SKIP_WAITING')self.skipWaiting()});
async function network(request){try{return await fetch(request,{cache:'no-cache'})}catch{return null}}
self.addEventListener('fetch',event=>{
  const request=event.request;if(request.method!=='GET')return;
  const url=new URL(request.url);if(url.origin!==location.origin)return;
  const navigation=request.mode==='navigate';const key=navigation?INDEX_URL:request;
  event.respondWith((async()=>{
    const fresh=await network(request);
    if(fresh?.ok){const cache=await caches.open(CACHE);cache.put(key,fresh.clone());return fresh}
    const cache=await caches.open(CACHE);const cached=await cache.match(key);
    if(cached)return cached;
    if(navigation)return(await cache.match(INDEX_URL))||(await cache.match('./'));
    return new Response('',{status:503,statusText:'Offline'});
  })());
});
