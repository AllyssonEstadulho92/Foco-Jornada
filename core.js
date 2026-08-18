export const APP_VERSION = '4.0.0';
export const SCHEMA_VERSION = 4;
export const MS = { minute: 60_000, hour: 3_600_000, day: 86_400_000 };

export const defaultCoffeeTypes = () => [
  { id: 'espresso', name: 'Café', priceCents: 70, active: true },
  { id: 'galao', name: 'Galão', priceCents: 120, active: true },
  { id: 'cappuccino', name: 'Cappuccino', priceCents: 150, active: true },
];

export const defaultSettings = () => ({
  theme: 'system', locale: 'pt-PT', currency: 'EUR',
  screenBreakMinutes: 15, restBreakMinutes: 60,
  focusMinutes: 25, shortBreakMinutes: 5, longBreakMinutes: 15,
  focusCycles: 4, notifications: false,
  defaultCoffeeTypeId: 'espresso', coffeeTypes: defaultCoffeeTypes(),
  activeContextId: 'work', onboardingDone: false,
});

export function createInitialState(now = Date.now()) {
  return {
    schemaVersion: SCHEMA_VERSION, appVersion: APP_VERSION,
    createdAt: now, updatedAt: now,
    settings: defaultSettings(),
    contexts: [
      { id: 'work', name: 'Trabalho', archived: false },
      { id: 'personal', name: 'Pessoal', archived: false },
    ],
    workSessions: [], breakSessions: [], activities: [], activitySegments: [],
    focusSessions: [], coffeeEntries: [], events: [], auditLog: [],
  };
}

