import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const read=p=>fs.readFileSync(new URL(`../${p}`,import.meta.url),'utf8');
const persistence=read('persistence.js');
const install=read('install-app.js');
const index=read('index.html');
const productivity=read('productivity-core.js');
const app=read('app.js');
const stability=read('stability.js');
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

test('arranque carrega persistência antes da aplicação e não usa shell bloqueante',()=>{
  const persistencePos=index.indexOf('src="./persistence.js"');
  const uxPos=index.indexOf('src="./ux.js"');
  assert.ok(persistencePos>=0&&uxPos>persistencePos);
  assert.ok(index.includes('src="./features.js"'));
  assert.equal(index.includes('src="./focus-entry.js"'),false);
  assert.ok(productivity.includes("import('./focus-entry.js')"));
  assert.ok(index.includes('src="./install-app.js"'));
  assert.ok(index.includes('./install-app.css'));
  assert.equal(index.includes('id="startupShell"'),false);
  assert.equal(index.includes("import('./bootstrap.js')"),false);
});

test('folhas principais são carregadas diretamente sem media print temporário',()=>{
  for(const css of ['./styles.css','./ux.css','./features.css','./hub.css','./productivity.css','./stability-ui.css'])assert.ok(index.includes(`rel="stylesheet" href="${css}"`)||index.includes(`rel="stylesheet" href="${css}"`),css);
  assert.equal(index.includes('media="print" onload='),false);
});

test('runtime renderiza apenas a vista ativa e mantém temporizadores leves',()=>{
  const activeBlock=app.slice(app.indexOf('function renderActiveView('),app.indexOf('function render(){'));
  const renderBlock=app.slice(app.indexOf('function render(){'),app.indexOf('function renderToday('));
  for(const token of ["case'activities'","case'focus'","case'history'","case'stats'","case'more'","renderToday(now)"])assert.ok(activeBlock.includes(token),token);
  assert.ok(renderBlock.includes('renderActiveView(now)'));
  assert.equal(renderBlock.includes('renderActivities(now);renderFocus(now);renderHistory(now);renderStats(now);renderMore(now)'),false);
  assert.equal(renderBlock.includes('save();'),false);
  assert.equal(app.includes("setInterval(()=>{const r=reconcileTimers"),false);
  assert.ok(app.includes('function updateLiveUi('));
  assert.ok(app.includes('function scheduleLiveTick('));
  assert.ok(app.includes("window.dispatchEvent(new CustomEvent('foco-render'"));
  assert.equal(stability.includes('window.setInterval='),false);
  assert.equal(stability.includes('nativeSetInterval'),false);
  assert.ok(stability.includes("await import('./app.js')"));
});

test('service worker usa rede primeiro e mantém aplicação completa offline',()=>{
  assert.ok(sw.includes('direct-boot1'));
  assert.ok(sw.includes('./features.js'));
  assert.ok(sw.includes('./shift-planner.js'));
  assert.ok(sw.includes('./runtime-fixes.js'));
  assert.ok(sw.includes('./professional-ui.js'));
  assert.ok(sw.includes('./apple-touch-icon.png'));
  assert.ok(sw.includes('./icon-192.png'));
  assert.ok(sw.includes('./icon-512.png'));
  assert.ok(sw.includes("cache:'no-cache'"));
  assert.ok(sw.includes('self.skipWaiting()'));
});

test('interface ignora alterações apenas textuais dos temporizadores',()=>{
  assert.ok(ux.includes('mutation.addedNodes'));
  assert.ok(ux.includes('node.nodeType===1'));
  assert.equal(ux.includes('characterData:true'),false);
});

test('manifest usa ícones PNG instaláveis e mantém SVG como fallback',()=>{
  assert.equal(manifest.display,'standalone');
  assert.equal(manifest.id,'./');
  assert.equal(manifest.start_url,'./');
  assert.ok(manifest.icons.some(icon=>icon.src==='./icon-192.png'&&icon.sizes==='192x192'));
  assert.ok(manifest.icons.some(icon=>icon.src==='./icon-512.png'&&icon.sizes==='512x512'&&icon.purpose==='maskable'));
  assert.ok(manifest.icons.some(icon=>icon.src==='./icon.svg'));
  for(const file of ['apple-touch-icon.png','icon-192.png','icon-512.png'])assert.ok(fs.existsSync(new URL(`../${file}`,import.meta.url)),file);
});
