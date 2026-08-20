const APP_KEY='foco-jornada-v4';
const PREF_KEY='foco-jornada-notification-preference-v1';
const RESTORE_VIEW_KEY='foco-jornada-runtime-view-v1';
const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
let settingsDraft=null,editingSettings=false,raf=0;

const clamp=(v,min,max,fallback)=>{const n=Number(v);return Number.isFinite(n)?Math.min(max,Math.max(min,n)):fallback};
const readState=()=>{try{return JSON.parse(localStorage.getItem(APP_KEY)||'null')}catch{return null}};
const writeState=s=>{if(!s)return;s.updatedAt=Date.now();localStorage.setItem(APP_KEY,JSON.stringify(s))};
const notify=(text)=>window.FocoUI?.notify?.(text);

function formSnapshot(){
  const form=$('#settingsForm');if(!form)return null;
  return {
    theme:$('#setTheme')?.value||'system',context:$('#setContext')?.value||'work',
    screen:$('#setScreen')?.value??'15',rest:$('#setRest')?.value??'60',focus:$('#setFocus')?.value??'25',
    short:$('#setShort')?.value??'5',long:$('#setLong')?.value??'15',cycles:$('#setCycles')?.value??'4',
    coffee:$('#setCoffee')?.value??'0.40',coffeeName:$('#setCoffeeName')?.value??'',notifications:!!$('#setNotifications')?.checked
  };
}
function applyDraft(){
  if(!editingSettings||!settingsDraft)return;
  const values={setTheme:settingsDraft.theme,setContext:settingsDraft.context,setScreen:settingsDraft.screen,setRest:settingsDraft.rest,setFocus:settingsDraft.focus,setShort:settingsDraft.short,setLong:settingsDraft.long,setCycles:settingsDraft.cycles,setCoffee:settingsDraft.coffee,setCoffeeName:settingsDraft.coffeeName};
  for(const [id,value] of Object.entries(values)){const el=$(`#${id}`);if(el&&document.activeElement!==el&&el.value!==String(value))el.value=String(value)}
  const n=$('#setNotifications');if(n&&document.activeElement!==n)n.checked=!!settingsDraft.notifications;
}
function stateMatchesDraft(state,d){
  if(!state?.settings||!d)return false;
  const c=state.settings.coffeeTypes?.find(x=>x.id===state.settings.defaultCoffeeTypeId);
  return state.settings.theme===d.theme&&state.settings.activeContextId===d.context&&Number(state.settings.screenBreakMinutes)===clamp(d.screen,1,120,15)&&Number(state.settings.restBreakMinutes)===clamp(d.rest,1,240,60)&&Number(state.settings.focusMinutes)===clamp(d.focus,1,180,25)&&Number(state.settings.shortBreakMinutes)===clamp(d.short,1,60,5)&&Number(state.settings.longBreakMinutes)===clamp(d.long,1,120,15)&&Number(state.settings.focusCycles)===clamp(d.cycles,1,12,4)&&Number(c?.priceCents||0)===Math.max(0,Math.round((Number(d.coffee)||0)*100));
}
function forceSaveDraft(state,d){
  if(!state?.settings||!d)return;
  state.settings.theme=d.theme;state.settings.activeContextId=d.context;
  state.settings.screenBreakMinutes=clamp(d.screen,1,120,15);state.settings.restBreakMinutes=clamp(d.rest,1,240,60);
  state.settings.focusMinutes=clamp(d.focus,1,180,25);state.settings.shortBreakMinutes=clamp(d.short,1,60,5);state.settings.longBreakMinutes=clamp(d.long,1,120,15);state.settings.focusCycles=clamp(d.cycles,1,12,4);
  state.settings.notifications=!!d.notifications;
  const c=state.settings.coffeeTypes?.find(x=>x.id===state.settings.defaultCoffeeTypeId);if(c){c.priceCents=Math.max(0,Math.round((Number(d.coffee)||0)*100));if(d.coffeeName?.trim())c.name=d.coffeeName.trim()}
  localStorage.setItem(PREF_KEY,d.notifications?'1':'0');writeState(state);
}
function bindSettings(){
  const form=$('#settingsForm');if(!form||form.dataset.interactionFixed)return;form.dataset.interactionFixed='1';
  form.addEventListener('focusin',()=>{editingSettings=true;settingsDraft=formSnapshot()});
  form.addEventListener('input',()=>{if(editingSettings)settingsDraft=formSnapshot()},true);
  form.addEventListener('change',()=>{if(editingSettings)settingsDraft=formSnapshot()},true);
  const save=form.querySelector('button[type="submit"]');
  save?.addEventListener('pointerdown',()=>applyDraft(),true);
  form.addEventListener('submit',()=>{
    const desired=formSnapshot();settingsDraft=desired;
    localStorage.setItem(PREF_KEY,desired.notifications?'1':'0');
    setTimeout(()=>{
      const current=readState();
      if(!stateMatchesDraft(current,desired)){
        forceSaveDraft(current,desired);sessionStorage.setItem(RESTORE_VIEW_KEY,'today');
        notify('Definições guardadas. A sincronizar a aplicação.');setTimeout(()=>location.reload(),140);return;
      }
      if(current?.settings){current.settings.notifications=!!desired.notifications;const c=current.settings.coffeeTypes?.find(x=>x.id===current.settings.defaultCoffeeTypeId);if(c&&desired.coffeeName?.trim())c.name=desired.coffeeName.trim();writeState(current)}
      editingSettings=false;settingsDraft=null;
      if(save){const old=save.textContent;save.textContent='Guardado ✓';save.disabled=true;setTimeout(()=>{save.textContent=old;save.disabled=false},1200)}
    },90);
  },true);
}

