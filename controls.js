import './couple.js';

const STORAGE_KEY='foco-jornada-v4';
const PREF_KEY='foco-jornada-notification-preference-v1';
const ALERT_META_KEY='foco-jornada-alert-meta-v2';
let alertTimer=null;

const readState=()=>{try{return JSON.parse(localStorage.getItem(STORAGE_KEY)||'null')}catch{return null}};
const writeState=s=>localStorage.setItem(STORAGE_KEY,JSON.stringify(s));
const readMeta=()=>{try{return JSON.parse(localStorage.getItem(ALERT_META_KEY)||'{}')}catch{return{}}};
const writeMeta=m=>localStorage.setItem(ALERT_META_KEY,JSON.stringify(m));
const notify=(text,label='',fn=null)=>window.FocoUI?.notify?.(text,label,fn);

function notificationsEnabled(){
  const pref=localStorage.getItem(PREF_KEY);
  if(pref==='1')return true;
  if(pref==='0')return false;
  return !!readState()?.settings?.notifications;
}

function syncPersistedFlag(){
  const pref=localStorage.getItem(PREF_KEY);
  if(pref!=='1'&&pref!=='0')return;
  const state=readState();
  if(!state?.settings)return;
  const enabled=pref==='1';
  if(!!state.settings.notifications===enabled)return;
  state.settings.notifications=enabled;
  state.updatedAt=Date.now();
  writeState(state);
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
  syncPersistedFlag();
  if(!notificationsEnabled())return;
  const target=currentAlertTarget(readState());
  if(!target)return;
  const meta=readMeta();
  const marker=`${target.kind}:${target.id}:${target.at}`;
  if(meta.lastAlertMarker===marker)return;
  const delay=Math.max(0,target.at-Date.now());
  alertTimer=setTimeout(()=>fireAlert(target),Math.min(delay,2_147_000_000));
}

async function fireAlert(target){
  alertTimer=null;
  syncPersistedFlag();
  if(!notificationsEnabled())return;
  const current=currentAlertTarget(readState());
  if(!current||current.id!==target.id||Date.now()<current.at){scheduleNextAlert();return}
  const marker=`${current.kind}:${current.id}:${current.at}`;
  const meta=readMeta();
  if(meta.lastAlertMarker===marker)return;
  meta.lastAlertMarker=marker;meta.lastAlertAt=Date.now();writeMeta(meta);
  await showSystemNotification(current.title,current.body,`foco-jornada-${current.kind}-${current.id}`);
  notify(`${current.title}.`);
}

function resyncSoon(){setTimeout(scheduleNextAlert,140)}

document.addEventListener('click',resyncSoon);
document.addEventListener('submit',resyncSoon);
document.addEventListener('change',resyncSoon);
document.addEventListener('visibilitychange',()=>{if(!document.hidden)scheduleNextAlert()});
window.addEventListener('pageshow',scheduleNextAlert);
window.addEventListener('storage',e=>{if([STORAGE_KEY,PREF_KEY].includes(e.key))scheduleNextAlert()});
window.addEventListener('foco-notification-preference-change',scheduleNextAlert);

scheduleNextAlert();
