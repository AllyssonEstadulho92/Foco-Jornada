// Ponte de compatibilidade mantida para instalações/caches antigos.
// A aplicação atual carrega runtime-fixes.js, summary-guard.js e hub-about.js
// pelos seus pontos de entrada próprios. Não importar estes módulos aqui evita
// handlers prematuros e duplicados durante o arranque.
window.FocoLegacyBridge=Object.freeze({version:'2.0.0',active:false});
