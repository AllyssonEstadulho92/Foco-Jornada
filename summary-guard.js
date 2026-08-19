const FEATURE_KEY='foco-jornada-features-v2';
let raf=0;
const $=s=>document.querySelector(s);
const dayKey=()=>new Date().toLocaleDateString('sv-SE');
function read(){try{return JSON.parse(localStorage.getItem(FEATURE_KEY)||'{}')||{}}catch{return{}}}
function write(v){localStorage.setItem(FEATURE_KEY,JSON.stringify(v||{}))}
function fmt(ms){ms=Math.max(0,Number(ms)||0);const h=Math.floor(ms/3600000),m=Math.floor(ms%3600000/60000);return h?`${h}h ${String(m).padStart(2,'0')}m`:`${m} min`}
function money(c){return new Intl.NumberFormat('pt-PT',{style:'currency',currency:'EUR'}).format((Number(c)||0)/100)}
function guard(){const card=$('#dailySummaryCard');if(!card)return;const f=read(),key=dayKey(),closed=Array.isArray(f.closedDays)&&f.closedDays.includes(key);if(!closed)return;if(card.querySelector('.summary-guard-closed'))return;const s=f.dailyClosures?.[key];card.hidden=false;card.innerHTML=`<div class="runtime-summary-closed summary-guard-closed"><div><span class="kicker">FECHO DO DIA</span><b>Dia fechado${s?.closedAt?` às ${new Intl.DateTimeFormat('pt-PT',{hour:'2-digit',minute:'2-digit'}).format(new Date(s.closedAt))}`:''}</b><small>${s?`${fmt(s.effectiveWorkMs)} efetivos · ${fmt(s.focusMs)} foco · ${s.completedActivities||0} atividades · ${s.coffeeCount||0} cafés (${money(s.coffeeSpendCents)})`:'Resumo arquivado neste dispositivo.'}</small></div><button type="button" class="btn" data-summary-guard-reopen>Reabrir dia</button></div>`}
function schedule(){if(raf)return;raf=requestAnimationFrame(()=>{raf=0;guard()})}
document.addEventListener('click',e=>{const b=e.target.closest?.('[data-summary-guard-reopen]');if(!b)return;e.preventDefault();e.stopImmediatePropagation();const f=read(),key=dayKey();f.closedDays=(Array.isArray(f.closedDays)?f.closedDays:[]).filter(x=>x!==key);if(f.dailyClosures)delete f.dailyClosures[key];write(f);location.reload()},true);
new MutationObserver(schedule).observe(document.body,{childList:true,subtree:true});window.addEventListener('pageshow',schedule);schedule();
