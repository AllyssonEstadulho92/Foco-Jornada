import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const read=path=>fs.readFileSync(new URL(`../${path}`,import.meta.url),'utf8');
const pkg=JSON.parse(read('package.json')),version=pkg.version,cacheVersion=version.replaceAll('.','-');

test('versão 4.2.0 é coerente nos ficheiros públicos ativos',()=>{
  const index=read('index.html'),ux=read('ux.js'),stability=read('stability.js'),featureCore=read('features-core.js'),sw=read('sw.js');
  assert.match(index,new RegExp(`id="appVersionSide">${version.replaceAll('.','\\.')}</span>`));
  assert.match(index,new RegExp(`id="appVersion">${version.replaceAll('.','\\.')}</span>`));
  assert.ok(ux.includes(`UI_VERSION='${version}'`));
  assert.ok(stability.includes(`VERSION='${version}'`));
  assert.ok(featureCore.includes(`FEATURE_VERSION='${version}'`));
  assert.ok(sw.includes(`v${cacheVersion}`));
});

test('runtime público já não carrega a antiga camada enhancements',()=>{assert.equal(read('index.html').includes('enhancements.js'),false);assert.equal(read('ux.js').includes("import './enhancements.js'"),false);assert.ok(read('ux.js').includes("import './stability.js'"));});

test('manifest inclui atalhos de transportes e Planeamento',()=>{const manifest=JSON.parse(read('manifest.webmanifest'));const urls=(manifest.shortcuts||[]).map(x=>x.url);assert.ok(urls.includes('./?action=transport'));assert.ok(urls.includes('./?action=planning'));assert.equal(urls.includes('./?action=focus'),false);});
