import {normalizePlanner,fromDayKey,dayKey,addDays,templateById,assignShift,rangeReport,monthReport} from './shift-planner-core.js';

export const SICK_TEMPLATE=Object.freeze({id:'sick',code:'BA',name:'Baixa médica',kind:'sick',allDay:true,start:null,end:null,breakMinutes:0,color:'magenta'});

export function ensureAdvancedTemplates(planner){
  const next=normalizePlanner(planner);
  if(!next.templates.some(t=>t.id===SICK_TEMPLATE.id))next.templates.push({...SICK_TEMPLATE});
  return next;
}

export function copyDay(planner,sourceKey,targetKey){
  const next=ensureAdvancedTemplates(planner),source=next.assignments[sourceKey];
  if(!source)throw new Error('SOURCE_SHIFT_NOT_FOUND');
  if(!/^\d{4}-\d{2}-\d{2}$/.test(String(targetKey)))throw new Error('TARGET_DAY_INVALID');
  next.assignments[targetKey]={...source,copiedFrom:sourceKey};
  return next;
}

export function copyWeek(planner,anchorKey,weekOffset=1){
  const next=ensureAdvancedTemplates(planner),anchor=fromDayKey(anchorKey),sourceStart=addDays(anchor,-anchor.getDay()),targetStart=addDays(sourceStart,7*Math.max(1,Number(weekOffset)||1));
  let copied=0;
  for(let i=0;i<7;i++){
    const sourceKey=dayKey(addDays(sourceStart,i)),targetKey=dayKey(addDays(targetStart,i)),assignment=next.assignments[sourceKey];
    if(assignment){next.assignments[targetKey]={...assignment,copiedFrom:sourceKey};copied++}
  }
  return {planner:next,copied,sourceStart:dayKey(sourceStart),targetStart:dayKey(targetStart)};
}

export function applyTemplateRange(planner,startKey,endKey,templateId,extra={}){
  let next=ensureAdvancedTemplates(planner);
  if(!templateById(next,templateId))throw new Error('SHIFT_TEMPLATE_NOT_FOUND');
  let start=fromDayKey(startKey),end=fromDayKey(endKey);
  if(Number.isNaN(start.getTime())||Number.isNaN(end.getTime()))throw new Error('DATE_RANGE_INVALID');
  if(end<start)[start,end]=[end,start];
  const days=Math.floor((end-start)/86400000)+1;
  if(days<1||days>366)throw new Error('DATE_RANGE_TOO_LARGE');
  for(let i=0;i<days;i++)next=assignShift(next,dayKey(addDays(start,i)),templateId,extra);
  return {planner:next,days,startKey:dayKey(start),endKey:dayKey(end)};
}

function kindCounts(planner,rows){
  const counts={work:0,off:0,holiday:0,vacation:0,absence:0,sick:0,other:0};
  rows.forEach(row=>{const kind=row.template?.kind||'other';counts[kind]=(counts[kind]||0)+1});
  return counts;
}

export function monthSummary(planner,value){
  const p=ensureAdvancedTemplates(planner),report=monthReport(p,value),counts=kindCounts(p,report.rows);
  return {...report,kindCounts:counts,assignedDays:report.rows.length,workDays:(counts.work||0)+(counts.holiday||0),vacationDays:counts.vacation||0,absenceDays:counts.absence||0,sickDays:counts.sick||0,offDays:counts.off||0,holidayDays:counts.holiday||0};
}

export function yearSummary(planner,yearValue){
  const p=ensureAdvancedTemplates(planner),year=Number(yearValue)||new Date().getFullYear(),start=new Date(year,0,1),end=new Date(year,11,31),report=rangeReport(p,start,end),counts=kindCounts(p,report.rows),job=p.jobs.find(j=>j.isDefault)||p.jobs[0],monthlyTarget=Math.max(0,Number(job?.targetMonthlyMinutes)||0),targetYearMinutes=monthlyTarget*12;
  return {...report,year,kindCounts:counts,assignedDays:report.rows.length,workDays:(counts.work||0)+(counts.holiday||0),vacationDays:counts.vacation||0,absenceDays:counts.absence||0,sickDays:counts.sick||0,offDays:counts.off||0,holidayDays:counts.holiday||0,targetYearMinutes,overtimeYearMinutes:targetYearMinutes?report.workedMinutes-targetYearMinutes:null};
}
