# Área de férias — separação visual e navegação

Atualizado em 2026-09-16. PR #212.

## Problema e objetivo

A rota única `#/ferias` colocava resumo, indicadores, sugestões, calendário, simulação, evolução de 12 meses, configuração e regras num fluxo extenso; o planeamento interrompia a leitura da evolução mensal. A alteração separa a organização da informação sem alterar dias, meta de 28, dados, sincronização ou regras.

## Estrutura entregue

1. `#/ferias` — **Acumulação e saldo**. Cabeçalho «Férias acumuladas mês a mês», quatro métricas vivas, painel de evolução mensal, depois «O que tens, o que falta e o que vem a seguir». Mantém configuração, referência laboral, fontes e precisão no fim; o planeador não é visível nesta vista.
2. `#/ferias/planeamento` — **Planeamento de férias**. Painel `VacationPlannerPanel` exclusivo desta vista, contendo sugestão de períodos, filtros, calendário, comparação, formulário de simulação, saldos e ligação explícita ao mapa de turnos. Os restantes painéis não são visíveis.
3. Navegação entre as duas vistas com `NavLink`, `aria-label`, estado ativo comunicado por `aria-current` e foco visível. O link antigo `#/ferias` continua válido; o planeamento ganha endereço copiável e diretamente acessível.

## Implementação e fronteira de dados

`VacationWorkspacePage.tsx` é um invólucro de apresentação com `view="overview" | "planning"`. Renderiza a mesma instância lógica de `VacationBalancePage` por rota, que mantém a agregação única, `VacationBalance`, configurações cifradas e o único `VacationPlannerPanel`. `vacation-workspace.css` altera exclusivamente a disposição e a visibilidade dos blocos por rota e reorganiza a ordem visual na vista geral; os painéis continuam no mesmo componente de origem para evitar reescrever cálculos ou migrar estado nesta alteração de UI.

**Limite técnico explícito:** a vista oculta continua montada no React embora não seja apresentada ao utilizador. Esta opção evita duplicar agregação e riscos de regressão agora; uma extração futura para componentes/hook de dados partilhado poderá eliminar o trabalho de renderização oculto, com testes próprios. Não afirmar que há desmonte de componentes.

## Layout e acessibilidade

Contentor máximo 80rem; largura fluida e `min-width: 0`, `max-width: 100%` nos blocos, `overflow-wrap` nos textos longos, espaçamento responsivo com `clamp`, cartões sem compressão excessiva, grelha de métricas auto-fit (mínimo 15rem), navegação em duas colunas e uma coluna abaixo de 560px. Planeamento recebe cabeçalho, sugestões, calendário e resultados com respiro, sem bordas/padding duplicados no painel externo. Mantidos `forced-colors`, `prefers-reduced-motion`, foco visível, etiquetas originais e heading H1 acessível na rota de planeamento.

## Validação

Teste `src/styles/vacation-workspace.test.ts` protege rotas, navegação, ordem, isolamento visual, manutenção do componente de dados, responsividade e acessibilidade estrutural. Executar gates de auditoria, TypeScript, lint, Vitest, build, Worker dry-run e smoke Chromium no head final e em `main`. CI não substitui validação visual real: verificar iPhone, Android, tablet, desktop, orientação horizontal, zoom/texto maior e VoiceOver/TalkBack. Confirmar que voltar ao primeiro plano recalcula o relógio e que as sugestões continuam a preencher a simulação sem guardar férias.

Não muda autenticação, autorização, cofre, API, Worker, dependências, schema, telemetria ou armazenamento de férias. A projeção pessoal continua distinta do direito efetivo confirmado com RH; feriados e escalas especiais permanecem fora da inferência automática.
