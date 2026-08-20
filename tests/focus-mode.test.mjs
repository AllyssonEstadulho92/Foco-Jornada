import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import * as C from '../core.js';
import * as M from '../focus-mode-core.js';

const ui=fs.readFileSync('focus-mode.js','utf8');
const css=fs.readFileSync('focus-mode.css','utf8');
const productivity=fs.readFileSync('productivity-core.js','utf8');
const index=fs.readFileSync('index.html','utf8');

test('Modo Foco guarda preferências simples',()=>{
  const s=C.createInitialState(new Date(2026,7,20,8).getTime());
  const p=M.setFocusModeSettings(s,{durationMinutes:50,dailyGoalMinutes:180,activityId:null});
  assert.equal(p.durationMinutes,50);
  assert.equal(p.dailyGoalMinutes,180);
});

test('núcleo suporta sessão de foco sem atividade',()=>{
  const at=new Date(2026,7,20,8).getTime(),s=C.createInitialState(at);
  const r=M.startFocusMode(s,at,{durationMinutes:30});
  assert.equal(r.ok,true);
  assert.equal(r.value.activityId,null);
  assert.equal(r.value.phase,'FOCUS');
  assert.equal(r.value.mode,'FOCUS_MODE');
  assert.equal(r.value.targetDurationMs,30*C.MS.minute);
});

test('resumo diário usa minutos e não ciclos Pomodoro',()=>{
  const at=new Date(2026,7,20,8).getTime(),s=C.createInitialState(at);
  M.setFocusModeSettings(s,{dailyGoalMinutes:60});
  const r=M.startFocusMode(s,at,{durationMinutes:30});
  C.endFocus(s,at+30*C.MS.minute,'COMPLETED');
  const summary=M.focusModeSummary(s,at+31*C.MS.minute);
  assert.equal(summary.completed,1);
  assert.equal(summary.minutes,30);
  assert.equal(summary.goalMinutes,60);
});

test('interface substitui Pomodoro por Modo Foco e mantém atividade opcional',()=>{
  assert.ok(ui.includes('Modo Foco'));
  assert.ok(ui.includes('Sem atividade'));
  assert.ok(ui.includes('+ Criar atividade'));
  assert.ok(ui.includes('Iniciar jornada + sessão'));
  assert.ok(ui.includes('Concluir sessão'));
  assert.ok(css.includes('.focus-mode-v2 [data-view="focus"]>#focusArea'));
  assert.ok(index.includes('./focus-mode.js'));
  assert.ok(index.includes('./focus-mode.css'));
});

test('ciclo automático antigo foi desligado e focus-entry deixou de ser importado',()=>{
  assert.equal(productivity.includes("import('./focus-entry.js')"),false);
  assert.ok(productivity.includes('next:null,transitioned:false'));
  assert.equal(ui.includes('reconcilePomodoro'),false);
});
