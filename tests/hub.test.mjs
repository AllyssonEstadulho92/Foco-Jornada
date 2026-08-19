import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const read=path=>fs.readFileSync(new URL(`../${path}`,import.meta.url),'utf8');

test('menu Mais carrega o hub oculto',()=>{
  const index=read('index.html');
  assert.ok(index.includes('./hub.css'));
  assert.ok(index.includes('src="./hub.js"'));
});

test('hub contém Moovit, Supershift e ferramentas de sistema',()=>{
  const hub=read('hub.js');
  for(const item of ['Moovit','Supershift','Definições','Backup e diagnóstico','Notificações','Atualizações','Horário e pausas'])assert.ok(hub.includes(item),`hub deve incluir ${item}`);
});

test('Moovit abre por deep link oficial com fallback oficial',()=>{
  const hub=read('hub.js');
  assert.ok(hub.includes("moovit://nearby?partner_id=FocoJornada"));
  assert.ok(hub.includes('moovit.onelink.me/3986059930'));
  assert.ok(hub.includes('openMoovitApp'));
});

test('Supershift usa package Android e não inventa scheme iOS',()=>{
  const hub=read('hub.js');
  assert.ok(hub.includes('package=app.supershift'));
  assert.ok(hub.includes('https://supershift.app/'));
  assert.equal(hub.includes('supershift://'),false);
  assert.ok(hub.includes('openSupershiftApp'));
});

test('hub não cria polling contínuo',()=>{
  const hub=read('hub.js');
  assert.equal(hub.includes('setInterval('),false);
});

test('hub mantém acesso à página Mais original',()=>{
  const hub=read('hub.js');
  assert.ok(hub.includes('bypassMore'));
  assert.ok(hub.includes("openMoreAt('#settingsForm')"));
  assert.ok(hub.includes("openMoreAt('#exportBtn')"));
});

test('hub não inclui módulo Vida pessoal',()=>{
  const hub=read('hub.js');
  assert.equal(hub.includes('Tempo a dois'),false);
  assert.equal(hub.includes('Vida pessoal'),false);
});
