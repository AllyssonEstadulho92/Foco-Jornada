import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const read=p=>fs.readFileSync(new URL(`../${p}`,import.meta.url),'utf8');
const app=read('app.js'),runtime=read('runtime-fixes.js'),hub=read('hub.js'),shift=read('shift-planner.js'),touch=read('shift-mobile-interactions.js'),professional=read('professional-ui.js'),professionalCore=read('professional-core.js'),links=read('app-links.js'),interaction=read('interaction-fixes.js'),index=read('index.html'),focusMode=read('focus-mode.js'),focusCss=read('focus-mode.css'),planning=read('planning-mode.js'),linear=read('linear-ui.css'),productivity=read('productivity-core.js');

test('ações centrais da aplicação têm handler',()=>{
  for(const action of ['startWork','endWork','screenBreak','restBreak','goFocus','coffee','startFocus','pauseFocus','resumeFocus','endFocus','newActivity','startActivity','pauseActivity','completeActivity','duplicateActivity','moveTomorrow','toggleSubtask','cancelActivity','editWork','reopenWork','cancelWork','export','import','check','reset','toggleTheme'])
    assert.ok(app.includes(`case'${action}'`)||runtime.includes(`action==='${action}'`)||runtime.includes(`'${action}'`)||professional.includes(action),action);
});

test('Atividades e motor legado de foco não regressam aos handlers antigos do runtime',()=>{
  assert.equal(runtime.includes('performFocus'),false);
  assert.equal(runtime.includes('performActivity'),false);
  assert.equal(runtime.includes('openActivityEditor'),false);
  assert.ok(app.includes("import * as P from './productivity-core.js'"));
  assert.equal(productivity.includes("import('./focus-entry.js')"),false);
  assert.equal(index.includes('focus-entry.js'),false);
});

test('motor de foco permanece compatível mas fica fora da experiência principal',()=>{
  for(const token of ['data-focus-mode-action="start"','data-focus-mode-action="pause"','data-focus-mode-action="resume"','data-focus-mode-action="complete"'])assert.ok(focusMode.includes(token),token);
  assert.ok(focusCss.includes('[data-view="focus"]>#focusArea'));
  assert.ok(index.includes('src="./focus-mode.js"'));
  assert.ok(index.includes('src="./planning-mode.js"'));
  assert.ok(index.includes('Planeamento'));
  assert.ok(planning.includes('O essencial do dia'));
  assert.ok(planning.includes('data-plan-shift'));
  assert.ok(linear.includes('[data-view="focus"]>#focusArea'));
  assert.ok(linear.includes('display:none!important'));
});

test('motor de foco não cria pausa ou novo ciclo automaticamente',()=>{
  assert.ok(productivity.includes('next:null,transitioned:false'));
  assert.equal(productivity.includes("nextPhase='FOCUS'"),false);
  assert.equal(productivity.includes("'SHORT_BREAK':'"),false);
});

test('Centro de Comando executa regressar, sessão antiga e iniciar jornada',()=>{
  for(const command of ['endBreak','resumeFocus','startWork'])assert.ok(professional.includes(command),command);
  assert.ok(professional.includes('runPrimary'));
  assert.ok(professionalCore.includes("nextTitle=active.activity?'Abrir atividade':'Escolher atividade'"));
  assert.ok(professionalCore.includes("['planning','Planeamento'"));
  assert.equal(professionalCore.includes("['focus','Modo Foco'"),false);
});

test('Verificar dados executa análise estrutural real',()=>{
  assert.ok(professional.includes('integrityIssues'));
  assert.ok(professional.includes("#checkBtn"));
  assert.ok(professional.includes('Dados consistentes ✓'));
});

test('Moovit tem um único proprietário efetivo anterior ao runtime',()=>{
  assert.ok(links.includes("document.addEventListener('click',handleMoovitClick,true)"));
  assert.ok(links.includes('stopImmediatePropagation'));
  assert.ok(index.indexOf('src="./app-links.js"')<index.indexOf('src="./runtime-fixes.js"'));
  for(const fn of ['openMoovitPlanner','planMoovit','nearbyMoovit'])assert.equal(runtime.includes(`function ${fn}`),false,fn);
  for(const token of ["t.matches('[data-hub-action=\"moovit\"]')","t.id==='planMoovit'","t.id==='nearbyTransit'"])assert.equal(runtime.includes(token),false,token);
});

test('teste de notificações tem um único proprietário efetivo anterior ao runtime',()=>{
  assert.ok(interaction.includes("[data-runtime-test-notification]"));
  assert.ok(interaction.includes('stopImmediatePropagation'));
  assert.ok(index.indexOf('src="./interaction-fixes.js"')<index.indexOf('src="./runtime-fixes.js"'));
  assert.equal(runtime.includes('function testNotification'),false);
  assert.equal(runtime.includes("t.matches('[data-runtime-test-notification]')"),false);
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
  assert.ok(touch.includes('sp-touch-copy sp-advanced-actions-grid'));
  for(const action of ['prev-month','next-month','calendar-options','pick-selected','export-ics','print'])assert.ok(shift.includes(action),action);
});
