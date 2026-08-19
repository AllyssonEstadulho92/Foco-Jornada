import {buildMoovitDirectionsUrl,buildMoovitNearbyUrl,validPlace} from './features-core.js';

const FEATURE_KEY='foco-jornada-features-v2';
const MOOVIT_PARTNER_ID='FocoJornada';
const SHORTCUT_NAME='Supershift';
const SHORTCUT_RUN=`shortcuts://run-shortcut?name=${encodeURIComponent(SHORTCUT_NAME)}`;
const SHORTCUT_CREATE='shortcuts://create-shortcut';
const SHORTCUT_EDIT=`shortcuts://open-shortcut?name=${encodeURIComponent(SHORTCUT_NAME)}`;
const SUPERSHIFT_STORE='https://apps.apple.com/pt/app/supershift-escala-de-trabalho/id1104165041';
const SUPERSHIFT_WEB='https://supershift.app/';
const $=s=>document.querySelector(s);

const readFeature=()=>{try{return JSON.parse(localStorage.getItem(FEATURE_KEY)||'{}')||{}}catch{return{}}};
const writeFeature=v=>localStorage.setItem(FEATURE_KEY,JSON.stringify(v));
const placeLabel=(key,f)=>key==='current'?'Localização atual':f?.places?.[key]?.name||(key==='home'?'Casa':'Trabalho');
const resolvePlace=(key,f)=>key==='current'?null:(validPlace(f?.places?.[key])?f.places[key]:null);
const isIOS=()=>/iPad|iPhone|iPod/.test(navigator.userAgent)||(navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1);
const isAndroid=()=>/Android/i.test(navigator.userAgent);

function ensureStyles(){
  if($('#appLinksStyles'))return;
  const style=document.createElement('style');
  style.id='appLinksStyles';
  style.textContent=`
  .app-link-status{margin:10px 0 0;padding:11px 12px;border:1px solid var(--line);border-radius:14px;background:var(--surface2);color:var(--muted);font-size:13px;line-height:1.45}
  .app-link-status.error{border-color:color-mix(in srgb,var(--danger) 55%,var(--line));color:var(--danger)}
  .native-app-link{display:flex!important;align-items:center;justify-content:center;gap:8px;text-decoration:none!important}
  .supershift-direct{margin-top:14px;padding:16px;border:1px solid var(--line);border-radius:18px;background:var(--surface2)}
  .supershift-direct h4{margin:0 0 6px;font-size:17px}.supershift-direct p{margin:0;color:var(--muted);line-height:1.5}
  .supershift-direct .button-row{margin-top:12px;display:grid;grid-template-columns:1fr 1fr;gap:9px}
  .supershift-direct .button-row .primary-link{grid-column:1/-1;background:var(--primary);color:#fff;border-color:transparent}
  .supershift-direct ol{margin:12px 0 0;padding-left:20px;color:var(--muted);line-height:1.55}
  .supershift-direct code{color:var(--text);font-weight:800}
  @media(max-width:560px){.supershift-direct .button-row{grid-template-columns:1fr}.supershift-direct .button-row .primary-link{grid-column:auto}}
  `;
  document.head.appendChild(style);
}

function routeStatus(text,type=''){
  const host=$('#planMoovit');if(!host)return;
  let el=$('#appLinkRouteStatus');
  if(!el){el=document.createElement('div');el.id='appLinkRouteStatus';host.after(el)}
  el.className=`app-link-status ${type}`.trim();el.textContent=text;
}
function revealPlaces(){const details=$('#moovitSection details.transport-settings');if(details){details.open=true;details.scrollIntoView({behavior:'smooth',block:'nearest'})}}
function validateRoute(origin,dest,f){
  if(origin===dest){routeStatus('Escolhe uma origem e um destino diferentes.','error');return false}
  if(origin!=='current'&&!resolvePlace(origin,f)){routeStatus(`Falta configurar ${placeLabel(origin,f)}. Abri a configuração abaixo.`,'error');revealPlaces();return false}
  if(dest!=='current'&&!resolvePlace(dest,f)){routeStatus(`Falta configurar ${placeLabel(dest,f)}. Abri a configuração abaixo.`,'error');revealPlaces();return false}
  return true;
}
function rememberTrip(origin,dest,when,f){
  const trip={id:`trip_${Date.now()}`,originKey:origin,destKey:dest,originLabel:placeLabel(origin,f),destinationLabel:placeLabel(dest,f),when:when?new Date(when).toISOString():null,at:Date.now()};
  f.recentTrips=[trip,...(Array.isArray(f.recentTrips)?f.recentTrips:[])].slice(0,10);writeFeature(f);
}
function computeRoute(){
  const f=readFeature(),origin=$('#routeOrigin')?.value||'current',dest=$('#routeDestination')?.value||'work',when=$('#routeWhen')?.value||null;
  if(!validateRoute(origin,dest,f))return null;
  return {f,origin,dest,when,url:buildMoovitDirectionsUrl({origin:resolvePlace(origin,f),destination:resolvePlace(dest,f),date:when||null,autoRun:true,partnerId:MOOVIT_PARTNER_ID})};
}
function replacePlanButton(){
  const old=$('#planMoovit');if(!old||old.dataset.nativeLink==='1')return;
  const link=document.createElement('a');
  link.id='planMoovit';link.className=old.className+' native-app-link';link.innerHTML=old.innerHTML;link.href='#';link.dataset.nativeLink='1';
  old.replaceWith(link);
  link.addEventListener('click',e=>{
    const route=computeRoute();
    if(!route){e.preventDefault();return}
    rememberTrip(route.origin,route.dest,route.when,route.f);
    link.href=route.url;
    routeStatus('A abrir a rota no Moovit…');
  });
}
function replaceNearbyButton(){
  const old=$('#nearbyTransit');if(!old||old.dataset.nativeLink==='1')return;
  const link=document.createElement('a');link.id='nearbyTransit';link.className=old.className+' native-app-link';link.innerHTML=old.innerHTML;
  link.href=buildMoovitNearbyUrl({partnerId:MOOVIT_PARTNER_ID});link.dataset.nativeLink='1';old.replaceWith(link);
}

