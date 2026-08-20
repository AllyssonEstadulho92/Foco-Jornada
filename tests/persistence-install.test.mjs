import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const read=p=>fs.readFileSync(new URL(`../${p}`,import.meta.url),'utf8');
const persistence=read('persistence.js');
const install=read('install-app.js');
const index=read('index.html');
const bootstrap=read('bootstrap.js');
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

test('bootstrap carrega persistência antes do núcleo leve e mantém correção Pomodoro ativa sem duplicação',()=>{
  const persistencePos=bootstrap.indexOf("loadClassic('./persistence.js')");
  const stabilityPos=bootstrap.indexOf("import('./stability.js')");
  assert.ok(persistencePos>=0&&stabilityPos>persistencePos);
  assert.ok(productivity.includes("import('./focus-entry.js')"));
  assert.equal(index.includes('src="./focus-entry.js"'),false);
  assert.equal(index.includes('src="./ux.js"'),false);
  assert.ok(index.includes("import('./bootstrap.js')"));
  assert.ok(bootstrap.includes("'./ux.js'"));
  assert.ok(bootstrap.includes("'./install-app.js'"));
  assert.ok(index.includes('./install-app.css'));
});

test('primeiro paint mantém onboarding isolado dos módulos visuais e integrações',()=>{
  assert.ok(index.includes('id="startupShell"'));
  assert.ok(index.includes('id="startupStatus"'));
  assert.ok(index.includes('requestAnimationFrame(function()'));
  assert.ok(index.includes('media="print" onload="this.media=\'all\'"'));
  assert.ok(index.includes('id="mainCss"'));
  assert.ok(bootstrap.includes("waitStylesheet('mainCss')"));
  assert.ok(bootstrap.includes('onboardingPending'));
  assert.ok(bootstrap.includes('#finishOnboarding,#skipOnboarding'));
  assert.ok(bootstrap.includes('scheduleExtras()'));
  assert.ok(bootstrap.includes('const nextFrame='));
  assert.ok(bootstrap.includes("const modules=['./ux.js'"));
  assert.equal(bootstrap.includes("await import('./ux.js');"),false);
  assert.equal(bootstrap.includes('requestIdleCallback'),false);
  assert.equal(bootstrap.includes('setTimeout(()=>loadShift()'),false);
  for(const heavy of ['src="./shift-planner.js"','src="./shift-advanced.js"','src="./shift-reports.js"','src="./shift-mobile-interactions.js"'])assert.equal(index.includes(heavy),false,heavy);
  for(const heavy of ["import('./shift-planner.js')","import('./shift-advanced.js')","import('./shift-reports.js')","import('./shift-mobile-interactions.js')"])assert.ok(bootstrap.includes(heavy),heavy);
});

test('service worker abre pelo cache e atualiza pela rede em segundo plano',()=>{
  assert.ok(sw.includes('fast-cache1-core-startup1'));
  assert.ok(sw.includes('./bootstrap.js'));
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
