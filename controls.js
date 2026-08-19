const STORAGE_KEY='foco-jornada-v4';
const ALERT_META_KEY='foco-jornada-alert-meta-v1';
let alertTimer=null;

const $=s=>document.querySelector(s);
const readState=()=>{try{return JSON.parse(localStorage.getItem(STORAGE_KEY)||'null')}catch{return null}};
const writeState=s=>localStorage.setItem(STORAGE_KEY,JSON.stringify(s));
const readMeta=()=>{try{return JSON.parse(localStorage.getItem(ALERT_META_KEY)||'{}')}catch{return{}}};
const writeMeta=m=>localStorage.setItem(ALERT_META_KEY,JSON.stringify(m));
const notify=(text,label='',fn=null)=>window.FocoUI?.notify?.(text,label,fn);

function ensureControlStyles(){
  if($('#settingsControlStyles'))return;
  const style=document.createElement('style');
  style.id='settingsControlStyles';
  style.textContent=`
    .fj-toggle{grid-column:1/-1!important;display:flex!important;align-items:center!important;justify-content:space-between!important;gap:16px!important;min-height:58px;padding:10px 2px;color:var(--text)!important}
    .fj-toggle span{font-size:14px!important;line-height:1.35;color:var(--muted)}
    .fj-toggle input#setNotifications{-webkit-appearance:none!important;appearance:none!important;position:relative!important;flex:0 0 auto!important;width:54px!important;height:32px!important;min-width:54px!important;min-height:32px!important;margin:0!important;padding:0!important;border:1px solid var(--line)!important;border-radius:999px!important;background:var(--surface2)!important;box-shadow:inset 0 0 0 1px color-mix(in srgb,var(--line) 55%,transparent)!important;transition:background .18s ease,border-color .18s ease!important}
    .fj-toggle input#setNotifications::after{content:"";position:absolute;left:3px;top:3px;width:24px;height:24px;border-radius:50%;background:var(--muted);box-shadow:0 2px 7px #0005;transition:transform .18s cubic-bezier(.2,.8,.2,1),background .18s ease}
    .fj-toggle input#setNotifications:checked{background:color-mix(in srgb,var(--primary) 82%,var(--surface2))!important;border-color:var(--primary)!important}
    .fj-toggle input#setNotifications:checked::after{transform:translateX(22px);background:#fff}
    .fj-toggle input#setNotifications:focus-visible{outline:3px solid color-mix(in srgb,var(--primary) 62%,white)!important;outline-offset:3px!important}
    @media(max-width:760px){.fj-toggle{min-height:64px;padding:12px 0}.fj-toggle span{font-size:16px!important}}
    @media(prefers-reduced-motion:reduce){.fj-toggle input#setNotifications,.fj-toggle input#setNotifications::after{transition:none!important}}
  `;
  document.head.appendChild(style);
}

function persistNotificationSetting(enabled){
  const state=readState();
  if(!state?.settings)return false;
  state.settings.notifications=!!enabled;
  state.updatedAt=Date.now();
  writeState(state);
  return true;
}

async function requestSystemPermission(){
  if(!('Notification'in window))return'unsupported';
  if(Notification.permission==='granted')return'granted';
  if(Notification.permission==='denied')return'denied';
  try{return await Notification.requestPermission()}catch{return'unsupported'}
}

async function showSystemNotification(title,body,tag){
  if(!('Notification'in window)||Notification.permission!=='granted')return false;
  try{
    if('serviceWorker'in navigator){
      const reg=await navigator.serviceWorker.ready;
      if(reg?.showNotification){await reg.showNotification(title,{body,icon:'./icon.svg',badge:'./icon.svg',tag,renotify:false});return true}
    }
    new Notification(title,{body,icon:'./icon.svg',tag});
    return true;
  }catch{return false}
}