export const clone = value => structuredClone(value);
export const uid = (prefix='id') => `${prefix}_${globalThis.crypto?.randomUUID?.() || `${Date.now().toString(36)}_${Math.random().toString(36).slice(2)}`}`;
export const tz = () => Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
export const clamp = (value, min, max, fallback) => { const n=Number(value); return Number.isFinite(n) ? Math.min(max,Math.max(min,n)) : fallback; };
export const fmtMoney = (cents, locale='pt-PT', currency='EUR') => new Intl.NumberFormat(locale,{style:'currency',currency}).format((Number(cents)||0)/100);
export const localDayKey = timestamp => { const d=new Date(timestamp); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`; };
export const dayRange = key => { const [y,m,d]=key.split('-').map(Number); const start=new Date(y,m-1,d,0,0,0,0).getTime(); return {start,end:new Date(y,m-1,d+1,0,0,0,0).getTime()}; };
export const overlapMs = (start,end,rangeStart,rangeEnd) => Math.max(0,Math.min(end,rangeEnd)-Math.max(start,rangeStart));

function normalizeSettings(input={}) {
  const base=defaultSettings();
  const coffeeTypes=Array.isArray(input.coffeeTypes)&&input.coffeeTypes.length ? input.coffeeTypes.map(c=>({
    id:String(c.id||uid('coffee_type')), name:String(c.name||'Café'),
    priceCents:Math.max(0,Math.round(Number(c.priceCents)||0)), active:c.active!==false
  })) : base.coffeeTypes;
  return {
    ...base, ...input, coffeeTypes,
    screenBreakMinutes:clamp(input.screenBreakMinutes ?? input.screen,1,120,15),
    restBreakMinutes:clamp(input.restBreakMinutes ?? input.rest,1,240,60),
    focusMinutes:clamp(input.focusMinutes ?? input.focus,1,180,25),
    shortBreakMinutes:clamp(input.shortBreakMinutes,1,60,5),
    longBreakMinutes:clamp(input.longBreakMinutes,1,120,15),
    focusCycles:clamp(input.focusCycles,1,12,4),
    theme:['system','dark','light'].includes(input.theme)?input.theme:'system',
  };
}

export function migrateState(input, now=Date.now()) {
  if (!input || typeof input !== 'object') return createInitialState(now);
  if (input.schemaVersion === SCHEMA_VERSION) {
    const base=createInitialState(now);
    const next={...base,...input,settings:normalizeSettings(input.settings),schemaVersion:SCHEMA_VERSION,appVersion:APP_VERSION};
    for (const k of ['contexts','workSessions','breakSessions','activities','activitySegments','focusSessions','coffeeEntries','events','auditLog']) if(!Array.isArray(next[k])) next[k]=[];
    return next;
  }
  const out=createInitialState(now);
  const legacy=input.data && typeof input.data==='object' ? input.data : input;
  out.settings=normalizeSettings(legacy.settings||{});
  if (Array.isArray(legacy.work)) out.workSessions=legacy.work.map(x=>({
    id:x.id||uid('work'),contextId:'work',status:x.status|| (x.end?'COMPLETED':'ACTIVE'),
    startedAt:x.start??x.startedAt,endedAt:x.end??x.endedAt??null,
    timezoneAtStart:x.tzStart||x.timezoneAtStart||null,timezoneAtEnd:x.tzEnd||x.timezoneAtEnd||null,
    createdAt:x.start??now,updatedAt:x.end??x.start??now,version:1,manuallyEdited:false,
  })).filter(x=>Number.isFinite(x.startedAt));
  else if (Array.isArray(legacy.workSessions)) out.workSessions=legacy.workSessions;
  if (Array.isArray(legacy.breaks)) out.breakSessions=legacy.breaks.map(x=>({
    id:x.id||uid('break'),workSessionId:x.workSessionId||null,type:x.type||'SCREEN',status:x.status|| (x.end?'COMPLETED':'ACTIVE'),
    startedAt:x.start??x.startedAt,expectedEndAt:x.expected??x.expectedEndAt??null,endedAt:x.end??x.endedAt??null,
    targetDurationMs:(x.expected??0)-(x.start??0) || null,resumeActivityId:x.previousTaskId||x.resumeActivityId||null,createdAt:x.start??now,updatedAt:x.end??x.start??now,version:1,
  })).filter(x=>Number.isFinite(x.startedAt));
  if (Array.isArray(legacy.tasks)) {
    out.activities=legacy.tasks.map(x=>({id:x.id||uid('act'),contextId:'work',title:String(x.title||'Atividade'),description:'',status:x.status==='PLANNED'?'BACKLOG':(x.status||'BACKLOG'),priority:'NORMAL',category:'',plannedFor:null,dueAt:null,estimatedDurationMs:null,completedAt:x.done??null,createdAt:x.created??now,updatedAt:x.done??x.created??now,version:1}));
    out.activitySegments=legacy.tasks.flatMap(x=>(x.segments||[]).map(s=>({id:uid('seg'),activityId:x.id,startedAt:s.start??s.startedAt,endedAt:s.end??s.endedAt??null,createdAt:s.start??now}))).filter(x=>Number.isFinite(x.startedAt));
  } else {
    if(Array.isArray(legacy.activities)) out.activities=legacy.activities;
    if(Array.isArray(legacy.activitySegments)) out.activitySegments=legacy.activitySegments;
  }
  if (Array.isArray(legacy.focus)) out.focusSessions=legacy.focus.map(x=>({id:x.id||uid('focus'),workSessionId:x.workSessionId||null,activityId:x.taskId||x.activityId||null,phase:'FOCUS',status:x.status||'COMPLETED',startedAt:x.start??x.startedAt,expectedEndAt:x.expected??x.expectedEndAt,endedAt:x.end??x.endedAt??null,pausedAt:x.pausedAt??null,pausedMs:x.pausedMs||0,targetDurationMs:(x.expected??0)-(x.start??0)||null,cycleNumber:1,createdAt:x.start??now,updatedAt:x.end??x.start??now,version:1})).filter(x=>Number.isFinite(x.startedAt));
  else if(Array.isArray(legacy.focusSessions)) out.focusSessions=legacy.focusSessions;
  if(Array.isArray(legacy.coffee)) out.coffeeEntries=legacy.coffee.map(x=>({id:x.id||uid('coffee'),contextId:'work',coffeeTypeId:'espresso',coffeeTypeName:'Café',unitPriceCents:x.price??x.priceCents??out.settings.coffeeTypes[0].priceCents,quantity:1,totalPriceCents:x.price??x.priceCents??out.settings.coffeeTypes[0].priceCents,consumedAt:x.at??x.consumedAt??now,createdAt:x.at??now}));
  else if(Array.isArray(legacy.coffeeEntries)) out.coffeeEntries=legacy.coffeeEntries;
  if(Array.isArray(legacy.events)) out.events=legacy.events.map(x=>({id:x.id||uid('evt'),type:x.type||'LEGACY',title:x.title||'Registo',detail:x.detail||'',occurredAt:x.occurredAt??x.at??now,contextId:x.contextId||'work',entityType:x.entityType||null,entityId:x.entityId||null,metadata:x.metadata||{}}));
  out.settings.onboardingDone=legacy.settings?.onboardingDone ?? true;
  out.updatedAt=now;
  return migrateState({...out,schemaVersion:SCHEMA_VERSION},now);
}

export const activeContextId = state => state.settings.activeContextId || 'work';
export const activeWork = state => state.workSessions.find(x=>x.contextId===activeContextId(state)&&x.status==='ACTIVE')||null;
export const activeBreak = state => state.breakSessions.find(x=>x.status==='ACTIVE')||null;
export const activeFocus = state => state.focusSessions.find(x=>['ACTIVE','PAUSED'].includes(x.status))||null;
export const activeActivitySegment = state => state.activitySegments.find(x=>x.endedAt==null)||null;
export const activeActivity = state => { const s=activeActivitySegment(state); return s?state.activities.find(a=>a.id===s.activityId)||null:null; };

export function pushEvent(state,type,title,detail='',occurredAt=Date.now(),entityType=null,entityId=null,metadata={}) {
  const e={id:uid('evt'),type,title,detail,occurredAt,contextId:activeContextId(state),entityType,entityId,metadata}; state.events.push(e); return e;
}
export function audit(state,action,entityType,entityId,before,after,at=Date.now()) { state.auditLog.push({id:uid('audit'),action,entityType,entityId,at,before,after}); }
export function touch(state,at=Date.now()) { state.updatedAt=at; state.appVersion=APP_VERSION; state.schemaVersion=SCHEMA_VERSION; return state; }

export function startWork(state,at=Date.now(),opts={}) {
  if(activeWork(state)) return {ok:false,error:'WORK_SESSION_ALREADY_ACTIVE'};
  const startedAt=opts.startedAt??at; if(!Number.isFinite(startedAt)||startedAt>at+5*MS.minute) return {ok:false,error:'INVALID_TIME_RANGE'};
  const w={id:uid('work'),contextId:activeContextId(state),status:'ACTIVE',startedAt,endedAt:null,timezoneAtStart:tz(),timezoneAtEnd:null,createdAt:at,updatedAt:at,version:1,manuallyEdited:opts.startedAt!=null};
  state.workSessions.push(w); pushEvent(state,'WORK_STARTED','Entrada na jornada',new Intl.DateTimeFormat('pt-PT',{hour:'2-digit',minute:'2-digit'}).format(startedAt),startedAt,'WorkSession',w.id); touch(state,at); return {ok:true,value:w};
}
export function endWork(state,at=Date.now(),opts={}) {
  const w=opts.id?state.workSessions.find(x=>x.id===opts.id):activeWork(state); if(!w)return{ok:false,error:'WORK_SESSION_NOT_FOUND'};
  if(w.status!=='ACTIVE'&&w.status!=='INCOMPLETE')return{ok:false,error:'INVALID_WORK_SESSION_STATE'};
  if(activeBreak(state)||activeFocus(state)||activeActivitySegment(state))return{ok:false,error:'RELATED_SESSION_ACTIVE'};
  const endedAt=opts.endedAt??at;if(!Number.isFinite(endedAt)||endedAt<w.startedAt)return{ok:false,error:'INVALID_TIME_RANGE'};
  const before=clone(w);w.status='COMPLETED';w.endedAt=endedAt;w.timezoneAtEnd=tz();w.updatedAt=at;w.version++;w.manuallyEdited ||= opts.endedAt!=null;audit(state,'END','WorkSession',w.id,before,clone(w),at);pushEvent(state,'WORK_ENDED','Jornada terminada','',endedAt,'WorkSession',w.id);touch(state,at);return{ok:true,value:w};
}
export function markWorkIncomplete(state,id,at=Date.now()) { const w=state.workSessions.find(x=>x.id===id);if(!w)return{ok:false,error:'WORK_SESSION_NOT_FOUND'};const before=clone(w);w.status='INCOMPLETE';w.endedAt=null;w.updatedAt=at;w.version++;audit(state,'MARK_INCOMPLETE','WorkSession',w.id,before,clone(w),at);touch(state,at);return{ok:true,value:w}; }
export function reopenWork(state,id,at=Date.now()) { if(activeWork(state))return{ok:false,error:'WORK_SESSION_ALREADY_ACTIVE'};const w=state.workSessions.find(x=>x.id===id);if(!w)return{ok:false,error:'WORK_SESSION_NOT_FOUND'};if(!['COMPLETED','INCOMPLETE'].includes(w.status))return{ok:false,error:'INVALID_WORK_SESSION_STATE'};const before=clone(w);w.status='ACTIVE';w.endedAt=null;w.updatedAt=at;w.version++;w.manuallyEdited=true;audit(state,'REOPEN','WorkSession',w.id,before,clone(w),at);pushEvent(state,'WORK_REOPENED','Jornada reaberta','',at,'WorkSession',w.id);touch(state,at);return{ok:true,value:w}; }
export function cancelWork(state,id,at=Date.now()) { const w=state.workSessions.find(x=>x.id===id);if(!w)return{ok:false,error:'WORK_SESSION_NOT_FOUND'};if(w.status==='ACTIVE'&&(activeBreak(state)||activeFocus(state)||activeActivitySegment(state)))return{ok:false,error:'RELATED_SESSION_ACTIVE'};const before=clone(w);w.status='CANCELLED';w.updatedAt=at;w.version++;audit(state,'CANCEL','WorkSession',w.id,before,clone(w),at);pushEvent(state,'WORK_CANCELLED','Jornada cancelada','',at,'WorkSession',w.id);touch(state,at);return{ok:true,value:w}; }
export function editWork(state,id,changes,at=Date.now()) { const w=state.workSessions.find(x=>x.id===id);if(!w)return{ok:false,error:'WORK_SESSION_NOT_FOUND'};const startedAt=changes.startedAt??w.startedAt,endedAt=changes.endedAt===undefined?w.endedAt:changes.endedAt;if(!Number.isFinite(startedAt)||(endedAt!=null&&(!Number.isFinite(endedAt)||endedAt<startedAt)))return{ok:false,error:'INVALID_TIME_RANGE'};const before=clone(w);w.startedAt=startedAt;w.endedAt=endedAt;w.status=endedAt?'COMPLETED':w.status;w.manuallyEdited=true;w.updatedAt=at;w.version++;audit(state,'EDIT','WorkSession',w.id,before,clone(w),at);pushEvent(state,'WORK_EDITED','Jornada editada','',at,'WorkSession',w.id);touch(state,at);return{ok:true,value:w}; }
export const grossWorkMs=(w,at=Date.now())=>Math.max(0,(w.endedAt??at)-w.startedAt);
export function breakMsForWork(state,w,at=Date.now()){const end=w.endedAt??at;return state.breakSessions.filter(b=>b.workSessionId===w.id&&b.status!=='CANCELLED').reduce((sum,b)=>sum+Math.max(0,Math.min(b.endedAt??at,end)-Math.max(b.startedAt,w.startedAt)),0)}
export const effectiveWorkMs=(state,w,at=Date.now())=>Math.max(0,grossWorkMs(w,at)-breakMsForWork(state,w,at));

export function startBreak(state,type='SCREEN',at=Date.now(),durationMinutes=null){const w=activeWork(state);if(!w)return{ok:false,error:'NO_ACTIVE_WORK_SESSION'};if(activeBreak(state))return{ok:false,error:'BREAK_ALREADY_ACTIVE'};if(activeFocus(state))return{ok:false,error:'FOCUS_ALREADY_ACTIVE'};const mins=durationMinutes??(type==='REST'?state.settings.restBreakMinutes:state.settings.screenBreakMinutes);if(!Number.isFinite(mins)||mins<=0)return{ok:false,error:'INVALID_DURATION'};const seg=activeActivitySegment(state);const resumeActivityId=seg?.activityId||null;if(seg)pauseActivity(state,seg.activityId,at);const b={id:uid('break'),workSessionId:w.id,type,status:'ACTIVE',startedAt:at,expectedEndAt:at+mins*MS.minute,endedAt:null,targetDurationMs:mins*MS.minute,resumeActivityId,createdAt:at,updatedAt:at,version:1};state.breakSessions.push(b);pushEvent(state,'BREAK_STARTED',type==='REST'?'Pausa principal iniciada':'Pausa de ecrã iniciada',`${mins} min`,at,'BreakSession',b.id);touch(state,at);return{ok:true,value:b};}
export function endBreak(state,id=null,at=Date.now()){const b=id?state.breakSessions.find(x=>x.id===id):activeBreak(state);if(!b)return{ok:false,error:'BREAK_NOT_FOUND'};if(b.status!=='ACTIVE')return{ok:false,error:'INVALID_BREAK_STATE'};b.status='COMPLETED';b.endedAt=at;b.updatedAt=at;b.version++;pushEvent(state,'BREAK_ENDED','Pausa concluída','',at,'BreakSession',b.id);touch(state,at);return{ok:true,value:b};}
export function extendBreak(state,minutes=5,at=Date.now()){const b=activeBreak(state);if(!b)return{ok:false,error:'BREAK_NOT_FOUND'};const m=clamp(minutes,1,60,5);b.expectedEndAt+=m*MS.minute;b.targetDurationMs+=m*MS.minute;b.updatedAt=at;b.version++;touch(state,at);return{ok:true,value:b};}
export const breakRemainingMs=(b,at=Date.now())=>Math.max(0,b.expectedEndAt-at);
export const breakOvertimeMs=(b,at=Date.now())=>Math.max(0,at-b.expectedEndAt);

export function createActivity(state,data,at=Date.now()){const title=String(data.title||'').trim();if(!title)return{ok:false,error:'TITLE_REQUIRED'};const a={id:uid('act'),contextId:activeContextId(state),title,description:String(data.description||''),status:data.plannedFor?'PLANNED':'BACKLOG',priority:['LOW','NORMAL','HIGH','URGENT'].includes(data.priority)?data.priority:'NORMAL',category:String(data.category||''),plannedFor:data.plannedFor||null,dueAt:data.dueAt||null,estimatedDurationMs:data.estimatedMinutes?Math.max(1,Number(data.estimatedMinutes))*MS.minute:null,completedAt:null,createdAt:at,updatedAt:at,version:1};state.activities.push(a);pushEvent(state,'ACTIVITY_CREATED','Atividade criada',a.title,at,'Activity',a.id);touch(state,at);return{ok:true,value:a};}
export function editActivity(state,id,changes,at=Date.now()){const a=state.activities.find(x=>x.id===id);if(!a)return{ok:false,error:'ACTIVITY_NOT_FOUND'};const before=clone(a);if(changes.title!==undefined){const t=String(changes.title).trim();if(!t)return{ok:false,error:'TITLE_REQUIRED'};a.title=t}if(changes.description!==undefined)a.description=String(changes.description);if(changes.priority!==undefined&&['LOW','NORMAL','HIGH','URGENT'].includes(changes.priority))a.priority=changes.priority;if(changes.category!==undefined)a.category=String(changes.category);if(changes.estimatedMinutes!==undefined)a.estimatedDurationMs=changes.estimatedMinutes?Number(changes.estimatedMinutes)*MS.minute:null;a.updatedAt=at;a.version++;audit(state,'EDIT','Activity',id,before,clone(a),at);touch(state,at);return{ok:true,value:a};}
export function startActivity(state,id,at=Date.now()){if(!activeWork(state))return{ok:false,error:'NO_ACTIVE_WORK_SESSION'};if(activeBreak(state))return{ok:false,error:'BREAK_ALREADY_ACTIVE'};const a=state.activities.find(x=>x.id===id);if(!a||['COMPLETED','CANCELLED'].includes(a.status))return{ok:false,error:'ACTIVITY_NOT_FOUND'};const current=activeActivitySegment(state);if(current){if(current.activityId===id)return{ok:false,error:'ACTIVITY_ALREADY_ACTIVE'};pauseActivity(state,current.activityId,at)};a.status='ACTIVE';a.updatedAt=at;a.version++;state.activitySegments.push({id:uid('seg'),activityId:id,startedAt:at,endedAt:null,createdAt:at});pushEvent(state,'ACTIVITY_STARTED','Atividade iniciada',a.title,at,'Activity',id);touch(state,at);return{ok:true,value:a};}
export function pauseActivity(state,id,at=Date.now()){const seg=state.activitySegments.find(x=>x.activityId===id&&x.endedAt==null);if(!seg)return{ok:false,error:'NO_ACTIVE_ACTIVITY'};seg.endedAt=at;const a=state.activities.find(x=>x.id===id);if(a&&a.status!=='COMPLETED'){a.status='PAUSED';a.updatedAt=at;a.version++;pushEvent(state,'ACTIVITY_PAUSED','Atividade pausada',a.title,at,'Activity',id)}touch(state,at);return{ok:true,value:a};}
export function completeActivity(state,id,at=Date.now()){const a=state.activities.find(x=>x.id===id);if(!a)return{ok:false,error:'ACTIVITY_NOT_FOUND'};const seg=state.activitySegments.find(x=>x.activityId===id&&x.endedAt==null);if(seg)seg.endedAt=at;a.status='COMPLETED';a.completedAt=at;a.updatedAt=at;a.version++;pushEvent(state,'ACTIVITY_COMPLETED','Atividade concluída',a.title,at,'Activity',id);touch(state,at);return{ok:true,value:a};}
export function cancelActivity(state,id,at=Date.now()){const a=state.activities.find(x=>x.id===id);if(!a)return{ok:false,error:'ACTIVITY_NOT_FOUND'};const seg=state.activitySegments.find(x=>x.activityId===id&&x.endedAt==null);if(seg)seg.endedAt=at;a.status='CANCELLED';a.updatedAt=at;a.version++;pushEvent(state,'ACTIVITY_CANCELLED','Atividade cancelada',a.title,at,'Activity',id);touch(state,at);return{ok:true,value:a};}
export const activityDurationMs=(state,id,at=Date.now())=>state.activitySegments.filter(s=>s.activityId===id).reduce((sum,s)=>sum+Math.max(0,(s.endedAt??at)-s.startedAt),0);

export function startFocus(state,at=Date.now(),opts={}){const w=activeWork(state);if(!w)return{ok:false,error:'NO_ACTIVE_WORK_SESSION'};if(activeBreak(state))return{ok:false,error:'BREAK_ALREADY_ACTIVE'};if(activeFocus(state))return{ok:false,error:'FOCUS_ALREADY_ACTIVE'};const phase=opts.phase||'FOCUS';const durationMinutes=opts.durationMinutes??(phase==='SHORT_BREAK'?state.settings.shortBreakMinutes:phase==='LONG_BREAK'?state.settings.longBreakMinutes:state.settings.focusMinutes);if(!Number.isFinite(durationMinutes)||durationMinutes<=0)return{ok:false,error:'INVALID_DURATION'};const completedToday=state.focusSessions.filter(f=>f.phase==='FOCUS'&&f.status==='COMPLETED'&&localDayKey(f.startedAt)===localDayKey(at)).length;const cycleNumber=(completedToday%state.settings.focusCycles)+1;const f={id:uid('focus'),workSessionId:w.id,activityId:opts.activityId||activeActivity(state)?.id||null,phase,status:'ACTIVE',startedAt:at,expectedEndAt:at+durationMinutes*MS.minute,endedAt:null,targetDurationMs:durationMinutes*MS.minute,pausedAt:null,pausedMs:0,cycleNumber,createdAt:at,updatedAt:at,version:1};state.focusSessions.push(f);pushEvent(state,'FOCUS_STARTED',phase==='FOCUS'?'Foco iniciado':'Pausa Pomodoro iniciada',`${durationMinutes} min`,at,'FocusSession',f.id,{phase,cycleNumber});touch(state,at);return{ok:true,value:f};}
export function pauseFocus(state,at=Date.now()){const f=activeFocus(state);if(!f||f.status!=='ACTIVE')return{ok:false,error:'FOCUS_NOT_ACTIVE'};f.status='PAUSED';f.pausedAt=at;f.updatedAt=at;f.version++;pushEvent(state,'FOCUS_PAUSED','Foco pausado','',at,'FocusSession',f.id);touch(state,at);return{ok:true,value:f};}
export function resumeFocus(state,at=Date.now()){const f=activeFocus(state);if(!f||f.status!=='PAUSED')return{ok:false,error:'FOCUS_NOT_PAUSED'};const d=Math.max(0,at-f.pausedAt);f.pausedMs+=d;f.expectedEndAt+=d;f.pausedAt=null;f.status='ACTIVE';f.updatedAt=at;f.version++;pushEvent(state,'FOCUS_RESUMED','Foco retomado','',at,'FocusSession',f.id);touch(state,at);return{ok:true,value:f};}
export function endFocus(state,at=Date.now(),outcome='COMPLETED'){const f=activeFocus(state);if(!f)return{ok:false,error:'FOCUS_NOT_FOUND'};if(f.status==='PAUSED'&&f.pausedAt)f.pausedMs+=Math.max(0,at-f.pausedAt);f.status=outcome;f.endedAt=at;f.pausedAt=null;f.updatedAt=at;f.version++;pushEvent(state,outcome==='COMPLETED'?'FOCUS_COMPLETED':'FOCUS_INTERRUPTED',outcome==='COMPLETED'?'Sessão de foco concluída':'Sessão de foco interrompida','',at,'FocusSession',f.id,{phase:f.phase});touch(state,at);return{ok:true,value:f};}
export const focusRemainingMs=(f,at=Date.now())=>!f?0:Math.max(0,f.expectedEndAt-(f.status==='PAUSED'&&f.pausedAt?f.pausedAt:at));
export const focusEffectiveMs=(f,at=Date.now())=>Math.max(0,(f.endedAt??at)-f.startedAt-(f.pausedMs||0)-(f.status==='PAUSED'&&f.pausedAt?Math.max(0,at-f.pausedAt):0));
export function reconcileFocus(state,at=Date.now()){const f=activeFocus(state);if(f?.status==='ACTIVE'&&at>=f.expectedEndAt){const end=f.expectedEndAt;return endFocus(state,end,'COMPLETED')}return null;}

export function addCoffee(state,at=Date.now(),opts={}){const type=state.settings.coffeeTypes.find(c=>c.id===(opts.typeId||state.settings.defaultCoffeeTypeId)&&c.active);if(!type)return{ok:false,error:'COFFEE_TYPE_NOT_FOUND'};const quantity=Math.max(1,Math.floor(Number(opts.quantity)||1));const priceCents=opts.priceCents??type.priceCents;const c={id:uid('coffee'),contextId:activeContextId(state),coffeeTypeId:type.id,coffeeTypeName:type.name,unitPriceCents:priceCents,quantity,totalPriceCents:priceCents*quantity,consumedAt:at,createdAt:at};state.coffeeEntries.push(c);pushEvent(state,'COFFEE_ADDED','Café adicionado',`${type.name} · ${fmtMoney(c.totalPriceCents)}`,at,'CoffeeEntry',c.id);touch(state,at);return{ok:true,value:c};}
export function undoCoffee(state,id,at=Date.now()){const i=state.coffeeEntries.findIndex(c=>c.id===id);if(i<0)return{ok:false,error:'COFFEE_NOT_FOUND'};const[c]=state.coffeeEntries.splice(i,1);state.events=state.events.filter(e=>!(e.entityType==='CoffeeEntry'&&e.entityId===id));touch(state,at);return{ok:true,value:c};}

export function rangeStats(state,start,end,at=Date.now()){const works=state.workSessions.filter(w=>w.status!=='CANCELLED'&&w.startedAt<end&&(w.endedAt??at)>start);let gross=0,breakTime=0;for(const w of works){const we=w.endedAt??at;gross+=overlapMs(w.startedAt,we,start,end);for(const b of state.breakSessions.filter(b=>b.workSessionId===w.id&&b.status!=='CANCELLED'))breakTime+=overlapMs(b.startedAt,b.endedAt??at,start,end)}const focusTime=state.focusSessions.filter(f=>f.phase==='FOCUS'&&f.status!=='CANCELLED'&&f.startedAt<end&&(f.endedAt??at)>start).reduce((sum,f)=>sum+Math.min(focusEffectiveMs(f,at),overlapMs(f.startedAt,f.endedAt??at,start,end)),0);const coffees=state.coffeeEntries.filter(c=>c.consumedAt>=start&&c.consumedAt<end);const completedActivities=state.activities.filter(a=>a.completedAt&&a.completedAt>=start&&a.completedAt<end).length;return{grossWork:gross,breakTime,effectiveWork:Math.max(0,gross-breakTime),focusTime,coffeeCount:coffees.reduce((s,c)=>s+c.quantity,0),coffeeSpend:coffees.reduce((s,c)=>s+c.totalPriceCents,0),completedActivities,workDays:new Set(works.map(w=>localDayKey(w.startedAt))).size};}
export const dayStats=(state,key,at=Date.now())=>{const r=dayRange(key);return rangeStats(state,r.start,r.end,at)};
export const eventsForDay=(state,key)=>state.events.filter(e=>localDayKey(e.occurredAt)===key).sort((a,b)=>a.occurredAt-b.occurredAt||a.id.localeCompare(b.id));

export function validateState(state,at=Date.now()){const issues=[];const activeWorks=state.workSessions.filter(x=>x.status==='ACTIVE'),activeBreaks=state.breakSessions.filter(x=>x.status==='ACTIVE'),activeFocuses=state.focusSessions.filter(x=>['ACTIVE','PAUSED'].includes(x.status)),activeSegments=state.activitySegments.filter(x=>x.endedAt==null);if(activeWorks.length>1)issues.push({severity:'critical',code:'MULTIPLE_ACTIVE_WORK'});if(activeBreaks.length>1)issues.push({severity:'critical',code:'MULTIPLE_ACTIVE_BREAKS'});if(activeFocuses.length>1)issues.push({severity:'critical',code:'MULTIPLE_ACTIVE_FOCUS'});if(activeSegments.length>1)issues.push({severity:'critical',code:'MULTIPLE_ACTIVE_ACTIVITIES'});for(const w of state.workSessions){if(w.endedAt!=null&&w.endedAt<w.startedAt)issues.push({severity:'error',code:'WORK_NEGATIVE_DURATION',entityId:w.id});if(w.status==='ACTIVE'&&at-w.startedAt>36*MS.hour)issues.push({severity:'warning',code:'VERY_LONG_WORK_SESSION',entityId:w.id})}for(const s of state.activitySegments)if(s.endedAt!=null&&s.endedAt<s.startedAt)issues.push({severity:'error',code:'SEGMENT_NEGATIVE_DURATION',entityId:s.id});return issues;}
