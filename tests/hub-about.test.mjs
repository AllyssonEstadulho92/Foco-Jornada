import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const read=p=>fs.readFileSync(new URL(`../${p}`,import.meta.url),'utf8');

test('menu remove ícones Flaticon duplicados da coluna de seta',()=>{
  const js=read('icon-dedupe.js'),css=read('hub-about.css');
  assert.ok(js.includes("#appHub .hub-item-arrow"));
  assert.ok(js.includes("i.fi-motion"));
  assert.ok(js.includes("static-chevron"));
  assert.ok(css.includes('.hub-item-arrow>.fi-motion{display:none!important}'));
  assert.ok(css.includes('.hub-item-arrow>.hub-svg{display:block!important}'));
});

test('ícone principal usa apenas um Flaticon quando disponível',()=>{
  const js=read('icon-dedupe.js');
  assert.ok(js.includes("icons.find(i=>i.classList.contains('flaticon-live'))"));
  assert.ok(js.includes("if(i!==keep)i.remove()"));
  assert.ok(js.includes("svg.hidden=true"));
});

test('Sobre mostra informação real da aplicação e diagnóstico',()=>{
  const about=read('hub-about.js');
  for(const value of ['Foco & Jornada','Service Worker','Notificações','Armazenamento','Jornadas','Atividades','Sessões de foco','Dias com turno','Copiar diagnóstico','Verificar atualização'])assert.ok(about.includes(value),value);
  assert.ok(about.includes("navigator.serviceWorker.getRegistration()"));
  assert.ok(about.includes('localStorage.length'));
  assert.ok(about.includes("[data-hub-action=\"about\"]"));
});

test('novos ficheiros entram no cache e publicação Pages',()=>{
  const sw=read('sw.js'),pages=read('.github/workflows/pages.yml'),couple=read('couple.js');
  for(const f of ['hub-about.js','hub-about.css','icon-dedupe.js']){assert.ok(sw.includes(f),`cache ${f}`);assert.ok(pages.includes(f),`pages ${f}`)}
  assert.ok(couple.includes("import './hub-about.js'"));
  assert.ok(couple.includes("import './icon-dedupe.js'"));
});
