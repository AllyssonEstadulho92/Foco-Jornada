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
});

test('alertas de foco e pausa usam Service Worker quando possível',()=>{
  const js=read('controls.js');
  assert.ok(js.includes('navigator.serviceWorker.ready'));
  assert.ok(js.includes('showNotification'));
  assert.ok(js.includes("kind:'focus'"));
  assert.ok(js.includes("kind:'break'"));
});

test('couple é apenas compatibilidade e não reintroduz Atalhos antigos',()=>{
  const js=read('couple.js');
  assert.ok(js.includes("import './runtime-fixes.js'"));
  assert.equal(js.includes('shortcuts://'),false);
  assert.equal(js.includes('supershift://'),false);
});

test('Moovit e Supershift usam os módulos atuais',()=>{
  const links=read('app-links.js'),runtime=read('runtime-fixes.js');
  assert.ok(links.includes('buildMoovitDirectionsUrl'));
  assert.ok(links.includes("import('./shift-planner.js')"));
  assert.ok(runtime.includes('launchMoovit'));
  assert.ok(runtime.includes('openMoovitPlanner'));
});
