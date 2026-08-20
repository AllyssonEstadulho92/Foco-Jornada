import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const read=p=>fs.readFileSync(new URL(`../${p}`,import.meta.url),'utf8');

test('Flaticon UIcons está ligado com atribuição',()=>{
  const html=read('index.html');
  assert.ok(html.includes('cdn-uicons.flaticon.com/3.0.0/uicons-regular-rounded/css/uicons-regular-rounded.css'));
  assert.ok(html.includes('data-flaticon-uicons'));
  assert.ok(html.includes('UIcons by'));
  assert.ok(html.includes('flaticon.com/uicons'));
});

test('camada Flaticon não cria polling contínuo',()=>{
  const js=read('flaticon-icons.js');
  assert.equal(js.includes('setInterval('),false);
  assert.ok(js.includes('MutationObserver'));
  assert.ok(js.includes('flaticon-source-hidden'));
});

test('ícones mantêm fallback SVG quando UIcon não renderiza',()=>{
  const js=read('flaticon-icons.js');
  assert.ok(js.includes('validPseudo'));
  assert.ok(js.includes('i.remove()'));
  assert.ok(js.includes("svg.classList.remove('flaticon-source-hidden')"));
});

test('animações respeitam redução de movimento',()=>{
  const css=read('flaticon-motion.css');
  assert.ok(css.includes('@media(prefers-reduced-motion:reduce)'));
  assert.ok(css.includes('@keyframes fiTap'));
  assert.ok(css.includes('@keyframes fiBell'));
  assert.ok(css.includes('button:active .fi-motion'));
});

test('Service Worker guarda a camada local Flaticon',()=>{
  const sw=read('sw.js');
  assert.ok(sw.includes('./flaticon-motion.css'));
  assert.ok(sw.includes('./flaticon-icons.js'));
});
