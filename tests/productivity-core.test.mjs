import test from 'node:test';
import assert from 'node:assert/strict';
import * as C from '../core.js';
import * as P from '../productivity-core.js';

const base=(at=Date.UTC(2026,7,19,8))=>{const s=C.createInitialState(at);s.settings.onboardingDone=true;C.startWork(s,at);return s};

test('atividade guarda prazo, etiquetas, subtarefas e recorrência',()=>{const at=Date.UTC(2026,7,19,8),s=base(at),r=C.createActivity(s,{title:'Relatório'},at);P.applyActivityAdvanced(r.value,{plannedFor:'2026-08-19',dueDate:'2026-08-20',recurrence:'weekly',tags:'loja, urgente, loja',subtasks:'Preparar\nRever'},at);assert.equal(r.value.recurrence,'weekly');assert.deepEqual(r.value.tags,['loja','urgente']);assert.equal(r.value.subtasks.length,2);assert.equal(P.dueDateKey(r.value),'2026-08-20')});

test('concluir atividade recorrente cria a próxima ocorrência',()=>{const at=new Date(2026,7,19,8).getTime(),s=base(at),r=C.createActivity(s,{title:'Inventário',plannedFor:'2026-08-19'},at);P.applyActivityAdvanced(r.value,{recurrence:'weekly',subtasks:'Contar\nEnviar'},at);const done=P.completeActivityAdvanced(s,r.value.id,at+1000);assert.equal(done.ok,true);assert.ok(done.nextActivity);assert.equal(done.nextActivity.plannedFor,'2026-08-26');assert.equal(done.nextActivity.title,'Inventário');assert.equal(done.nextActivity.subtasks.every(x=>!x.done),true)});

test('duplicar e mover para amanhã preservam o original',()=>{const at=new Date(2026,7,19,8).getTime(),s=base(at),r=C.createActivity(s,{title:'Documento'},at),copy=P.duplicateActivity(s,r.value.id,at+10);assert.equal(copy.ok,true);assert.notEqual(copy.value.id,r.value.id);const moved=P.moveActivityToTomorrow(s,copy.value.id,at+20);assert.equal(moved.value.plannedFor,'2026-08-20');assert.equal(r.value.plannedFor,null)});

test('subtarefa alterna concluída e reaberta',()=>{const at=new Date(2026,7,19,8).getTime(),s=base(at),r=C.createActivity(s,{title:'Checklist'},at);P.applyActivityAdvanced(r.value,{subtasks:'Passo 1'},at);const id=r.value.subtasks[0].id;assert.equal(P.toggleSubtask(s,r.value.id,id,at+1).value.done,true);assert.equal(P.toggleSubtask(s,r.value.id,id,at+2).value.done,false)});

test('fim do temporizador conclui a sessão sem criar outra fase',()=>{const at=new Date(2026,7,19,8).getTime(),s=base(at);const start=C.startFocus(s,at,{durationMinutes:1});const result=P.reconcilePomodoro(s,start.value.expectedEndAt);assert.equal(result.ok,true);assert.equal(result.completed.status,'COMPLETED');assert.equal(result.next,null);assert.equal(result.transitioned,false);assert.equal(C.activeFocus(s),null)});

test('compatibilidade Pomodoro mantém ciclo automático desligado',()=>{const at=new Date(2026,7,19,8).getTime(),s=base(at);const settings=P.setPomodoroSettings(s,{auto:true,dailyGoal:6},at);assert.equal(settings.auto,false);assert.equal(settings.dailyGoal,6);assert.equal(s.settings.autoPomodoro,false)});
