import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const read=p=>fs.readFileSync(new URL(`../${p}`,import.meta.url),'utf8');
const persistence=read('persistence.js');
const install=read('install-app.js');
const index=read('index.html');
const productivity=read('productivity-core.js');
const sw=read('sw.js');
const ux=read('ux.js');
const manifest=JSON.parse(read('manifest.webmanifest'));

test('persistência protege estado principal e Supershift',()=>{
  for(const token of ['foco-jornada-v4','foco-jornada-features-v2','foco-jornada-recovery-v1','indexedDB','shiftPlanner','foco-shift-planner-change'])assert.ok(persistence.includes(token),token);
  assert.ok(persistence.includes('preserveFeatureBranches'));
  assert.ok(persistence.includes("Storage.prototype.setItem"));
  assert.ok(persistence.includes("visibilitychange"));
  assert.ok(persistence.includes("pagehide"));
});

test('persistência inclui preferências auxiliares importantes',()=>{
  for(const key of ['foco-jornada-notifications-v1','foco-jornada-notification-preference-v1','foco-jornada-focus-activity-v1'])assert.ok(persistence.includes(key),key);
  assert.ok(persistence.includes('AUX_KEYS'));
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

test('instalador não mantém observador global permanente',()=>{
  assert.equal(install.includes('new MutationObserver'),false);
  assert.ok(install.includes('menuRetries'));
  assert.ok(install.includes('setTimeout(schedule,100)'));
});

test('bootstrap carrega persistência antes dos módulos e mantém correção Pomodoro ativa sem duplicar script',()=>{
  const persistencePos=index.indexOf('./persistence.js');
  const uxPos=index.indexOf('./ux.js');
  assert.ok(persistencePos>=0&&uxPos>persistencePos);
  assert.ok(productivity.includes("import('./focus-entry.js')"));
  assert.equal(index.includes('<script type="module" src="./focus-entry.js"></script>'),false);
  assert.ok(index.includes('./install-app.js'));
  assert.ok(index.includes('./install-app.css'));
});

test('service worker abre pelo cache e atualiza pela rede em segundo plano',()=>{
  assert.ok(sw.includes('fast-cache1'));
  assert.ok(sw.includes("cache:'no-cache'"));
  assert.ok(sw.includes('cache.match(key)'));
  assert.ok(sw.includes('event.waitUntil(update'));
  assert.ok(sw.includes('self.skipWaiting()'));
  assert.equal(sw.includes("cache:'no-store'"),false);
});

test('interface ignora alterações apenas textuais dos temporizadores',()=>{
  assert.ok(ux.includes('mutation.addedNodes'));
  assert.ok(ux.includes('node.nodeType===1'));
  assert.equal(ux.includes('characterData:true'),false);
});

test('manifest está configurado como aplicação standalone',()=>{
  assert.equal(manifest.display,'standalone');
  assert.equal(manifest.id,'./');
  assert.equal(manifest.start_url,'./');
  assert.ok(Array.isArray(manifest.icons)&&manifest.icons.length>=1);
});
