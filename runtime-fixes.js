import * as C from './core.js';

const APP_KEY='foco-jornada-v4';
const FEATURE_KEY='foco-jornada-features-v2';
const FOCUS_SELECTION_KEY='foco-jornada-focus-activity-v1';
const RESTORE_VIEW_KEY='foco-jornada-runtime-view-v1';
const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
let raf=0;

function ensureCss(){
  if($('#runtimeFixesCss'))return;
  const link=document.createElement('link');
  link.id='runtimeFixesCss'; link.rel='stylesheet'; link.href='./runtime-fixes.css';
  document.head.appendChild(link);
}
function readApp(){try{return C.migrateState(JSON.parse(localStorage.getItem(APP_KEY)||'null'))}catch{return null}}
function writeApp(state){if(!state)return;state.updatedAt=Date.now();localStorage.setItem(APP_KEY,JSON.stringify(state))}
function readFeature(){try{return JSON.parse(localStorage.getItem(FEATURE_KEY)||'{}')||{}}catch{return{}}}
function writeFeature(v){localStorage.setItem(FEATURE_KEY,JSON.stringify(v||{}))}
function notify(text,label='',fn=null){window.FocoUI?.notify?.(text,label,fn)}
function esc(v){return String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
function errorText(code){return ({
  WORK_SESSION_ALREADY_ACTIVE:'Já existe uma jornada em curso.',NO_ACTIVE_WORK_SESSION:'Inicia primeiro a jornada.',BREAK_ALREADY_ACTIVE:'Já existe uma pausa ativa.',FOCUS_ALREADY_ACTIVE:'Já existe uma sessão de foco ativa.',FOCUS_NOT_ACTIVE:'Não existe foco ativo.',FOCUS_NOT_PAUSED:'A sessão de foco não está pausada.',ACTIVITY_NOT_FOUND:'Atividade não encontrada.',ACTIVITY_ALREADY_ACTIVE:'Esta atividade já está ativa.',NO_ACTIVE_ACTIVITY:'Não existe atividade ativa.',TITLE_REQUIRED:'Indica um título para a atividade.',INVALID_DURATION:'A duração indicada não é válida.',RELATED_SESSION_ACTIVE:'Termina primeiro a pausa, foco ou atividade em curso.'
}[code]||`Não foi possível concluir a ação (${code}).`)}
function reloadTo(view){sessionStorage.setItem(RESTORE_VIEW_KEY,view);location.reload()}
function restoreView(){const v=sessionStorage.getItem(RESTORE_VIEW_KEY);if(!v)return;sessionStorage.removeItem(RESTORE_VIEW_KEY);setTimeout(()=>document.querySelector(`.bottom-nav [data-nav="${v}"]`)?.click()||document.querySelector(`.side-nav [data-nav="${v}"]`)?.click(),120)}

function modal(html){
  $('#runtimeDialog')?.remove();
  const root=document.createElement('div');root.id='runtimeDialog';root.className='runtime-dialog-backdrop';
  root.innerHTML=`<div class="runtime-dialog" role="dialog" aria-modal="true">${html}</div>`;
  document.body.appendChild(root);
  root.addEventListener('click',e=>{if(e.target===root||e.target.closest('[data-runtime-close]'))root.remove()});
  return root;
}
function confirmAction(title,body,confirmLabel,onConfirm){
  const root=modal(`<header><h2>${esc(title)}</h2><button type="button" data-runtime-close aria-label="Fechar">×</button></header><p>${esc(body)}</p><div class="runtime-dialog-actions"><button type="button" class="btn" data-runtime-close>Cancelar</button><button type="button" class="btn primary" id="runtimeConfirm">${esc(confirmLabel)}</button></div>`);
  root.querySelector('#runtimeConfirm').onclick=()=>{root.remove();onConfirm()};
}

function openActivityEditor(id=null){
  const state=readApp();if(!state)return notify('Não foi possível carregar as atividades.');
  const a=id?state.activities.find(x=>x.id===id):null;
  const root=modal(`<header><h2>${a?'Editar':'Nova'} atividade</h2><button type="button" data-runtime-close aria-label="Fechar">×</button></header><form id="runtimeActivityForm" class="runtime-form"><label>Título<input name="title" maxlength="120" required value="${esc(a?.title||'')}" placeholder="Ex.: Rever documentação"></label><label>Descrição<textarea name="description" rows="3" placeholder="Opcional">${esc(a?.description||'')}</textarea></label><div class="runtime-form-grid"><label>Prioridade<select name="priority">${['LOW','NORMAL','HIGH','URGENT'].map(p=>`<option value="${p}" ${a?.priority===p?'selected':''}>${({LOW:'Baixa',NORMAL:'Normal',HIGH:'Alta',URGENT:'Urgente'})[p]}</option>`).join('')}</select></label><label>Categoria<input name="category" value="${esc(a?.category||'')}"></label><label>Estimativa (min)<input name="estimate" type="number" min="0" step="5" value="${a?.estimatedDurationMs?Math.round(a.estimatedDurationMs/C.MS.minute):''}"></label></div><button class="btn primary full" type="submit">${a?'Guardar':'Criar atividade'}</button></form>`);
  root.querySelector('#runtimeActivityForm').onsubmit=e=>{
    e.preventDefault();const fd=new FormData(e.currentTarget),now=Date.now();
    const fresh=readApp();if(!fresh)return notify('Não foi possível guardar a atividade.');
    const data={title:String(fd.get('title')||'').trim(),description:String(fd.get('description')||''),priority:String(fd.get('priority')||'NORMAL'),category:String(fd.get('category')||''),estimatedMinutes:Number(fd.get('estimate'))||null};
    const r=id?C.editActivity(fresh,id,data,now):C.createActivity(fresh,data,now);
    if(!r?.ok)return notify(errorText(r?.error));
    writeApp(fresh);root.remove();notify(id?'Atividade atualizada.':'Atividade criada.');reloadTo('activities');
  };
}
function performActivity(action,id){
  const state=readApp();if(!state)return notify('Não foi possível carregar a atividade.');
  const now=Date.now();let r;
  if(action==='startActivity')r=C.startActivity(state,id,now);
  if(action==='pauseActivity')r=C.pauseActivity(state,id,now);
  if(action==='completeActivity')r=C.completeActivity(state,id,now);
  if(action==='cancelActivity')r=C.cancelActivity(state,id,now);
  if(!r?.ok)return notify(errorText(r?.error));
  writeApp(state);notify(({startActivity:'Atividade iniciada.',pauseActivity:'Atividade pausada.',completeActivity:'Atividade concluída.',cancelActivity:'Atividade cancelada.'})[action]);reloadTo('activities');
}

function performFocus(action){
  const state=readApp();if(!state)return notify('Não foi possível carregar o Pomodoro.');
  const now=Date.now();let r;
  if(action==='startFocus'){
    const select=$('#focusActivity');const saved=select?.value||localStorage.getItem(FOCUS_SELECTION_KEY)||null;
    if(C.activeBreak(state))return notify('Termina primeiro a pausa em curso.');
    if(!C.activeWork(state)){
      confirmAction('Iniciar jornada e foco?','O Pomodoro precisa de uma jornada ativa para manter os tempos consistentes. Posso registar a entrada agora e iniciar o foco em seguida.','Iniciar jornada e foco',()=>{
        const fresh=readApp();if(!fresh)return;
        const w=C.startWork(fresh,Date.now());if(!w?.ok)return notify(errorText(w?.error));
        const f=C.startFocus(fresh,Date.now()+1,{activityId:saved||null});if(!f?.ok)return notify(errorText(f?.error));
        writeApp(fresh);notify('Jornada e sessão de foco iniciadas.');reloadTo('focus');
      });return;
    }
    r=C.startFocus(state,now,{activityId:saved||null});
  }else if(action==='pauseFocus')r=C.pauseFocus(state,now);
  else if(action==='resumeFocus')r=C.resumeFocus(state,now);
  else if(action==='endFocus')r=C.endFocus(state,now,'COMPLETED');
  if(!r?.ok)return notify(errorText(r?.error));
  writeApp(state);notify(({startFocus:'Sessão de foco iniciada.',pauseFocus:'Foco pausado.',resumeFocus:'Foco retomado.',endFocus:'Foco concluído.'})[action]);reloadTo('focus');
}

function closeDailySummary(){
  const key=new Date().toLocaleDateString('sv-SE');const f=readFeature();f.closedDays=Array.isArray(f.closedDays)?f.closedDays:[];
  if(!f.closedDays.includes(key))f.closedDays.push(key);writeFeature(f);renderClosedSummary(true);notify('Resumo de hoje fechado.');
}
function reopenDailySummary(){
  const key=new Date().toLocaleDateString('sv-SE');const f=readFeature();f.closedDays=(Array.isArray(f.closedDays)?f.closedDays:[]).filter(x=>x!==key);writeFeature(f);reloadTo('today');
}
function renderClosedSummary(force=false){
  const card=$('#dailySummaryCard');if(!card)return;const key=new Date().toLocaleDateString('sv-SE'),f=readFeature(),closed=Array.isArray(f.closedDays)&&f.closedDays.includes(key);if(!force&&!closed)return;
  if(card.dataset.runtimeClosed==='1')return;card.dataset.runtimeClosed='1';
  card.innerHTML=`<div class="runtime-summary-closed"><div><span class="kicker">FECHO DO DIA</span><b>Resumo de hoje fechado</b><small>Podes voltar a abrir o resumo se precisares de consultar os totais.</small></div><button type="button" class="btn" data-runtime-reopen-summary>Ver resumo</button></div>`;
}

function fixFocusUi(){
  const button=$('[data-action="startFocus"]');if(button){button.disabled=false;button.removeAttribute('disabled');button.title='Iniciar sessão de foco';}
  const select=$('#focusActivity');if(select){
    const saved=localStorage.getItem(FOCUS_SELECTION_KEY);if(saved&&[...select.options].some(o=>o.value===saved)&&select.value!==saved)select.value=saved;
    if(!select.dataset.runtimeBound){select.dataset.runtimeBound='1';select.addEventListener('change',()=>localStorage.setItem(FOCUS_SELECTION_KEY,select.value||''))}
  }
  const panel=$('.focus-config');if(panel&&!panel.querySelector('[data-runtime-new-activity]')){
    const start=panel.querySelector('[data-action="startFocus"]');if(start){const wrap=document.createElement('div');wrap.className='runtime-focus-actions';start.parentNode.insertBefore(wrap,start);wrap.appendChild(start);const b=document.createElement('button');b.type='button';b.className='btn';b.dataset.runtimeNewActivity='1';b.textContent='Nova atividade';wrap.appendChild(b)}
  }
}
function fixActivityUi(){
  const newBtn=$('#newActivityBtn');if(newBtn)newBtn.dataset.runtimeActivity='new';
  const list=$('#activityList');const empty=list?.querySelector('.empty');if(empty&&!empty.querySelector('[data-runtime-new-activity]')){const b=document.createElement('button');b.type='button';b.className='btn primary runtime-empty-action';b.dataset.runtimeNewActivity='1';b.textContent='Criar atividade';empty.appendChild(b)}
  const current=$('#currentActivity');const curEmpty=current?.querySelector('.empty');if(curEmpty&&!curEmpty.querySelector('[data-runtime-new-activity]')){const b=document.createElement('button');b.type='button';b.className='mini primary runtime-empty-action';b.dataset.runtimeNewActivity='1';b.textContent='Criar atividade';curEmpty.appendChild(b)}
}
function fixSupershiftUi(){
  const kicker=$('#shiftPlanner .sp-kicker');if(kicker&&kicker.textContent!=='SUPERSHIFT')kicker.textContent='SUPERSHIFT';
  const next=$('#shiftPlanner [data-sp-action="next-month"]');if(next&&!next.dataset.runtimeArrow){next.dataset.runtimeArrow='1';next.innerHTML='<svg class="sp-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m9 18 6-6-6-6"/></svg>'}
  $$('.hub-row-copy b').forEach(b=>{if(b.textContent.trim()==='Escala de trabalho')b.textContent='Supershift'});
  $$('.hub-row-copy small').forEach(s=>{if(s.textContent.trim()==='Calendário, relatórios e rotações')s.textContent='Escala de trabalho · calendário, relatórios e rotações'});
}
function auditButtons(){
  const ids=['newActivityBtn','exportBtn','importBtn','checkBtn','resetBtn'];
  ids.forEach(id=>{const b=document.getElementById(id);if(b)b.dataset.runtimeAudited='1'});
  $$('button[data-nav],button[data-filter],button[data-period],button[data-action],button[data-hub-action],button[data-sp-action],button[data-sp-tab],button[data-sp-day]').forEach(b=>b.dataset.runtimeAudited='1');
}
function enhance(){fixFocusUi();fixActivityUi();fixSupershiftUi();renderClosedSummary();auditButtons()}
function schedule(){if(raf)return;raf=requestAnimationFrame(()=>{raf=0;enhance()})}

document.addEventListener('click',e=>{
  const t=e.target.closest('button,a');if(!t)return;
  if(t.id==='closeTodayBtn'){e.preventDefault();e.stopImmediatePropagation();closeDailySummary();return}
  if(t.matches('[data-runtime-reopen-summary]')){e.preventDefault();e.stopImmediatePropagation();reopenDailySummary();return}
  if(t.matches('[data-runtime-new-activity]')||t.id==='newActivityBtn'){e.preventDefault();e.stopImmediatePropagation();openActivityEditor();return}
  const action=t.dataset.action;
  if(action==='editActivity'){e.preventDefault();e.stopImmediatePropagation();openActivityEditor(t.dataset.id);return}
  if(['startActivity','pauseActivity','completeActivity'].includes(action)){e.preventDefault();e.stopImmediatePropagation();performActivity(action,t.dataset.id);return}
  if(action==='cancelActivity'){e.preventDefault();e.stopImmediatePropagation();confirmAction('Cancelar atividade?','A atividade fica no histórico, mas deixa de aparecer como aberta.','Cancelar atividade',()=>performActivity(action,t.dataset.id));return}
  if(['startFocus','pauseFocus','resumeFocus','endFocus'].includes(action)){e.preventDefault();e.stopImmediatePropagation();performFocus(action);return}
},true);

ensureCss();restoreView();schedule();new MutationObserver(schedule).observe(document.body,{childList:true,subtree:true});
window.FocoRuntimeFixes=Object.freeze({version:'1.0.0',enhance,audit:auditButtons,openActivity:openActivityEditor});
