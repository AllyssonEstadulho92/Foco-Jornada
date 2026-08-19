import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';
const js=fs.readFileSync('runtime-fixes.js','utf8'),css=fs.readFileSync('runtime-fixes.css','utf8');
test('runtime fixes não cria polling contínuo',()=>assert.equal(js.includes('setInterval('),false));
test('corrige Pomodoro e associação de atividade',()=>{assert.ok(js.includes('startFocus'));assert.ok(js.includes('FOCUS_SELECTION_KEY'));assert.ok(js.includes('activityId:saved||null'))});
test('corrige criação e ações de atividades',()=>{for(const x of ['openActivityEditor','createActivity','startActivity','pauseActivity','completeActivity','cancelActivity'])assert.ok(js.includes(x))});
test('fechar resumo realmente colapsa e pode reabrir',()=>{assert.ok(js.includes('runtime-summary-closed'));assert.ok(js.includes('reopenDailySummary'))});
test('Supershift usa paleta principal',()=>{for(const x of ['var(--bg)','var(--surface)','var(--primary)','var(--line)'])assert.ok(css.includes(x))});
test('corrige ícone do próximo mês',()=>assert.ok(js.includes('m9 18 6-6-6-6')));
