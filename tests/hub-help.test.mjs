import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const read=p=>fs.readFileSync(new URL(`../${p}`,import.meta.url),'utf8');
const help=read('hub-help.js'),summary=read('summary-guard.js'),css=read('interaction-fixes.css');

test('Ajuda cobre os módulos atuais da aplicação',()=>{
  for(const text of ['Jornada de trabalho','Pausas e descanso','Atividades','Modo Foco','Café','Histórico','Estatísticas','Moovit e transportes','Supershift / Escala','Notificações','Dados e persistência','Backup e diagnóstico','Instalar aplicação','Atualizações','Se algo não funcionar'])assert.ok(help.includes(text),text);
  assert.ok(help.includes('Sem ciclos automáticos'));
  assert.equal(help.includes('Foco e Pomodoro'),false);
});

test('Ajuda tem pesquisa e filtragem interna',()=>{
  assert.ok(help.includes('fjHelpSearch'));
  assert.ok(help.includes('function filter'));
  assert.ok(help.includes('Pesquisar função ou problema'));
});

test('Ajuda e Sobre são carregados sem reintroduzir deduplicação legada',()=>{
  for(const file of ['./hub-help.js','./hub-about.js'])assert.ok(summary.includes(`import '${file}'`),file);
  assert.equal(summary.includes("import './icon-dedupe.js'"),false);
});

test('acesso superior duplicado ao Mais fica oculto',()=>{
  assert.ok(css.includes('.fj-more-trigger{display:none!important'));
  assert.ok(css.includes('.topbar{padding-left:0}'));
});
