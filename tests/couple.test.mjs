import test from 'node:test';
import assert from 'node:assert/strict';
import {couplePlan,coupleStateForNow,nextCoupleReminderAt,recordCoupleAction} from '../couple-core.js';

const local=(y,m,d,h,min=0)=>new Date(y,m-1,d,h,min).getTime();

test('dias normais começam 90 min depois da saída e duram 30 min',()=>{
  const p=couplePlan(local(2026,8,17,12));
  assert.equal(p.start,'18:30');assert.equal(p.end,'19:00');assert.equal(p.durationMinutes,30);
});

test('quarta reserva 1h30 sem hora rígida independente do trabalho',()=>{
  const p=couplePlan(local(2026,8,19,12));
  assert.equal(p.start,'18:30');assert.equal(p.end,'20:00');assert.equal(p.durationMinutes,90);
});

test('sábado reserva 3 horas depois da jornada normal',()=>{
  const p=couplePlan(local(2026,8,22,12));
  assert.equal(p.start,'18:30');assert.equal(p.end,'21:30');assert.equal(p.durationMinutes,180);
});

test('domingo respeita jornada 09–18 e começa às 19:30',()=>{
  const p=couplePlan(local(2026,8,23,12));
  assert.equal(p.start,'19:30');assert.equal(p.end,'20:30');assert.equal(p.durationMinutes,60);
});

test('saída real mais tarde desloca o tempo a dois',()=>{
  const p=couplePlan(local(2026,8,19,12),{actualWorkEndAt:local(2026,8,19,17,45)});
  assert.equal(p.start,'19:15');assert.equal(p.end,'20:45');assert.equal(p.anchorSource,'actual');
});

test('lembrete ocorre 15 minutos antes do início',()=>{
  const now=local(2026,8,19,18,0),at=nextCoupleReminderAt({},now);
  assert.equal(at,local(2026,8,19,18,15));
});

test('adiar move lembrete 30 minutos',()=>{
  const t=local(2026,8,19,18,15),r=recordCoupleAction({},'snooze',t),n=nextCoupleReminderAt(r,t);
  assert.equal(n,t+30*60_000);
});

test('concluído não volta a lembrar no mesmo dia',()=>{
  const t=local(2026,8,19,18,30),r=recordCoupleAction({},'done',t),s=coupleStateForNow(r,t);
  assert.equal(s.phase,'done');assert.ok(nextCoupleReminderAt(r,t)>t);
});
