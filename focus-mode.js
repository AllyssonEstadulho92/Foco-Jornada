import * as C from './core.js';
import {focusModeSummary,recentFocusSessions} from './focus-mode-core.js';

const APP_KEY='foco-jornada-v4';
const FEATURE_KEY='foco-jornada-features-v2';
const RETURN_KEY='foco-jornada-focus-mode-return-v1';
const $=s=>document.querySelector(s);
let root=null,renderQueued=false,lastKey='';

function readApp(){try{return C.migrateState(JSON.parse(localStorage.getItem(APP_KEY)||'null'))}catch{return C.createInitialState()}}
function readFeatures(){try{return JSON.parse(localStorage.getItem(FEATURE_KEY)||'{}')||{}}catch{return{}}}
function writeFeatures(features){localStorage.setItem(FEATURE_KEY,JSON.stringify(features||{}));window.FocoPersistence?.snapshot?.()}
function prefs(){const f=readFeatures();return{activityId:f.focusMode?.activityId||null,dailyGoalMinutes:Math.max(15,Math.min(720,Number(f.focusMode?.dailyGoalMinutes)||120))}}
function savePrefs(patch){const f=readFeatures(),current=prefs();f.focusMode={...(f.focusMode||{}),...current,...patch};writeFeatures(f);return f.focusMode}
function notify(text){window.FocoUI?.notify?.(text)}
function esc(v){return String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
function fmtClock(ms){ms=Math.max(0,Number(ms)||0);const h=Math.floor(ms/C.MS.hour),m=Math.floor(ms%C.MS.hour/C.MS.minute),s=Math.floor(ms%C.MS.minute/1000);return h?`${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`:`${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`}
function fmtTime(ts){return new Intl.DateTimeFormat('pt-PT',{hour:'2-digit',minute:'2-digit'}).format(new Date(ts))}
function fmtDate(ts){return new Intl.DateTimeFormat('pt-PT',{day:'2-digit',month:'short'}).format(new Date(ts))}
function navigate(view){const b=$(`.bottom-nav [data-nav="${view}"]`)||$(`.side-nav [data-nav="${view}"]`);b?.click()}
function waitUntil(fn,timeout=2400){return new Promise(resolve=>{const start=Date.now();const check=()=>{let value=null;try{value=fn()}catch{}if(value)return resolve(value);if(Date.now()-start>=timeout)return resolve(null);setTimeout(check,35)};check()})}

function ensureRoot(){
  const view=$('[data-view="focus"]');if(!view)return null;
  if(root?.isConnected)return root;
  root=document.createElement('div');root.id='focusModeRoot';root.className='focus-mode-root';
  const legacy=$('#focusArea');view.insertBefore(root,legacy||view.firstChild);
  document.documentElement.classList.add('focus-mode-v2');
  root.addEventListener('click',onClick);root.addEventListener('change',onChange);return root;
}

function openActivities(){sessionStorage.setItem(RETURN_KEY,'1');navigate('activities');setTimeout(()=>$('#newActivityBtn')?.click(),90)}
function finishActivityReturn(){
  if(sessionStorage.getItem(RETURN_KEY)!=='1')return;
  setTimeout(()=>{
    if($('#dialogRoot .dialog'))return;
    const app=readApp(),latest=(app.activities||[]).filter(a=>!['COMPLETED','CANCELLED'].includes(a.status)).sort((a,b)=>(b.createdAt||0)-(a.createdAt||0))[0];
    if(latest?.id)savePrefs({activityId:latest.id});
    sessionStorage.removeItem(RETURN_KEY);navigate('focus');queueRender();
  },160);
}

async function startSession(){
  let app=readApp();
  if(C.activeBreak(app))return notify('Termina primeiro a pausa em curso.');
  if(C.activeFocus(app))return notify('Já existe uma sessão de foco em curso.');
  const p=prefs(),activityId=$('#focusModeActivity')?.value||p.activityId||'';
  savePrefs({activityId:activityId||null});

  if(!C.activeWork(app)){
    navigate('today');
    const start=await waitUntil(()=>document.querySelector('[data-view="today"] [data-action="startWork"]:not([disabled])'));
    if(!start){notify('Não foi possível preparar a jornada.');navigate('focus');return}
    start.click();
    const work=await waitUntil(()=>C.activeWork(readApp()));
    if(!work){notify('A jornada não foi iniciada.');navigate('focus');return}
  }

  navigate('focus');
  const legacyStart=await waitUntil(()=>$('#focusArea [data-action="startFocus"]'));
  if(!legacyStart){notify('Não foi possível preparar a sessão de foco.');queueRender();return}
  const legacySelect=$('#focusActivity');
  if(legacySelect&&[...legacySelect.options].some(o=>o.value===activityId))legacySelect.value=activityId;
  legacyStart.removeAttribute('disabled');legacyStart.disabled=false;legacyStart.click();
  const focus=await waitUntil(()=>C.activeFocus(readApp()));
  if(!focus){notify('Não foi possível iniciar a sessão.');return}
  notify('Modo Foco iniciado.');queueRender();
}

function runLegacyAction(action){const button=$(`#focusArea [data-action="${action}"]`);if(button){button.click();setTimeout(queueRender,30);return true}return false}
function onClick(e){
  const button=e.target.closest('[data-focus-mode-action]');if(!button)return;
  e.preventDefault();e.stopPropagation();
  const action=button.dataset.focusModeAction;
  if(action==='start')startSession();
  else if(action==='create-activity')openActivities();
  else if(action==='pause')runLegacyAction('pauseFocus');
  else if(action==='resume')runLegacyAction('resumeFocus');
  else if(action==='complete')runLegacyAction('endFocus');
  else if(action==='activities')navigate('activities');
  else if(action==='settings'){navigate('more');setTimeout(()=>$('#setFocus')?.scrollIntoView({behavior:'smooth',block:'center'}),90)}
}
function onChange(e){
  if(e.target.id==='focusModeActivity')savePrefs({activityId:e.target.value||null});
  if(e.target.id==='focusModeGoal'){const value=Math.max(15,Math.min(720,Number(e.target.value)||120));savePrefs({dailyGoalMinutes:value});queueRender()}
}

function activityName(app,id){return app.activities?.find(a=>a.id===id)?.title||''}
function activeHtml(app,focus,summary){
  const remaining=C.focusRemainingMs(focus,Date.now()),pct=Math.min(100,Math.max(0,100-remaining/Math.max(1,focus.targetDurationMs)*100));
  const activity=activityName(app,focus.activityId),legacy=focus.phase!=='FOCUS';
  return `<section class="focus-mode-stage ${legacy?'legacy':''}">
    <div class="focus-mode-stage-head"><div><span class="kicker">${legacy?'ESTADO ANTIGO':'MODO FOCO'}</span><h2>${legacy?'Finalizar sessão Pomodoro antiga':activity?esc(activity):'Sessão de concentração'}</h2></div><span class="focus-mode-context">${focus.workSessionId?'Dentro da jornada':'Sessão independente'}</span></div>
    <div class="focus-mode-timer-wrap"><div class="focus-mode-ring" style="--focus-progress:${pct*3.6}deg"><div><small>${focus.status==='PAUSED'?'PAUSADO':legacy?'COMPATIBILIDADE':'EM FOCO'}</small><strong>${fmtClock(remaining)}</strong><span>${Math.round((focus.targetDurationMs||0)/C.MS.minute)} min</span></div></div></div>
    <p class="focus-mode-message">${legacy?'Este estado veio do Pomodoro anterior. Conclui-o para ficares apenas com o novo Modo Foco.':'Sem ciclos automáticos nem pausas criadas sozinhas. Tu controlas quando começa e termina.'}</p>
    <div class="focus-mode-actions">${focus.status==='PAUSED'?'<button class="btn primary" data-focus-mode-action="resume">Retomar</button>':'<button class="btn primary" data-focus-mode-action="pause">Pausar</button>'}<button class="btn" data-focus-mode-action="complete">Concluir sessão</button></div>
    <div class="focus-mode-progress"><span><b>${summary.minutes}</b> / ${summary.goalMinutes} min hoje</span><div><i style="width:${summary.progress}%"></i></div></div>
  </section>`;
}
function idleHtml(app,summary){
  const p=prefs(),activities=(app.activities||[]).filter(a=>a.contextId===C.activeContextId(app)&&!['COMPLETED','CANCELLED'].includes(a.status));
  const valid=activities.some(a=>a.id===p.activityId)?p.activityId:'';
  const work=C.activeWork(app),pause=C.activeBreak(app),duration=app.settings?.focusMinutes||25;
  return `<section class="focus-mode-card">
    <div class="focus-mode-head"><div><span class="kicker">CONCENTRAÇÃO</span><h2>Modo Foco</h2><p>Uma sessão simples. Sem ciclos automáticos e sem criar pausas por conta própria.</p></div><span class="focus-mode-badge">${duration} min</span></div>
    <div class="focus-mode-form"><label>Atividade opcional<select id="focusModeActivity"><option value="">Sem atividade</option>${activities.map(a=>`<option value="${esc(a.id)}" ${a.id===valid?'selected':''}>${esc(a.title)}</option>`).join('')}</select></label>${activities.length?`<small>${activities.length} atividade${activities.length===1?'':'s'} disponível${activities.length===1?'':'eis'}.</small>`:'<div class="focus-mode-empty"><span>Nenhuma atividade aberta.</span><button type="button" data-focus-mode-action="create-activity">+ Criar atividade</button></div>'}
      <div class="focus-mode-config-row"><div><small>Duração da sessão</small><b>${duration} minutos</b></div><button type="button" data-focus-mode-action="settings">Alterar</button></div>
      <label>Objetivo diário (minutos)<input id="focusModeGoal" type="number" min="15" max="720" step="15" value="${p.dailyGoalMinutes}"></label>
    </div>
    <div class="focus-mode-start"><button type="button" class="btn primary big" data-focus-mode-action="start" ${pause?'disabled':''}>${pause?'Termina a pausa primeiro':work?'Iniciar sessão':'Iniciar jornada + sessão'}</button><small>${pause?'Existe uma pausa ativa.':work?'A sessão ficará associada à jornada atual.':'A aplicação inicia a jornada e depois a sessão, sem Pomodoro automático.'}</small></div>
    <div class="focus-mode-progress"><span><b>${summary.minutes}</b> / ${summary.goalMinutes} min hoje</span><div><i style="width:${summary.progress}%"></i></div></div>
  </section>`;
}
function historyHtml(app){
  const rows=recentFocusSessions(app,6,Date.now());
  return `<section class="focus-mode-history"><div class="section-head"><div><span class="kicker">HISTÓRICO</span><h2>Sessões recentes</h2></div></div>${rows.length?rows.map(r=>`<div class="focus-mode-history-row"><div><b>${activityName(app,r.activityId)?esc(activityName(app,r.activityId)):'Foco sem atividade'}</b><small>${fmtDate(r.startedAt)} · ${fmtTime(r.startedAt)} · ${r.independent?'independente':'jornada'}</small></div><span>${r.status==='COMPLETED'?'✓ ':''}${r.minutes} min</span></div>`).join(''):'<div class="focus-mode-no-history">Ainda não existem sessões de foco.</div>'}</section>`;
}
function renderMode(){
  const host=ensureRoot();if(!host)return;
  const app=readApp(),focus=C.activeFocus(app),summary=focusModeSummary(app,Date.now());
  const key=JSON.stringify([focus?.id,focus?.status,focus?.expectedEndAt,focus?.pausedAt,focus?.phase,app.updatedAt,prefs(),summary.minutes,summary.progress]);
  if(key===lastKey)return;lastKey=key;
  host.innerHTML=(focus?activeHtml(app,focus,summary):idleHtml(app,summary))+historyHtml(app);
}
function polishToday(){
  const app=readApp(),focus=C.activeFocus(app),button=$('#quickActions [data-action="goFocus"]');
  if(button&&!C.activeBreak(app)){button.disabled=false;button.removeAttribute('disabled');const b=button.querySelector('b');if(b)b.textContent='Modo Foco'}
  if(focus?.mode==='FOCUS_MODE'){
    const hero=$('#todayHero .hero.focus');if(hero){const status=hero.querySelector('.status'),p=hero.querySelector('p'),end=hero.querySelector('[data-action="endFocus"]');if(status)status.textContent=focus.status==='PAUSED'?'MODO FOCO PAUSADO':'MODO FOCO';if(p)p.textContent=focus.activityId?`Atividade: ${activityName(app,focus.activityId)}`:(focus.workSessionId?'Sessão ligada à jornada':'Sessão independente');if(end)end.textContent='Concluir sessão'}
  }
}
function queueRender(){if(renderQueued)return;renderQueued=true;queueMicrotask(()=>{renderQueued=false;renderMode();polishToday()})}

document.addEventListener('click',e=>{
  if(e.target.closest('#saveActivity')&&sessionStorage.getItem(RETURN_KEY)==='1')finishActivityReturn();
  if(e.target.closest('#dialogRoot [data-close]')&&sessionStorage.getItem(RETURN_KEY)==='1')sessionStorage.removeItem(RETURN_KEY);
},true);
window.addEventListener('foco-render',queueRender);
window.addEventListener('storage',queueRender);
window.addEventListener('pageshow',queueRender);
document.addEventListener('visibilitychange',()=>{if(!document.hidden)queueRender()});
queueRender();
window.FocoMode=Object.freeze({version:'2.0.0',refresh:queueRender,start:startSession});