function notificationStatus(text){const el=$('#runtimeNotificationStatus');if(el)el.textContent=text}
async function runNotificationTest(button){
  const original=button.textContent;button.disabled=true;button.textContent='A testar…';
  try{
    if(!('Notification'in window)){
      notificationStatus('Teste interno concluído. O browser atual não permite notificação de sistema.');notify('Teste de notificação concluído no centro interno.');button.textContent='Teste interno ✓';return;
    }
    let permission=Notification.permission;
    if(permission==='default')permission=await Notification.requestPermission();
    if(permission!=='granted'){
      notificationStatus('Notificações do sistema não autorizadas. Ativa a permissão nas definições do iPhone/PWA.');notify('Permissão de notificações não concedida.');button.textContent='Permissão necessária';return;
    }
    let sent=false;
    if('serviceWorker'in navigator){
      try{const reg=await Promise.race([navigator.serviceWorker.ready,new Promise((_,rej)=>setTimeout(()=>rej(new Error('timeout')),2500))]);if(reg?.showNotification){await reg.showNotification('Foco & Jornada',{body:'Notificação de teste enviada com sucesso.',icon:'./icon.svg',badge:'./icon.svg',tag:'foco-jornada-test-interaction'});sent=true}}catch{}
    }
    if(!sent){new Notification('Foco & Jornada',{body:'Notificação de teste enviada com sucesso.',icon:'./icon.svg',tag:'foco-jornada-test-interaction'});sent=true}
    notificationStatus(sent?'Teste enviado. Notificações do sistema estão funcionais.':'Não foi possível enviar o teste.');notify(sent?'Notificação de teste enviada.':'Não foi possível enviar a notificação de teste.');button.textContent=sent?'Teste enviado ✓':'Falhou';
  }catch{notificationStatus('O teste falhou. Verifica as permissões da PWA.');notify('O teste de notificações falhou.');button.textContent='Falhou'}
  finally{setTimeout(()=>{button.disabled=false;button.textContent=original},1800)}
}

