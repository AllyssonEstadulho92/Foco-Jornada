import './enhancements.js';

const UI_VERSION='4.1.2';
const NOTIFICATION_KEY='foco-jornada-notifications-v1';
const MAX_NOTIFICATIONS=30;
const runtimeActions=new Map();
let lastCaptured={text:'',at:0};
let iconRAF=0;

const $=s=>document.querySelector(s);
const $$=s=>[...document.querySelectorAll(s)];

const ICON_PATHS={
  home:'<path d="M3 10.5 12 3l9 7.5"/><path d="M5.5 9.5V21h13V9.5"/><path d="M9 21v-7h6v7"/>',
  tasks:'<rect x="3" y="4" width="18" height="16" rx="3"/><path d="m8 10 2 2 4-4"/><path d="M15 10h3"/><path d="M8 16h10"/>',
  focus:'<circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="3"/><path d="M12 2v2M22 12h-2M12 22v-2M2 12h2"/>',
  history:'<path d="M3 12a9 9 0 1 0 3-6.7"/><path d="M3 4v5h5"/><path d="M12 7v5l3 2"/>',
  chart:'<path d="M4 20V10M10 20V4M16 20v-7M22 20V7"/>',
  more:'<circle cx="5" cy="12" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/>',
  bell:'<path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9"/><path d="M10 21h4"/>',
  theme:'<path d="M12 3a9 9 0 1 0 9 9c0-.4 0-.8-.1-1.2A7 7 0 0 1 12 3Z"/>',
  pause:'<circle cx="12" cy="12" r="9"/><path d="M10 9v6M14 9v6"/>',
  rest:'<path d="M20.5 14.5A8 8 0 0 1 9.5 3.5 8.5 8.5 0 1 0 20.5 14.5Z"/>',
  coffee:'<path d="M4 9h13v5a6 6 0 0 1-6 6H10a6 6 0 0 1-6-6Z"/><path d="M17 11h2a3 3 0 0 1 0 6h-2"/><path d="M7 4c1 1 1 2 0 3M11 4c1 1 1 2 0 3"/>',
  play:'<circle cx="12" cy="12" r="9"/><path d="m10 8 6 4-6 4Z"/>',
  check:'<path d="m5 12 4 4L19 6"/>',
  edit:'<path d="M4 20h4L19 9l-4-4L4 16Z"/><path d="m13.5 6.5 4 4"/>',
  trash:'<path d="M4 7h16M9 7V4h6v3M7 7l1 13h8l1-13"/>',
  plus:'<path d="M12 5v14M5 12h14"/>',
  download:'<path d="M12 3v12"/><path d="m7 10 5 5 5-5"/><path d="M5 21h14"/>',
  upload:'<path d="M12 21V9"/><path d="m7 14 5-5 5 5"/><path d="M5 3h14"/>',
  shield:'<path d="M12 3 5 6v5c0 5 3 8 7 10 4-2 7-5 7-10V6Z"/><path d="m9 12 2 2 4-4"/>',
  save:'<path d="M5 3h12l2 2v16H5Z"/><path d="M8 3v6h8V3M8 21v-7h8v7"/>',
  sun:'<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
  arrowRight:'<path d="M5 12h14M14 7l5 5-5 5"/>',
  undo:'<path d="M9 7 4 12l5 5"/><path d="M5 12h8a6 6 0 0 1 6 6"/>'
};

function icon(name,extra=''){
  const paths=ICON_PATHS[name]||ICON_PATHS.more;
  return `<svg class="ui-svg ${extra}" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round">${paths}</svg>`;
}

function setStaticViewport(){
  const meta=$('meta[name="viewport"]');
  if(meta) meta.content='width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no,viewport-fit=cover';
  document.documentElement.classList.add('app-like-mobile');
}

function readNotifications(){
  try{const n=JSON.parse(localStorage.getItem(NOTIFICATION_KEY)||'[]');return Array.isArray(n)?n:[]}catch{return[]}
}
function writeNotifications(items){localStorage.setItem(NOTIFICATION_KEY,JSON.stringify(items.slice(0,MAX_NOTIFICATIONS)))}
function unreadCount(){return readNotifications().filter(n=>!n.read).length}
function notificationKind(text=''){
  const t=text.toLowerCase();
  if(/não foi|erro|inválid|termina primeiro|não existe|já existe/.test(t)) return 'error';
  if(/conclu|guardad|registad|criad|restaurad|adicionado|retomad|iniciad|terminad/.test(t)) return 'success';
  return 'info';
}

