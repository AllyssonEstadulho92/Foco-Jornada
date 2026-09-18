# Estado do Projeto

Atualizado em: 2026-09-18. PR #221 em validação; última publicação confirmada: PR #220. Teste físico no iPhone pendente.

## Alteração em curso — PR #221

**Objetivo e evidência:** a página única do PDF enviado em 18/09 mostra o planeamento de julho/2027 precedido por quatro cartões de saldo de 2026, seguido de quatro alternativas volumosas, simulação, checklist e notas extensas. A página não indica erro de cálculo; identifica um problema de hierarquia e comprimento no ecrã móvel. Análise do código confirmou a ordem em `VacationPlannerPanel` e o aspeto de cartões altos em `vacation-joint-planner.css`.

**Mudanças na branch `refactor/vacation-planning-clarity-20260918`:** para o ano seguinte, `VacationJointPlanner` aparece primeiro; a referência viva de 2026, com as mesmas quatro métricas e relógio, passa para um `<details>` opcional a seguir, com aviso de que não transfere saldo para 2027. Para o ano corrente continua visível antes das sugestões. O planeamento a dois organiza-se em quatro passos (escolher, comparar, simular, confirmar); alternativas usam linhas compactas e a metodologia detalhada é expansível. Novo CSS escopado à rota `vacation-planning-structure.css`, testes estruturais e relatório `docs/VACATION-PLANNING-STRUCTURE-2026.md`. Sem alteração a domínio, dias, limites novembro/dezembro, checklist por cenário, storage cifrado ou sincronização. **Estado:** PR #221 aberto em draft; integrar e publicar apenas depois de Qualidade no head final.

**Próximo passo:** validar a CI final e a publicação; depois pedir captura real da página de 2027 para confirmar largura, fontes, calendário, zoom e navegação. A exportação PDF não substitui teste físico de interações/VoiceOver.

## Última alteração publicada — PR #220

PR #220 refinou `#/ferias` e `#/ferias/planeamento` com leitura de 74rem, sombras discretas, saldo principal destacado e calendários contidos, e corrigiu o skip link global `AppShell` para `focusSection('main-content')` sem mudar o hash. Merge `8a45758f68462e8631edbaf65f0b802a2c60ee19`; Qualidade #1219 (head) e #1220 (`main`) concluíram auditoria, TypeScript, lint, Vitest, build, Worker dry-run e smoke Chromium com sucesso; Publicar #259 gerou build `eec8da024db5b3f65624433c66726e7c56e04cb0`; Pages #859 concluiu deploy. Teste visual no iPhone/Android real ainda pendente. Ver `docs/VACATION-UI-AUDIT-2026.md` e `docs/HASH-ROUTER-NAVIGATION.md`.

## Entregas anteriores — PR #219 e #218

PR #219 harmonizou a navegação móvel, tipografia, espaçamento e cartões sem alterar domínio; merge `f96ced5532178bb0746db0e50ef52874e72710dc`, Qualidade #1209/#1210, Publicar #258, build `96c779f88ab2d0f941b7a54f690dd759fa909ec1`, Pages #854. PR #218 corrigiu o 404 no atalho de proveniência causado por `href="#vacation-evidence-title"` em `createHashRouter`: botão com foco/scroll e rota `*` de recuperação PT-PT; merge `89564f3ebbfe5d54e5d09dcf28db9e574b35cc50`, Qualidade #1201/#1202, Publicar #257, Pages #848. Confirmação no iPhone do atalho de proveniência continua pendente.

## Estado da aplicação e das férias

PWA React 19/TypeScript/Vite responsiva para iPhone, Android, tablet e computador, frontend GitHub Pages, IndexedDB/Dexie e cofre AES-GCM, sincronização opcional cifrada Cloudflare Worker/Durable Object; replicação não é instantânea garantida. `#/ferias` apresenta acumulação mensal, saldo, indicadores e proveniência (horas/turnos/plano); `#/ferias/planeamento` contém sugestões, calendário, simulação e férias a dois para o próximo ano. Julho pode ser predefinido; novembro/dezembro excluídos por restrição indicada pelo utilizador, sujeita a confirmação anual. O planeador não valida disponibilidade da parceira nem aprovação da ILUNION.

A meta anual de 28 dias é **pessoal e configurável**, não direito contratual automático. Acumulação intramensal em fração do mês local, atualização por minuto enquanto ativa e ao regressar (iOS pode suspender JS). Férias deduplicadas; segunda–sexta por omissão. 24/08–06/09/2026: 14 datas civis, dez úteis, quatro fins de semana ignorados sob regra padrão. Feriados, descanso alternativo, contrato/CCT, escala e aprovação exigem confirmação.

## Problemas e próximo passo transversal

- Validar visualmente no iPhone real as duas rotas, depois Android/tablet/desktop: zoom, texto ampliado, rotação, teclado e VoiceOver/TalkBack. Testar salto global sem 404, atalho e expansão de proveniência, filtros, mudança de ano, calendário e retorno após suspensão/sync.
- A vista inativa continua montada sob CSS; `VacationBalancePage` mantém coletor próprio distinto de `VacationYearRecords`. Comparar dados reais antes de qualquer unificação e não inventar saldo com cofre temporariamente inacessível.
- Preservar documentos históricos em `docs/history/PROJECT_STATE-pre-217.md` e restantes ficheiros do mesmo diretório; histórico recente nos PRs #217–#221.
