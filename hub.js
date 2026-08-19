const HUB_VERSION='4.2.0';
const NOTIFICATION_KEY='foco-jornada-notifications-v1';
const MOOVIT_APP_URL='moovit://nearby?partner_id=FocoJornada';
const MOOVIT_FALLBACK_URL='https://moovit.onelink.me/3986059930?pid=Developers&c=FocoJornada';
const SUPERSHIFT_WEB_URL='https://supershift.app/';
const SUPERSHIFT_IOS_STORE_URL='https://apps.apple.com/pt/app/supershift-escala-de-trabalho/id1104165041';
const SUPERSHIFT_ANDROID_STORE_URL='https://play.google.com/store/apps/details?id=app.supershift';
const $=s=>document.querySelector(s);
let bypassMore=false;
let hubOpen=false;

const svg=(body,cls='')=>`<svg class="hub-svg ${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${body}</svg>`;
const I={
  close:'<path d="m6 6 12 12M18 6 6 18"/>',
  moovit:'<path d="M5 17h14l1-8c.2-2-1.2-4-3.3-4H7.3C5.2 5 3.8 7 4 9Z"/><path d="M7 17v2M17 17v2M7 12h10M8 8h8"/><circle cx="8" cy="15" r="1"/><circle cx="16" cy="15" r="1"/>',
  supershift:'<rect x="3" y="5" width="18" height="16" rx="3"/><path d="M7 3v4M17 3v4M3 10h18"/><path d="M8 14h3M13 14h3M8 18h3"/>',
  settings:'<circle cx="12" cy="12" r="3"/><path d="M19 12a7 7 0 0 0-.1-1l2-1.5-2-3.4-2.4 1A8 8 0 0 0 15 6l-.3-2.6h-4L10.5 6a8 8 0 0 0-1.6.9l-2.4-1-2 3.4 2 1.6a7 7 0 0 0 0 2.1l-2 1.6 2 3.4 2.4-1a8 8 0 0 0 1.6.9l.3 2.6h4l.3-2.6a8 8 0 0 0 1.6-.9l2.4 1 2-3.4-2-1.6c.1-.3.1-.7.1-1Z"/>',
  backup:'<path d="M5 4h11l3 3v13H5Z"/><path d="M8 4v6h8V4M8 20v-6h8v6"/>',
  chart:'<path d="M4 20V10M10 20V4M16 20v-7M22 20V7"/>',
  bell:'<path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9"/><path d="M10 21h4"/>',
  update:'<path d="M20 7v5h-5"/><path d="M4 17v-5h5"/><path d="M18.5 9A7 7 0 0 0 6 6l-2 2M5.5 15A7 7 0 0 0 18 18l2-2"/>',
  clock:'<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  info:'<circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 7h.01"/>',
  chevron:'<path d="m9 6 6 6-6 6"/>',
  modules:'<rect x="3" y="3" width="7" height="7" rx="2"/><rect x="14" y="3" width="7" height="7" rx="2"/><rect x="3" y="14" width="7" height="7" rx="2"/><path d="M17.5 14v7M14 17.5h7"/>'
};

function unread(){try{return JSON.parse(localStorage.getItem(NOTIFICATION_KEY)||'[]').filter(x=>!x.read).length}catch{return 0}}
function notify(text,label='',fn=null){window.FocoUI?.notify?.(text,label,fn)}
function row(action,icon,title,desc,badge=false){return `<button type="button" class="hub-row" data-hub-action="${action}"><span class="hub-row-icon">${svg(icon)}</span><span class="hub-row-copy"><b>${title}</b><small>${desc}</small></span>${badge?'<i class="hub-row-dot" data-hub-notification-dot></i>':''}<span class="hub-row-arrow">${svg(I.chevron)}</span></button>`}

function ensureHub(){
  if($('#appHub'))return;
  const root=document.createElement('section');
  root.id='appHub';root.className='app-hub';root.hidden=true;root.setAttribute('aria-label','Menu de aplicações e definições');
  root.innerHTML=`<div class="hub-backdrop" data-hub-close></div><div class="hub-sheet" role="dialog" aria-modal="true" aria-labelledby="hubTitle">
    <header class="hub-head"><div><span class="kicker">CENTRAL</span><h2 id="hubTitle">Foco & Jornada</h2><p>Aplicações, definições e ferramentas.</p></div><button type="button" class="hub-close" data-hub-close aria-label="Fechar">${svg(I.close)}</button></header>
    <section class="hub-app-section"><div class="hub-section-title"><span>Aplicações</span><small>Abrir no dispositivo</small></div><div class="hub-app-grid">
      <button type="button" class="hub-app moovit" data-hub-action="moovit"><span class="hub-app-icon">${svg(I.moovit)}</span><b>Moovit</b><small>Abrir aplicação</small></button>
      <button type="button" class="hub-app supershift" data-hub-action="supershift"><span class="hub-app-icon">${svg(I.supershift)}</span><b>Supershift</b><small>Abrir aplicação</small></button>
    </div></section>
    <section class="hub-group"><div class="hub-section-title"><span>Trabalho</span></div>
      ${row('schedule',I.clock,'Horário e pausas','08–17 · domingo 09–18')}
      ${row('stats',I.chart,'Estatísticas','Semana, mês e ano')}
    </section>
    <section class="hub-group"><div class="hub-section-title"><span>Sistema</span></div>
      ${row('settings',I.settings,'Definições','Tema, foco, pausas e café')}
      ${row('backup',I.backup,'Backup e diagnóstico','Exportar, importar e verificar')}
      ${row('notifications',I.bell,'Notificações','Avisos e alterações',true)}
      ${row('updates',I.update,'Atualizações','Procurar nova versão')}
      ${row('about',I.info,'Sobre','Versão e armazenamento local')}
    </section>
    <section class="hub-future"><div class="hub-future-icon">${svg(I.modules)}</div><div><b>Preparado para novos módulos</b><small>Novas ferramentas podem entrar aqui apenas quando forem necessárias.</small></div></section>
    <footer class="hub-footer"><span>Foco & Jornada</span><strong>v${HUB_VERSION}</strong></footer>
  </div>`;
  document.body.appendChild(root);
  root.addEventListener('click',handleHubClick);
  document.addEventListener('keydown',e=>{if(e.key==='Escape'&&hubOpen)closeHub()});
}

