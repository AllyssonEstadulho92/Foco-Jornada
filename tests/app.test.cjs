const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

function productionScript() {
  const html = fs.readFileSync(__dirname + '/../index.html', 'utf8');
  const scripts = [...html.matchAll(/<script>([\s\S]*?)<\/script>/gi)];
  assert.equal(scripts.length, 1, 'index.html deve conter um único script inline de produção');
  return scripts[0][1];
}

function makeHarness(start = Date.UTC(2026, 7, 18, 8, 0, 0)) {
  let clock = start;
  const storage = new Map();
  const FakeDate = class extends Date {
    constructor(...args) { super(...(args.length ? args : [clock])); }
    static now() { return clock; }
  };
  const elements = new Map();
  const el = id => {
    if (!elements.has(id)) elements.set(id, {
      id, textContent:'', innerHTML:'', hidden:false, value:'', files:[], dataset:{},
      classList:{add(){},remove(){},toggle(){}},
      addEventListener(){}, setAttribute(){}, toggleAttribute(){},
      closest(){return null}
    });
    return elements.get(id);
  };
  const context = {
    window: null,
    document: {
      getElementById: el,
      querySelectorAll: () => [],
      querySelector: selector => selector.includes('theme-color') ? {content:''} : null,
      documentElement:{dataset:{}},
      addEventListener(){}
    },
    localStorage: {
      getItem: k => storage.has(k) ? storage.get(k) : null,
      setItem: (k,v) => storage.set(k,String(v)),
      removeItem: k => storage.delete(k)
    },
    navigator:{onLine:true,serviceWorker:{register(){return Promise.resolve()}}},
    location:{protocol:'https:'},
    matchMedia:()=>({matches:false,addEventListener(){}}),
    addEventListener(){}, scrollTo(){}, confirm:()=>true,
    Blob, URL, Intl, console, setInterval(){}, setTimeout(){return 1}, clearTimeout(){},
    Date:FakeDate, crypto:globalThis.crypto, Math,
    globalThis:null
  };
  context.window=context; context.globalThis=context;

  let script = productionScript();
  const bindAt = script.indexOf("document.addEventListener('click'");
  assert.ok(bindAt > 0, 'ponto de inicialização da UI não encontrado');
  script = script.slice(0, bindAt) + `\nwindow.__app={getState:()=>S,startWork,endWork,startBreak,endBreak,startFocus,toggleFocus,endFocus,addCoffee,addTask,startTask,pauseTask,completeTask,deleteTask,metrics,focusRemain,taskMs,check};\n})();`;
  script = script.replace(/function commit\(msg\)\{[\s\S]*?\}\nfunction toast\(msg\)\{[\s\S]*?\}\nfunction act/, "function commit(msg){if(!persist()) throw new Error('persist failed')}\nfunction toast(msg){}\nfunction act");

  vm.createContext(context);
  vm.runInContext(script, context, {filename:'index-inline.js'});
  return {app:context.__app, advance:ms=>clock+=ms, setTime:t=>clock=t, storage};
}

test('script de produção compila sem erro de sintaxe', () => {
  assert.doesNotThrow(() => new Function(productionScript()));
});

test('jornada inicia e impede segunda jornada ativa', () => {
  const h=makeHarness();
  h.app.startWork(); h.app.startWork();
  assert.equal(h.app.getState().work.filter(x=>x.status==='ACTIVE').length,1);
});

test('jornada de 8 horas mantém duração correta', () => {
  const h=makeHarness(); h.app.startWork(); h.advance(8*3600000); h.app.endWork();
  const w=h.app.getState().work[0];
  assert.equal(w.end-w.start,8*3600000);
});

test('pausa de 15 minutos é descontada do tempo efetivo', () => {
  const h=makeHarness(); h.app.startWork(); h.advance(3600000); h.app.startBreak('SCREEN'); h.advance(15*60000); h.app.endBreak(); h.advance(45*60000);
  const m=h.app.metrics();
  assert.equal(m.gross,2*3600000);
  assert.equal(m.effective,105*60000);
});

test('atividade é pausada automaticamente ao iniciar pausa e fica sugerida para retoma', () => {
  const h=makeHarness(); h.app.startWork(); h.app.addTask('Ocorrências'); const id=h.app.getState().tasks[0].id; h.app.startTask(id); h.advance(10*60000); h.app.startBreak('SCREEN');
  assert.equal(h.app.getState().tasks[0].status,'PAUSED');
  h.advance(15*60000); h.app.endBreak();
  assert.equal(h.app.getState().resumeTaskId,id);
});

test('foco pausado congela o tempo restante', () => {
  const h=makeHarness(); h.app.startWork(); h.app.startFocus(); h.advance(5*60000); h.app.toggleFocus();
  const before=h.app.focusRemain(); h.advance(10*60000); const after=h.app.focusRemain();
  assert.equal(after,before);
});

test('café é calculado em cêntimos', () => {
  const h=makeHarness(); h.app.startWork(); h.app.addCoffee(); h.app.addCoffee(); h.app.addCoffee();
  const m=h.app.metrics(); assert.equal(m.coffeeCount,3); assert.equal(m.coffeeSpend,210);
});

test('não termina jornada enquanto foco estiver ativo', () => {
  const h=makeHarness(); h.app.startWork(); h.app.startFocus(); h.app.endWork();
  assert.equal(h.app.getState().work[0].status,'ACTIVE');
});
