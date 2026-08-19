import test from 'node:test';
import assert from 'node:assert/strict';
import {commandModel,buildSearchIndex,searchItems,diagnosticSnapshot,todayShift} from '../professional-core.js';

test('centro de comando prioriza pausa, foco e jornada',()=>{
  assert.equal(commandModel({breakSessions:[{status:'ACTIVE'}]},{}).status,'Em pausa');
  assert.equal(commandModel({focusSessions:[{status:'ACTIVE'}]},{}).status,'Em foco');
  assert.equal(commandModel({workSessions:[{status:'ACTIVE'}],activities:[{status:'ACTIVE',title:'Inventário'}]},{}).detail,'Inventário');
});

test('turno do dia é lido da escala',()=>{
  const f={shiftPlanner:{templates:[{id:'m',name:'Manhã',kind:'work',start:'08:00',end:'17:00'}],assignments:{'2026-08-19':{templateId:'m'}}}};
  const shift=todayShift(f,new Date(2026,7,19,12));
  assert.equal(shift.label,'Manhã');
  assert.equal(shift.start,'08:00');
});

test('pesquisa global inclui módulos, atividades e turnos',()=>{
  const app={activities:[{id:'a1',title:'Contar stock',category:'Trabalho',status:'PLANNED'}]};
  const features={shiftPlanner:{templates:[{id:'t1',name:'Horário intermédio',code:'HO',kind:'work'}]}};
  const index=buildSearchIndex(app,features);
  assert.ok(searchItems(index,'stock').some(x=>x.title==='Contar stock'));
  assert.ok(searchItems(index,'intermédio').some(x=>x.title==='Horário intermédio'));
  assert.ok(searchItems(index,'backup').some(x=>x.id==='backup'));
});

test('diagnóstico agrega contagens sem alterar dados',()=>{
  const d=diagnosticSnapshot({workSessions:[{}],activities:[{},{}],focusSessions:[{}],coffeeEntries:[{}]},{shiftPlanner:{assignments:{a:{}},templates:[{},{}]}},{online:true,standalone:true,serviceWorker:'ativo',notifications:'granted',storageBytes:1234});
  assert.equal(d.counts.atividades,2);
  assert.equal(d.counts.turnos,1);
  assert.equal(d.storageBytes,1234);
  assert.equal(d.standalone,true);
});