function currentAlertTarget(state){
  const now=Date.now();
  const focus=(state?.focusSessions||[]).filter(x=>x.status==='ACTIVE'&&Number.isFinite(x.expectedEndAt)).sort((a,b)=>a.expectedEndAt-b.expectedEndAt)[0];
  const pause=(state?.breakSessions||[]).filter(x=>x.status==='ACTIVE'&&Number.isFinite(x.expectedEndAt)).sort((a,b)=>a.expectedEndAt-b.expectedEndAt)[0];
  const items=[];
  if(focus)items.push({id:focus.id,kind:'focus',at:focus.expectedEndAt,title:'Sessão de foco concluída',body:'O tempo de foco terminou.'});
  if(pause)items.push({id:pause.id,kind:'break',at:pause.expectedEndAt,title:'Pausa terminada',body:'O tempo previsto da pausa terminou.'});
  items.sort((a,b)=>a.at-b.at);
  const target=items[0]||null;
  if(target&&target.at<now-12*60*60*1000)return null;
  return target;
}

function clearAlertTimer(){if(alertTimer){clearTimeout(alertTimer);alertTimer=null}}

function scheduleNextAlert(){
  clearAlertTimer();
  const state=readState();
  if(!state?.settings?.notifications)return;
  const target=currentAlertTarget(state);
  if(!target)return;
  const meta=readMeta();
  if(meta.lastAlertId===target.id)return;
  const delay=Math.max(0,target.at-Date.now());
  alertTimer=setTimeout(()=>fireAlert(target),Math.min(delay,2_147_000_000));
}

async function fireAlert(target){
  alertTimer=null;
  const state=readState();
  if(!state?.settings?.notifications)return;
  const current=currentAlertTarget(state);
  if(!current||current.id!==target.id||Date.now()<current.at){scheduleNextAlert();return}
  const meta=readMeta();
  if(meta.lastAlertId===target.id)return;
  meta.lastAlertId=target.id;meta.lastAlertAt=Date.now();writeMeta(meta);
  await showSystemNotification(target.title,target.body,`foco-jornada-${target.kind}-${target.id}`);
  notify(`${target.title}.`);
}

function syncInitialToggle(){
  ensureControlStyles();
  const input=$('#setNotifications');
  if(!input||input.dataset.controlsReady)return;
  input.dataset.controlsReady='1';
  input.setAttribute('role','switch');
  input.setAttribute('aria-label','Notificações quando foco ou pausa terminar');
  const state=readState();
  if(state?.settings)input.checked=!!state.settings.notifications;
}

document.addEventListener('change',async e=>{
  const input=e.target.closest?.('#setNotifications');
  if(!input)return;
  persistNotificationSetting(input.checked);
  if(input.checked){
    const permission=await requestSystemPermission();
    if(permission==='granted')notify('Notificações de foco e pausa ativadas.');
    else if(permission==='denied')notify('Alertas internos ativados. As notificações do sistema estão bloqueadas pelo dispositivo.');
    else notify('Alertas internos ativados. Este navegador não disponibiliza notificações do sistema.');
  }else notify('Notificações de foco e pausa desativadas.');
  scheduleNextAlert();
},true);

document.addEventListener('submit',e=>{
  if(e.target?.id!=='settingsForm')return;
  const input=$('#setNotifications');
  if(input)persistNotificationSetting(input.checked);
  setTimeout(()=>{const latest=$('#setNotifications');if(latest)persistNotificationSetting(latest.checked);scheduleNextAlert()},0);
},true);

document.addEventListener('click',()=>setTimeout(()=>{syncInitialToggle();scheduleNextAlert()},120));
document.addEventListener('visibilitychange',()=>{if(!document.hidden){syncInitialToggle();scheduleNextAlert()}});
window.addEventListener('pageshow',()=>{syncInitialToggle();scheduleNextAlert()});
window.addEventListener('storage',e=>{if(e.key===STORAGE_KEY){syncInitialToggle();scheduleNextAlert()}});

ensureControlStyles();
syncInitialToggle();
scheduleNextAlert();
