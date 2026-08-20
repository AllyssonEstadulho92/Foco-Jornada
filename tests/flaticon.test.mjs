import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const read=p=>fs.readFileSync(new URL(`../${p}`,import.meta.url),'utf8');

test('tipografia pública usa Manrope de forma global',()=>{
  const html=read('index.html'),css=read('linear-ui.css');
  assert.ok(html.includes('family=Manrope'));
  assert.ok(css.includes('font-family:"Manrope"'));
  assert.ok(css.includes('html,body,button,input,select,textarea'));
});

test('Flaticon UIcons está ativo com fallback local',()=>{
  const html=read('index.html'),icons=read('flaticon-icons.js'),motion=read('flaticon-motion.css'),about=read('hub-about.js');
  assert.ok(html.includes('cdn-uicons.flaticon.com/4.0.0/uicons-regular-rounded'));
  assert.ok(html.includes('data-flaticon-uicons'));
  assert.ok(html.includes('./flaticon-motion.css'));
  assert.ok(html.includes('src="./flaticon-icons.js"'));
  assert.ok(icons.includes("planning:'calendar-lines'"));
  for(const selector of ['svg.ui-svg','svg.hub-svg','svg.sp-icon','svg.feature-svg','#professionalCommandCenter svg'])assert.ok(icons.includes(selector),selector);
  assert.ok(motion.includes('.flaticon-source-hidden'));
  assert.ok(about.includes('Flaticon UIcons'));
});

test('camada de estabilidade mantém alvos de toque grandes',()=>{
  const css=read('stability-ui.css');
  for(const value of ['.bottom-nav .ui-svg{width:36px;height:36px}', '.quick-grid>button>span .ui-svg{width:48px;height:48px}', '.icon-btn .ui-svg{width:28px;height:28px}', '.hub-item-icon .hub-svg{width:28px;height:28px}', '.transport-launch-icon .feature-svg{width:34px;height:34px}', '.shift-planner .sp-top-actions button,.shift-planner .sp-close{width:44px;height:44px'])assert.ok(css.includes(value),value);
  assert.ok(css.includes('@media(prefers-reduced-motion:reduce)'));
});

test('interface pública usa Planeamento e não carrega o módulo antigo',()=>{
  const html=read('index.html'),hub=read('hub.js'),planning=read('planning-mode.js');
  assert.ok(html.includes('data-nav="planning"'));
  assert.ok(html.includes('data-view="planning"'));
  assert.ok(hub.includes("item('planning'"));
  assert.ok(planning.includes("[data-view=\"planning\"]"));
  assert.equal(html.includes('src="./focus-mode.js"'),false);
  assert.equal(html.includes('./focus-mode.css'),false);
  assert.equal(hub.includes('Foco e Pomodoro'),false);
});

test('Service Worker e Pages publicam a identidade visual ativa',()=>{
  const sw=read('sw.js'),pages=read('.github/workflows/pages.yml');
  for(const asset of ['./stability-ui.css','./linear-ui.css','./flaticon-motion.css','./planning-mode.js','./flaticon-icons.js'])assert.ok(sw.includes(asset),asset);
  for(const asset of ['stability-ui.css','linear-ui.css','flaticon-motion.css','planning-mode.js','flaticon-icons.js'])assert.ok(pages.includes(asset),asset);
  for(const legacy of ['focus-mode.css','focus-mode-core.js','focus-mode.js']){assert.equal(sw.includes(legacy),false,legacy);assert.equal(pages.includes(legacy),false,legacy)}
});
