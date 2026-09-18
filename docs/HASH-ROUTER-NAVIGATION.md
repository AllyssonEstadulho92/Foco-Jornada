# Incidente — 404 nos atalhos internos do HashRouter

Data do incidente original: 2026-09-17. A captura no iPhone após o PR #217 mostrou «Unexpected Application Error! / 404 Not Found» quando se usou «Ver de onde vêm os dias registados ↓». Seguimento global: PR #220 em validação a 2026-09-18.

## Facto e causa confirmada no código

`src/presentation/router.tsx` usa `createHashRouter`; a rota das férias é `#/ferias`. O atalho introduzido no PR #217 em `VacationWorkspacePage.tsx` era um `<a href="#vacation-evidence-title">`. Ao ativá-lo, o browser substituía o fragmento que representa a rota pelo identificador da secção; o Router tentava resolver esse fragmento como caminho inexistente e mostrava o fallback técnico. O alvo da secção existe e os dados do saldo não são a causa do 404. A captura não permite avaliar o estado do cofre ou dos registos.

## Correção PR #218

O atalho de proveniência é um botão nativo. `focusSection` usa `document.getElementById`, `scrollIntoView` e `focus` com título `tabIndex={-1}` sem alterar `window.location.hash`. Para URLs inválidos ou links antigos, o Router inclui um `*` com mensagem acessível em PT-PT e ações «Voltar às férias» e «Ir ao início» em lugar do ecrã técnico. A consulta de origens continua recolhida por omissão: o atalho leva ao título e o botão «Ver dias e fontes» expande os registos. PR #218 integrado/publicado, mas teste físico permanece pendente.

## Seguimento PR #220 — salto global «Saltar para o conteúdo»

A auditoria confirmou o mesmo padrão incorreto em `AppShell.tsx`: `<a href="#main-content">` substituía a rota ativa, não apenas a posição de scroll. O PR #220 substitui essa âncora por um `<button type="button" className="skipLink">` que chama `focusSection('main-content')`. O `<main id="main-content" tabIndex={-1}>` já existia. Botão conserva navegação por Tab e ativação nativa por Enter/Espaço e desloca/foca o conteúdo sem navegar. A aparência `.skipLink` preexistente permanece; não se introduz handler global de cliques, persistência ou alteração do router. `focusSection.test.ts` cobre foco/hash em `#/ferias`, `#/ferias/planeamento` e `#/turnos` e impede regressão do `href` no AppShell. PR #220 aguarda validação final e publicação; não confundir implementação com entrega.

## QA e limites

CI inclui tipos, lint, Vitest, build, Worker dry-run e smoke Chromium. Testar no iPhone real depois de receber a nova versão: abrir ambas as rotas de férias, tocar no atalho de proveniência, confirmar que o hash permanece, expandir «Ver dias e fontes» e testar «Saltar para o conteúdo» com VoiceOver ou teclado. Verificar retorno de URL inválido. Se a PWA ainda servir JS antigo em cache, atualizar/reabrir antes de retestar; não apagar dados do site. Sem alterações às fórmulas, meta pessoal, datas, dados, backend, autenticação, cofre ou sincronização. CI/publicação e teste físico têm estados separados.