function supershiftHref(){
  if(isIOS())return SHORTCUT_RUN;
  if(isAndroid()){const fallback=encodeURIComponent('https://play.google.com/store/apps/details?id=app.supershift');return`intent://#Intent;package=app.supershift;S.browser_fallback_url=${fallback};end`}
  return SUPERSHIFT_WEB;
}
function replaceSupershiftButton(){
  const old=$('#openSupershift');if(!old||old.dataset.nativeLink==='1')return;
  const link=document.createElement('a');link.id='openSupershift';link.className=old.className+' native-app-link';link.innerHTML=old.innerHTML;link.href=supershiftHref();link.dataset.nativeLink='1';old.replaceWith(link);
}
function ensureSupershiftDirect(){
  const section=$('#supershiftSection');if(!section)return;
  section.querySelector('#supershiftBridge')?.remove();
  if($('#supershiftDirect'))return;
  const block=document.createElement('div');block.id='supershiftDirect';block.className='supershift-direct';
  if(isIOS()){
    block.innerHTML=`<h4>Abertura do Supershift no iPhone</h4><p>O Supershift não publica um deep link próprio. A forma suportada de o abrir a partir desta PWA é um Atalho da Apple chamado <code>Supershift</code>.</p><div class="button-row"><a class="btn native-app-link" href="${SHORTCUT_CREATE}">1. Criar atalho</a><a class="btn native-app-link" href="${SHORTCUT_EDIT}">Editar atalho</a><a class="btn native-app-link primary-link" href="${SHORTCUT_RUN}">Abrir Supershift</a></div><ol><li>Toca em <b>Criar atalho</b>.</li><li>Adiciona a ação <b>Abrir aplicação</b> e escolhe <b>Supershift</b>.</li><li>Guarda o atalho com o nome exato <b>Supershift</b>.</li><li>Depois usa <b>Abrir Supershift</b> nesta aplicação.</li></ol><p class="app-link-status">Não é possível abrir diretamente o ecrã de planificação do Supershift porque o fabricante não publica um URL para esse ecrã.</p>`;
  }else{
    block.innerHTML=`<h4>Abrir Supershift</h4><p>Usa o botão principal para abrir a aplicação. Se não estiver instalada, usa a loja oficial.</p><div class="button-row"><a class="btn native-app-link primary-link" href="${supershiftHref()}">Abrir Supershift</a><a class="btn native-app-link" href="${SUPERSHIFT_STORE}" target="_blank" rel="noopener">App Store</a></div>`;
  }
  const help=section.querySelector('.integration-help');(help||section.lastElementChild)?.after(block);
}
function simplifySupershiftCopy(){
  const section=$('#supershiftSection');if(!section)return;
  const hero=section.querySelector('.supershift-hero');
  if(hero){const b=hero.querySelector('b'),p=hero.querySelector('p');if(b)b.textContent='Supershift instalado no dispositivo';if(p)p.textContent='A Foco & Jornada apenas abre a aplicação ou exporta a escala. A planificação continua dentro do Supershift.'}
}
function enhance(){ensureStyles();replacePlanButton();replaceNearbyButton();replaceSupershiftButton();ensureSupershiftDirect();simplifySupershiftCopy()}

let raf=0;const schedule=()=>{if(raf)return;raf=requestAnimationFrame(()=>{raf=0;enhance()})};
new MutationObserver(schedule).observe(document.body,{childList:true,subtree:true});
document.addEventListener('change',e=>{if(e.target?.matches?.('#routeOrigin,#routeDestination,#routeWhen')){const status=$('#appLinkRouteStatus');if(status)status.remove()}},true);
schedule();
window.FocoAppLinks=Object.freeze({version:'1.0.0',enhance});
