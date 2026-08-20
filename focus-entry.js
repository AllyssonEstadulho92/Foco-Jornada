import * as C from './core.js';

const APP_KEY='foco-jornada-v4';
const FOCUS_SELECTION_KEY='foco-jornada-focus-activity-v1';
const CREATE_RETURN_KEY='foco-jornada-focus-create-return-v1';
const REOPEN_KEY='foco-jornada-focus-reopen-v1';
const $=s=>document.querySelector(s);
const enqueue=globalThis.queueMicrotask||((fn)=>Promise.resolve().then(fn));
let scheduled=false;

function readState(){
  try{return C.migrateState(JSON.parse(localStorage.getItem(APP_KEY)||'null'))}catch{return C.createInitialState()}
}
function writeState(state){state.updatedAt=Date.now();localStorage.setItem(APP_KEY,JSON.stringify(state))}
function notify(text){window.FocoUI?.notify?.(text)}
function openActivities(){
  const nav=$('.bottom-nav [data-nav="activities"]')||$('.side-nav [data-nav="activities"]');
  nav?.click();
}
function openFocus(){
  const nav=$('.bottom-nav [data-nav="focus"]')||$('.side-nav [data-nav="focus"]');
  nav?.click();
}
function selectedActivity(){
  const select=$('#focusActivity');
  return select?select.value||null:localStorage.getItem(FOCUS_SELECTION_KEY)||null;
}

function ensureStyle(){
  if($('#focusEntryStyle'))return;
  const style=document.createElement('style');
  style.id='focusEntryStyle';
  style.textContent=`.focus-entry-tools{display:flex;align-items:center;justify-content:space-between;gap:10px;margin:10px 0 14px;padding:11px 12px;border:1px solid var(--line);border-radius:14px;background:var(--surface2)}.focus-entry-tools small{color:var(--muted);font-size:12px;line-height:1.4}.focus-entry-tools .btn{flex:0 0 auto}.focus-entry-start-note{display:block;margin:7px 0 12px;color:var(--muted);font-size:12px;line-height:1.4}@media(max-width:560px){.focus-entry-tools{align-items:stretch;flex-direction:column}.focus-entry-tools .btn{width:100%}}`;
  document.head.appendChild(style);
}
function ensureFocusUi(){
  ensureStyle();
  const panel=$('#focusArea .focus-config'),select=$('#focusActivity');
  if(!panel||!select)return;
  const state=readState(),work=C.activeWork(state),pause=C.activeBreak(state),button=panel.querySelector('[data-action="startFocus"]');
  const saved=localStorage.getItem(FOCUS_SELECTION_KEY);
  if(saved&&[...select.options].some(o=>o.value===saved)&&select.value!==saved)select.value=saved;
  if(!select.dataset.focusEntryBound){
    select.dataset.focusEntryBound='1';
    select.addEventListener('change',()=>localStorage.setItem(FOCUS_SELECTION_KEY,select.value||''));
  }
  if(button){
    if(pause){
      if(!button.disabled)button.disabled=true;
      if(!button.hasAttribute('disabled'))button.setAttribute('disabled','');
      if(button.textContent!=='Termina a pausa primeiro')button.textContent='Termina a pausa primeiro';
      button.title='Termina a pausa em curso antes de iniciar o Pomodoro.';
    }else{
      if(button.disabled)button.disabled=false;
      if(button.hasAttribute('disabled'))button.removeAttribute('disabled');
      const label=work?'Iniciar foco':'Iniciar jornada + foco';
      if(button.textContent!==label)button.textContent=work?'Iniciar foco':'Iniciar jornada + foco';
      button.title=work?'Iniciar sessão de foco':'Iniciar a jornada e, após confirmação, iniciar o foco';
    }
  }
  let tools=panel.querySelector('.focus-entry-tools');
  if(!tools){
    tools=document.createElement('div');
    tools.className='focus-entry-tools';
    select.closest('label')?.after(tools);
  }
  const available=[...select.options].filter(o=>o.value).length;
  const availableText=available===1?'1 atividade disponível para associar.':`${available} atividades disponíveis para associar.`;
  const toolsHtml=`<small>${available?availableText:'Nenhuma atividade aberta. Podes iniciar sem atividade ou criar uma agora.'}</small><button type="button" class="btn" data-focus-create-activity data-runtime-new-activity="1">+ Criar atividade</button>`;
  if(tools&&tools.innerHTML!==toolsHtml)tools.innerHTML=toolsHtml;
  let note=panel.querySelector('.focus-entry-start-note');
  if(!note){
    note=document.createElement('small');
    note.className='focus-entry-start-note';
    button?.before(note);
  }
  const noteText=pause?'Existe uma pausa ativa. Termina-a primeiro.':work?'A sessão será registada dentro da jornada atual.':'Não existe jornada ativa. Ao iniciar, será pedida confirmação para registar Jornada + Foco.';
  if(note&&note.textContent!==noteText)note.textContent=noteText;
}

