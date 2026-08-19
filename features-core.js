export const FEATURE_VERSION='4.2.0';
export const MOOVIT_PARTNER_ID='FocoJornada';
export const MS={minute:60000,hour:3600000,day:86400000};

export const DEFAULT_WEEKLY_SCHEDULE=Object.freeze({
  0:Object.freeze({label:'Domingo',start:'09:00',end:'18:00',breakStart:'13:00',breakEnd:'14:00'}),
  1:Object.freeze({label:'Segunda',start:'08:00',end:'17:00',breakStart:'12:00',breakEnd:'13:00'}),
  2:Object.freeze({label:'Terça',start:'08:00',end:'17:00',breakStart:'12:00',breakEnd:'13:00'}),
  3:Object.freeze({label:'Quarta',start:'08:00',end:'17:00',breakStart:'12:00',breakEnd:'13:00'}),
  4:Object.freeze({label:'Quinta',start:'08:00',end:'17:00',breakStart:'12:00',breakEnd:'13:00'}),
  5:Object.freeze({label:'Sexta',start:'08:00',end:'17:00',breakStart:'12:00',breakEnd:'13:00'}),
  6:Object.freeze({label:'Sábado',start:'08:00',end:'17:00',breakStart:'12:00',breakEnd:'13:00'})
});

export const validCoordinate=(v,min,max)=>{
  if(v===null||v===undefined||String(v).trim()==='')return false;
  const n=Number(v);
  return Number.isFinite(n)&&n>=min&&n<=max;
};
export const validPlace=p=>!!p&&validCoordinate(p.lat,-90,90)&&validCoordinate(p.lon,-180,180);

export function buildMoovitNearbyUrl({lat=null,lon=null,partnerId=MOOVIT_PARTNER_ID}={}){
  const p=new URLSearchParams();
  if(validCoordinate(lat,-90,90))p.set('lat',String(Number(lat)));
  if(validCoordinate(lon,-180,180))p.set('lon',String(Number(lon)));
  p.set('partner_id',partnerId);
  return `moovit://nearby?${p.toString()}`;
}

export function buildMoovitDirectionsUrl({origin=null,destination=null,date=null,autoRun=true,partnerId=MOOVIT_PARTNER_ID}={}){
  const p=new URLSearchParams();
  if(validPlace(origin)){
    p.set('orig_lat',String(Number(origin.lat)));p.set('orig_lon',String(Number(origin.lon)));
    if(origin.name)p.set('orig_name',String(origin.name));
  }
  if(validPlace(destination)){
    p.set('dest_lat',String(Number(destination.lat)));p.set('dest_lon',String(Number(destination.lon)));
    if(destination.name)p.set('dest_name',String(destination.name));
  }
  if(date){const d=date instanceof Date?date:new Date(date);if(!Number.isNaN(d.getTime()))p.set('date',d.toISOString())}
  p.set('auto_run',autoRun?'true':'false');p.set('partner_id',partnerId);
  return `moovit://directions?${p.toString()}`;
}

