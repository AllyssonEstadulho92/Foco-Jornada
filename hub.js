const HUB_VERSION='4.2.0';
const NOTIFICATION_KEY='foco-jornada-notifications-v1';
const MOOVIT_APP_URL='moovit://nearby?partner_id=FocoJornada';
const MOOVIT_FALLBACK_URL='https://moovit.onelink.me/3986059930?pid=Developers&c=FocoJornada';
const $=s=>document.querySelector(s);
let bypassMore=false,hubOpen=false;
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
  tasks:'<rect x="3" y="4" width="18" height="16" rx="3"/><path d="m8 10 2 2 4-4M15 10h3M8 16h10"/>',
  focus:'<circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="3"/><path d="M12 2v2M22 12h-2M12 22v-2M2 12h2"/>',
  help:'<circle cx="12" cy="12" r="9"/><path d="M9.8 9a2.4 2.4 0 1 1 3.8 2c-1.2.8-1.6 1.3-1.6 2.5M12 17h.01"/>',
  shield:'<path d="M12 3 5 6v5c0 5 3 8 7 10 4-2 7-5 7-10V6Z"/><path d="m9 12 2 2 4-4"/>',
  coffee:'<path d="M4 9h13v5a6 6 0 0 1-6 6H10a6 6 0 0 1-6-6Z"/><path d="M17 11h2a3 3 0 0 1 0 6h-2"/>'
};
function unread(){try{return JSON.parse(localStorage.getItem(NOTIFICATION_KEY)||'[]').filter(x=>!x.read).length}catch{return 0}}
function notify(text,label='',fn=null){window.FocoUI?.notify?.(text,label,fn)}
function row(action,ic,title,desc,badge=false){return `<button type="button" class="hub-row" data-hub-action="${action}"><span class="hub-row-icon">${svg(ic)}</span><span class="hub-row-copy"><b>${title}</b>${desc?`<small>${desc}</small>`:''}</span>${badge?'<i class="hub-row-dot" data-hub-notification-dot></i>':''}<span class="hub-row-arrow">${svg(I.chevron)}</span></button>`}
function group(title,content){return `<section class="hub-group"><h3>${title}</h3><div class="hub-list">${content}</div></section>`}
function ensureHub(){
  if($('#appHub'))return;
  const r=document.createElement('section');
  r.id='appHub';r.className='app-hub';r.hidden=true;r.setAttribute('aria-label','Menu Mais');
  r.innerHTML=`<div class="hub-backdrop" data-hub-close></div><div class="hub-sheet" role="dialog" aria-modal="true" aria-labelledby="hubTitle">
    <header class="hub-head"><div><span class="kicker">CENTRAL</span><h2 id="hubTitle">Mais</h2><p>Organização, trabalho e definições.</p></div><button type="button" class="hub-close" data-hub-close aria-label="Fechar">${svg(I.close)}</button></header>
    <div class="hub-scroll">
      <section class="hub-quick" aria-label="Acesso rápido">
        <button type="button" class="hub-quick-item moovit" data-hub-action="moovit"><span>${svg(I.moovit)}</span><div><b>Moovit</b><small>Transportes</small></div></button>
        <button type="button" class="hub-quick-item supershift" data-hub-action="supershift"><span>${svg(I.supershift)}</span><div><b>Supershift</b><small>Escala e turnos</small></div></button>
      </section>
      ${group('Trabalho',row('shifts',I.supershift,'Escala de trabalho','Calendário, relatórios e rotações')+row('schedule',I.clock,'Horário e pausas','Jornada semanal e pausa prevista')+row('stats',I.chart,'Estatísticas','Semana, mês e ano'))}
      ${group('Produtividade',row('activities',I.tasks,'Atividades','Criar, organizar e concluir')+row('focus',I.focus,'Foco e Pomodoro','Sessões e associação a atividade')+row('notifications',I.bell,'Notificações','Avisos, foco, pausas e alterações',true))}
      ${group('Aplicação',row('settings',I.settings,'Definições','Tema, pausas, foco e café')+row('backup',I.backup,'Backup e diagnóstico','Exportar, importar e verificar dados')+row('updates',I.update,'Atualizações','Verificar e instalar nova versão'))}
      ${group('Informação',row('help',I.help,'Ajuda','Como utilizar as principais funções')+row('about',I.info,'Sobre','Versão, dados locais e projeto'))}
      <footer class="hub-footer"><span>Foco & Jornada</span><strong>v${HUB_VERSION}</strong></footer>
    </div>
  </div>`;
  document.body.appendChild(r);r.addEventListener('click',handleHubClick);document.addEventListener('keydown',e=>{if(e.key==='Escape'&&hubOpen)closeHub()});
}
function openHub(){ensureHub();const r=$('#appHub');hubOpen=true;r.hidden=false;requestAnimationFrame(()=>r.classList.add('open'));document.body.classList.add('hub-open');refreshHub()}
function closeHub(){const r=$('#appHub');if(!r)return;hubOpen=false;r.classList.remove('open');document.body.classList.remove('hub-open');setTimeout(()=>{if(!hubOpen)r.hidden=true},220)}
function refreshHub(){const d=$('[data-hub-notification-dot]');if(d)d.classList.toggle('on',unread()>0)}
function launchCustomScheme(appUrl,fallbackUrl){closeHub();let left=false;const vis=()=>{if(document.hidden)left=true};document.addEventListener('visibilitychange',vis);location.href=appUrl;setTimeout(()=>{document.removeEventListener('visibilitychange',vis);if(!left&&!document.hidden&&fallbackUrl)location.href=fallbackUrl},1300)}
function openMoovitApp(){launchCustomScheme(MOOVIT_APP_URL,MOOVIT_FALLBACK_URL)}
function ensureShiftPlannerMobileCss(){const existing=$('#shiftPlannerMobileCss');if(existing)return existing.sheet?Promise.resolve():new Promise(resolve=>{existing.addEventListener('load',resolve,{once:true});existing.addEventListener('error',resolve,{once:true})});const link=document.createElement('link');link.id='shiftPlannerMobileCss';link.rel='stylesheet';link.href='./shift-mobile.css';document.head.appendChild(link);return new Promise(resolve=>{link.addEventListener('load',resolve,{once:true});link.addEventListener('error',resolve,{once:true});setTimeout(resolve,1200)})}
async function openShiftPlanner(){closeHub();try{await ensureShiftPlannerMobileCss();if(window.FocoShiftPlanner?.open)return window.FocoShiftPlanner.open();const mod=await import('./shift-planner.js');mod.open()}catch{notify('Não foi possível abrir a escala de trabalho.')}}
function handleHubClick(e){
  if(e.target.closest('[data-hub-close]')){closeHub();return}
  const action=e.target.closest('[data-hub-action]')?.dataset.hubAction;if(!action)return;
  if(action==='moovit'){openIntegration('moovitSection');return}
  if(action==='supershift'||action==='shifts'){openShiftPlanner();return}
  if(action==='schedule'){openIntegration('workScheduleSection');return}
  if(action==='settings'){openMoreAt('#settingsForm');return}
  if(action==='backup'){openMoreAt('#exportBtn');return}
  if(action==='about'){openMoreAt('#appVersion');return}
  if(action==='stats'||action==='activities'||action==='focus'){navigate(action);return}
  if(action==='notifications'){closeHub();setTimeout(()=>window.FocoUI?.toggleNotifications?.(true),140);return}
  if(action==='updates'){checkUpdates();return}
  if(action==='help'){openHelp();return}
}
function navigate(view){closeHub();const b=$(`.side-nav [data-nav="${view}"]`)||$(`.bottom-nav [data-nav="${view}"]`);b?.click()}
function openMoreAt(selector){closeHub();bypassMore=true;const b=$('.bottom-nav [data-nav="more"]')||$('.side-nav [data-nav="more"]');b?.click();bypassMore=false;setTimeout(()=>$(selector)?.closest('.panel')?.scrollIntoView({behavior:'smooth',block:'start'}),150)}
function openIntegration(target){closeHub();const opener=$('#integrationsDesktopButton')||$('.integrations-open');if(!opener){notify('As integrações ainda estão a carregar.');return}opener.click();setTimeout(()=>document.querySelector(`#${target}`)?.scrollIntoView({behavior:'smooth',block:'start'}),160)}
function openHelp(){
  const sheet=$('#appHub .hub-sheet');if(!sheet)return;
  const old=$('#hubHelp');if(old){old.remove();return}
  const p=document.createElement('section');p.id='hubHelp';p.className='hub-help';p.innerHTML=`<div class="hub-help-head"><div><span class="kicker">AJUDA</span><h3>Guia rápido</h3></div><button type="button" data-help-close aria-label="Fechar">${svg(I.close)}</button></div><div class="hub-help-list"><div>${svg(I.clock)}<span><b>Jornada</b><small>Entra em Hoje para iniciar, pausar e terminar a jornada.</small></span></div><div>${svg(I.tasks)}<span><b>Atividades</b><small>Cria tarefas e associa uma atividade à sessão de foco.</small></span></div><div>${svg(I.focus)}<span><b>Pomodoro</b><small>Usa Foco para iniciar, pausar e retomar sessões.</small></span></div><div>${svg(I.moovit)}<span><b>Transportes</b><small>Configura Casa/Trabalho e planeia a rota pelo Moovit.</small></span></div><div>${svg(I.supershift)}<span><b>Escala</b><small>Gere turnos, rotações, relatórios e exportação ICS.</small></span></div><div>${svg(I.shield)}<span><b>Dados</b><small>Faz backup antes de limpar dados ou trocar de dispositivo.</small></span></div></div>`;sheet.appendChild(p);p.querySelector('[data-help-close]').onclick=()=>p.remove();requestAnimationFrame(()=>p.classList.add('open'))
}
async function checkUpdates(){closeHub();if(!('serviceWorker'in navigator)){notify('Atualizações automáticas não estão disponíveis neste browser.');return}try{const reg=await navigator.serviceWorker.getRegistration();if(!reg){notify('Service Worker ainda não está ativo.');return}await reg.update();if(reg.waiting)notify('Nova versão pronta para instalar.','Atualizar',()=>reg.waiting?.postMessage({type:'SKIP_WAITING'}));else notify('A aplicação já está atualizada.')}catch{notify('Não foi possível verificar atualizações agora.')}}
function interceptMore(e){const more=e.target.closest?.('[data-nav="more"]');if(!more||bypassMore)return;e.preventDefault();e.stopImmediatePropagation();openHub()}
document.addEventListener('click',interceptMore,true);window.addEventListener('storage',refreshHub);ensureHub();window.FocoHub=Object.freeze({open:openHub,close:closeHub,refresh:refreshHub,openMoovit:openMoovitApp,openSupershift:openShiftPlanner,version:HUB_VERSION});
