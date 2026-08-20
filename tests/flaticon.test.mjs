import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const read=p=>fs.readFileSync(new URL(`../${p}`,import.meta.url),'utf8');

test('ícones públicos usam SVG local sem CDN bloqueante',()=>{
  const html=read('index.html'),ux=read('ux.js');
  assert.equal(html.includes('cdn-uicons.flaticon.com'),false);
  assert.equal(html.includes('flaticon-motion.css'),false);
  assert.equal(html.includes('src="./flaticon-icons.js"'),false);
  assert.ok(html.includes('./stability-ui.css'));
  assert.ok(ux.includes('const ICON_PATHS='));
  assert.ok(ux.includes('class="ui-svg'));
});

test('camada de estabilidade aumenta ícones e alvos de toque',()=>{
  const css=read('stability-ui.css');
  for(const value of ['.bottom-nav .ui-svg{width:36px;height:36px}', '.quick-grid>button>span .ui-svg{width:48px;height:48px}', '.icon-btn .ui-svg{width:28px;height:28px}', '.hub-item-icon .hub-svg{width:28px;height:28px}', '.transport-launch-icon .feature-svg{width:34px;height:34px}', '.shift-planner .sp-top-actions button,.shift-planner .sp-close{width:44px;height:44px'])assert.ok(css.includes(value),value);
  assert.ok(css.includes('@media(prefers-reduced-motion:reduce)'));
});

test('folhas dinâmicas principais já chegam carregadas uma única vez',()=>{
  const html=read('index.html'),features=read('features.js'),about=read('hub-about.js');
  assert.ok(html.includes('id="featuresCss"'));
  assert.ok(features.includes("if($('#featuresCss'))return"));
  assert.ok(html.includes('id="hubAboutCss"'));
  assert.ok(about.includes("document.querySelector('#hubAboutCss')"));
});

test('Modo Foco substitui a entrada Pomodoro antiga',()=>{
  const html=read('index.html'),productivity=read('productivity-core.js');
  assert.equal(html.includes('src="./focus-entry.js"'),false);
  assert.equal(productivity.includes("import('./focus-entry.js')"),false);
  assert.ok(html.includes('src="./focus-mode.js"'));
  assert.ok(html.includes('./focus-mode.css'));
});

test('Service Worker e Pages publicam apenas a camada local ativa',()=>{
  const sw=read('sw.js'),pages=read('.github/workflows/pages.yml');
  assert.ok(sw.includes('./stability-ui.css'));
  assert.equal(sw.includes('./flaticon-motion.css'),false);
  assert.equal(sw.includes('./flaticon-icons.js'),false);
  assert.ok(pages.includes('stability-ui.css'));
  assert.equal(pages.includes('flaticon-motion.css'),false);
  assert.equal(pages.includes('flaticon-icons.js'),false);
  assert.ok(sw.includes('./focus-mode.js'));
  assert.ok(pages.includes('focus-mode.js'));
});
