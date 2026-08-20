import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const read=p=>fs.readFileSync(new URL(`../${p}`,import.meta.url),'utf8');
const app=read('app.js'),runtime=read('runtime-fixes.js'),hub=read('hub.js'),shift=read('shift-planner.js'),touch=read('shift-mobile-interactions.js'),professional=read('professional-ui.js'),professionalCore=read('professional-core.js'),links=read('app-links.js'),interaction=read('interaction-fixes.js'),index=read('index.html'),planning=read('planning-mode.js'),linear=read('linear-ui.css');

test('ações centrais da aplicação têm handler',()=>{for(const action of ['startWork','endWork','screenBreak','restBreak','coffee','newActivity','startActivity','pauseActivity','completeActivity','duplicateActivity','moveTomorrow','toggleSubtask','cancelActivity','editWork','reopenWork','cancelWork','export','import','check','reset','toggleTheme'])assert.ok(app.includes(`case'${action}'`)||runtime.includes(`action==='${action}'`)||runtime.includes(`'${action}'`)||professional.includes(action),action);});

test('Planeamento é uma vista pública própria',()=>{assert.ok(index.includes('data-view="planning"'));assert.ok(index.includes('data-nav="planning"'));assert.ok(index.includes('src="./planning-mode.js"'));assert.ok(planning.includes('O essencial do dia'));assert.ok(planning.includes('data-plan-shift'));assert.ok(linear.includes('.planning-glyph'));assert.equal(index.includes('src="./focus-mode.js"'),false);assert.equal(index.includes('./focus-mode.css'),false);});

test('interface pública não apresenta Foco ou Pomodoro como módulo',()=>{for(const source of [index,hub,planning,professional,professionalCore]){assert.equal(source.includes('Foco e Pomodoro'),false);assert.equal(source.includes('Modo Foco'),false);assert.equal(source.includes('Pomodoro'),false)}assert.ok(hub.includes('Planeamento'));assert.ok(professional.includes('Planeamento'));});

test('Verificar dados executa análise estrutural real',()=>{assert.ok(professional.includes('integrityIssues'));assert.ok(professional.includes("#checkBtn"));assert.ok(professional.includes('Dados consistentes ✓'));});

test('Moovit tem um único proprietário efetivo anterior ao runtime',()=>{assert.ok(links.includes("document.addEventListener('click',handleMoovitClick,true)"));assert.ok(links.includes('stopImmediatePropagation'));assert.ok(index.indexOf('src="./app-links.js"')<index.indexOf('src="./runtime-fixes.js"'));for(const fn of ['openMoovitPlanner','planMoovit','nearbyMoovit'])assert.equal(runtime.includes(`function ${fn}`),false,fn);});

test('teste de notificações tem um único proprietário efetivo anterior ao runtime',()=>{assert.ok(interaction.includes("[data-runtime-test-notification]"));assert.ok(interaction.includes('stopImmediatePropagation'));assert.ok(index.indexOf('src="./interaction-fixes.js"')<index.indexOf('src="./runtime-fixes.js"'));assert.equal(runtime.includes('function testNotification'),false);});

test('compatibilidades restantes estão ligadas a ações reais',()=>{for(const fn of ['handleImportFile','resetAllData','closeDailySummary','sharePlannerIcs','printPlannerA4','checkForAppUpdate'])assert.ok(runtime.includes(`function ${fn}`),fn);});
test('hub mantém Moovit, Supershift e Atualizações',()=>{for(const action of ['moovit','supershift','updates'])assert.ok(hub.includes(`action==='${action}'`)||hub.includes(`data-hub-action="${action}"`),action);});
test('Supershift móvel tem edição táctil, copiar amanhã e copiar semana',()=>{assert.ok(touch.includes("addEventListener('pointerup'"));assert.ok(touch.includes('assignShift'));assert.ok(touch.includes('removeShift'));assert.ok(touch.includes('data-touch-copy-tomorrow'));assert.ok(touch.includes('data-touch-copy-week'));assert.ok(touch.includes('copyDay'));assert.ok(touch.includes('copyWeek'));assert.ok(touch.includes('sp-touch-copy sp-advanced-actions-grid'));for(const action of ['prev-month','next-month','calendar-options','pick-selected','export-ics','print'])assert.ok(shift.includes(action),action);});
