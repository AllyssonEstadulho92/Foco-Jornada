import test from 'node:test';
import assert from 'node:assert/strict';
import {commandModel,buildSearchIndex,searchItems,diagnosticSnapshot,integrityIssues,todayShift} from '../professional-core.js';

test('centro de comando prioriza pausa, sessão antiga e jornada com comando executável',()=>{
  assert.equal(commandModel({breakSessions:[{status:'ACTIVE'}]},{}).nextCommand,'endBreak');
  assert.equal(commandModel({focusSessions:[{status:'PAUSED'}]},{}).nextCommand,'resumeFocus');
  assert.equal(commandModel({focusSessions:[{status:'ACTIVE'}]},{}).nextTitle,'Abrir sessão ativa');
  assert.equal(commandModel({workSessions:[{status:'ACTIVE'}],activities:[{status:'ACTIVE',title:'Inventário'}]},{}).detail,'Inventário');
});

test('turno do dia é lido da escala e sugere iniciar jornada',()=>{
  const f={shiftPlanner:{templates:[{id:'m',name:'Manhã',kind:'work',start:'08:00',end:'17:00'}],assignments:{'2026-08-19':{templateId:'m'}}}};
  const shift=todayShift(f,new Date(2026,7,19,12));
  assert.equal(shift.label,'Manhã');
  assert.equal(shift.start,'08:00');
  assert.equal(commandModel({},f,new Date(2026,7,19,12)).nextCommand,'startWork');
});

test('pesquisa global inclui Planeamento, módulos, atividades e turnos',()=>{
  const app={activities:[{id:'a1',title:'Contar stock',category:'Trabalho',status:'PLANNED'}]};
  const features={shiftPlanner:{templates:[{id:'t1',name:'Horário intermédio',code:'HO',kind:'work'}]}};
  const index=buildSearchIndex(app,features);
  assert.ok(searchItems(index,'stock').some(x=>x.title==='Contar stock'));
  assert.ok(searchItems(index,'intermédio').some(x=>x.title==='Horário intermédio'));
  assert.ok(searchItems(index,'backup').some(x=>x.id==='backup'));
  assert.ok(searchItems(index,'planeamento').some(x=>x.title==='Planeamento'));
  assert.equal(searchItems(index,'foco').some(x=>x.title==='Modo Foco'),false);
});

test('diagnóstico agrega contagens sem alterar dados',()=>{
  const d=diagnosticSnapshot({workSessions:[{}],activities:[{},{}],focusSessions:[{}],coffeeEntries:[{}]},{shiftPlanner:{assignments:{a:{}},templates:[{},{}]}},{online:true,standalone:true,serviceWorker:'ativo',notifications:'granted',storageBytes:1234});
  assert.equal(d.counts.atividades,2);
  assert.equal(d.counts.turnos,1);
  assert.equal(d.storageBytes,1234);
  assert.equal(d.standalone,true);
});

test('verificação de integridade encontra conflitos reais da aplicação e da escala',()=>{
  const app={settings:{},workSessions:[{id:'w1',status:'ACTIVE'},{id:'w2',status:'ACTIVE'}],breakSessions:[],activities:[],activitySegments:[],focusSessions:[],coffeeEntries:[],events:[]};
  const features={shiftPlanner:{templates:[{id:'morning'}],assignments:{'2026-08-19':{templateId:'missing'}}}};
  const issues=integrityIssues(app,features);
  assert.ok(issues.some(x=>x.code==='MULTIPLE_ACTIVE_WORK'));
  assert.ok(issues.some(x=>x.code==='SHIFT_TEMPLATE_MISSING'));
});
