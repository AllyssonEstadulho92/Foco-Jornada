import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const read=p=>fs.readFileSync(new URL(`../${p}`,import.meta.url),'utf8');

test('menu usa Flaticon com SVG local como fallback',()=>{
  const hub=read('hub.js'),couple=read('couple.js'),summary=read('summary-guard.js'),html=read('index.html');
  assert.ok(hub.includes('hub-svg'));
  assert.ok(hub.includes('hub-item-icon'));
  assert.ok(hub.includes('hub-item-arrow'));
  assert.equal(couple.includes("import './icon-dedupe.js'"),false);
  assert.equal(summary.includes("import './icon-dedupe.js'"),false);
  assert.ok(html.includes('cdn-uicons.flaticon.com'));
  assert.ok(html.includes('src="./flaticon-icons.js"'));
});

test('Sobre inclui atribuição Flaticon',()=>{
  const about=read('hub-about.js');
  assert.ok(about.includes('Flaticon UIcons'));
  assert.ok(about.includes('flaticon.com/uicons'));
});

test('Sobre mostra informação real da aplicação, Planeamento e diagnóstico',()=>{
  const about=read('hub-about.js');
  for(const value of ['Foco & Jornada','Planeamento','Service Worker','Notificações','Armazenamento','Jornadas','Atividades','Dias com turno','Copiar diagnóstico','Verificar atualização'])assert.ok(about.includes(value),value);
  assert.equal(about.includes('Modo Foco'),false);
  assert.equal(about.includes('Sessões de foco'),false);
  assert.ok(about.includes("navigator.serviceWorker.getRegistration()"));
  assert.ok(about.includes('localStorage.length'));
  assert.ok(about.includes('[data-hub-action="about"]'));
});

test('publicação mantém Sobre e a camada Flaticon ativa',()=>{
  const sw=read('sw.js'),pages=read('.github/workflows/pages.yml'),couple=read('couple.js');
  for(const f of ['hub-about.js','hub-about.css','flaticon-icons.js','flaticon-motion.css']){assert.ok(sw.includes(f),`cache ${f}`);assert.ok(pages.includes(f),`pages ${f}`)}
  assert.equal(sw.includes('./icon-dedupe.js'),false);
  assert.equal(pages.includes('icon-dedupe.js'),false);
  assert.ok(couple.includes("import './hub-about.js'"));
});
