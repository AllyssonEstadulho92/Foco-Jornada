import {buildMoovitDirectionsUrl,validPlace} from './features-core.js';

const FEATURE_KEY='foco-jornada-features-v2';
const SUPERSHIFT_SHORTCUT_READY='foco-jornada-supershift-shortcut-v1';
const SUPERSHIFT_SHORTCUT_URL='shortcuts://run-shortcut?name=Supershift';
const SUPERSHIFT_CREATE_SHORTCUT_URL='shortcuts://create-shortcut';
const SUPERSHIFT_EDIT_SHORTCUT_URL='shortcuts://open-shortcut?name=Supershift';
const SUPERSHIFT_ANDROID_STORE_URL='https://play.google.com/store/apps/details?id=app.supershift';
const SUPERSHIFT_WEB_URL='https://supershift.app/';
const $=s=>document.querySelector(s);

function readFeature(){try{return JSON.parse(localStorage.getItem(FEATURE_KEY)||'{}')||{}}catch{return{}}}
function writeFeature(v){localStorage.setItem(FEATURE_KEY,JSON.stringify(v))}
function placeLabel(key,f){if(key==='current')return'Localização atual';return f?.places?.[key]?.name||(key==='home'?'Casa':'Trabalho')}
function resolvePlace(key,f){if(key==='current')return null;const p=f?.places?.[key];return validPlace(p)?p:null}

function ensureStyle(){
  if($('#integrationControlStyle'))return;
  const s=document.createElement('style');s.id='integrationControlStyle';s.textContent=`
    .integration-inline-status{margin:9px 0 0;padding:10px 12px;border:1px solid var(--line);border-radius:13px;background:var(--surface2);color:var(--muted);font-size:13px;line-height:1.4}
    .integration-inline-status.error{border-color:color-mix(in srgb,var(--danger) 55%,var(--line));color:var(--danger)}
    .integration-inline-status.ok{border-color:color-mix(in srgb,var(--success) 50%,var(--line));color:var(--success)}
    .supershift-bridge{margin-top:12px;padding:13px;border:1px solid var(--line);border-radius:16px;background:var(--surface2)}
    .supershift-bridge b,.supershift-bridge small{display:block}.supershift-bridge small{color:var(--muted);margin-top:4px;line-height:1.4}.supershift-bridge .button-row{margin-top:10px}
    .app-bridge-dialog .steps{display:grid;gap:8px;margin:14px 0;color:var(--muted)}.app-bridge-dialog .steps b{color:var(--text)}
  `;document.head.appendChild(s);
}

function routeStatus(text,type=''){
  ensureStyle();const btn=$('#planMoovit');if(!btn)return;
  let el=$('#routeLaunchStatus');if(!el){el=document.createElement('div');el.id='routeLaunchStatus';btn.after(el)}
  el.className=`integration-inline-status ${type}`.trim();el.textContent=text;
}
function revealLocationSettings(){const d=$('#moovitSection details.transport-settings');if(d)d.open=true;d?.scrollIntoView({behavior:'smooth',block:'nearest'})}
function validateRoute(originKey,destKey,f){
  if(originKey===destKey){routeStatus('Escolhe uma origem e um destino diferentes.','error');return false}
  if(originKey!=='current'&&!resolvePlace(originKey,f)){routeStatus(`Configura primeiro ${placeLabel(originKey,f)} em “Casa, Trabalho e objetivo diário”.`,'error');revealLocationSettings();return false}
  if(destKey!=='current'&&!resolvePlace(destKey,f)){routeStatus(`Configura primeiro ${placeLabel(destKey,f)} em “Casa, Trabalho e objetivo diário”.`,'error');revealLocationSettings();return false}
  return true;
}
function rememberTrip(originKey,destKey,when,f){
  const r={id:`trip_${Date.now()}`,originKey,destKey,originLabel:placeLabel(originKey,f),destinationLabel:placeLabel(destKey,f),when:when?new Date(when).toISOString():null,at:Date.now()};
  f.recentTrips=[r,...(Array.isArray(f.recentTrips)?f.recentTrips:[])].slice(0,10);writeFeature(f);
}
function planMoovitFromForm(){
  const originKey=$('#routeOrigin')?.value||'current',destKey=$('#routeDestination')?.value||'work',when=$('#routeWhen')?.value||null,f=readFeature();
  if(!validateRoute(originKey,destKey,f))return;
  const url=buildMoovitDirectionsUrl({origin:resolvePlace(originKey,f),destination:resolvePlace(destKey,f),date:when||null,autoRun:true});
  rememberTrip(originKey,destKey,when,f);
  routeStatus('A abrir a viagem no Moovit…','ok');
  window.location.href=url;
}

