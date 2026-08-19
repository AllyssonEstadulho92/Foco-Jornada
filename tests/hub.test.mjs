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