function ensureNotificationCenter(){
  if($('#notificationBell')) return;
  const topRight=$('.top-right'); if(!topRight) return;
  const bell=document.createElement('button');
  bell.id='notificationBell'; bell.type='button'; bell.className='notification-bell'; bell.setAttribute('aria-label','Notificações');
  bell.innerHTML=`${icon('bell')}<span class="notification-dot" aria-hidden="true"></span>`;
  const theme=topRight.querySelector('[data-action="toggleTheme"]');
  topRight.insertBefore(bell,theme||null);

  const panel=document.createElement('section');
  panel.id='notificationPanel'; panel.className='notification-panel'; panel.hidden=true;
  panel.innerHTML=`<div class="notification-head"><div><span class="kicker">ATUALIZAÇÕES</span><h2>Notificações</h2></div><button type="button" id="notificationClose" class="notification-close" aria-label="Fechar">×</button></div><div id="notificationList" class="notification-list"></div><div class="notification-footer"><button type="button" id="notificationClear" class="text-btn">Limpar notificações</button></div>`;
  document.body.appendChild(panel);

  bell.addEventListener('click',()=>toggleNotifications());
  $('#notificationClose').addEventListener('click',()=>toggleNotifications(false));
  $('#notificationClear').addEventListener('click',()=>{writeNotifications([]);runtimeActions.clear();renderNotificationCenter();});
  document.addEventListener('pointerdown',e=>{if(!panel.hidden&&!panel.contains(e.target)&&!bell.contains(e.target))toggleNotifications(false)});
  renderNotificationCenter();
}

function toggleNotifications(force){
  const panel=$('#notificationPanel'); if(!panel) return;
  const open=force??panel.hidden;
  panel.hidden=!open;
  if(open){
    const items=readNotifications().map(n=>({...n,read:true}));writeNotifications(items);renderNotificationCenter();
  }
}

function renderNotificationCenter(){
  const dot=$('.notification-dot'); if(dot) dot.classList.toggle('on',unreadCount()>0);
  const list=$('#notificationList'); if(!list) return;
  const items=readNotifications();
  list.innerHTML=items.length?items.map(n=>`<article class="notification-item ${n.kind||'info'}"><div class="notification-state"></div><div class="notification-copy"><b>${escapeHtml(n.text)}</b><small>${formatNotificationTime(n.at)}</small></div>${runtimeActions.has(n.id)?`<button type="button" class="notification-action" data-notification-action="${n.id}">${escapeHtml(n.actionLabel||'Abrir')}</button>`:''}</article>`).join(''):'<div class="notification-empty">Sem notificações novas.</div>';
  $$('[data-notification-action]').forEach(b=>b.onclick=()=>{const fn=runtimeActions.get(b.dataset.notificationAction);if(fn){fn();runtimeActions.delete(b.dataset.notificationAction);renderNotificationCenter();toggleNotifications(false)}});
}

function pushNotification(text,actionLabel='',action=null){
  text=String(text||'').trim(); if(!text) return;
  const now=Date.now();
  if(lastCaptured.text===text&&now-lastCaptured.at<500) return;
  lastCaptured={text,at:now};
  const id=`n_${now}_${Math.random().toString(36).slice(2,7)}`;
  const item={id,text,actionLabel:actionLabel||'',kind:notificationKind(text),at:now,read:false};
  const items=readNotifications();items.unshift(item);writeNotifications(items);
  if(typeof action==='function') runtimeActions.set(id,action);
  ensureNotificationCenter();renderNotificationCenter();
  const bell=$('#notificationBell'); if(bell){bell.classList.remove('pulse');void bell.offsetWidth;bell.classList.add('pulse');setTimeout(()=>bell.classList.remove('pulse'),650)}
}

