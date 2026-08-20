(function(){
'use strict';
const VERSION='1.0.1';
const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];
let retries=0;

function clearLegacyBlockers(){
  for(const selector of ['#startupShell','#bootstrapShell','[data-startup-shell]','.startup-shell','.bootstrap-shell']){
    $$(selector).forEach(el=>el.remove());
  }
  const targets=[document.documentElement,document.body,$('.layout'),$('.app'),$('.sidebar'),$('.bottom-nav')].filter(Boolean);
  for(const el of targets){
    el.removeAttribute('inert');
    if(el.style?.pointerEvents==='none')el.style.removeProperty('pointer-events');
  }
  document.documentElement.removeAttribute('data-fj-boot');
  document.documentElement.dataset.fjTouchRecovery='1';
}

function appHasHandlers(){
  const nav=$('.bottom-nav [data-nav="activities"]')||$('.side-nav [data-nav="activities"]');
  return typeof nav?.onclick==='function';
}

function fallbackNavigate(e){
  const button=e.target.closest?.('button[data-nav]');
  if(!button||typeof button.onclick==='function')return;
  const view=button.dataset.nav;if(!view)return;
  $$('.view').forEach(el=>el.classList.toggle('on',el.dataset.view===view));
  $$('[data-nav]').forEach(el=>el.classList.toggle('on',el.dataset.nav===view));
  const title=$('#pageTitle');if(title)title.textContent=({today:'Hoje',activities:'Atividades',focus:'Planeamento',history:'Histórico',stats:'Estatísticas',more:'Mais'})[view]||'Foco & Jornada';
}

function showRecoveryNotice(){
  if($('#fjBootRecoveryNotice')||appHasHandlers())return;
  const notice=document.createElement('div');notice.id='fjBootRecoveryNotice';notice.setAttribute('role','status');
  notice.style.cssText='position:fixed;left:12px;right:12px;bottom:calc(82px + env(safe-area-inset-bottom));z-index:9999;display:flex;align-items:center;justify-content:space-between;gap:10px;padding:12px 14px;border:1px solid rgba(255,255,255,.16);border-radius:12px;background:#111b28;color:#fff;box-shadow:none;font:600 13px/1.35 system-ui,-apple-system,sans-serif';
  notice.innerHTML='<span>A aplicação não terminou o arranque.</span><button type="button" style="border:0;border-radius:9px;padding:9px 12px;background:#2388ff;color:white;font:700 13px system-ui,-apple-system,sans-serif">Recarregar</button>';
  notice.querySelector('button').onclick=()=>location.reload();document.body.appendChild(notice);
}

async function ensureInteractive(){
  clearLegacyBlockers();
  if(appHasHandlers()){document.documentElement.dataset.fjAppInteractive='1';$('#fjBootRecoveryNotice')?.remove();return}
  try{await import('./app.js')}catch{}
  clearLegacyBlockers();
  if(appHasHandlers()){document.documentElement.dataset.fjAppInteractive='1';$('#fjBootRecoveryNotice')?.remove();return}
  if(retries++<8){setTimeout(ensureInteractive,350);return}
  showRecoveryNotice();
}

document.addEventListener('click',fallbackNavigate,false);
document.addEventListener('DOMContentLoaded',()=>{clearLegacyBlockers();setTimeout(ensureInteractive,80)},{once:true});
window.addEventListener('pageshow',()=>{retries=0;setTimeout(ensureInteractive,80)});
setTimeout(ensureInteractive,700);
window.FocoBootRecovery=Object.freeze({version:VERSION,refresh:ensureInteractive,clear:clearLegacyBlockers});
})();