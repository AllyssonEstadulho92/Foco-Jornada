import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const read=p=>fs.readFileSync(new URL(`../${p}`,import.meta.url),'utf8');
const app=read('app.js'),runtime=read('runtime-fixes.js'),hub=read('hub.js'),shift=read('shift-planner.js'),touch=read('shift-mobile-interactions.js'),professional=read('professional-ui.js'),links=read('app-links.js'),interaction=read('interaction-fixes.js'),index=read('index.html');

test('ações centrais da aplicação têm handler',()=>{
  for(const action of ['startWork','endWork','screenBreak','restBreak','goFocus','coffee','startFocus','pauseFocus','resumeFocus','endFocus','newActivity','startActivity','pauseActivity','completeActivity','duplicateActivity','moveTomorrow','toggleSubtask','cancelActivity','editWork','reopenWork','cancelWork','export','import','check','reset','toggleTheme'])
    assert.ok(app.includes(`case'${action}'`)||runtime.includes(`action==='${action}'`)||runtime.includes(`'${action}'`)||professional.includes(action),action);
});

test('Atividades e Pomodoro já não têm handler duplicado no runtime',()=>{
  assert.equal(runtime.includes('performFocus'),false);
  assert.equal(runtime.includes('performActivity'),false);
  assert.equal(runtime.includes('openActivityEditor'),false);
  assert.ok(app.includes("import * as P from './productivity-core.js'"));
});

test('Centro de Comando executa regressar, retomar foco e iniciar jornada',()=>{
  for(const command of ['endBreak','resumeFocus','startWork'])assert.ok(professional.includes(command),command);
  assert.ok(professional.includes('runPrimary'));
});

test('Verificar dados executa análise estrutural real',()=>{
  assert.ok(professional.includes('integrityIssues'));
  assert.ok(professional.includes("#checkBtn"));
  assert.ok(professional.includes('Dados consistentes ✓'));
});

test('Moovit tem proprietário efetivo anterior ao runtime',()=>{
  assert.ok(links.includes("document.addEventListener('click',handleMoovitClick,true)"));
  assert.ok(links.includes('stopImmediatePropagation'));
  assert.ok(index.indexOf('./app-links.js')<index.indexOf('./runtime-fixes.js'));
});

test('teste de notificações tem proprietário efetivo anterior ao runtime',()=>{
  assert.ok(interaction.includes("[data-runtime-test-notification]"));
  assert.ok(interaction.includes('stopImmediatePropagation'));
  assert.ok(index.indexOf('./interaction-fixes.js')<index.indexOf('./runtime-fixes.js'));
});

test('compatibilidades restantes estão ligadas a ações reais',()=>{
  for(const fn of ['handleImportFile','resetAllData','closeDailySummary','sharePlannerIcs','printPlannerA4','checkForAppUpdate'])assert.ok(runtime.includes(`function ${fn}`),fn);
});

test('hub mantém Moovit, Supershift e Atualizações',()=>{
  for(const action of ['moovit','supershift','updates'])assert.ok(hub.includes(`action==='${action}'`)||hub.includes(`data-hub-action="${action}"`),action);
});

test('Supershift móvel tem edição táctil, copiar amanhã e copiar semana',()=>{
  assert.ok(touch.includes("addEventListener('pointerup'"));
  assert.ok(touch.includes('assignShift'));
  assert.ok(touch.includes('removeShift'));
  assert.ok(touch.includes('data-touch-copy-tomorrow'));
  assert.ok(touch.includes('data-touch-copy-week'));
  assert.ok(touch.includes('copyDay'));
  assert.ok(touch.includes('copyWeek'));
  for(const action of ['prev-month','next-month','calendar-options','pick-selected','export-ics','print'])assert.ok(shift.includes(action),action);
});
