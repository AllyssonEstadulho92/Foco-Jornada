import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';
const js=fs.readFileSync('runtime-fixes.js','utf8'),css=fs.readFileSync('runtime-fixes.css','utf8'),app=fs.readFileSync('app.js','utf8');
test('runtime fixes não cria polling contínuo',()=>assert.equal(js.includes('setInterval('),false));
test('Pomodoro e atividades pertencem ao app base',()=>{assert.equal(js.includes('performFocus'),false);assert.equal(js.includes('openActivityEditor'),false);assert.ok(app.includes("import * as P from './productivity-core.js'"));assert.ok(app.includes("case'completeActivity'"));assert.ok(app.includes("case'startFocus'"))});
test('runtime mantém apenas compatibilidades operacionais',()=>{for(const x of ['testNotification','handleImportFile','resetAllData','closeDailySummary','openMoovitPlanner','planMoovit','nearbyMoovit','sharePlannerIcs','printPlannerA4','checkForAppUpdate'])assert.ok(js.includes(`function ${x}`),x)});
test('fechar resumo realmente colapsa e pode reabrir',()=>{assert.ok(js.includes('runtime-summary-closed'));assert.ok(js.includes('reopenDailySummary'))});
test('Supershift usa paleta principal',()=>{for(const x of ['var(--bg)','var(--surface)','var(--primary)','var(--line)'])assert.ok(css.includes(x))});
test('corrige ícone do próximo mês',()=>assert.ok(js.includes('m9 18 6-6-6-6')));
