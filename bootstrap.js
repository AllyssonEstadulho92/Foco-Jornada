const BOOT_VERSION='1.0.0';
const root=document.documentElement;
const shell=document.getElementById('startupShell');
const status=document.getElementById('startupStatus');
const sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms));
let shiftPromise=null;

function setStatus(text){if(status)status.textContent=text}
function loadClassic(src){return new Promise((resolve,reject)=>{const existing=document.querySelector(`script[data-fj-classic="${src}"]`);if(existing){if(existing.dataset.loaded==='1')return resolve();existing.addEventListener('load',resolve,{once:true});existing.addEventListener('error',reject,{once:true});return}const script=document.createElement('script');script.src=src;script.async=false;script.dataset.fjClassic=src;script.addEventListener('load',()=>{script.dataset.loaded='1';resolve()},{once:true});script.addEventListener('error',()=>reject(new Error(`Falha ao carregar ${src}`)),{once:true});document.head.appendChild(script)})}
async function waitStylesheet(id,timeout=3000){const link=document.getElementById(id);if(!link||link.sheet)return;await Promise.race([new Promise(resolve=>{link.addEventListener('load',resolve,{once:true});link.addEventListener('error',resolve,{once:true})}),sleep(timeout)])}
function revealApp(){root.dataset.fjCoreReady='1';if(shell)shell.hidden=true}
function failBoot(error){console.error('[Foco & Jornada] Falha de arranque',error);root.dataset.fjBoot='error';setStatus('Não foi possível concluir o arranque. Toca em Recarregar para tentar novamente.');const retry=document.getElementById('startupRetry');if(retry){retry.hidden=false;retry.onclick=()=>location.reload()}}
async function loadExtras(){const modules=['./hub.js','./controls.js','./settings-controller.js','./app-links.js','./interaction-fixes.js','./runtime-fixes.js','./summary-guard.js','./professional-ui.js','./install-app.js'];for(const path of modules){try{await import(path)}catch(error){console.error(`[Foco & Jornada] Módulo opcional não carregado: ${path}`,error)}}}
async function loadShift(){if(!shiftPromise)shiftPromise=(async()=>{const planner=await import('./shift-planner.js');await Promise.allSettled([import('./shift-advanced.js'),import('./shift-reports.js'),import('./shift-mobile-interactions.js')]);return planner})();return shiftPromise}

window.FocoBootstrap=Object.freeze({version:BOOT_VERSION,loadShift});

try{
  setStatus('A preparar os dados locais…');
  await loadClassic('./persistence.js');
  setStatus('A carregar a jornada…');
  await import('./ux.js');
  await waitStylesheet('mainCss');
  revealApp();
  requestAnimationFrame(()=>setTimeout(loadExtras,0));
  if('requestIdleCallback'in window)requestIdleCallback(()=>loadShift().catch(()=>{}),{timeout:2500});
  else setTimeout(()=>loadShift().catch(()=>{}),1800);
}catch(error){failBoot(error)}