function isIOS(){return /iPad|iPhone|iPod/.test(navigator.userAgent)||(navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1)}
function isAndroid(){return /Android/i.test(navigator.userAgent)}
function closeSetup(){document.querySelector('#supershiftSetupBackdrop')?.remove()}
function runSupershiftShortcut(){localStorage.setItem(SUPERSHIFT_SHORTCUT_READY,'1');window.location.href=SUPERSHIFT_SHORTCUT_URL}
function showSupershiftSetup(){
  ensureStyle();if($('#supershiftSetupBackdrop'))return;
  const root=document.createElement('div');root.id='supershiftSetupBackdrop';root.className='backdrop';root.innerHTML=`<div class="dialog app-bridge-dialog" role="dialog" aria-modal="true" aria-labelledby="supershiftSetupTitle"><div class="dialog-head"><h2 id="supershiftSetupTitle">Abrir Supershift no iPhone</h2><button type="button" data-ss-close>×</button></div><p>O Supershift não publica um deep link iOS. A ligação direta fica estável através de um Atalho da Apple criado uma única vez.</p><div class="steps"><span><b>1.</b> Toca em “Criar atalho”.</span><span><b>2.</b> Adiciona a ação “Abrir aplicação” e escolhe <b>Supershift</b>.</span><span><b>3.</b> Dá ao atalho exatamente o nome <b>Supershift</b>.</span><span><b>4.</b> Volta aqui e toca em “Já configurei”.</span></div><div class="dialog-actions"><button type="button" class="btn" data-ss-close>Agora não</button><button type="button" class="btn" id="createSupershiftShortcut">Criar atalho</button><button type="button" class="btn primary" id="confirmSupershiftShortcut">Já configurei</button></div></div>`;
  document.body.appendChild(root);root.querySelectorAll('[data-ss-close]').forEach(b=>b.onclick=closeSetup);root.onclick=e=>{if(e.target===root)closeSetup()};
  $('#createSupershiftShortcut').onclick=()=>{window.location.href=SUPERSHIFT_CREATE_SHORTCUT_URL};
  $('#confirmSupershiftShortcut').onclick=()=>{closeSetup();runSupershiftShortcut()};
}
function openSupershift(){
  if(isIOS()){
    if(localStorage.getItem(SUPERSHIFT_SHORTCUT_READY)==='1'){runSupershiftShortcut();return}
    showSupershiftSetup();return;
  }
  if(isAndroid()){
    const fallback=encodeURIComponent(SUPERSHIFT_ANDROID_STORE_URL);window.location.href=`intent://#Intent;package=app.supershift;S.browser_fallback_url=${fallback};end`;return;
  }
  window.location.href=SUPERSHIFT_WEB_URL;
}
function ensureSupershiftBridge(){
  ensureStyle();const section=$('#supershiftSection');if(!section||$('#supershiftBridge'))return;
  const host=section.querySelector('.integration-actions')||section;const box=document.createElement('div');box.id='supershiftBridge';box.className='supershift-bridge';
  box.innerHTML=`<b>Abertura direta no iPhone</b><small>Depois de configurar o Atalho “Supershift” uma vez, o botão Abrir Supershift lança a aplicação instalada.</small><div class="button-row"><button type="button" class="mini" id="setupSupershiftBridge">Configurar ligação</button>${localStorage.getItem(SUPERSHIFT_SHORTCUT_READY)==='1'?'<button type="button" class="mini" id="editSupershiftBridge">Editar atalho</button>':''}</div>`;host.after(box);
  $('#setupSupershiftBridge').onclick=showSupershiftSetup;const edit=$('#editSupershiftBridge');if(edit)edit.onclick=()=>window.location.href=SUPERSHIFT_EDIT_SHORTCUT_URL;
}
function ensure(){ensureStyle();ensureSupershiftBridge()}

document.addEventListener('click',e=>{
  const plan=e.target.closest?.('#planMoovit');if(plan){e.preventDefault();e.stopImmediatePropagation();planMoovitFromForm();return}
  const sup=e.target.closest?.('#openSupershift,[data-hub-action="supershift"]');if(sup){e.preventDefault();e.stopImmediatePropagation();openSupershift();return}
},true);

new MutationObserver(()=>requestAnimationFrame(ensure)).observe(document.body,{childList:true,subtree:true});
ensure();
window.FocoIntegrations=Object.freeze({planMoovit:planMoovitFromForm,openSupershift,setupSupershift:showSupershiftSetup});
