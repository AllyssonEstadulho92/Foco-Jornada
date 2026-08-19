export const PROFESSIONAL_VERSION='1.0.1';

export function localDayKey(value=Date.now()){
  const d=value instanceof Date?value:new Date(value);
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}

export function todayShift(features={},now=Date.now()){
  const planner=features?.shiftPlanner||{};
  const key=localDayKey(now);
  const assignment=planner?.assignments?.[key];
  if(assignment){
    const template=(planner.templates||[]).find(t=>t.id===assignment.templateId)||null;
    if(template)return {source:'planner',key,assignment,template,label:template.name,start:assignment.start||template.start||null,end:assignment.end||template.end||null,kind:template.kind||'work'};
  }
  const weekday=new Date(now).getDay();
  const plan=features?.schedule?.[weekday]||features?.schedule?.[String(weekday)]||null;
  if(plan?.start&&plan?.end)return {source:'schedule',key,assignment:null,template:null,label:'Horário previsto',start:plan.start,end:plan.end,kind:'work'};
  return null;
}

export function activeState(app={}){
  const work=(app.workSessions||[]).find(x=>x.status==='ACTIVE')||null;
  const pause=(app.breakSessions||[]).find(x=>x.status==='ACTIVE')||null;
  const focus=(app.focusSessions||[]).find(x=>x.status==='ACTIVE'||x.status==='PAUSED')||null;
  const activity=(app.activities||[]).find(x=>x.status==='ACTIVE')||null;
  return {work,pause,focus,activity};
}

export function commandModel(app={},features={},now=Date.now()){
  const active=activeState(app),shift=todayShift(features,now);
  let status='Livre',nextTitle='Organizar atividades',nextAction='activities',tone='neutral',detail='Escolhe o que fazer a seguir.';
  if(active.pause){status='Em pausa';nextTitle='Regressar da pausa';nextAction='today';tone='warning';detail='Existe uma pausa ativa.'}
  else if(active.focus){status=active.focus.status==='PAUSED'?'Foco pausado':'Em foco';nextTitle=active.focus.status==='PAUSED'?'Retomar foco':'Continuar foco';nextAction='focus';tone='primary';detail='Sessão Pomodoro em curso.'}
  else if(active.work){status='Em jornada';nextTitle=active.activity?'Continuar atividade':'Escolher atividade';nextAction='activities';tone='success';detail=active.activity?active.activity.title:'Jornada ativa sem atividade em curso.'}
  else if(shift&&['work','holiday'].includes(shift.kind)){status='Turno previsto';nextTitle='Iniciar jornada';nextAction='today';tone='primary';detail=shift.start&&shift.end?`${shift.start}–${shift.end}`:shift.label}
  return {status,nextTitle,nextAction,tone,detail,shift,active};
}

export function buildSearchIndex(app={},features={}){
  const staticItems=[
    ['today','Hoje','Jornada, ações rápidas e resumo','Principal','nav:today'],
    ['activities','Atividades','Subtarefas, prazos, recorrência e etiquetas','Produtividade','nav:activities'],
    ['focus','Foco e Pomodoro','Sessões, ciclos automáticos e objetivo diário','Produtividade','nav:focus'],
    ['history','Histórico','Jornadas e linha temporal','Principal','nav:history'],
    ['stats','Estatísticas','Semana, mês e ano','Relatórios','nav:stats'],
    ['shifts','Supershift / Escala','Calendário, turnos, férias e relatórios','Trabalho','shift'],
    ['moovit','Moovit / Transportes','Casa, Trabalho, Perto de mim e rotas','Transportes','moovit'],
    ['settings','Definições','Tema, pausas, foco, café e notificações','Aplicação','more:settings'],
    ['backup','Backup e diagnóstico','Exportar, importar e verificar dados','Dados','more:backup'],
    ['notifications','Notificações','Centro de avisos da aplicação','Aplicação','notifications'],
    ['updates','Atualizações','Verificar nova versão da PWA','Aplicação','updates'],
    ['about','Sobre','Versão, armazenamento e estado técnico','Informação','more:about'],
    ['help','Ajuda','Manual e instruções de utilização','Informação','help']
  ].map(([id,title,subtitle,category,action])=>({id,title,subtitle,category,action,keywords:`${title} ${subtitle} ${category}`.toLowerCase()}));
  const activityItems=(app.activities||[]).filter(a=>a.status!=='CANCELLED').map(a=>{const tags=(a.tags||[]).join(' '),subtasks=(a.subtasks||[]).map(s=>s.title).join(' ');return{id:`activity:${a.id}`,title:a.title||'Atividade',subtitle:[a.category,a.status,a.plannedFor].filter(Boolean).join(' · ')||'Atividade',category:'Atividades',action:'nav:activities',keywords:`${a.title||''} ${a.category||''} ${a.description||''} ${a.status||''} ${a.recurrence||''} ${tags} ${subtasks}`.toLowerCase()}});
  const templateItems=(features?.shiftPlanner?.templates||[]).map(t=>({id:`shift:${t.id}`,title:t.name||'Turno',subtitle:[t.start&&t.end?`${t.start}–${t.end}`:'Dia inteiro',t.kind].filter(Boolean).join(' · '),category:'Turnos',action:'shift',keywords:`${t.name||''} ${t.code||''} ${t.kind||''}`.toLowerCase()}));
  return [...staticItems,...activityItems,...templateItems];
}

export function searchItems(items=[],query='',limit=12){
  const q=String(query||'').trim().toLowerCase();
  if(!q)return items.slice(0,limit);
  const tokens=q.split(/\s+/).filter(Boolean);
  return items.map(item=>{
    const hay=`${item.title} ${item.subtitle} ${item.category} ${item.keywords||''}`.toLowerCase();
    let score=0;
    if(item.title.toLowerCase().startsWith(q))score+=8;
    if(item.title.toLowerCase().includes(q))score+=5;
    for(const token of tokens)if(hay.includes(token))score+=2;
    return {item,score};
  }).filter(x=>x.score>0).sort((a,b)=>b.score-a.score||a.item.title.localeCompare(b.item.title,'pt')).slice(0,limit).map(x=>x.item);
}

export function diagnosticSnapshot(app={},features={},env={}){
  const planner=features?.shiftPlanner||{};
  return {
    online:env.online!==false,
    standalone:!!env.standalone,
    serviceWorker:env.serviceWorker||'desconhecido',
    notifications:env.notifications||'indisponível',
    storageBytes:Math.max(0,Number(env.storageBytes)||0),
    counts:{
      jornadas:(app.workSessions||[]).length,
      atividades:(app.activities||[]).length,
      foco:(app.focusSessions||[]).length,
      cafes:(app.coffeeEntries||[]).length,
      turnos:Object.keys(planner.assignments||{}).length,
      modelos:(planner.templates||[]).length
    }
  };
}
