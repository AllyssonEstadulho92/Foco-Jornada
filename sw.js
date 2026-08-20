const CACHE='foco-jornada-v4-2-0-brand-splash2';
const CORE_ASSETS=[
  './','./index.html','./bootstrap.js',
  './styles.css','./ux.css','./features.css','./hub.css','./hub-about.css','./settings-controller.css',
  './shift-planner.css','./shift-mobile.css','./shift-compact.css','./runtime-fixes.css','./interaction-fixes.css',
  './professional.css','./productivity.css','./install-app.css','./stability-ui.css',
  './core.js','./productivity-core.js','./focus-entry.js','./persistence.js','./app.js','./stability.js',
  './manifest.webmanifest','./icon.svg','./icon-192.png','./icon-512.png','./apple-touch-icon.png','./.nojekyll'
];
const INDEX_URL=new URL('./index.html',self.location.href).href;

self.addEventListener('install',event=>event.waitUntil(
  caches.open(CACHE).then(cache=>cache.addAll(CORE_ASSETS)).then(()=>self.skipWaiting())
));
self.addEventListener('activate',event=>event.waitUntil(
  caches.keys().then(keys=>Promise.all(keys.filter(key=>key!==CACHE).map(key=>caches.delete(key)))).then(()=>self.clients.claim())
));
self.addEventListener('message',event=>{if(event.data?.type==='SKIP_WAITING')self.skipWaiting()});

async function refresh(request,key){
  try{
    const response=await fetch(request,{cache:'no-cache'});
    if(response?.ok){
      const cache=await caches.open(CACHE);
      await cache.put(key,response.clone());
    }
    return response;
  }catch{return null}
}

self.addEventListener('fetch',event=>{
  const request=event.request;
  if(request.method!=='GET')return;
  const url=new URL(request.url);
  if(url.origin!==location.origin)return;
  const navigation=request.mode==='navigate';
  const key=navigation?INDEX_URL:request;
  const update=refresh(request,key);
  event.waitUntil(update.then(()=>{}));
  event.respondWith((async()=>{
    const cache=await caches.open(CACHE);
    const cached=await cache.match(key);
    if(cached)return cached;
    const network=await update;
    if(network)return network;
    if(navigation)return (await cache.match(INDEX_URL))||(await cache.match('./'));
    return new Response('',{status:503,statusText:'Offline'});
  })());
});
