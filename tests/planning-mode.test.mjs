import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const read=p=>fs.readFileSync(new URL(`../${p}`,import.meta.url),'utf8');
const index=read('index.html'),planning=read('planning-mode.js'),linear=read('linear-ui.css'),sw=read('sw.js'),hub=read('hub.js'),icons=read('flaticon-icons.js');

test('Planeamento tem rota e vista próprias',()=>{assert.ok(index.includes('data-nav="planning"'));assert.ok(index.includes('data-view="planning"'));assert.ok(index.includes('src="./planning-mode.js"'));assert.equal(index.includes('data-nav="focus"'),false);});
test('Planeamento usa o mesmo ícone em navegação e ação rápida',()=>{assert.ok(planning.includes('const PLAN_ICON='));assert.ok(planning.includes('planning-glyph'));assert.ok(planning.includes('planning-nav-icon'));assert.ok(planning.includes('planning-quick-icon'));assert.ok(linear.includes('.planning-glyph'));assert.ok(hub.includes("planning:'<rect x=\"4\" y=\"4\" width=\"6\""));assert.ok(icons.includes("planning:'calendar-lines'"));assert.ok(icons.includes("goFocus:'calendar-lines'"));});
test('Planeamento apresenta estado, prioridades e atalhos úteis',()=>{for(const token of ['O essencial do dia','Para hoje','Atrasadas','Próximas atividades','Supershift','Histórico'])assert.ok(planning.includes(token),token);});
test('tipografia global é Manrope e preserva a família dos ícones',()=>{assert.ok(linear.includes('font-family:"Manrope"'));assert.ok(linear.includes('!important'));assert.ok(linear.includes(':not(.fi)'));assert.equal(linear.includes('font-family:Arial'),false);assert.equal(linear.includes('font-family:system-ui,-apple-system'),false);});
test('módulos públicos antigos não são carregados nem enviados para cache',()=>{assert.equal(index.includes('focus-mode.js'),false);assert.equal(index.includes('focus-mode.css'),false);assert.equal(sw.includes('focus-mode.js'),false);assert.equal(sw.includes('focus-mode-core.js'),false);assert.equal(sw.includes('focus-mode.css'),false);});
