export const FEATURE_VERSION='4.2.0';
export const MOOVIT_PARTNER_ID='FocoJornada';
export const MS={minute:60000,hour:3600000,day:86400000};

export const validCoordinate=(v,min,max)=>Number.isFinite(Number(v))&&Number(v)>=min&&Number(v)<=max;
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

export function workBreakMs(state,work,now=Date.now()){
  const end=work.endedAt??now;
  return (state.breakSessions||[]).filter(b=>b.workSessionId===work.id&&b.status!=='CANCELLED').reduce((sum,b)=>sum+Math.max(0,Math.min(b.endedAt??now,end)-Math.max(b.startedAt,work.startedAt)),0);
}

export function effectiveWorkMs(state,work,now=Date.now()){
  return Math.max(0,(work.endedAt??now)-work.startedAt-workBreakMs(state,work,now));
}

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
