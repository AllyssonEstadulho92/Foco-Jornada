import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const read=p=>fs.readFileSync(new URL(`../${p}`,import.meta.url),'utf8');
const help=read('hub-help.js'),summary=read('summary-guard.js'),css=read('interaction-fixes.css');

test('Ajuda cobre os módulos principais da aplicação',()=>{
  for(const text of ['Jornada de trabalho','Pausas e descanso','Atividades','Foco e Pomodoro','Café','Histórico','Estatísticas','Moovit e transportes','Supershift / Escala','Notificações','Backup e dados','Atualizações','Se algo não funcionar'])assert.ok(help.includes(text),text);
});

test('Ajuda tem pesquisa e filtragem interna',()=>{
  assert.ok(help.includes('fjHelpSearch'));
  assert.ok(help.includes('function filter'));
  assert.ok(help.includes('Pesquisar função ou problema'));
});

test('Ajuda, Sobre e deduplicação são carregados pelo runtime',()=>{
  for(const file of ['./hub-help.js','./hub-about.js','./icon-dedupe.js'])assert.ok(summary.includes(`import '${file}'`),file);
});

test('acesso superior duplicado ao Mais fica oculto',()=>{
  assert.ok(css.includes('.fj-more-trigger{display:none!important'));
  assert.ok(css.includes('.topbar{padding-left:0}'));
});
