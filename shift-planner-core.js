export const SHIFT_PLANNER_VERSION='4.2.0';
export const DAY_MS=86400000;

export const DEFAULT_SHIFT_TEMPLATES=Object.freeze([
  Object.freeze({id:'morning',code:'DE',name:'De manhã',kind:'work',start:'08:00',end:'17:00',breakMinutes:60,color:'coral'}),
  Object.freeze({id:'off',code:'⌂',name:'Folga',kind:'off',allDay:true,start:null,end:null,breakMinutes:0,color:'blue'}),
  Object.freeze({id:'holiday',code:'FE',name:'Feriado',kind:'holiday',start:'09:00',end:'17:00',breakMinutes:60,color:'green'}),
  Object.freeze({id:'vacation',code:'FE',name:'Férias',kind:'vacation',allDay:true,start:null,end:null,breakMinutes:0,color:'amber'}),
  Object.freeze({id:'absence',code:'FA',name:'Falta',kind:'absence',start:'09:00',end:'17:00',breakMinutes:60,color:'cyan'}),
  Object.freeze({id:'middle',code:'HO',name:'Horários intermédios',kind:'work',start:'11:00',end:'20:00',breakMinutes:60,color:'emerald'})
]);

export const DEFAULT_JOB=Object.freeze({id:'default',name:'O meu trabalho',hourlyRateCents:523,targetMonthlyMinutes:217*60,isDefault:true});
export const DEFAULT_ROTATION=Object.freeze({id:'rotation1',name:'Rota. 1',days:70,sequence:['morning','morning','morning','morning','morning','off','off']});

