import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const read=p=>fs.readFileSync(new URL(`../${p}`,import.meta.url),'utf8');
const persistence=read('persistence.js');
const install=read('install-app.js');
const index=read('index.html');
const manifest=JSON.parse(read('manifest.webmanifest'));

test('persistência protege estado principal e Supershift',()=>{
  for(const token of ['foco-jornada-v4','foco-jornada-features-v2','foco-jornada-recovery-v1','indexedDB','shiftPlanner','foco-shift-planner-change'])assert.ok(persistence.includes(token),token);
  assert.ok(persistence.includes("Storage.prototype.setItem"));
  assert.ok(persistence.includes("visibilitychange"));
  assert.ok(persistence.includes("pagehide"));
});

test('persistência oferece proteção de armazenamento',()=>{
  assert.ok(persistence.includes('navigator.storage?.persisted'));
  assert.ok(persistence.includes('navigator.storage?.persist'));
  assert.ok(persistence.includes('requestPersistentStorage'));
});

test('instalação suporta prompt nativo e instruções iPhone',()=>{
  assert.ok(install.includes('beforeinstallprompt'));
  assert.ok(install.includes('appinstalled'));
  assert.ok(install.includes('Adicionar ao ecrã principal'));
  assert.ok(install.includes('Partilhar'));
  assert.ok(install.includes('navigator.standalone'));
});

test('menu recebe Instalar aplicação e ferramentas de proteção',()=>{
  assert.ok(install.includes('Instalar aplicação'));
  assert.ok(install.includes('Proteger dados'));
  assert.ok(install.includes('Criar backup'));
});

test('bootstrap carrega persistência antes dos módulos e mantém correção Pomodoro ativa',()=>{
  const persistencePos=index.indexOf('./persistence.js');
  const uxPos=index.indexOf('./ux.js');
  assert.ok(persistencePos>=0&&uxPos>persistencePos);
  assert.ok(index.includes('./focus-entry.js'));
  assert.ok(index.includes('./install-app.js'));
  assert.ok(index.includes('./install-app.css'));
});

test('manifest está configurado como aplicação standalone',()=>{
  assert.equal(manifest.display,'standalone');
  assert.equal(manifest.id,'./');
  assert.equal(manifest.start_url,'./');
  assert.ok(Array.isArray(manifest.icons)&&manifest.icons.length>=1);
});