function openHub(){ensureHub();const root=$('#appHub');if(!root)return;hubOpen=true;root.hidden=false;requestAnimationFrame(()=>root.classList.add('open'));document.body.classList.add('hub-open');refreshHub();setTimeout(()=>root.querySelector('.hub-close')?.focus(),120)}
function closeHub(){const root=$('#appHub');if(!root)return;hubOpen=false;root.classList.remove('open');document.body.classList.remove('hub-open');setTimeout(()=>{if(!hubOpen)root.hidden=true},220)}
function refreshHub(){const dot=$('[data-hub-notification-dot]');if(dot)dot.classList.toggle('on',unread()>0)}

function launchCustomScheme(appUrl,fallbackUrl){
  closeHub();
  let leftPage=false;
  const onVisibility=()=>{if(document.hidden)leftPage=true};
  document.addEventListener('visibilitychange',onVisibility);
  location.href=appUrl;
  setTimeout(()=>{
    document.removeEventListener('visibilitychange',onVisibility);
    if(!leftPage&&!document.hidden&&fallbackUrl)location.href=fallbackUrl;
  },1300);
}

function openMoovitApp(){
  launchCustomScheme(MOOVIT_APP_URL,MOOVIT_FALLBACK_URL);
}

function openSupershiftApp(){
  closeHub();
  const ua=navigator.userAgent||'';
  if(/Android/i.test(ua)){
    const fallback=encodeURIComponent(SUPERSHIFT_ANDROID_STORE_URL);
    location.href=`intent://#Intent;package=app.supershift;S.browser_fallback_url=${fallback};end`;
    return;
  }
  // O Supershift não publica um URL scheme/deep link oficial para iOS.
  // A ligação oficial pode abrir a app se o iOS/Supershift tiver Universal Links ativos;
  // caso contrário abre o site oficial, sem usar um esquema inventado.
  location.href=SUPERSHIFT_WEB_URL;
}

function handleHubClick(e){
  if(e.target.closest('[data-hub-close]')){closeHub();return}
  const action=e.target.closest('[data-hub-action]')?.dataset.hubAction;if(!action)return;
  if(action==='moovit'){openMoovitApp();return}
  if(action==='supershift'){openSupershiftApp();return}
  if(action==='schedule')openIntegration('workScheduleSection');
  if(action==='settings')openMoreAt('#settingsForm');
  if(action==='backup')openMoreAt('#exportBtn');
  if(action==='about')openMoreAt('#appVersion');
  if(action==='stats')navigate('stats');
  if(action==='notifications'){closeHub();setTimeout(()=>window.FocoUI?.toggleNotifications?.(true),140)}
  if(action==='updates')checkUpdates();
}

function navigate(view){closeHub();const button=$(`.side-nav [data-nav="${view}"]`)||$(`.bottom-nav [data-nav="${view}"]`);button?.click()}
function openMoreAt(selector){closeHub();bypassMore=true;const button=$('.bottom-nav [data-nav="more"]')||$('.side-nav [data-nav="more"]');button?.click();bypassMore=false;setTimeout(()=>$(selector)?.closest('.panel')?.scrollIntoView({behavior:'smooth',block:'start'}),150)}
function openIntegration(target){
  closeHub();
  const opener=$('#integrationsDesktopButton')||$('.integrations-open');
  if(!opener){notify('As integrações ainda estão a carregar. Tenta novamente.');return}
  opener.click();
  setTimeout(()=>{const el=$(`#${target}`);if(!el)return;if(el.tagName==='BUTTON')el.click();else el.scrollIntoView({behavior:'smooth',block:'start'})},130);
}
async function checkUpdates(){
  closeHub();
  if(!('serviceWorker'in navigator)){notify('Atualizações automáticas não estão disponíveis neste browser.');return}
  try{const reg=await navigator.serviceWorker.getRegistration();if(!reg){notify('Service Worker ainda não está ativo.');return}await reg.update();if(reg.waiting){notify('Nova versão pronta para instalar.','Atualizar',()=>reg.waiting?.postMessage({type:'SKIP_WAITING'}))}else notify('A aplicação já está atualizada.')}catch{notify('Não foi possível verificar atualizações agora.')}
}
function interceptMore(e){const more=e.target.closest?.('[data-nav="more"]');if(!more||bypassMore)return;e.preventDefault();e.stopImmediatePropagation();openHub()}

document.addEventListener('click',interceptMore,true);
window.addEventListener('storage',refreshHub);
ensureHub();
window.FocoHub=Object.freeze({open:openHub,close:closeHub,refresh:refreshHub,openMoovit:openMoovitApp,openSupershift:openSupershiftApp,version:HUB_VERSION});
