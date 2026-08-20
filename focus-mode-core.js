import * as C from './core.js';

export const FOCUS_MODE_VERSION='2.0.0';
export const FOCUS_PRESETS=Object.freeze([
  {minutes:15,label:'Rápido',detail:'Arranque curto'},
  {minutes:30,label:'Concentrado',detail:'Sessão equilibrada'},
  {minutes:50,label:'Profundo',detail:'Trabalho sem interrupções'},
  {minutes:90,label:'Imersão',detail:'Bloco prolongado'}
]);

const clamp=(value,min,max,fallback)=>{const n=Number(value);return Number.isFinite(n)?Math.min(max,Math.max(min,n)):fallback};

export function focusModeSettings(state={}){
  const raw=state.settings?.focusMode||{};
  return {
    durationMinutes:clamp(raw.durationMinutes,5,180,30),
    dailyGoalMinutes:clamp(raw.dailyGoalMinutes,15,720,120),
    activityId:raw.activityId||null
  };
}

export function setFocusModeSettings(state,data={},at=Date.now()){
  state.settings=state.settings||{};
  const current=focusModeSettings(state);
  const next={
    durationMinutes:'durationMinutes'in data?clamp(data.durationMinutes,5,180,current.durationMinutes):current.durationMinutes,
    dailyGoalMinutes:'dailyGoalMinutes'in data?clamp(data.dailyGoalMinutes,15,720,current.dailyGoalMinutes):current.dailyGoalMinutes,
    activityId:'activityId'in data?(data.activityId||null):current.activityId
  };
  state.settings.focusMode=next;
  C.touch(state,at);
  return next;
}

export function availableFocusActivities(state={}){
  const context=C.activeContextId(state);
  return (state.activities||[]).filter(a=>a.contextId===context&&!['COMPLETED','CANCELLED'].includes(a.status));
}

function validActivityId(state,id){
  if(!id)return null;
  return availableFocusActivities(state).some(a=>a.id===id)?id:null;
}

export function startFocusMode(state,at=Date.now(),options={}){
  if(C.activeBreak(state))return{ok:false,error:'BREAK_ALREADY_ACTIVE'};
  if(C.activeFocus(state))return{ok:false,error:'FOCUS_ALREADY_ACTIVE'};
  const durationMinutes=clamp(options.durationMinutes,5,180,focusModeSettings(state).durationMinutes);
  if(!Number.isFinite(durationMinutes)||durationMinutes<=0)return{ok:false,error:'INVALID_DURATION'};
  const work=C.activeWork(state);
  const activityId=validActivityId(state,options.activityId??focusModeSettings(state).activityId);
  const session={
    id:C.uid('focus'),
    workSessionId:work?.id||null,
    activityId,
    phase:'FOCUS',
    mode:'FOCUS_MODE',
    status:'ACTIVE',
    startedAt:at,
    expectedEndAt:at+durationMinutes*C.MS.minute,
    endedAt:null,
    targetDurationMs:durationMinutes*C.MS.minute,
    pausedAt:null,
    pausedMs:0,
    cycleNumber:1,
    createdAt:at,
    updatedAt:at,
    version:1
  };
  state.focusSessions=state.focusSessions||[];
  state.focusSessions.push(session);
  setFocusModeSettings(state,{durationMinutes,activityId},at);
  C.pushEvent(state,'FOCUS_STARTED','Modo Foco iniciado',`${durationMinutes} min${work?' · dentro da jornada':' · sessão independente'}`,at,'FocusSession',session.id,{mode:'FOCUS_MODE',activityId,workSessionId:work?.id||null});
  C.touch(state,at);
  return{ok:true,value:session};
}

export function finishExpiredFocus(state,at=Date.now()){
  const focus=C.activeFocus(state);
  if(!focus||focus.status!=='ACTIVE'||at<focus.expectedEndAt)return null;
  return C.endFocus(state,focus.expectedEndAt,'COMPLETED');
}

export function focusModeSummary(state={},at=Date.now()){
  const key=C.localDayKey(at),settings=focusModeSettings(state);
  const sessions=(state.focusSessions||[]).filter(f=>f.phase==='FOCUS'&&C.localDayKey(f.startedAt)===key);
  const completed=sessions.filter(f=>f.status==='COMPLETED').length;
  const active=sessions.filter(f=>['ACTIVE','PAUSED'].includes(f.status)).length;
  const minutes=Math.round(sessions.reduce((sum,f)=>sum+C.focusEffectiveMs(f,at),0)/C.MS.minute);
  return {sessions:sessions.length,completed,active,minutes,goalMinutes:settings.dailyGoalMinutes,goalReached:minutes>=settings.dailyGoalMinutes,progress:Math.min(100,Math.round(minutes/settings.dailyGoalMinutes*100))};
}

export function recentFocusSessions(state={},limit=6,at=Date.now()){
  return [...(state.focusSessions||[])]
    .filter(f=>f.phase==='FOCUS')
    .sort((a,b)=>(b.startedAt||0)-(a.startedAt||0))
    .slice(0,Math.max(1,limit))
    .map(f=>({
      id:f.id,
      startedAt:f.startedAt,
      endedAt:f.endedAt,
      status:f.status,
      activityId:f.activityId||null,
      minutes:Math.max(0,Math.round(C.focusEffectiveMs(f,at)/C.MS.minute)),
      independent:!f.workSessionId
    }));
}
