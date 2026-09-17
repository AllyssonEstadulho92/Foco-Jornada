# Incidente — 404 ao saltar para a origem das férias

Data: 2026-09-17. Captura no iPhone após o PR #217: ao usar «Ver de onde vêm os dias registados ↓», a aplicação apresenta «Unexpected Application Error! / 404 Not Found» do React Router.

## Facto e causa confirmada no código

`src/presentation/router.tsx` usa `createHashRouter`; a rota das férias é `#/ferias`. O atalho introduzido no PR #217 em `VacationWorkspacePage.tsx` era um `<a href="#vacation-evidence-title">`. Ao ativá-lo, o browser substitui o fragmento que representa a rota pelo identificador da secção; o Router tenta resolver esse fragmento como caminho não existente e mostra o fallback de desenvolvimento. O alvo da secção existe e os dados do saldo não são a causa do 404. A captura não permite avaliar o estado do cofre ou dos registos, mas este erro é de navegação.

## Correção

O atalho é agora um botão nativo com a mesma apresentação visual. `focusSection` usa `document.getElementById`, `scrollIntoView` e `focus` com título `tabIndex={-1}` sem alterar `window.location.hash`. Para URLs inválidos ou links antigos, o Router inclui um `*` com mensagem acessível em PT-PT e ações «Voltar às férias» e «Ir ao início» em lugar do ecrã técnico. A consulta de origens continua recolhida por omissão: o atalho leva ao título e o botão «Ver dias e fontes» expande os registos. O mesmo problema potencial existe no skip link global `href="#main-content"` de `AppShell`; corrigir essa ligação numa alteração dirigida, sem reescrever todo o shell nesta correção urgente.

## QA e limites

`focusSection.test.ts` testa scroll, foco e preservação do hash, inclusive destino inexistente; `vacation-evidence.test.ts` impede o regresso do `href` incompatível e garante a rota de recuperação. CI inclui tipos, lint, Vitest, build, Worker dry-run e smoke Chromium. Testar no iPhone real depois de receber a nova versão: abrir `#/ferias`, tocar no atalho, confirmar que a rota não muda e expandir «Ver dias e fontes»; verificar retorno de URL inválido. Se uma PWA ainda servir JS antigo em cache, atualizar/reabrir antes de retestar. Sem alterações às fórmulas, meta pessoal, datas, dados, backend, autenticação, cofre ou sincronização. CI/publicação e teste físico têm estados separados e só devem ser dados por concluídos após verificação.
