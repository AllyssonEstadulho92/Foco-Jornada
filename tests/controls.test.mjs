import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const read=path=>fs.readFileSync(new URL(`../${path}`,import.meta.url),'utf8');

test('controlador de alertas não usa polling contínuo',()=>{
  const js=read('controls.js');
  assert.equal(js.includes('setInterval('),false);
  assert.ok(js.includes('scheduleNextAlert'));
  assert.ok(js.includes("PREF_KEY='foco-jornada-notification-preference-v1'"));
});

test('preferência visual é controlada por módulo dedicado',()=>{
  const js=read('settings-controller.js');
  assert.ok(js.includes('#setNotifications'));
  assert.ok(js.includes('Notification.requestPermission'));
  assert.ok(js.includes('foco-notification-preference-change'));
  assert.ok(js.includes('aria-checked'));
  assert.ok(js.includes('Notificações quando uma pausa terminar'));
});

test('controlador de definições ignora mudanças apenas textuais',()=>{
  const js=read('settings-controller.js');
  assert.ok(js.includes('settingsObserver'));
  assert.ok(js.includes('mutation.addedNodes'));
  assert.ok(js.includes('node.nodeType===1'));
  assert.equal(js.includes('characterData:true'),false);
  assert.equal(js.includes("document.addEventListener('click'"),false);
});

test('alertas públicos são apenas de pausa e usam Service Worker',()=>{
  const js=read('controls.js');
  assert.ok(js.includes('navigator.serviceWorker.ready'));
  assert.ok(js.includes('showNotification'));
  assert.ok(js.includes("kind:'break'"));
  assert.equal(js.includes("kind:'focus'"),false);
  assert.ok(js.includes('Pausa terminada'));
});

test('couple é apenas compatibilidade neutra e não antecipa handlers',()=>{
  const js=read('couple.js');
  assert.ok(js.includes('FocoLegacyBridge'));
  assert.ok(js.includes('active:false'));
  assert.equal(js.includes("import './runtime-fixes.js'"),false);
  assert.equal(js.includes('shortcuts://'),false);
  assert.equal(js.includes('supershift://'),false);
});

test('Moovit e Supershift usam os módulos atuais',()=>{
  const links=read('app-links.js'),runtime=read('runtime-fixes.js');
  assert.ok(links.includes('buildMoovitDirectionsUrl'));
  assert.ok(links.includes("import('./shift-planner.js')"));
  assert.equal(runtime.includes('function launchMoovit'),false);
  assert.equal(runtime.includes('function openMoovitPlanner'),false);
});
