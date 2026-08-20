const APP_KEY='foco-jornada-v4';
const FEATURE_KEY='foco-jornada-features-v2';
const VERSION='4.2.0';
const $=s=>document.querySelector(s);

function ensureAboutCss(){if(document.querySelector('#hubAboutCss'))return;const link=document.createElement('link');link.id='hubAboutCss';link.rel='stylesheet';link.href='./hub-about.css';document.head.appendChild(link)}
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const icon=body=>`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${body}</svg>`;
const closeIcon=icon('<path d="m6 6 12 12M18 6 6 18"/>');

function readJSON(key,fallback={}){try{return JSON.parse(localStorage.getItem(key)||'null')||fallback}catch{return fallback}}
function storageBytes(){let n=0;try{for(let i=0;i<localStorage.length;i++){const k=localStorage.key(i)||'';const v=localStorage.getItem(k)||'';n+=(k.length+v.length)*2}}catch{}return n}
function fmtBytes(bytes){if(bytes<1024)return`${bytes} B`;if(bytes<1024*1024)return`${(bytes/1024).toFixed(1)} KB`;return`${(bytes/1024/1024).toFixed(1)} MB`}
function standalone(){return !!(window.matchMedia?.('(display-mode: standalone)').matches||navigator.standalone)}
function notificationState(){if(!('Notification'in window))return'Não suportadas';return ({granted:'Autorizadas',denied:'Bloqueadas',default:'Por autorizar'})[Notification.permission]||Notification.permission}
function dataSummary(){const s=readJSON(APP_KEY,{}),f=readJSON(FEATURE_KEY,{});return{works:s.workSessions?.length||0,activities:s.activities?.length||0,focus:s.focusSessions?.length||0,coffee:s.coffeeEntries?.length||0,shifts:Object.keys(f.shiftPlanner?.assignments||{}).length}}
function row(label,value,id=''){return`<div class="hub-about-row"><span>${esc(label)}</span><b ${id?`id="${id}"`:''}>${esc(value)}</b></div>`}
async function serviceWorkerState(){if(!('serviceWorker'in navigator))return'Não suportado';try{const reg=await navigator.serviceWorker.getRegistration();if(!reg)return'Não registado';if(reg.waiting)return'Atualização pronta';if(reg.installing)return'A instalar';return reg.active?'Ativo':'Registado'}catch{return'Indisponível'}}
function buildDiagnostic(){const d=dataSummary();return[`Foco & Jornada ${VERSION}`,`Modo: ${standalone()?'PWA instalada':'Browser'}`,`Rede: ${navigator.onLine?'Online':'Offline'}`,`Notificações: ${notificationState()}`,`Armazenamento local: ${fmtBytes(storageBytes())}`,`Jornadas: ${d.works}`,`Atividades: ${d.activities}`,`Foco: ${d.focus}`,`Cafés: ${d.coffee}`,`Dias com turno: ${d.shifts}`].join('\n')}

function openAbout(){
  ensureAboutCss();const sheet=$('#appHub .hub-sheet');if(!sheet)return;
  $('#hubHelp')?.remove();$('#hubAbout')?.remove();const d=dataSummary();const p=document.createElement('section');p.id='hubAbout';p.className='hub-about';
  p.innerHTML=`<div class="hub-about-head"><div><span class="kicker">INFORMAÇÃO</span><h3>Sobre</h3></div><button type="button" class="hub-about-close" data-about-close aria-label="Fechar">${closeIcon}</button></div><div class="hub-about-card hub-about-brand"><strong>Foco & Jornada</strong><p>Aplicação local-first para jornada de trabalho, pausas, atividades, Pomodoro, transportes, escala e histórico.</p></div><section class="hub-about-section"><h4>Aplicação</h4><div class="hub-about-card">${row('Versão',VERSION)}${row('Instalação',standalone()?'PWA instalada':'Aberta no browser')}${row('Estado da rede',navigator.onLine?'Online':'Offline')}${row('Service Worker','A verificar…','aboutSwState')}${row('Notificações',notificationState())}${row('Armazenamento',fmtBytes(storageBytes()))}</div></section><section class="hub-about-section"><h4>Dados neste dispositivo</h4><div class="hub-about-card">${row('Jornadas',d.works)}${row('Atividades',d.activities)}${row('Sessões de foco',d.focus)}${row('Registos de café',d.coffee)}${row('Dias com turno',d.shifts)}</div></section><section class="hub-about-section"><h4>Módulos</h4><div class="hub-about-modules"><span>Jornada</span><span>Atividades</span><span>Pomodoro</span><span>Histórico</span><span>Estatísticas</span><span>Moovit</span><span>Supershift</span><span>Backup</span><span>Notificações</span></div></section><div class="hub-about-note">Os dados principais são guardados localmente neste dispositivo. A aplicação não tem atualmente conta de utilizador, base de dados cloud ou sincronização automática entre dispositivos.</div><div class="hub-about-actions"><button type="button" class="btn" id="aboutCopyDiagnostic">Copiar diagnóstico</button><button type="button" class="btn" id="aboutCheckUpdate">Verificar atualização</button></div>`;
  sheet.appendChild(p);p.querySelector('[data-about-close]').onclick=()=>p.remove();
  p.querySelector('#aboutCopyDiagnostic').onclick=async()=>{try{await navigator.clipboard.writeText(buildDiagnostic());window.FocoUI?.notify?.('Diagnóstico copiado.')}catch{window.FocoUI?.notify?.('Não foi possível copiar o diagnóstico.')}};
  p.querySelector('#aboutCheckUpdate').onclick=()=>{p.remove();document.querySelector('[data-hub-action="updates"]')?.click()};
  serviceWorkerState().then(v=>{const el=$('#aboutSwState');if(el)el.textContent=v});requestAnimationFrame(()=>p.classList.add('open'));
}

ensureAboutCss();
document.addEventListener('click',e=>{const t=e.target.closest?.('[data-hub-action="about"]');if(!t)return;e.preventDefault();e.stopImmediatePropagation();openAbout()},true);
window.FocoAbout=Object.freeze({open:openAbout,diagnostic:buildDiagnostic,version:VERSION});
