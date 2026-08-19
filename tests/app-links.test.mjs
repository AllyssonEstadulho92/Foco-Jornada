import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const read=path=>fs.readFileSync(new URL(`../${path}`,import.meta.url),'utf8');

test('links de aplicações não usam polling contínuo',()=>{const js=read('app-links.js');assert.equal(js.includes('setInterval('),false);assert.ok(js.includes('buildMoovitDirectionsUrl'));assert.ok(js.includes("import('./shift-planner.js')"));});
test('Moovit tem um handler documental autoritativo carregado antes do runtime',()=>{const js=read('app-links.js');assert.ok(js.includes("document.addEventListener('click',handleMoovitClick,true)"));assert.ok(js.includes('stopImmediatePropagation'));assert.ok(js.includes("[data-hub-action=\"moovit\"]"));assert.ok(js.includes("#planMoovit"));assert.ok(js.includes("#nearbyTransit"));});
test('planeador Moovit valida Casa/Trabalho e mantém botão nativo',()=>{const js=read('app-links.js');assert.ok(js.includes('validateRoute'));assert.ok(js.includes('revealPlaces'));assert.ok(js.includes('ensureButton'));assert.equal(js.includes('native-app-link'),false);});
test('Perto de mim e atalhos rápidos usam deep links do mesmo proprietário',()=>{const js=read('app-links.js');assert.ok(js.includes('function nearby()'));assert.ok(js.includes('function quickTrip(type)'));assert.ok(js.includes('buildMoovitNearbyUrl'));assert.ok(js.includes('launchMoovitScheme'));});
test('planeamento tem fallback quando o esquema não abre',()=>{const js=read('app-links.js');assert.ok(js.includes('MOOVIT_FALLBACK'));assert.ok(js.includes('document.visibilityState'));assert.ok(js.includes('1500'));});
test('Supershift do painel abre o planeador interno em vez de um esquema inventado',()=>{const js=read('app-links.js');assert.equal(js.includes('supershift://'),false);assert.ok(js.includes('FocoShiftPlanner'));assert.ok(js.includes('Abrir calendário e turnos'));});