const pad=n=>String(n).padStart(2,'0');
export function dayKey(value){const d=value instanceof Date?value:new Date(value);return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`}
export function fromDayKey(key){const[y,m,d]=String(key).split('-').map(Number);return new Date(y,m-1,d)}
export function addDays(value,days){const d=value instanceof Date?new Date(value):new Date(value);d.setDate(d.getDate()+Number(days||0));return d}
export function monthKey(value){const d=value instanceof Date?value:new Date(value);return `${d.getFullYear()}-${pad(d.getMonth()+1)}`}
export function monthBounds(value){const d=value instanceof Date?value:new Date(value);const start=new Date(d.getFullYear(),d.getMonth(),1),end=new Date(d.getFullYear(),d.getMonth()+1,1);return{start,end}}
export function daysInMonth(value){const d=value instanceof Date?value:new Date(value);return new Date(d.getFullYear(),d.getMonth()+1,0).getDate()}
export function minutesFromTime(time){if(!time)return null;const[h,m]=String(time).split(':').map(Number);if(!Number.isFinite(h)||!Number.isFinite(m))return null;return h*60+m}
export function durationMinutes(template,assignment={}){
  if(!template||template.allDay||['off','vacation'].includes(template.kind))return 0;
  const start=minutesFromTime(assignment.start||template.start),end=minutesFromTime(assignment.end||template.end);if(start==null||end==null)return 0;
  let diff=end-start;if(diff<0)diff+=24*60;return Math.max(0,diff-Math.max(0,Number(assignment.breakMinutes??template.breakMinutes??0)));
}
export function normalizePlanner(input={}){
  const templates=Array.isArray(input.templates)&&input.templates.length?input.templates.map(x=>({...x})):DEFAULT_SHIFT_TEMPLATES.map(x=>({...x}));
  const jobs=Array.isArray(input.jobs)&&input.jobs.length?input.jobs.map(x=>({...x})):[{...DEFAULT_JOB}];
  const rotations=Array.isArray(input.rotations)&&input.rotations.length?input.rotations.map(x=>({...x,sequence:Array.isArray(x.sequence)?[...x.sequence]:[]})):[{...DEFAULT_ROTATION,sequence:[...DEFAULT_ROTATION.sequence]}];
  return {version:SHIFT_PLANNER_VERSION,templates,jobs,rotations,assignments:{...(input.assignments||{})},settings:{calendarView:'month',visibleJobIds:jobs.map(x=>x.id),...(input.settings||{})}};
}
export function templateById(planner,id){return planner?.templates?.find(x=>x.id===id)||null}
export function jobById(planner,id){return planner?.jobs?.find(x=>x.id===id)||planner?.jobs?.[0]||null}
export function assignmentFor(planner,key){return planner?.assignments?.[key]||null}
export function assignShift(planner,key,templateId,extra={}){const next=normalizePlanner(planner);if(!templateById(next,templateId))throw new Error('SHIFT_TEMPLATE_NOT_FOUND');next.assignments[key]={templateId,jobId:extra.jobId||jobById(next,extra.jobId)?.id||next.jobs[0]?.id||'default',...extra};return next}
export function removeShift(planner,key){const next=normalizePlanner(planner);delete next.assignments[key];return next}
export function calendarCells(value){const d=value instanceof Date?value:new Date(value),first=new Date(d.getFullYear(),d.getMonth(),1),start=addDays(first,-first.getDay());return Array.from({length:42},(_,i)=>{const date=addDays(start,i);return{date,key:dayKey(date),day:date.getDate(),inMonth:date.getMonth()===d.getMonth(),today:dayKey(date)===dayKey(new Date())}})}
export function rangeReport(planner,startValue,endValue){
  const start=startValue instanceof Date?new Date(startValue):new Date(startValue),end=endValue instanceof Date?new Date(endValue):new Date(endValue);end.setHours(23,59,59,999);
  const counts={},jobMinutes={},rows=[];let workedMinutes=0;
  Object.entries(planner?.assignments||{}).forEach(([key,a])=>{const date=fromDayKey(key);if(date<start||date>end)return;const t=templateById(planner,a.templateId);if(!t)return;counts[t.id]=(counts[t.id]||0)+1;const minutes=durationMinutes(t,a);if(t.kind==='work'||t.kind==='holiday'){workedMinutes+=minutes;const job=a.jobId||planner.jobs?.[0]?.id;jobMinutes[job]=(jobMinutes[job]||0)+minutes}rows.push({key,assignment:a,template:t,minutes})});
  const primary=jobById(planner,planner.jobs?.find(x=>x.isDefault)?.id),targetMinutes=Math.max(0,Number(primary?.targetMonthlyMinutes)||0),overtimeMinutes=workedMinutes-targetMinutes,hourlyRateCents=Math.max(0,Number(primary?.hourlyRateCents)||0),earningsCents=Math.round(workedMinutes/60*hourlyRateCents);
  rows.sort((a,b)=>a.key.localeCompare(b.key));return{counts,rows,workedMinutes,targetMinutes,overtimeMinutes,earningsCents,jobMinutes};
}
export function monthReport(planner,value){const{start,end}=monthBounds(value);return rangeReport(planner,start,new Date(end.getTime()-1))}
export function applyRotation(planner,rotationId,startKey,days=null){
  const next=normalizePlanner(planner),rotation=next.rotations.find(x=>x.id===rotationId);if(!rotation||!rotation.sequence?.length)throw new Error('ROTATION_NOT_FOUND');const total=Math.max(1,Math.min(730,Number(days||rotation.days||rotation.sequence.length))),start=fromDayKey(startKey);for(let i=0;i<total;i++){const templateId=rotation.sequence[i%rotation.sequence.length];if(templateById(next,templateId))next.assignments[dayKey(addDays(start,i))]={templateId,jobId:next.jobs[0]?.id||'default',rotationId:rotation.id}}return next;
}
export function shiftCountRows(planner,report){return planner.templates.map(t=>({id:t.id,code:t.code,name:t.name,color:t.color,count:report.counts[t.id]||0})).filter(x=>x.count>0)}
const icsEscape=s=>String(s??'').replace(/\\/g,'\\\\').replace(/;/g,'\\;').replace(/,/g,'\\,').replace(/\n/g,'\\n');
const icsDateTime=(key,time='00:00')=>`${key.replaceAll('-','')}T${String(time).replace(':','')}00`;
export function exportPlannerIcs(planner,startValue,endValue){
  const report=rangeReport(planner,startValue,endValue),lines=['BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//Foco & Jornada//Escala PT','CALSCALE:GREGORIAN','METHOD:PUBLISH'];
  report.rows.forEach(row=>{const t=row.template,a=row.assignment;lines.push('BEGIN:VEVENT',`UID:fj-escala-${row.key}-${t.id}@local`,`DTSTAMP:${icsDateTime(dayKey(new Date()),'00:00')}`);if(t.allDay||['off','vacation'].includes(t.kind)){const next=dayKey(addDays(fromDayKey(row.key),1));lines.push(`DTSTART;VALUE=DATE:${row.key.replaceAll('-','')}`,`DTEND;VALUE=DATE:${next.replaceAll('-','')}`)}else{lines.push(`DTSTART:${icsDateTime(row.key,a.start||t.start)}`,`DTEND:${icsDateTime(row.key,a.end||t.end)}`)}lines.push(`SUMMARY:${icsEscape(t.name)}`,`DESCRIPTION:${icsEscape('Escala Foco & Jornada')}`,'END:VEVENT')});lines.push('END:VCALENDAR');return lines.join('\r\n');
}