function confirmDeleteWork(id){
  const state=readState(),work=state?.workSessions?.find(x=>x.id===id);if(!work)return notify('Jornada não encontrada.');
  const activeBreak=state.breakSessions?.some(x=>x.workSessionId===id&&x.status==='ACTIVE');
  const activeFocus=state.focusSessions?.some(x=>x.workSessionId===id&&['ACTIVE','PAUSED'].includes(x.status));
  if(work.status==='ACTIVE'&&(activeBreak||activeFocus))return notify('Termina primeiro a pausa ou foco ligados a esta jornada.');
  $('#fjDeleteWorkDialog')?.remove();
  const root=document.createElement('div');root.id='fjDeleteWorkDialog';root.className='fj-action-backdrop';
  root.innerHTML=`<div class="fj-action-dialog" role="dialog" aria-modal="true"><h2>Eliminar jornada?</h2><p>Esta jornada e as pausas, sessões de foco e eventos diretamente associados serão removidos do histórico.</p><div><button type="button" class="btn" data-fj-cancel>Voltar</button><button type="button" class="btn danger-fill" data-fj-confirm>Eliminar</button></div></div>`;
  document.body.appendChild(root);root.querySelector('[data-fj-cancel]').onclick=()=>root.remove();root.addEventListener('click',e=>{if(e.target===root)root.remove()});
  root.querySelector('[data-fj-confirm]').onclick=()=>{root.remove();hardDeleteWork(id)};
}
function hardDeleteWork(id){
  const state=readState();if(!state)return;
  const breakIds=(state.breakSessions||[]).filter(x=>x.workSessionId===id).map(x=>x.id),focusIds=(state.focusSessions||[]).filter(x=>x.workSessionId===id).map(x=>x.id),ids=new Set([id,...breakIds,...focusIds]);
  state.workSessions=(state.workSessions||[]).filter(x=>x.id!==id);state.breakSessions=(state.breakSessions||[]).filter(x=>x.workSessionId!==id);state.focusSessions=(state.focusSessions||[]).filter(x=>x.workSessionId!==id);
  state.events=(state.events||[]).filter(x=>!ids.has(x.entityId)&&x.metadata?.workSessionId!==id);state.auditLog=(state.auditLog||[]).filter(x=>!ids.has(x.entityId));
  writeState(state);sessionStorage.setItem(RESTORE_VIEW_KEY,'history');location.reload();
}
function enhanceWorkButtons(){
  $$('#historyWorks .row').forEach(row=>{
    const any=row.querySelector('[data-id]'),id=any?.dataset.id;if(!id)return;
    const cancel=row.querySelector('[data-action="cancelWork"]');if(cancel){cancel.textContent='Eliminar';cancel.classList.add('fj-delete-work');cancel.title='Eliminar jornada definitivamente'}
    if(!cancel&&!row.querySelector('[data-fj-delete-work]')){const actions=row.querySelector('.actions');if(actions){const b=document.createElement('button');b.type='button';b.className='mini danger fj-delete-work';b.dataset.fjDeleteWork=id;b.textContent='Eliminar';actions.appendChild(b)}}
  })
}
function ensureTopMore(){
  if($('#fjTopMore'))return;const top=$('.topbar');if(!top)return;
  const b=document.createElement('button');b.id='fjTopMore';b.type='button';b.className='fj-more-trigger';b.setAttribute('aria-label','Abrir menu Mais');b.innerHTML='<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="5" cy="12" r="1.8"/><circle cx="12" cy="12" r="1.8"/><circle cx="19" cy="12" r="1.8"/></svg>';b.onclick=()=>window.FocoHub?.open?.();top.prepend(b)
}
function enhance(){bindSettings();enhanceWorkButtons();ensureTopMore();if(editingSettings&&settingsDraft)applyDraft()}
function schedule(){if(raf)return;raf=requestAnimationFrame(()=>{raf=0;enhance()})}

document.addEventListener('click',e=>{
  const test=e.target.closest('[data-runtime-test-notification]');if(test){e.preventDefault();e.stopImmediatePropagation();runNotificationTest(test);return}
  const work=e.target.closest('[data-action="cancelWork"],[data-fj-delete-work]');if(work){e.preventDefault();e.stopImmediatePropagation();confirmDeleteWork(work.dataset.id||work.dataset.fjDeleteWork);return}
},true);
const interactionObserver=new MutationObserver(mutations=>{for(const mutation of mutations){if([...mutation.addedNodes].some(node=>node.nodeType===1)){schedule();break}}});
interactionObserver.observe(document.body,{childList:true,subtree:true});
window.addEventListener('pageshow',schedule);schedule();
window.FocoInteractionFixes=Object.freeze({enhance,deleteWork:hardDeleteWork,testNotification:runNotificationTest});
