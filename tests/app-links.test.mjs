import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const read=path=>fs.readFileSync(new URL(`../${path}`,import.meta.url),'utf8');
test('links de aplicações não usam polling contínuo',()=>{const js=read('app-links.js');assert.equal(js.includes('setInterval('),false);assert.ok(js.includes('buildMoovitDirectionsUrl'));assert.ok(js.includes("import('./shift-planner.js')"));});
test('planeador Moovit valida Casa/Trabalho',()=>{const js=read('app-links.js');assert.ok(js.includes('validateRoute'));assert.ok(js.includes('revealPlaces'));assert.ok(js.includes('native-app-link'));});
test('Supershift do painel abre o planeador interno em vez de um esquema inventado',()=>{const js=read('app-links.js');assert.equal(js.includes('supershift://'),false);assert.ok(js.includes('FocoShiftPlanner'));assert.ok(js.includes('Abrir calendário e turnos'));});
