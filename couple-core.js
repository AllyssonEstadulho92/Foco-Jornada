export const COUPLE_VERSION='1.0.0';
export const DEFAULT_COUPLE_SCHEDULE=Object.freeze({
  0:{start:'19:30',end:'21:30',title:'Jantar e planeamento da semana'},
  1:{start:'19:30',end:'21:00',title:'Jantar e tempo juntos'},
  2:{start:'20:30',end:'21:00',title:'Conversa sem ecrãs'},
  3:{start:'19:30',end:'22:00',title:'Noite do casal'},
  4:{start:'19:30',end:'21:00',title:'Tempo tranquilo juntos'},
  5:{start:'19:30',end:'22:30',title:'Noite a dois'},
  6:{start:'18:30',end:'22:30',title:'Bloco principal do casal'}
});

export function localDayKey(ts=Date.now()){
  const d=new Date(ts);return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}
function clockOnDay(ts,clock){
  const d=new Date(ts),[h,m]=String(clock).split(':').map(Number);d.setHours(h||0,m||0,0,0);return d.getTime();
}
export function couplePlan(ts=Date.now(),schedule=DEFAULT_COUPLE_SCHEDULE){
  const d=new Date(ts),plan=schedule[d.getDay()]||DEFAULT_COUPLE_SCHEDULE[d.getDay()];
  return {...plan,day:d.getDay(),dayKey:localDayKey(ts),startAt:clockOnDay(ts,plan.start),endAt:clockOnDay(ts,plan.end)};
}
export function coupleStateForNow(records={},ts=Date.now(),schedule=DEFAULT_COUPLE_SCHEDULE){
  const plan=couplePlan(ts,schedule),rec=records?.[plan.dayKey]||{};
  if(rec.status==='done')return{phase:'done',plan,record:rec};
  if(rec.status==='skipped')return{phase:'skipped',plan,record:rec};
  if(Number(rec.snoozedUntil)>ts)return{phase:'snoozed',plan,record:rec,nextAt:Number(rec.snoozedUntil)};
  if(ts<plan.startAt)return{phase:'upcoming',plan,record:rec,nextAt:plan.startAt};
  if(ts<=plan.endAt)return{phase:'active',plan,record:rec,nextAt:ts};
  return{phase:'ended',plan,record:rec};
}
export function nextCoupleReminderAt(records={},ts=Date.now(),schedule=DEFAULT_COUPLE_SCHEDULE){
  const today=coupleStateForNow(records,ts,schedule);
  if(today.phase==='snoozed'||today.phase==='upcoming')return today.nextAt;
  if(today.phase==='active'&&!today.record?.notifiedAt)return ts;
  for(let i=1;i<=8;i++){
    const d=new Date(ts);d.setDate(d.getDate()+i);d.setHours(0,0,0,0);
    const plan=couplePlan(d.getTime(),schedule),rec=records?.[plan.dayKey]||{};
    if(rec.status!=='done'&&rec.status!=='skipped')return plan.startAt;
  }
  return null;
}
export function recordCoupleAction(records={},action,ts=Date.now(),schedule=DEFAULT_COUPLE_SCHEDULE){
  const plan=couplePlan(ts,schedule),next={...records},prev={...(next[plan.dayKey]||{})};
  if(action==='done')next[plan.dayKey]={...prev,status:'done',completedAt:ts,snoozedUntil:null};
  else if(action==='skip')next[plan.dayKey]={...prev,status:'skipped',skippedAt:ts,snoozedUntil:null};
  else if(action==='snooze')next[plan.dayKey]={...prev,status:'pending',snoozedUntil:ts+30*60_000,notifiedAt:null};
  else if(action==='notified')next[plan.dayKey]={...prev,notifiedAt:ts};
  return next;
}
