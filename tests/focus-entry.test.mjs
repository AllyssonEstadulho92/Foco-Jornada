import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const focus=fs.readFileSync('focus-entry.js','utf8');
const app=fs.readFileSync('app.js','utf8');
const productivity=fs.readFileSync('productivity-core.js','utf8');
const runtime=fs.readFileSync('runtime-fixes.js','utf8');

test('Pomodoro permite iniciar Jornada + Foco quando não há jornada ativa',()=>{
  assert.ok(focus.includes("button.textContent=work?'Iniciar foco':'Iniciar jornada + foco'"));
  assert.ok(focus.includes('C.startWork(fresh,now)'));
  assert.ok(focus.includes("C.startFocus(fresh,now+1,{activityId:aid||null})"));
  assert.ok(focus.includes('confirmStartWithWork'));
});

test('Pomodoro continua utilizável sem atividade',()=>{
  assert.ok(app.includes('<option value="">Sem atividade</option>'));
  assert.ok(focus.includes('Podes iniciar sem atividade ou criar uma agora.'));
  assert.ok(focus.includes('data-focus-create-activity'));
});

test('criar atividade a partir do Foco regressa e seleciona a atividade criada',()=>{
  assert.ok(focus.includes("sessionStorage.setItem(CREATE_RETURN_KEY,'1')"));
  assert.ok(focus.includes("localStorage.setItem(FOCUS_SELECTION_KEY,latest.id)"));
  assert.ok(focus.includes('openFocus()'));
});

test('handler normal de foco continua no app e não regressa ao runtime antigo',()=>{
  assert.ok(app.includes("case'startFocus'"));
  assert.equal(runtime.includes("['startFocus','pauseFocus','resumeFocus','endFocus']"),false);
  assert.ok(productivity.includes("import('./focus-entry.js')"));
});
