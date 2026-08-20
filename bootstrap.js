const BOOT_VERSION='1.5.0';
const APP_KEY='foco-jornada-v4';
const root=document.documentElement;
const shell=document.getElementById('startupShell');
const status=document.getElementById('startupStatus');
const sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms));
const nextFrame=()=>new Promise(resolve=>requestAnimationFrame(()=>resolve()));
let shiftPromise=null,extrasPromise=null,extrasScheduled=false;

const BRAND_MARK=`<svg class="fj-brand-mark" viewBox="0 0 120 120" aria-hidden="true" focusable="false"><g fill="none" stroke-linecap="round" stroke-linejoin="round"><g class="fj-brand-orbit" stroke="#eef4ff" stroke-width="5"><path d="M60 10v12M60 98v12M10 60h12M98 60h12"/><circle cx="60" cy="60" r="40" stroke-dasharray="58 17"/></g><circle cx="60" cy="60" r="25" stroke="#a8b7cf" stroke-width="4" stroke-dasharray="50 18"/><path class="fj-brand-route" d="M26 91C35 70 49 72 61 63c10-8 17-18 23-30" stroke="#4b8dff" stroke-width="6"/><path class="fj-brand-route" d="m74 35 11-3-1 11" stroke="#4b8dff" stroke-width="6"/></g></svg>`;

function installBrandVisual(){
  if(!document.getElementById('fjBrandStartupStyle')){
    const style=document.createElement('style');
    style.id='fjBrandStartupStyle';
    style.textContent=`#startupShell .startup-card.fj-branded-startup{width:min(430px,100%);padding:22px;text-align:center;border:0;background:transparent;box-shadow:none}#startupShell .fj-startup-mark{width:112px;height:112px;margin:0 auto 12px;display:grid;place-items:center}#startupShell .fj-brand-mark{display:block;width:100%;height:100%;overflow:visible}#startupShell .fj-brand-orbit{transform-box:fill-box;transform-origin:center;animation:fjBrandOrbit 5s linear infinite}#startupShell .fj-brand-route{stroke-dasharray:126;stroke-dashoffset:126;animation:fjBrandRoute 1.65s ease-in-out infinite}#startupShell .fj-branded-startup small{display:flex;align-items:center;justify-content:center;gap:5px;color:#6d9cff;font-size:10px;letter-spacing:.18em;font-weight:900}#startupShell .fj-branded-startup h1{margin:8px 0 8px;font-size:clamp(28px,7vw,38px);font-weight:650;letter-spacing:-.045em}#startupShell .fj-branded-startup h1 span{color:#4b8dff}#startupShell .fj-branded-startup p{margin:0;color:#91a2ae;font-size:14px;line-height:1.5}#startupShell .fj-dots{display:inline-flex;gap:2px;letter-spacing:0}#startupShell .fj-dots i{display:block;width:3px;height:3px;border-radius:50%;background:#6d9cff;animation:fjBrandDot 1.2s ease-in-out infinite}#startupShell .fj-dots i:nth-child(2){animation-delay:.16s}#startupShell .fj-dots i:nth-child(3){animation-delay:.32s}.logo .fj-brand-mini{display:grid!important;place-items:center!important;width:34px!important;height:34px!important;border-radius:11px!important;background:#0b1724!important;color:inherit!important;overflow:hidden!important}.logo .fj-brand-mini .fj-brand-mark{width:28px;height:28px}.logo .fj-brand-mini .fj-brand-orbit{transform:none;animation:none}.logo .fj-brand-mini .fj-brand-route{stroke-dasharray:none;stroke-dashoffset:0;animation:none}@keyframes fjBrandOrbit{to{transform:rotate(360deg)}}@keyframes fjBrandRoute{0%,15%{stroke-dashoffset:126;opacity:.38}58%,78%{stroke-dashoffset:0;opacity:1}100%{stroke-dashoffset:-126;opacity:.42}}@keyframes fjBrandDot{0%,70%,100%{opacity:.25;transform:translateY(0)}35%{opacity:1;transform:translateY(-2px)}}@media(prefers-reduced-motion:reduce){#startupShell .fj-brand-orbit,#startupShell .fj-brand-route,#startupShell .fj-dots i{animation:none!important}#startupShell .fj-brand-route{stroke-dashoffset:0!important}}`;
    document.head.appendChild(style);
  }
  const card=shell?.querySelector('.startup-card');
  if(card&&!card.dataset.brandVisual){
    card.dataset.brandVisual='1';
    card.classList.add('fj-branded-startup');
    card.insertAdjacentHTML('afterbegin',`<div class="fj-startup-mark">${BRAND_MARK}</div>`);
    const kicker=card.querySelector('small');
    if(kicker)kicker.innerHTML='A INICIAR <span class="fj-dots" aria-hidden="true"><i></i><i></i><i></i></span>';
    const title=card.querySelector('h1');
    if(title)title.innerHTML='Foco <span>&amp;</span> Jornada';
  }
  const sidebarMark=document.querySelector('.logo > span');
  if(sidebarMark&&!sidebarMark.classList.contains('fj-brand-mini')){
    sidebarMark.classList.add('fj-brand-mini');
    sidebarMark.innerHTML=BRAND_MARK;
  }
}