export function localDayKey(ts){const d=new Date(ts);return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`}
export function dayBounds(key){const[y,m,d]=key.split('-').map(Number);const start=new Date(y,m-1,d).getTime();return{start,end:new Date(y,m-1,d+1).getTime()}}
const overlap=(a,b,start,end)=>Math.max(0,Math.min(b,end)-Math.max(a,start));

function normalizeSchedule(schedule=DEFAULT_WEEKLY_SCHEDULE){
  const out={};
  for(let day=0;day<7;day++){
    const base=DEFAULT_WEEKLY_SCHEDULE[day],src=schedule?.[day]||schedule?.[String(day)]||{};
    out[day]={...base,...src};
  }
  return out;
}
export function getScheduleForDate(date=Date.now(),schedule=DEFAULT_WEEKLY_SCHEDULE){
  const d=date instanceof Date?date:new Date(date);
  return {...normalizeSchedule(schedule)[d.getDay()]};
}
export function timeOnDate(date,time){
  const d=date instanceof Date?new Date(date):new Date(date);
  const [h,m]=String(time||'00:00').split(':').map(Number);
  d.setHours(Number.isFinite(h)?h:0,Number.isFinite(m)?m:0,0,0);
  return d.getTime();
}
export function plannedShift(date=Date.now(),schedule=DEFAULT_WEEKLY_SCHEDULE){
  const d=date instanceof Date?date:new Date(date),s=getScheduleForDate(d,schedule);
  return {...s,startAt:timeOnDate(d,s.start),endAt:timeOnDate(d,s.end),breakStartAt:timeOnDate(d,s.breakStart),breakEndAt:timeOnDate(d,s.breakEnd)};
}
export function breakReminderStatus(state,{now=Date.now(),schedule=DEFAULT_WEEKLY_SCHEDULE,alreadyReminded=false}={}){
  const plan=plannedShift(now,schedule);
  const context=state?.settings?.activeContextId||'work';
  const work=(state?.workSessions||[]).find(w=>w.status==='ACTIVE'&&w.contextId===context);
  const restDone=!!work&&(state?.breakSessions||[]).some(b=>b.workSessionId===work.id&&b.type==='REST'&&b.status!=='CANCELLED');
  const inWindow=now>=plan.breakStartAt&&now<plan.endAt;
  return {plan,work,restDone,shouldRemind:!!work&&!restDone&&!alreadyReminded&&inWindow};
}

export function workBreakMs(state,work,now=Date.now()){
  const end=work.endedAt??now;
  return (state.breakSessions||[]).filter(b=>b.workSessionId===work.id&&b.status!=='CANCELLED').reduce((sum,b)=>sum+Math.max(0,Math.min(b.endedAt??now,end)-Math.max(b.startedAt,work.startedAt)),0);
}
export function effectiveWorkMs(state,work,now=Date.now()){return Math.max(0,(work.endedAt??now)-work.startedAt-workBreakMs(state,work,now));}
export function computeProjectedExit(state,{targetMinutes=480,plannedRestMinutes=60,now=Date.now()}={}){
  const context=state?.settings?.activeContextId||'work';
  const work=(state?.workSessions||[]).find(w=>w.status==='ACTIVE'&&w.contextId===context);
  if(!work)return null;
  const effective=effectiveWorkMs(state,work,now);
  const remaining=Math.max(0,Number(targetMinutes)*MS.minute-effective);
  const breaks=(state.breakSessions||[]).filter(b=>b.workSessionId===work.id&&b.status!=='CANCELLED');
  const hadRest=breaks.some(b=>b.type==='REST');
  const activeBreak=breaks.find(b=>b.status==='ACTIVE');
  const activeBreakRemaining=activeBreak?.expectedEndAt?Math.max(0,activeBreak.expectedEndAt-now):0;
  const plannedRestRemaining=hadRest?0:Math.max(0,Number(plannedRestMinutes)||0)*MS.minute;
  return {projectedAt:now+remaining+activeBreakRemaining+plannedRestRemaining,effectiveMs:effective,remainingEffectiveMs:remaining,plannedRestRemainingMs:plannedRestRemaining,activeBreakRemainingMs:activeBreakRemaining};
}

export function summarizeDay(state,key=localDayKey(Date.now()),now=Date.now()){
  const {start,end}=dayBounds(key);let gross=0,breaks=0;
  const works=(state?.workSessions||[]).filter(w=>w.status!=='CANCELLED'&&w.startedAt<end&&(w.endedAt??now)>start);
  for(const w of works){const we=w.endedAt??now;gross+=overlap(w.startedAt,we,start,end);for(const b of (state.breakSessions||[]).filter(b=>b.workSessionId===w.id&&b.status!=='CANCELLED'))breaks+=overlap(b.startedAt,b.endedAt??now,start,end)}
  const focus=(state?.focusSessions||[]).filter(f=>f.phase==='FOCUS'&&f.status!=='CANCELLED'&&f.startedAt>=start&&f.startedAt<end).reduce((sum,f)=>sum+Math.max(0,(f.endedAt??now)-f.startedAt-(f.pausedMs||0)-(f.status==='PAUSED'&&f.pausedAt?Math.max(0,now-f.pausedAt):0)),0);
  const coffees=(state?.coffeeEntries||[]).filter(c=>c.consumedAt>=start&&c.consumedAt<end);
  const completed=(state?.activities||[]).filter(a=>a.completedAt>=start&&a.completedAt<end).length;
  return {grossWorkMs:gross,breakMs:breaks,effectiveWorkMs:Math.max(0,gross-breaks),focusMs:focus,coffeeCount:coffees.reduce((s,c)=>s+(c.quantity||1),0),coffeeSpendCents:coffees.reduce((s,c)=>s+(c.totalPriceCents||0),0),completedActivities:completed,workSessions:works.length,hasCompletedWork:works.some(w=>w.status==='COMPLETED')};
}

const pad=n=>String(n).padStart(2,'0');
const icsDate=ts=>{const d=new Date(ts);return `${d.getFullYear()}${pad(d.getMonth()+1)}${pad(d.getDate())}T${pad(d.getHours())}${pad(d.getMinutes())}00`};
const icsEscape=s=>String(s??'').replace(/\\/g,'\\\\').replace(/;/g,'\\;').replace(/,/g,'\\,').replace(/\n/g,'\\n');
export function buildWorkScheduleIcs({startDate=Date.now(),weeks=8,schedule=DEFAULT_WEEKLY_SCHEDULE,title='Trabalho — Foco & Jornada'}={}){
  const start=new Date(startDate);start.setHours(0,0,0,0);
  const days=Math.max(1,Math.min(366,Math.round(Number(weeks)||8)*7));
  const lines=['BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//Foco & Jornada//PT','CALSCALE:GREGORIAN','METHOD:PUBLISH'];
  for(let i=0;i<days;i++){
    const d=new Date(start);d.setDate(start.getDate()+i);const plan=plannedShift(d,schedule);const key=localDayKey(d.getTime()).replaceAll('-','');
    lines.push('BEGIN:VEVENT',`UID:foco-jornada-${key}@local`,`DTSTAMP:${icsDate(Date.now())}`,`DTSTART:${icsDate(plan.startAt)}`,`DTEND:${icsDate(plan.endAt)}`,`SUMMARY:${icsEscape(title)}`,`DESCRIPTION:${icsEscape(`Pausa prevista ${plan.breakStart}–${plan.breakEnd}. Início da pausa é manual na Foco & Jornada.`)}`,'END:VEVENT');
  }
  lines.push('END:VCALENDAR');return lines.join('\r\n');
}
