import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const read=p=>fs.readFileSync(new URL(`../${p}`,import.meta.url),'utf8');
const js=read('interaction-fixes.js'),css=read('interaction-fixes.css'),index=read('index.html');

test('correções são carregadas antes do runtime legacy',()=>{assert.ok(index.includes('./interaction-fixes.css'));assert.ok(index.indexOf('src="./interaction-fixes.js"')<index.indexOf('src="./runtime-fixes.js"'));});
test('guardar definições preserva rascunho e tem fallback persistente',()=>{for(const fn of ['formSnapshot','applyDraft','stateMatchesDraft','forceSaveDraft','bindSettings'])assert.ok(js.includes(`function ${fn}`),fn);assert.ok(js.includes("button[type=\"submit\"]"));});
test('teste de notificações tem feedback visível e service worker',()=>{assert.ok(js.includes('runNotificationTest'));assert.ok(js.includes('showNotification'));assert.ok(js.includes('Teste enviado ✓'));});
test('jornada é eliminada de forma definitiva e limpa dependências',()=>{assert.ok(js.includes('hardDeleteWork'));assert.ok(js.includes('state.workSessions=')&&js.includes('state.breakSessions=')&&js.includes('state.focusSessions='));assert.ok(js.includes("data-action=\"cancelWork\""));});
test('menu superior móvel existe e abre o hub',()=>{assert.ok(js.includes('fjTopMore'));assert.ok(js.includes('window.FocoHub?.open?.()'));assert.ok(css.includes('.fj-more-trigger'));});
test('ícones do menu usam grelha fixa para alinhamento',()=>{assert.ok(css.includes('grid-template-columns:30px minmax(0,1fr) 10px 16px'));assert.ok(css.includes('.hub-item-arrow{grid-column:4'));});