function observeLegacyToast(){
  const toast=$('#toast'); if(!toast) return;
  const capture=()=>{
    if(!toast.classList.contains('show')) return;
    const text=toast.querySelector('span')?.textContent?.trim()||toast.textContent?.trim()||'';
    const actionBtn=toast.querySelector('#toastAction');
    const fn=actionBtn?.onclick;
    const label=actionBtn?.textContent?.trim()||'';
    pushNotification(text,label,typeof fn==='function'?()=>fn.call(actionBtn,new MouseEvent('click',{bubbles:true})):null);
    toast.classList.remove('show');
  };
  new MutationObserver(capture).observe(toast,{childList:true,subtree:true,attributes:true,attributeFilter:['class']});
  capture();
}

function replaceSpanIcon(button,name){
  const span=button?.querySelector(':scope > span'); if(!span) return;
  if(span.dataset.uiIcon===name) return;
  span.dataset.uiIcon=name;span.innerHTML=icon(name,'nav-icon');
}
function prependButtonIcon(button,name){
  if(!button||button.dataset.uiIconified===name) return;
  button.dataset.uiIconified=name;
  const holder=document.createElement('span');holder.className='button-inline-icon';holder.innerHTML=icon(name);
  button.prepend(holder);
}

function applyIcons(){
  const navMap={today:'home',activities:'tasks',focus:'focus',history:'history',stats:'chart',more:'more'};
  $$('[data-nav]').forEach(b=>replaceSpanIcon(b,navMap[b.dataset.nav]||'more'));
  const quick={screenBreak:'pause',restBreak:'rest',goFocus:'focus',coffee:'coffee'};
  Object.entries(quick).forEach(([action,name])=>$$(`#quickActions [data-action="${action}"]`).forEach(b=>replaceSpanIcon(b,name)));
  const actionMap={startWork:'play',endWork:'pause',endBreak:'check',extendBreak:'plus',startFocus:'focus',pauseFocus:'pause',resumeFocus:'play',endFocus:'check',startActivity:'play',pauseActivity:'pause',completeActivity:'check',editActivity:'edit',cancelActivity:'trash',editWork:'edit',reopenWork:'undo',cancelWork:'trash'};
  $$('.icon-btn[data-action]').forEach(b=>{const n=actionMap[b.dataset.action];if(n&&b.dataset.uiIconified!==n){b.dataset.uiIconified=n;b.innerHTML=icon(n);b.setAttribute('aria-label',b.title||b.dataset.action)}});
  $$('[data-action]').filter(b=>!b.classList.contains('icon-btn')&&!b.closest('#quickActions')).forEach(b=>{const n=actionMap[b.dataset.action];if(n)prependButtonIcon(b,n)});
  const theme=$('[data-action="toggleTheme"]');if(theme&&theme.dataset.uiIconified!=='theme'){theme.dataset.uiIconified='theme';theme.innerHTML=icon('theme');theme.setAttribute('aria-label','Alternar tema')}
  prependButtonIcon($('#newActivityBtn'),'plus');
  prependButtonIcon($('#exportBtn'),'download');
  prependButtonIcon($('#importBtn'),'upload');
  prependButtonIcon($('#checkBtn'),'shield');
  prependButtonIcon($('#resetBtn'),'trash');
  const save=$('#settingsForm button[type="submit"]');prependButtonIcon(save,'save');
  $$('.fj-history-delete').forEach(b=>{if(!b.dataset.uiTrash){b.dataset.uiTrash='1';b.innerHTML=icon('trash');}});
  const logo=$('.logo > span');if(logo&&!logo.dataset.uiLogo){logo.dataset.uiLogo='1';logo.innerHTML=icon('focus')}
}

function enforceVersion(){
  ['#appVersion','#appVersionSide'].forEach(sel=>{const el=$(sel);if(el&&el.textContent!==UI_VERSION)el.textContent=UI_VERSION});
}

function scheduleEnhance(){
  if(iconRAF) return;
  iconRAF=requestAnimationFrame(()=>{iconRAF=0;applyIcons();enforceVersion();ensureNotificationCenter();});
}

function escapeHtml(v){return String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
function formatNotificationTime(ts){try{return new Intl.DateTimeFormat('pt-PT',{hour:'2-digit',minute:'2-digit'}).format(new Date(ts))}catch{return''}}

setStaticViewport();
ensureNotificationCenter();
observeLegacyToast();
scheduleEnhance();
new MutationObserver(scheduleEnhance).observe(document.body,{childList:true,subtree:true,characterData:true});