function setStatus(text){if(status)status.textContent=text}
function loadClassic(src){return new Promise((resolve,reject)=>{const existing=document.querySelector(`script[data-fj-classic="${src}"]`);if(existing){if(existing.dataset.loaded==='1')return resolve();existing.addEventListener('load',resolve,{once:true});existing.addEventListener('error',reject,{once:true});return}const script=document.createElement('script');script.src=src;script.async=false;script.dataset.fjClassic=src;script.addEventListener('load',()=>{script.dataset.loaded='1';resolve()},{once:true});script.addEventListener('error',()=>reject(new Error(`Falha ao carregar ${src}`)),{once:true});document.head.appendChild(script)})}
async function waitStylesheet(id,timeout=3000){const link=document.getElementById(id);if(!link||link.sheet)return;await Promise.race([new Promise(resolve=>{link.addEventListener('load',resolve,{once:true});link.addEventListener('error',resolve,{once:true})}),sleep(timeout)])}
function revealApp(){root.dataset.fjCoreReady='1';if(shell)shell.hidden=true}
function failBoot(error){console.error('[Foco & Jornada] Falha de arranque',error);root.dataset.fjBoot='error';setStatus('Não foi possível concluir o arranque. Toca em Recarregar para tentar novamente.');const retry=document.getElementById('startupRetry');if(retry){retry.hidden=false;retry.onclick=()=>location.reload()}}
async function disableFirstUse(){const raw=localStorage.getItem(APP_KEY);try{const C=await import('./core.js');const state=raw?C.migrateState(JSON.parse(raw)):C.createInitialState();if(!state?.settings||state.settings.onboardingDone===true)return;state.settings.onboardingDone=true;state.updatedAt=Date.now();localStorage.setItem(APP_KEY,JSON.stringify(state))}catch(error){console.error('[Foco & Jornada] Não foi possível remover a primeira utilização',error)}}
async function loadExtras(){if(extrasPromise)return extrasPromise;extrasPromise=(async()=>{const modules=['./ux.js','./hub.js','./controls.js','./settings-controller.js','./app-links.js','./interaction-fixes.js','./runtime-fixes.js','./summary-guard.js','./professional-ui.js','./install-app.js'];for(const path of modules){try{await nextFrame();await sleep(35);await import(path)}catch(error){console.error(`[Foco & Jornada] Módulo opcional não carregado: ${path}`,error)}}})();return extrasPromise}
function scheduleExtras(){if(extrasScheduled)return;extrasScheduled=true;const start=()=>loadExtras().catch(error=>console.error('[Foco & Jornada] Extras não carregados',error));if('requestIdleCallback'in window){requestIdleCallback(start,{timeout:1800});return}setTimeout(start,700)}
async function loadShift(){if(!shiftPromise)shiftPromise=(async()=>{const planner=await import('./shift-planner.js');await Promise.allSettled([import('./shift-advanced.js'),import('./shift-reports.js'),import('./shift-mobile-interactions.js')]);return planner})();return shiftPromise}

window.FocoBootstrap=Object.freeze({version:BOOT_VERSION,loadShift,loadExtras});

installBrandVisual();
try{
  setStatus('A preparar os dados locais…');
  await loadClassic('./persistence.js');
  await disableFirstUse();
  setStatus('A carregar a jornada…');
  await import('./stability.js');
  await waitStylesheet('mainCss');
  revealApp();
  scheduleExtras();
}catch(error){failBoot(error)}
