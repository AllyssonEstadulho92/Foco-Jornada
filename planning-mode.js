const APP_KEY='foco-jornada-v4';
const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const dayKey=t=>{const d=new Date(t),y=d.getFullYear(),m=String(d.getMonth()+1).padStart(2,'0'),day=String(d.getDate()).padStart(2,'0');return `${y}-${m}-${day}`};
const readState=()=>{try{return JSON.parse(localStorage.getItem(APP_KEY)||'null')}catch{return null}};
const isOpen=a=>a&&!['COMPLETED','CANCELLED'].includes(a.status);
const priorityRank=p=>({URGENT:4,HIGH:3,NORMAL:2,LOW:1})[p]||0;
const fi=name=>`<i class="fi fi-rr-${name}" aria-hidden="true"></i>`;

function navigate(view){
  const button=$(`.bottom-nav [data-nav="${view}"]`)||$(`.side-nav [data-nav="${view}"]`);
  button?.click();
}
function openShift(){
  if(window.FocoShiftPlanner?.open){window.FocoShiftPlanner.open();return}
  const button=$('#openSupershift');if(button){button.click();return}
  window.FocoUI?.notify?.('O calendário ainda está a carregar.');
}
function statusLabel(state){
  const work=(state?.workSessions||[]).find(x=>x.status==='ACTIVE');
  const pause=(state?.breakSessions||[]).find(x=>x.status==='ACTIVE');
  if(pause)return 'Em pausa';
  if(work)return 'Jornada em curso';
  return 'Jornada por iniciar';
}
function renderPlanning(){
  const view=$('[data-view="planning"]');if(!view)return;
  const area=$('#planningArea');if(!area)return;
  const state=readState(),today=dayKey(Date.now()),activities=(state?.activities||[]).filter(isOpen),todayItems=activities.filter(a=>a.plannedFor===today),overdue=activities.filter(a=>a.dueAt&&dayKey(a.dueAt)<today),overdueIds=new Set(overdue.map(a=>a.id)),todayIds=new Set(todayItems.map(a=>a.id));
  const priorities=[...activities].sort((a,b)=>Number(overdueIds.has(b.id))-Number(overdueIds.has(a.id))||Number(todayIds.has(b.id))-Number(todayIds.has(a.id))||priorityRank(b.priority)-priorityRank(a.priority)||(b.updatedAt||0)-(a.updatedAt||0)).slice(0,5);
  area.innerHTML=`<section class="planning-summary"><div><span class="kicker">ORGANIZAÇÃO</span><h2>O essencial do dia</h2><p>Jornada, atividades e próximos passos num único lugar.</p></div><button type="button" class="btn primary" data-plan-new>${fi('plus')}<span>Nova atividade</span></button></section><div class="planning-metrics"><article><small>Estado</small><strong>${esc(statusLabel(state))}</strong></article><article><small>Abertas</small><strong>${activities.length}</strong></article><article><small>Para hoje</small><strong>${todayItems.length}</strong></article><article><small>Atrasadas</small><strong>${overdue.length}</strong></article></div><section class="panel planning-priorities"><div class="section-head"><div><span class="kicker">PRIORIDADES</span><h2>Próximas atividades</h2></div><button type="button" class="text-btn" data-plan-activities>Ver todas</button></div><div class="planning-list">${priorities.length?priorities.map(a=>`<button type="button" class="planning-item" data-plan-activities><span class="planning-dot ${String(a.priority||'NORMAL').toLowerCase()}"></span><span><b>${esc(a.title||'Sem título')}</b><small>${overdueIds.has(a.id)?'Atrasada':todayIds.has(a.id)?'Planeada para hoje':a.category?esc(a.category):'Atividade aberta'}</small></span><span class="planning-arrow">${fi('angle-small-right')}</span></button>`).join(''):'<div class="empty">Sem atividades abertas. Cria a próxima quando precisares.</div>'}</div></section><section class="panel planning-actions"><div class="section-head"><div><span class="kicker">ATALHOS</span><h2>Acesso rápido</h2></div></div><div class="planning-action-grid"><button type="button" data-plan-activities>${fi('list-check')}<span><b>Atividades</b><small>Organizar tarefas</small></span></button><button type="button" data-plan-shift>${fi('calendar')}<span><b>Supershift</b><small>Consultar escala</small></span></button><button type="button" data-plan-history>${fi('time-past')}<span><b>Histórico</b><small>Rever o dia</small></span></button><button type="button" data-plan-today>${fi('home')}<span><b>Hoje</b><small>Voltar à jornada</small></span></button></div></section>`;
  area.querySelector('[data-plan-new]')?.addEventListener('click',()=>{navigate('activities');setTimeout(()=>$('#newActivityBtn')?.click(),60)});
  area.querySelectorAll('[data-plan-activities]').forEach(b=>b.addEventListener('click',()=>navigate('activities')));
  area.querySelector('[data-plan-shift]')?.addEventListener('click',openShift);
  area.querySelector('[data-plan-history]')?.addEventListener('click',()=>navigate('history'));
  area.querySelector('[data-plan-today]')?.addEventListener('click',()=>navigate('today'));
}
function replaceStats(){
  const cards=$$('#statsGrid .big-metric');if(cards.length<2)return;
  const state=readState(),period=$('[data-period].on')?.dataset.period||'week',now=Date.now(),start=period==='year'?new Date(new Date(now).getFullYear(),0,1).getTime():now-(period==='month'?30:7)*86400000;
  const days=new Set((state?.workSessions||[]).filter(w=>w.status!=='CANCELLED'&&Number(w.startedAt)>=start&&Number(w.startedAt)<=now).map(w=>dayKey(w.startedAt)));
  cards[1].querySelector('small').textContent='Jornadas';cards[1].querySelector('strong').textContent=days.size;cards[1].querySelector('span').textContent='Dias registados';
  const summary=$('#statsSummary');if(summary)summary.innerHTML=`Foram registados <b>${days.size}</b> dias com jornada neste período. Consulta o gráfico para comparar as horas efetivas.`;
}
function cleanLegacyPresentation(){
  $$('#dailySummaryCard .summary-grid>div').forEach(cell=>{if(/^foco$/i.test(cell.querySelector('small')?.textContent?.trim()||''))cell.remove()});
  const closed=$('#dailySummaryCard .runtime-summary-closed small');if(closed)closed.textContent=closed.textContent.replace(/\s*·\s*[^·]*\bfoco\b/gi,'').replace(/\s{2,}/g,' ').trim();
  const legacyHero=$('#todayHero .hero.focus');if(legacyHero){
    const status=legacyHero.querySelector('.status');if(status)status.textContent='SESSÃO ANTIGA';
    const copy=legacyHero.querySelector('p');if(copy)copy.textContent='Existe um registo antigo ainda ativo. Termina-o para continuar a jornada normalmente.';
    legacyHero.querySelectorAll('[data-action="pauseFocus"],[data-action="resumeFocus"]').forEach(b=>b.hidden=true);
    const end=legacyHero.querySelector('[data-action="endFocus"]');if(end)end.textContent='Encerrar registo antigo';
  }
}
function syncToday(){
  const quick=$('#quickActions [data-action="goFocus"]');
  if(quick){quick.disabled=false;quick.removeAttribute('disabled');quick.innerHTML=`<span>${fi('calendar-lines')}</span><b>Planeamento</b><small>Organizar o dia</small>`;quick.onclick=e=>{e.preventDefault();e.stopImmediatePropagation();navigate('planning')}}
  const metrics=$$('#todayMetrics .metric');if(metrics[2]){const count=(readState()?.activities||[]).filter(isOpen).length;metrics[2].querySelector('small').textContent='Atividades';metrics[2].querySelector('strong').textContent=`${count} abertas`}
}
function render(){
  const planning=$('[data-view="planning"]');if(planning?.classList.contains('on')){const title=$('#pageTitle');if(title)title.textContent='Planeamento'}
  syncToday();renderPlanning();replaceStats();cleanLegacyPresentation();window.FocoFlaticon?.refresh?.();
}

document.addEventListener('foco-render',render);
window.addEventListener('pageshow',render);
const observer=new MutationObserver(mutations=>{if(mutations.some(m=>[...m.addedNodes].some(n=>n.nodeType===1)))queueMicrotask(render)});
observer.observe(document.body,{childList:true,subtree:true});
queueMicrotask(render);
window.FocoPlanningMode=Object.freeze({version:'2.1.0',render});
