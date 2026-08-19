import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const read=p=>fs.readFileSync(new URL(`../${p}`,import.meta.url),'utf8');
const app=read('app.js'),runtime=read('runtime-fixes.js'),hub=read('hub.js'),shift=read('shift-planner.js'),touch=read('shift-mobile-interactions.js');

test('ações centrais da aplicação têm handler',()=>{
  for(const action of ['startWork','endWork','screenBreak','restBreak','goFocus','coffee','startFocus','pauseFocus','resumeFocus','endFocus','newActivity','startActivity','pauseActivity','completeActivity','cancelActivity','editWork','reopenWork','cancelWork','export','import','check','reset','toggleTheme'])
    assert.ok(app.includes(`case'${action}'`)||runtime.includes(`action==='${action}'`)||runtime.includes(`'${action}'`),action);
});

test('reparações pedidas estão ligadas a ações reais',()=>{
  for(const fn of ['performFocus','testNotification','handleImportFile','resetAllData','closeDailySummary','openMoovitPlanner','planMoovit','nearbyMoovit','sharePlannerIcs','printPlannerA4','checkForAppUpdate'])assert.ok(runtime.includes(`function ${fn}`),fn);
});

test('hub mantém Moovit, Supershift e Atualizações',()=>{
  for(const action of ['moovit','supershift','updates'])assert.ok(hub.includes(`action==='${action}'`)||hub.includes(`data-hub-action="${action}"`),action);
});

test('Supershift tem edição táctil de dia e ações do calendário',()=>{
  assert.ok(touch.includes("addEventListener('pointerup'"));
  assert.ok(touch.includes('assignShift'));
  assert.ok(touch.includes('removeShift'));
  for(const action of ['prev-month','next-month','calendar-options','pick-selected','export-ics','print'])assert.ok(shift.includes(action),action);
});
