import {DEFAULT_WEEKLY_SCHEDULE,plannedShift,localDayKey as workDayKey,MS} from './features-core.js';

export const COUPLE_VERSION='2.0.0';
export const DEFAULT_COUPLE_CONFIG=Object.freeze({
  bufferMinutes:90,
  reminderMinutes:15,
  baseDurationMinutes:30,
  specialDurations:Object.freeze({0:60,3:90,6:180})
});

const titles={0:'Tempo a dois e alinhar a semana',3:'Noite do casal',6:'Bloco principal do casal'};
const clamp=(v,min,max,fallback)=>{const n=Number(v);return Number.isFinite(n)?Math.min(max,Math.max(min,n)):fallback};
const fmt=ts=>{const d=new Date(ts);return `${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`};

export function normalizeCoupleConfig(input={}){
  const b=DEFAULT_COUPLE_CONFIG;
  return {
    bufferMinutes:clamp(input.bufferMinutes,30,240,b.bufferMinutes),
    reminderMinutes:clamp(input.reminderMinutes,0,60,b.reminderMinutes),
    baseDurationMinutes:clamp(input.baseDurationMinutes,15,120,b.baseDurationMinutes),
    specialDurations:{...b.specialDurations,...(input.specialDurations||{})}
  };
}

export function couplePlan(ts=Date.now(),{
  workSchedule=DEFAULT_WEEKLY_SCHEDULE,
  actualWorkEndAt=null,
  config=DEFAULT_COUPLE_CONFIG
}={}){
  const c=normalizeCoupleConfig(config),shift=plannedShift(ts,workSchedule),day=new Date(ts).getDay();
  const sameDay=Number.isFinite(actualWorkEndAt)&&workDayKey(actualWorkEndAt)===workDayKey(ts);
  const anchorAt=sameDay?actualWorkEndAt:shift.endAt;
  const durationMinutes=clamp(c.specialDurations?.[day],15,360,c.baseDurationMinutes);
  const startAt=anchorAt+c.bufferMinutes*MS.minute;
  const endAt=startAt+durationMinutes*MS.minute;
  const reminderAt=startAt-c.reminderMinutes*MS.minute;
  return {
    day,dayKey:workDayKey(ts),title:titles[day]||'Conexão do casal',durationMinutes,
    bufferMinutes:c.bufferMinutes,reminderMinutes:c.reminderMinutes,
    startAt,endAt,reminderAt,start:fmt(startAt),end:fmt(endAt),anchorAt,
    anchorSource:sameDay?'actual':'planned',shift
  };
}

export function coupleStateForNow(records={},ts=Date.now(),options={}){
  const plan=couplePlan(ts,options),rec=records?.[plan.dayKey]||{};
  if(rec.status==='done')return{phase:'done',plan,record:rec};
  if(rec.status==='skipped')return{phase:'skipped',plan,record:rec};
  if(Number(rec.snoozedUntil)>ts)return{phase:'snoozed',plan,record:rec,nextAt:Number(rec.snoozedUntil)};
  if(ts<plan.startAt)return{phase:'upcoming',plan,record:rec,nextAt:rec.notifiedAt?plan.startAt:Math.max(ts,plan.reminderAt)};
  if(ts<=plan.endAt)return{phase:'active',plan,record:rec,nextAt:ts};
  return{phase:'ended',plan,record:rec};
}

export function nextCoupleReminderAt(records={},ts=Date.now(),options={}){
  const today=coupleStateForNow(records,ts,options);
  if(today.phase==='snoozed')return today.nextAt;
  if(today.phase==='upcoming'&&!today.record?.notifiedAt)return today.plan.reminderAt<=ts?ts:today.plan.reminderAt;
  if(today.phase==='active'&&!today.record?.notifiedAt)return ts;
  for(let i=1;i<=8;i++){
    const d=new Date(ts);d.setDate(d.getDate()+i);d.setHours(12,0,0,0);
    const plan=couplePlan(d.getTime(),{...options,actualWorkEndAt:null}),rec=records?.[plan.dayKey]||{};
    if(rec.status!=='done'&&rec.status!=='skipped')return plan.reminderAt;
  }
  return null;
}

export function recordCoupleAction(records={},action,ts=Date.now(),options={}){
  const plan=couplePlan(ts,options),next={...records},prev={...(next[plan.dayKey]||{})};
  if(action==='done')next[plan.dayKey]={...prev,status:'done',completedAt:ts,snoozedUntil:null};
  else if(action==='skip')next[plan.dayKey]={...prev,status:'skipped',skippedAt:ts,snoozedUntil:null};
  else if(action==='snooze')next[plan.dayKey]={...prev,status:'pending',snoozedUntil:ts+30*MS.minute,notifiedAt:null};
  else if(action==='notified')next[plan.dayKey]={...prev,notifiedAt:ts};
  return next;
}
