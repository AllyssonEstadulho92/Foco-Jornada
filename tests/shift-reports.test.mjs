import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const js=fs.readFileSync(new URL('../shift-reports.js',import.meta.url),'utf8');

test('remove valores antigos de fábrica dos relatórios',()=>{
  assert.ok(js.includes("job.targetMonthlyMinutes===217*60"));
  assert.ok(js.includes("job.hourlyRateCents===523"));
  assert.ok(js.includes("job.targetMonthlyMinutes=0"));
});

test('relatório exige configuração explícita para extras e ganhos',()=>{
  assert.ok(js.includes('reportTargetConfigured'));
  assert.ok(js.includes('reportRateConfigured'));
  assert.ok(js.includes('Horas normais por mês'));
  assert.ok(js.includes('Salário por hora (€)'));
});

test('guardar e limpar cálculos têm ações próprias',()=>{
  assert.ok(js.includes('data-report-save'));
  assert.ok(js.includes('data-report-clear'));
  assert.ok(js.includes('function saveConfig'));
  assert.ok(js.includes('function clearConfig'));
});

test('não cria polling contínuo',()=>assert.equal(js.includes('setInterval('),false));
