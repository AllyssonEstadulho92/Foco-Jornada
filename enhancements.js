import './app.js';

const STORAGE_KEY='foco-jornada-v4';
const META_KEY='foco-jornada-enhancements-meta';
const VERSION='4.1.0';

const $=s=>document.querySelector(s);
const $$=s=>[...document.querySelectorAll(s)];

export function migrateCoffeeDefaults(state){
  if(!state?.settings?.coffeeTypes) return false;
  const id=state.settings.defaultCoffeeTypeId||'espresso';
  const coffee=state.settings.coffeeTypes.find(c=>c.id===id)||state.settings.coffeeTypes.find(c=>c.id==='espresso');
  if(!coffee) return false;
  let changed=false;
  if(coffee.priceCents===70){coffee.priceCents=40;changed=true;}
  if(!coffee.name||coffee.name==='Café'){coffee.name='Café vending Sogenave';changed=true;}
  return changed;
}

function readState(){try{return JSON.parse(localStorage.getItem(STORAGE_KEY)||'null')}catch{return null}}
function writeState(state){localStorage.setItem(STORAGE_KEY,JSON.stringify(state))}
function readMeta(){try{return JSON.parse(localStorage.getItem(META_KEY)||'{}')}catch{return{}}}
function writeMeta(meta){localStorage.setItem(META_KEY,JSON.stringify(meta))}
function dayKey(ts){const d=new Date(ts);return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`}
function formatBytes(bytes){if(bytes<1024)return `${bytes} B`;if(bytes<1024*1024)return `${(bytes/1024).toFixed(1)} KB`;return `${(bytes/1024/1024).toFixed(2)} MB`}
function dateLabel(ts){return ts?new Intl.DateTimeFormat('pt-PT',{day:'2-digit',month:'2-digit',year:'numeric',hour:'2-digit',minute:'2-digit'}).format(new Date(ts)):'Ainda não'}

function ensureCoffeeMigration(){
  const state=readState();
  if(!state) return false;
  if(!migrateCoffeeDefaults(state)) return false;
  writeState(state);
  return true;
}

function injectStyles(){
  if($('#fj-enhancements-style'))return;
  const style=document.createElement('style');style.id='fj-enhancements-style';style.textContent=`
  button{touch-action:manipulation}
  .quick-grid button span{font-size:34px!important;line-height:1!important;margin-bottom:10px!important}
  .bottom-nav span{font-size:28px!important;line-height:1!important}
  .bottom-nav small{font-size:11px!important;margin-top:5px!important}
  .side-nav button span{font-size:25px!important;min-width:30px;text-align:center}
  .icon-btn{font-size:20px}
  #historyTimeline .event{grid-template-columns:76px minmax(0,1fr) auto!important;align-items:start}
  .fj-history-delete{width:40px;height:40px;border-radius:12px;border:1px solid var(--line);background:var(--surface2);color:var(--danger);font-size:18px;font-weight:800}
  .fj-history-tools{display:flex;gap:8px;align-items:center;flex-wrap:wrap}
  .fj-backup-summary{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin:14px 0}
  .fj-backup-stat{border:1px solid var(--line);background:var(--surface2);border-radius:14px;padding:12px}
  .fj-backup-stat small,.fj-backup-stat strong{display:block}.fj-backup-stat small{color:var(--muted);margin-bottom:5px}
  .fj-setting-help{font-size:12px;color:var(--muted);margin-top:-2px}
  .fj-toggle{display:flex!important;align-items:center;gap:10px}.fj-toggle input{width:22px!important;min-height:22px!important;margin:0}.fj-toggle span{font-size:13px}
  @media(max-width:560px){#historyTimeline .event{grid-template-columns:64px minmax(0,1fr) auto!important}.fj-backup-summary{grid-template-columns:1fr}.button-row .btn{min-height:48px}}
  `;document.head.appendChild(style);
}

function enhanceSettings(){
  const form=$('#settingsForm');if(!form)return;
  if(!$('#setCoffeeName')){
    const price=$('#setCoffee')?.closest('label');
    if(price){
      const label=document.createElement('label');
      label.innerHTML='Nome do café padrão<input id="setCoffeeName" type="text" maxlength="50" placeholder="Café vending Sogenave">';
      price.before(label);
      const help=document.createElement('small');help.className='fj-setting-help';help.textContent='Máquina vending Sogenave: 0,40 € por café. O valor continua editável.';price.appendChild(help);
    }
  }
  if(!$('#setNotifications')){
    const wide=form.querySelector('.wide');
    const label=document.createElement('label');label.className='fj-toggle';
    label.innerHTML='<input id="setNotifications" type="checkbox"><span>Notificações quando foco/pausa terminar</span>';
    wide?.before(label);
  }
  const state=readState();const coffee=state?.settings?.coffeeTypes?.find(c=>c.id===(state.settings.defaultCoffeeTypeId||'espresso'));
  if($('#setCoffeeName')&&!$('#setCoffeeName').matches(':focus'))$('#setCoffeeName').value=coffee?.name||'Café vending Sogenave';
  if($('#setNotifications'))$('#setNotifications').checked=!!state?.settings?.notifications;
  if($('#setCoffee')&&!$('#setCoffee').matches(':focus')&&coffee?.priceCents!=null)$('#setCoffee').value=(coffee.priceCents/100).toFixed(2);

  if(form.dataset.fjEnhanced)return;form.dataset.fjEnhanced='1';
  const draft=new Map();let holdUntil=0;
  const remember=el=>{if(!el?.id)return;draft.set(el.id,el.type==='checkbox'?el.checked:el.value);holdUntil=Date.now()+1500};
  form.addEventListener('focusin',e=>remember(e.target));
  form.addEventListener('input',e=>remember(e.target));
  form.addEventListener('change',e=>remember(e.target));
  form.addEventListener('focusout',()=>{holdUntil=Date.now()+900});
  setInterval(()=>{
    if(!(form.contains(document.activeElement)||Date.now()<holdUntil))return;
    for(const[id,value]of draft){const el=document.getElementById(id);if(!el)continue;if(el.type==='checkbox')el.checked=!!value;else if(el.value!==String(value))el.value=String(value)}
  },80);
  form.addEventListener('submit',()=>{
    const name=$('#setCoffeeName')?.value?.trim()||'Café vending Sogenave';
    const notifications=!!$('#setNotifications')?.checked;
    setTimeout(async()=>{
      const current=readState();if(!current)return;
      const c=current.settings?.coffeeTypes?.find(x=>x.id===(current.settings.defaultCoffeeTypeId||'espresso'));
      if(c)c.name=name;
      current.settings.notifications=notifications;
      writeState(current);
      if(notifications&&'Notification'in window&&Notification.permission==='default'){try{await Notification.requestPermission()}catch{}}
      sessionStorage.setItem('fj-restore-view','more');
      location.reload();
    },60);
  });
}

function enhanceHistory(){
  const timeline=$('#historyTimeline');if(!timeline)return;
  const date=$('#historyDate')?.value||dayKey(Date.now());
  const state=readState();if(!state)return;
  const events=(state.events||[]).filter(e=>dayKey(e.occurredAt)===date).sort((a,b)=>b.occurredAt-a.occurredAt||String(b.id).localeCompare(String(a.id)));
  const rows=$$('#historyTimeline .event');
  rows.forEach((row,i)=>{
    if(row.querySelector('.fj-history-delete')||!events[i])return;
    const btn=document.createElement('button');btn.type='button';btn.className='fj-history-delete';btn.textContent='⌫';btn.setAttribute('aria-label','Eliminar item da timeline');btn.title='Eliminar da timeline';
    btn.onclick=()=>{if(!confirm('Eliminar este item da timeline? O dado principal associado será preservado.'))return;const current=readState();if(!current)return;current.events=(current.events||[]).filter(e=>e.id!==events[i].id);writeState(current);sessionStorage.setItem('fj-restore-view','history');sessionStorage.setItem('fj-history-date',date);location.reload()};
    row.appendChild(btn);
  });
  const panel=timeline.closest('.panel');const head=panel?.querySelector('.section-head');
  if(head&&!head.querySelector('.fj-clear-day')){
    const tools=document.createElement('div');tools.className='fj-history-tools';
    const clear=document.createElement('button');clear.type='button';clear.className='mini danger fj-clear-day';clear.textContent='Limpar dia';
    clear.onclick=()=>{if(!confirm('Limpar todos os itens da timeline desta data? Jornadas, tempos e totais permanecem guardados.'))return;const current=readState();if(!current)return;current.events=(current.events||[]).filter(e=>dayKey(e.occurredAt)!==date);writeState(current);sessionStorage.setItem('fj-restore-view','history');sessionStorage.setItem('fj-history-date',date);location.reload()};
    tools.appendChild(clear);head.appendChild(tools);
  }
}

function downloadDiagnostic(){
  const state=readState();if(!state)return;
  const issues=[];
  const activeWorks=(state.workSessions||[]).filter(x=>x.status==='ACTIVE');if(activeWorks.length>1)issues.push('Várias jornadas ativas');
  const activeBreaks=(state.breakSessions||[]).filter(x=>x.status==='ACTIVE');if(activeBreaks.length>1)issues.push('Várias pausas ativas');
  const activeFocus=(state.focusSessions||[]).filter(x=>['ACTIVE','PAUSED'].includes(x.status));if(activeFocus.length>1)issues.push('Várias sessões de foco ativas');
  const activeSegments=(state.activitySegments||[]).filter(x=>x.endedAt==null);if(activeSegments.length>1)issues.push('Várias atividades ativas');
  const payload={product:'Foco & Jornada',uiVersion:VERSION,generatedAt:new Date().toISOString(),issues,counts:{jornadas:state.workSessions?.length||0,pausas:state.breakSessions?.length||0,atividades:state.activities?.length||0,foco:state.focusSessions?.length||0,cafes:state.coffeeEntries?.length||0,eventos:state.events?.length||0},settings:state.settings};
  const blob=new Blob([JSON.stringify(payload,null,2)],{type:'application/json'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=`foco-jornada-diagnostico-${dayKey(Date.now())}.json`;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
}

function enhanceBackup(){
  const heading=$$('h2').find(h=>h.textContent.trim()==='Backup e diagnóstico');const panel=heading?.closest('.panel');if(!panel)return;
  const buttons=panel.querySelector('.button-row');if(!buttons)return;
  if(!panel.querySelector('.fj-backup-summary')){const summary=document.createElement('div');summary.className='fj-backup-summary';buttons.before(summary)}
  if(!panel.querySelector('.fj-download-diagnostic')){const b=document.createElement('button');b.type='button';b.className='btn fj-download-diagnostic';b.textContent='Descarregar diagnóstico';b.onclick=downloadDiagnostic;buttons.appendChild(b)}
  const state=readState(),meta=readMeta();if(state){const bytes=new Blob([JSON.stringify(state)]).size;panel.querySelector('.fj-backup-summary').innerHTML=`<div class="fj-backup-stat"><small>Registos timeline</small><strong>${state.events?.length||0}</strong></div><div class="fj-backup-stat"><small>Dados locais</small><strong>${formatBytes(bytes)}</strong></div><div class="fj-backup-stat"><small>Último backup</small><strong>${dateLabel(meta.lastBackupAt)}</strong></div>`}
  const exportBtn=$('#exportBtn');if(exportBtn&&!exportBtn.dataset.fjMeta){exportBtn.dataset.fjMeta='1';exportBtn.addEventListener('click',()=>{const m=readMeta();m.lastBackupAt=Date.now();writeMeta(m)})}
  const checkBtn=$('#checkBtn');if(checkBtn&&!checkBtn.dataset.fjMeta){checkBtn.dataset.fjMeta='1';checkBtn.addEventListener('click',()=>{const m=readMeta();m.lastDiagnosticAt=Date.now();writeMeta(m)})}
}

function restoreView(){const v=sessionStorage.getItem('fj-restore-view');if(!v)return;sessionStorage.removeItem('fj-restore-view');setTimeout(()=>{document.querySelector(`[data-nav="${v}"]`)?.click();if(v==='history'){const d=sessionStorage.getItem('fj-history-date');sessionStorage.removeItem('fj-history-date');if(d&&$('#historyDate')){$('#historyDate').value=d;$('#historyDate').dispatchEvent(new Event('change',{bubbles:true}))}}},80)}

function updateVersion(){if($('#appVersion'))$('#appVersion').textContent=VERSION;if($('#appVersionSide'))$('#appVersionSide').textContent=VERSION}

function init(){injectStyles();enhanceSettings();enhanceHistory();enhanceBackup();updateVersion();restoreView();setInterval(()=>{enhanceSettings();enhanceHistory();enhanceBackup();updateVersion()},350)}

if(typeof window!=='undefined'){
  if(ensureCoffeeMigration()&&sessionStorage.getItem('fj-coffee-migrated')!=='1'){sessionStorage.setItem('fj-coffee-migrated','1');location.reload()}else{sessionStorage.removeItem('fj-coffee-migrated');init()}
}
