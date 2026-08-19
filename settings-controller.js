const APP_KEY='foco-jornada-v4';
const PREF_KEY='foco-jornada-notification-preference-v1';
const NOTIFICATION_KEY='foco-jornada-notifications-v1';
let syncRAF=0;
let lastSystemBody='';
let lastSystemAt=0;
let lastBreakMarker='';

const $=s=>document.querySelector(s);

function readApp(){try{return JSON.parse(localStorage.getItem(APP_KEY)||'null')}catch{return null}}
function readPreference(){
  const stored=localStorage.getItem(PREF_KEY);
  if(stored==='1')return true;
  if(stored==='0')return false;
  return !!readApp()?.settings?.notifications;
}
function writePreference(enabled){localStorage.setItem(PREF_KEY,enabled?'1':'0')}
function internalNotify(text){window.FocoUI?.notify?.(text)}

async function requestSystemPermission(){
  if(!('Notification'in window))return 'unsupported';
  if(Notification.permission==='granted')return 'granted';
  if(Notification.permission==='denied')return 'denied';
  try{return await Notification.requestPermission()}catch{return 'denied'}
}

function showSystemNotification(body){
  if(!readPreference()||!('Notification'in window)||Notification.permission!=='granted')return;
  const now=Date.now();
  if(body===lastSystemBody&&now-lastSystemAt<5000)return;
  lastSystemBody=body;lastSystemAt=now;
  try{new Notification('Foco & Jornada',{body,tag:`foco-jornada-${body.toLowerCase().includes('pausa')?'pausa':'foco'}`})}catch{}
}

function ensureControl(){
  const input=$('#setNotifications');
  if(!input)return;
  const label=input.closest('.fj-toggle');
  if(label){label.classList.add('notification-setting');label.setAttribute('role','group')}
  input.setAttribute('aria-label','Notificações quando foco ou pausa terminar');
  if(!input.dataset.notificationController){
    input.dataset.notificationController='1';
    input.addEventListener('change',async()=>{
      const enabled=input.checked;
      writePreference(enabled);
      if(enabled){
        const permission=await requestSystemPermission();
        if(permission==='granted')internalNotify('Notificações de foco e pausa ativadas.');
        else if(permission==='denied')internalNotify('Alertas internos ativados. As notificações do sistema estão bloqueadas no dispositivo.');
        else internalNotify('Alertas internos de foco e pausa ativados.');
      }else internalNotify('Notificações de foco e pausa desativadas.');
      scheduleSync();
    });
  }
  const enabled=readPreference();
  if(input.checked!==enabled)input.checked=enabled;
  input.setAttribute('aria-checked',enabled?'true':'false');
}

function checkNotificationCenter(){
  if(!readPreference())return;
  let items=[];
  try{items=JSON.parse(localStorage.getItem(NOTIFICATION_KEY)||'[]')}catch{}
  const latest=Array.isArray(items)?items[0]:null;
  if(!latest?.text)return;
  const text=String(latest.text);
  if(!/(foco|pausa|descanso)/i.test(text))return;
  showSystemNotification(text);
}

function checkActiveBreakEnd(){
  if(!readPreference())return;
  const app=readApp();
  const br=(app?.breakSessions||[]).find(x=>x.status==='ACTIVE');
  if(!br?.expectedEndAt||Date.now()<br.expectedEndAt){lastBreakMarker='';return}
  const marker=`${br.id}:${br.expectedEndAt}`;
  if(marker===lastBreakMarker)return;
  lastBreakMarker=marker;
  const message='A pausa terminou. Confirma quando regressares.';
  internalNotify(message);
  showSystemNotification(message);
}

function sync(){ensureControl();checkNotificationCenter();checkActiveBreakEnd()}
function scheduleSync(){if(syncRAF)return;syncRAF=requestAnimationFrame(()=>{syncRAF=0;sync()})}

scheduleSync();
new MutationObserver(scheduleSync).observe(document.body,{childList:true,subtree:true,characterData:true});
document.addEventListener('change',()=>setTimeout(scheduleSync,0));
document.addEventListener('submit',()=>setTimeout(scheduleSync,0));
window.addEventListener('focus',scheduleSync);
