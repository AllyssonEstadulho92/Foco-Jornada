const APP_KEY='foco-jornada-v4';
const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const dayKey=t=>{const d=new Date(t),y=d.getFullYear(),m=String(d.getMonth()+1).padStart(2,'0'),day=String(d.getDate()).padStart(2,'0');return `${y}-${m}-${day}`};
const readState=()=>{try{return JSON.parse(localStorage.getItem(APP_KEY)||'null')}catch{return null}};
const isOpen=a=>a&&!['COMPLETED','CANCELLED'].includes(a.status);
const priorityRank=p=>({URGENT:4,HIGH:3,NORMAL:2,LOW:1})[p]||0;

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
  const view=$('[data-view="focus"]');if(!view)return;
  let area=$('#planningArea');if(!area){area=document.createElement('div');area.id='planningArea';view.appendChild(area)}
  const state=readState(),today=dayKey(Date.now()),activities=(state?.activities||[]).filter(isOpen),todayItems=activities.filter(a=>a.plannedFor===today),overdue=activities.filter(a=>a.dueAt&&dayKey(a.dueAt)<today),overdueIds=new Set(overdue.map(a=>a.id)),todayIds=new Set(todayItems.map(a=>a.id));
  const priorities=[...activities].sort((a,b)=>Number(overdueIds.has(b.id))-Number(overdueIds.has(a.id))||Number(todayIds.has(b.id))-Number(todayIds.has(a.id))||priorityRank(b.priority)-priorityRank(a.priority)||(b.updatedAt||0)-(a.updatedAt||0)).slice(0,5);
  area.innerHTML=`<section class="planning-summary"><div><span class="kicker">ORGANIZAÇÃO</span><h2>O essencial do dia</h2><p>Jornada, atividades e próximos passos num único lugar.</p></div><button type="button" class="btn primary" data-plan-new>+ Nova atividade</button></section><div class="planning-metrics"><article><small>Estado</small><strong>${esc(statusLabel(state))}</strong></article><article><small>Abertas</small><strong>${activities.length}</strong></article><article><small>Para hoje</small><strong>${todayItems.length}</strong></article><article><small>Atrasadas</small><strong>${overdue.length}</strong></article></div><section class="panel planning-priorities"><div class="section-head"><div><span class="kicker">PRIORIDADES</span><h2>Próximas atividades</h2></div><button type="button" class="text-btn" data-plan-activities>Ver todas</button></div><div class="planning-list">${priorities.length?priorities.map(a=>`<button type="button" class="planning-item" data-plan-activities><span class="planning-dot ${String(a.priority||'NORMAL').toLowerCase()}"></span><span><b>${esc(a.title||'Sem título')}</b><small>${overdueIds.has(a.id)?'Atrasada':todayIds.has(a.id)?'Planeada para hoje':a.category?esc(a.category):'Atividade aberta'}</small></span><span class="planning-arrow">→</span></button>`).join(''):'<div class="empty">Sem atividades abertas. Cria a próxima quando precisares.</div>'}</div></section><section class="panel planning-actions"><div class="section-head"><div><span class="kicker">ATALHOS</span><h2>Acesso rápido</h2></div></div><div class="planning-action-grid"><button type="button" data-plan-activities><b>Atividades</b><small>Organizar tarefas</small></button><button type="button" data-plan-shift><b>Supershift</b><small>Consultar escala</small></button><button type="button" data-plan-history><b>Histórico</b><small>Rever o dia</small></button><button type="button" data-plan-today><b>Hoje</b><small>Voltar à jornada</small></button></div></section>`;
  area.querySelector('[data-plan-new]')?.addEventListener('click',()=>{navigate('activities');setTimeout(()=>$('#newActivityBtn')?.click(),60)});
  area.querySelectorAll('[data-plan-activities]').forEach(b=>b.addEventListener('click',()=>navigate('activities')));
  area.querySelector('[data-plan-shift]')?.addEventListener('click',openShift);
  area.querySelector('[data-plan-history]')?.addEventListener('click',()=>navigate('history'));
  area.querySelector('[data-plan-today]')?.addEventListener('click',()=>navigate('today'));
}
function replaceStats(){
  const grid=$('#statsGrid');if(!grid)return;
  const cards=$$('.big-metric');if(cards.length<2)return;
  const state=readState(),period=$('[data-period].on')?.dataset.period||'week',now=Date.now(),start=period==='year'?new Date(new Date(now).getFullYear(),0,1).getTime():now-(period==='month'?30:7)*86400000;
  const days=new Set((state?.workSessions||[]).filter(w=>w.status!=='CANCELLED'&&Number(w.startedAt)>=start&&Number(w.startedAt)<=now).map(w=>dayKey(w.startedAt)));
  cards[1].querySelector('small').textContent='Jornadas';cards[1].querySelector('strong').textContent=days.size;cards[1].querySelector('span').textContent='Dias registados';
  const summary=$('#statsSummary');if(summary)summary.innerHTML=summary.innerHTML.replace(/ e <b>[^<]*<\/b> de foco/,'');
}
function replaceVisibleFocus(){
  $$('[data-nav="focus"]').forEach(b=>{const small=b.querySelector('small');if(small){const icon=b.querySelector('span');if(icon)icon.textContent='▦';small.textContent='Planeamento'}else b.innerHTML='<span>▦</span>Planeamento'});
  const title=$('#pageTitle');if(title&&$('[data-view="focus"]')?.classList.contains('on'))title.textContent='Planeamento';
  const quick=$('#quickActions [data-action="goFocus"]');if(quick){quick.disabled=false;quick.innerHTML='<span>▦</span><b>Planeamento</b><small>Organizar o dia</small>';quick.onclick=e=>{e.preventDefault();e.stopImmediatePropagation();navigate('focus')}}
  const metrics=$$('#todayMetrics .metric');if(metrics[2]){const state=readState(),count=(state?.activities||[]).filter(isOpen).length;metrics[2].querySelector('small').textContent='Atividades';metrics[2].querySelector('strong').textContent=`${count} abertas`}
  for(const id of ['setFocus','setShort','setLong','setCycles'])$('#'+id)?.closest('label')?.classList.add('focus-setting-hidden');
  const notice=$('#setNotifications')?.closest('label')?.querySelector('span');if(notice)notice.textContent='Notificações quando uma pausa terminar';
  renderPlanning();replaceStats();
}

document.addEventListener('foco-render',replaceVisibleFocus);
window.addEventListener('pageshow',replaceVisibleFocus);
queueMicrotask(replaceVisibleFocus);
window.FocoPlanningMode=Object.freeze({version:'1.0.1',render:replaceVisibleFocus});
