import {buildMoovitDirectionsUrl,buildMoovitNearbyUrl,validPlace} from './features-core.js';

const FEATURE_KEY='foco-jornada-features-v2';
const MOOVIT_PARTNER_ID='FocoJornada';
const MOOVIT_FALLBACK=`https://moovit.onelink.me/3986059930?pid=Developers&c=${MOOVIT_PARTNER_ID}`;
const $=s=>document.querySelector(s);
const readFeature=()=>{try{return JSON.parse(localStorage.getItem(FEATURE_KEY)||'{}')||{}}catch{return{}}};
const writeFeature=v=>localStorage.setItem(FEATURE_KEY,JSON.stringify(v));
const placeLabel=(key,f)=>key==='current'?'Localização atual':f?.places?.[key]?.name||(key==='home'?'Casa':'Trabalho');
const resolvePlace=(key,f)=>key==='current'?null:(validPlace(f?.places?.[key])?f.places[key]:null);
let fallbackTimer=0;

function ensureStyles(){
  if($('#appLinksStyles'))return;
  const s=document.createElement('style');s.id='appLinksStyles';
  s.textContent='.app-link-status{margin:10px 0 0;padding:11px 12px;border:1px solid var(--line);border-radius:14px;background:var(--surface2);color:var(--muted);font-size:13px;line-height:1.45}.app-link-status.error{color:var(--danger)}#nearbyTransit[data-moovit-bound="1"]{text-decoration:none}.transport-quick #nearbyTransit{appearance:none;-webkit-appearance:none}';
  document.head.appendChild(s);
}
function notify(text){window.FocoUI?.notify?.(text)}
function routeStatus(text,type=''){
  const host=$('#planMoovit');if(!host)return;
  let el=$('#appLinkRouteStatus');if(!el){el=document.createElement('div');el.id='appLinkRouteStatus';host.after(el)}
  el.className=`app-link-status ${type}`.trim();el.textContent=text;
}
function revealPlaces(){const d=$('#moovitSection details.transport-settings');if(d){d.open=true;d.scrollIntoView({behavior:'smooth',block:'nearest'})}}
function validateRoute(origin,dest,f){
  if(origin===dest){routeStatus('Escolhe uma origem e um destino diferentes.','error');return false}
  if(origin!=='current'&&!resolvePlace(origin,f)){routeStatus(`Falta configurar ${placeLabel(origin,f)}.`,'error');revealPlaces();return false}
  if(dest!=='current'&&!resolvePlace(dest,f)){routeStatus(`Falta configurar ${placeLabel(dest,f)}.`,'error');revealPlaces();return false}
  return true;
}
function rememberTrip(origin,dest,when,f){
  const trip={id:`trip_${Date.now()}`,originKey:origin,destKey:dest,originLabel:placeLabel(origin,f),destinationLabel:placeLabel(dest,f),when:when?new Date(when).toISOString():null,at:Date.now()};
  f.recentTrips=[trip,...(Array.isArray(f.recentTrips)?f.recentTrips:[])].slice(0,10);writeFeature(f);
}
function launchMoovitScheme(url,status='A abrir no Moovit…'){
  routeStatus(status);
  let leftPage=false;
  const onVisibility=()=>{if(document.hidden)leftPage=true};
  document.addEventListener('visibilitychange',onVisibility,{once:true});
  clearTimeout(fallbackTimer);
  window.location.href=url;
  fallbackTimer=setTimeout(()=>{if(!leftPage&&document.visibilityState==='visible')window.location.href=MOOVIT_FALLBACK},1500);
}
function ensureButton(el,id){
  if(!el||el.tagName==='BUTTON')return el;
  const b=document.createElement('button');b.type='button';b.id=id;b.className=el.className;b.innerHTML=el.innerHTML;el.replaceWith(b);return b;
}
function stopOldHandler(e){e.preventDefault();e.stopImmediatePropagation()}
function openMoovitPlanner(){
  window.FocoHub?.close?.();
  const opener=$('#integrationsDesktopButton')||$('.integrations-open');
  if(!opener){notify('O módulo Moovit ainda está a carregar.');return}
  opener.click();setTimeout(()=>$('#moovitSection')?.scrollIntoView({behavior:'smooth',block:'start'}),120);
}
function planRoute(){
  const f=readFeature(),origin=$('#routeOrigin')?.value||'current',dest=$('#routeDestination')?.value||'work',when=$('#routeWhen')?.value||null;
  if(!validateRoute(origin,dest,f))return;
  const url=buildMoovitDirectionsUrl({origin:resolvePlace(origin,f),destination:resolvePlace(dest,f),date:when||null,autoRun:true,partnerId:MOOVIT_PARTNER_ID});
  rememberTrip(origin,dest,when,f);launchMoovitScheme(url,'Rota preparada. A abrir o Moovit…');
}
function nearby(){launchMoovitScheme(buildMoovitNearbyUrl({partnerId:MOOVIT_PARTNER_ID}),'A abrir linhas e paragens perto de ti…')}
function quickTrip(type){
  const origin=type==='home'?'work':'current',dest=type==='home'?'home':'work',f=readFeature();
  if(!validateRoute(origin,dest,f))return;
  rememberTrip(origin,dest,null,f);
  launchMoovitScheme(buildMoovitDirectionsUrl({origin:resolvePlace(origin,f),destination:resolvePlace(dest,f),autoRun:true,partnerId:MOOVIT_PARTNER_ID}),type==='home'?'A abrir a rota para casa…':'A abrir a rota para o trabalho…');
}
function handleMoovitClick(e){
  const target=e.target;
  if(target.closest?.('[data-hub-action="moovit"]')){stopOldHandler(e);openMoovitPlanner();return}
  if(target.closest?.('#planMoovit')){stopOldHandler(e);planRoute();return}
  if(target.closest?.('#nearbyTransit')){stopOldHandler(e);nearby();return}
  const trip=target.closest?.('#moovitSection [data-trip]');if(trip){stopOldHandler(e);quickTrip(trip.dataset.trip)}
}
function markButtons(){
  const plan=ensureButton($('#planMoovit'),'planMoovit'),near=ensureButton($('#nearbyTransit'),'nearbyTransit');
  if(plan)plan.dataset.moovitBound='1';if(near)near.dataset.moovitBound='1';
  document.querySelectorAll('#moovitSection [data-trip]').forEach(b=>b.dataset.moovitBound='1');
}
function replaceSupershift(){
  const old=$('#openSupershift');if(!old||old.dataset.internalPlanner==='1')return;
  old.dataset.internalPlanner='1';old.textContent='Abrir calendário e turnos';
  old.onclick=async e=>{e.preventDefault();try{if(window.FocoShiftPlanner?.open)return window.FocoShiftPlanner.open();const mod=await import('./shift-planner.js');mod.open()}catch{window.FocoUI?.notify?.('Não foi possível abrir a escala.')}};
}
function enhance(){ensureStyles();markButtons();replaceSupershift()}
let raf=0;const schedule=()=>{if(raf)return;raf=requestAnimationFrame(()=>{raf=0;enhance()})};
document.addEventListener('click',handleMoovitClick,true);
new MutationObserver(schedule).observe(document.body,{childList:true,subtree:true});schedule();
window.FocoAppLinks=Object.freeze({version:'2.2.0',enhance,openMoovit:openMoovitPlanner,launchMoovit:launchMoovitScheme});
