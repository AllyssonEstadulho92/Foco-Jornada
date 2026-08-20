const BOOT_VERSION='1.4.0';
const APP_KEY='foco-jornada-v4';
const root=document.documentElement;
const shell=document.getElementById('startupShell');
const status=document.getElementById('startupStatus');
const sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms));
const nextFrame=()=>new Promise(resolve=>requestAnimationFrame(()=>resolve()));
let shiftPromise=null,extrasPromise=null,extrasScheduled=false;

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
