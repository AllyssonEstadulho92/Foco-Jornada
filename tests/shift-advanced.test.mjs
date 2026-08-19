import test from 'node:test';
import assert from 'node:assert/strict';
import {normalizePlanner,assignShift} from '../shift-planner-core.js';
import {ensureAdvancedTemplates,copyDay,copyWeek,applyTemplateRange,monthSummary,yearSummary} from '../shift-advanced-core.js';

test('adiciona modelo de baixa médica sem duplicar',()=>{let p=ensureAdvancedTemplates(normalizePlanner({}));assert.equal(p.templates.filter(x=>x.id==='sick').length,1);p=ensureAdvancedTemplates(p);assert.equal(p.templates.filter(x=>x.id==='sick').length,1)});
test('copia um turno para outro dia',()=>{let p=assignShift(normalizePlanner({}),'2026-08-19','morning');p=copyDay(p,'2026-08-19','2026-08-20');assert.equal(p.assignments['2026-08-20'].templateId,'morning')});
test('copia semana para a semana seguinte',()=>{let p=normalizePlanner({});p=assignShift(p,'2026-08-17','morning');p=assignShift(p,'2026-08-18','off');const r=copyWeek(p,'2026-08-19');assert.equal(r.copied,2);assert.equal(r.planner.assignments['2026-08-24'].templateId,'morning');assert.equal(r.planner.assignments['2026-08-25'].templateId,'off')});
test('aplica férias por intervalo inclusivo',()=>{const r=applyTemplateRange(normalizePlanner({}),'2026-08-03','2026-08-14','vacation');assert.equal(r.days,12);assert.equal(Object.keys(r.planner.assignments).length,12)});
test('resumos mensal e anual contam férias e baixa',()=>{let p=ensureAdvancedTemplates(normalizePlanner({jobs:[{id:'default',name:'Trabalho',hourlyRateCents:600,targetMonthlyMinutes:160*60,isDefault:true}]}));p=assignShift(p,'2026-08-03','morning');p=assignShift(p,'2026-08-04','vacation');p=assignShift(p,'2026-08-05','sick');const m=monthSummary(p,new Date(2026,7,1)),y=yearSummary(p,2026);assert.equal(m.workDays,1);assert.equal(m.vacationDays,1);assert.equal(m.sickDays,1);assert.equal(y.vacationDays,1);assert.equal(y.sickDays,1)});
