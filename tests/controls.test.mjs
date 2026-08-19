import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const read=path=>fs.readFileSync(new URL(`../${path}`,import.meta.url),'utf8');

test('controlador de notificações não usa polling contínuo',()=>{
  const js=read('controls.js');
  assert.equal(js.includes('setInterval('),false);
  assert.ok(js.includes('scheduleNextAlert'));
  assert.ok(js.includes('setNotifications'));
});

test('notificações pedem permissão no gesto de alteração',()=>{
  const js=read('controls.js');
  assert.ok(js.includes("document.addEventListener('change'"));
  assert.ok(js.includes('Notification.requestPermission'));
  assert.ok(js.includes('persistNotificationSetting(input.checked)'));
});

test('alertas de foco e pausa usam o Service Worker quando possível',()=>{
  const js=read('controls.js');
  assert.ok(js.includes('navigator.serviceWorker.ready'));
  assert.ok(js.includes('showNotification'));
  assert.ok(js.includes("kind:'focus'"));
  assert.ok(js.includes("kind:'break'"));
});