function confirmStartWithWork(){
  const root=$('#dialogRoot');
  if(!root)return;
  const aid=selectedActivity();
  root.innerHTML=`<div class="backdrop"><div class="dialog" role="dialog" aria-modal="true" aria-labelledby="focusStartTitle"><div class="dialog-head"><h2 id="focusStartTitle">Iniciar jornada + foco?</h2><button type="button" data-focus-start-close aria-label="Fechar">×</button></div><p>O Pomodoro precisa de uma jornada ativa para manter os tempos consistentes. A entrada será registada agora e o foco começa em seguida.</p><div class="dialog-actions"><button type="button" class="btn" data-focus-start-close>Cancelar</button><button type="button" class="btn primary" id="focusStartWorkConfirm">Iniciar jornada + foco</button></div></div></div>`;
  root.querySelectorAll('[data-focus-start-close]').forEach(b=>b.onclick=()=>{root.innerHTML=''});
  root.querySelector('.backdrop').onclick=e=>{if(e.target.classList.contains('backdrop'))root.innerHTML=''};
  $('#focusStartWorkConfirm').onclick=()=>{
    const fresh=readState(),now=Date.now();
    if(C.activeBreak(fresh)){root.innerHTML='';notify('Termina primeiro a pausa em curso.');return}
    const work=C.activeWork(fresh)||C.startWork(fresh,now)?.value;
    if(!work){notify('Não foi possível iniciar a jornada.');return}
    const focus=C.startFocus(fresh,now+1,{activityId:aid||null});
    if(!focus?.ok){notify('Não foi possível iniciar o Pomodoro.');return}
    writeState(fresh);
    if(aid)localStorage.setItem(FOCUS_SELECTION_KEY,aid);
    sessionStorage.setItem(REOPEN_KEY,'1');
    location.reload();
  };
}

function createActivityFromFocus(){
  sessionStorage.setItem(CREATE_RETURN_KEY,'1');
  openActivities();
  setTimeout(()=>$('#newActivityBtn')?.click(),90);
}
function finishCreateReturn(){
  if(sessionStorage.getItem(CREATE_RETURN_KEY)!=='1')return;
  setTimeout(()=>{
    if($('#dialogRoot .dialog'))return;
    const state=readState(),latest=(state.activities||[]).filter(a=>!['COMPLETED','CANCELLED'].includes(a.status)).sort((a,b)=>(b.createdAt||0)-(a.createdAt||0))[0];
    if(latest?.id)localStorage.setItem(FOCUS_SELECTION_KEY,latest.id);
    sessionStorage.removeItem(CREATE_RETURN_KEY);
    openFocus();
  },180);
}
function restoreFocus(){
  if(sessionStorage.getItem(REOPEN_KEY)!=='1')return;
  sessionStorage.removeItem(REOPEN_KEY);
  setTimeout(()=>{openFocus();notify('Jornada e sessão de foco iniciadas.')},140);
}
function schedule(){
  if(scheduled)return;
  scheduled=true;
  enqueue(()=>{scheduled=false;ensureFocusUi()});
}

document.addEventListener('click',e=>{
  if(e.target.classList?.contains('backdrop')&&sessionStorage.getItem(CREATE_RETURN_KEY)==='1')sessionStorage.removeItem(CREATE_RETURN_KEY);
  const target=e.target.closest('button');
  if(!target)return;
  if(target.matches('[data-focus-create-activity]')){
    e.preventDefault();e.stopImmediatePropagation();createActivityFromFocus();return;
  }
  if(target.id==='saveActivity'&&sessionStorage.getItem(CREATE_RETURN_KEY)==='1'){finishCreateReturn();return}
  if(target.matches('#dialogRoot [data-close]')&&sessionStorage.getItem(CREATE_RETURN_KEY)==='1')sessionStorage.removeItem(CREATE_RETURN_KEY);
  if(target.dataset.action!=='startFocus')return;
  const state=readState();
  if(C.activeBreak(state)){e.preventDefault();e.stopImmediatePropagation();notify('Termina primeiro a pausa em curso.');return}
  if(C.activeWork(state))return;
  e.preventDefault();e.stopImmediatePropagation();confirmStartWithWork();
},true);

document.addEventListener('change',e=>{if(e.target?.id==='focusActivity')localStorage.setItem(FOCUS_SELECTION_KEY,e.target.value||'')},true);
const focusRoot=$('#focusArea');
if(focusRoot)new MutationObserver(schedule).observe(focusRoot,{childList:true,subtree:true});
addEventListener('pageshow',schedule);
document.addEventListener('visibilitychange',()=>{if(!document.hidden)schedule()});
restoreFocus();
schedule();
window.FocoFocusEntry=Object.freeze({version:'1.1.0',refresh:schedule});
