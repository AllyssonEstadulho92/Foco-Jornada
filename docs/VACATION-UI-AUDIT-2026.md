# Auditoria visual da área de Férias — 18/09/2026

## Âmbito e evidência

Base: componentes e estilos reais do `main` após PR #219, `VacationWorkspacePage`, `VacationBalancePage`, `VacationPlannerPanel`, `VacationSuggestionsPanel`, `VacationJointPlanner`, `VacationEvidencePanel`, `AppShell`, `focusSection`, `router` e `vacation-visual-audit.css`. Esta é **uma auditoria estática do código** e uma validação de regressão automatizada; não foi observada nem medida a interface no iPhone do utilizador. A auditoria de 17/09 está no histórico do GitHub do presente ficheiro e no PR #219.

## Diagnóstico e alterações no PR #220

| Facto confirmado | Impacto ou risco | Correção limitada |
| --- | --- | --- |
| O `AppShell` utiliza `href="#main-content"` com `createHashRouter`, enquanto `#/ferias` e `#/ferias/planeamento` são rotas. | Ativar o salto global substitui a rota por um fragmento não registado e pode exibir o fallback 404. | Substituir por botão nativo que chama `focusSection('main-content')`; o `<main>` já tem `id` e `tabIndex={-1}`. Testar hash/foco em ambas as páginas e em `/turnos`. |
| O espaço de leitura tem largura máxima de 80rem e os cartões usam sombras, bordas e níveis de destaque diferentes. | Em ecrãs largos a hierarquia pode ficar difusa e em pequenos o texto concorre com os números. | Ajustar largura de leitura para 74rem, suavizar sombras e uniformizar espaçamento; saldo principal e seleção do planeamento continuam proeminentes. |
| O cabeçalho do planeamento tem badge lateral, e ambos os calendários usam grelha de sete colunas. | Em 320–360 px CSS, títulos, badges e células necessitam de largura contida; não há prova física de overflow. | Manter título com quebra, badge com largura limitada, sete colunas `minmax(0,1fr)` e células sem padding lateral em ecrãs estreitos. |
| Os cartões e painéis já têm CSS escopado com alto contraste e movimento reduzido. | Uma nova camada ou sombras excessivas podem quebrar consistência/a11y. | Refinar a camada existente `vacation-visual-audit.css`, sem criar novo tema nem esconder funções, preservar `:focus-visible`, `forced-colors` e `prefers-reduced-motion`. |

A atualização não modifica qualquer fórmula de férias, data, registo, aprovação, segurança do cofre, API, sincronização, dependências ou persiste preferências novas. A meta de 28 dias permanece **pessoal**, não substitui direitos contratuais. O planeamento de julho com a parceira e a restrição declarada de novembro/dezembro continuam a requerer confirmação da empresa e de ambas as pessoas.

## Testes e níveis de confiança

- `focusSection.test.ts` comprova via jsdom que o destino recebe foco e a rota não muda em `#/ferias`, `#/ferias/planeamento` e `#/turnos`; teste estrutural impede regressão ao `href="#main-content"`.
- `vacation-visual-audit.test.ts` protege a importação, separação das vistas, estado selecionado, valores numéricos legíveis e calendário sete-colunas em larguras compactas. **Testes estáticos não medem caixas CSS nem fotografam ecrãs.**
- A pipeline de Qualidade executa auditoria de dependências, tipos, lint, Vitest, build, Worker dry-run e smoke Chromium de arranque. Registar número/resultado do head final, `main`, build e Pages **após confirmação**.
- **Validação física pendente:** no iPhone do utilizador abrir ambas as páginas, testar 320–430 px CSS, texto ampliado, retrato/paisagem, cabeçalho, status mensal, 12 meses, cartões de saldo, badge de pré-visualização, escolha do ano, calendário e resumo a dois; teclado/VoiceOver, salto global/atalho de proveniência e retorno após suspender a PWA. Repetir no Android e desktop com zoom 200%. Não declarar que isto foi feito sem capturas e testes reais.

## Riscos fora do âmbito

A vista oculta por CSS continua montada e o saldo do ano corrente pode diferir de uma consulta parcial do coletor de proveniência se o cofre estiver indisponível. Validar os dados reais e só depois consolidar a arquitetura. O salto global foi corrigido no código, mas a confirmação em dispositivos reais permanece necessária. Histórico e decisões nos cinco documentos de continuidade.
