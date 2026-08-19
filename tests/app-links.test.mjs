import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const read=path=>fs.readFileSync(new URL(`../${path}`,import.meta.url),'utf8');

test('links de aplicações usam navegação nativa e não polling',()=>{
  const js=read('app-links.js');
  assert.equal(js.includes('setInterval('),false);
  assert.ok(js.includes('moovit://')===false); // URLs Moovit vêm do features-core oficial
  assert.ok(js.includes('buildMoovitDirectionsUrl'));
  assert.ok(js.includes("shortcuts://run-shortcut?name="));
  assert.ok(js.includes("shortcuts://create-shortcut"));
});

test('planeador Moovit valida Casa/Trabalho antes de abrir',()=>{
  const js=read('app-links.js');
  assert.ok(js.includes('validateRoute'));
  assert.ok(js.includes('revealPlaces'));
  assert.ok(js.includes('native-app-link'));
});

test('Supershift não inventa deep link iOS do fabricante',()=>{
  const js=read('app-links.js');
  assert.equal(js.includes('supershift://'),false);
  assert.ok(js.includes('shortcuts://open-shortcut'));
  assert.ok(js.includes('app.supershift'));
});
