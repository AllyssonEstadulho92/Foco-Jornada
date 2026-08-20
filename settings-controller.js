const APP_KEY='foco-jornada-v4';
const PREF_KEY='foco-jornada-notification-preference-v1';
let syncRAF=0;

const $=s=>document.querySelector(s);
function readApp(){try{return JSON.parse(localStorage.getItem(APP_KEY)||'null')}catch{return null}}
function readPreference(){const stored=localStorage.getItem(PREF_KEY);if(stored==='1')return true;if(stored==='0')return false;return !!readApp()?.settings?.notifications}
function writePreference(enabled){localStorage.setItem(PREF_KEY,enabled?'1':'0')}
function internalNotify(text){window.FocoUI?.notify?.(text)}

async function requestSystemPermission(){
  if(!('Notification'in window))return'unsupported';
  if(Notification.permission==='granted')return'granted';
  if(Notification.permission==='denied')return'denied';
  try{return await Notification.requestPermission()}catch{return'unsupported'}
}

function mirrorIntoStoredState(enabled){
  const app=readApp();
  if(!app?.settings)return;
  app.settings.notifications=!!enabled;
  app.updatedAt=Date.now();
  localStorage.setItem(APP_KEY,JSON.stringify(app));
}

function ensureControl(){
  const input=$('#setNotifications');
  if(!input)return;
  const label=input.closest('.fj-toggle');
  if(label){label.classList.add('notification-setting');label.setAttribute('role','group')}
  input.setAttribute('role','switch');
  input.setAttribute('aria-label','Notificações quando foco ou pausa terminar');
  if(!input.dataset.notificationController){
    input.dataset.notificationController='1';
    input.addEventListener('change',async()=>{
      const enabled=input.checked;
      writePreference(enabled);
      mirrorIntoStoredState(enabled);
      window.dispatchEvent(new CustomEvent('foco-notification-preference-change',{detail:{enabled}}));
      if(enabled){
        const permission=await requestSystemPermission();
        if(permission==='granted')internalNotify('Notificações de foco e pausa ativadas.');
        else if(permission==='denied')internalNotify('Alertas internos ativados. As notificações do sistema estão bloqueadas no dispositivo.');
        else internalNotify('Alertas internos ativados. Este navegador não disponibiliza notificações do sistema.');
      }else internalNotify('Notificações de foco e pausa desativadas.');
      scheduleSync();
    });
  }
  const enabled=readPreference();
  if(input.checked!==enabled)input.checked=enabled;
  const aria=enabled?'true':'false';
  if(input.getAttribute('aria-checked')!==aria)input.setAttribute('aria-checked',aria);
}

function sync(){ensureControl()}
function scheduleSync(){if(syncRAF)return;syncRAF=requestAnimationFrame(()=>{syncRAF=0;sync()})}

scheduleSync();
const settingsObserver=new MutationObserver(mutations=>{
  for(const mutation of mutations){
    if([...mutation.addedNodes].some(node=>node.nodeType===1)){scheduleSync();break}
  }
});
settingsObserver.observe(document.body,{childList:true,subtree:true});
document.addEventListener('change',()=>setTimeout(scheduleSync,0));
document.addEventListener('submit',()=>setTimeout(scheduleSync,180));
window.addEventListener('focus',scheduleSync);
window.addEventListener('pageshow',scheduleSync);
