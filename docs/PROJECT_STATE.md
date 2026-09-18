# Estado do Projeto

Atualizado em: 2026-09-18. PR #221 integrado e publicado; validação física no iPhone pendente.

## Última alteração — PR #221

**Objetivo e evidência:** o PDF de uma página enviado pelo utilizador mostra o planeamento de julho/2027 precedido por quatro cartões do saldo de 2026, seguido de quatro alternativas volumosas, simulação, checklist e notas extensas. A captura demonstra excesso de informação antes das decisões principais, não um erro comprovado de cálculo. O código confirmou a ordem anterior em `VacationPlannerPanel` e a altura dos cartões em `vacation-joint-planner.css`.

**Implementação:** para o ano seguinte, `VacationJointPlanner` surge primeiro; a referência viva do ano corrente, com as mesmas quatro métricas e relógio, está num `<details>` opcional a seguir, com aviso explícito de que o saldo não é transferido automaticamente. Para o ano corrente o resumo mantém-se aberto antes das sugestões. O planeamento a dois segue quatro etapas (escolher, comparar, simular, confirmar), opções mais compactas e notas detalhadas expansíveis. CSS específico `vacation-planning-structure.css`, testes estruturais e relatório `docs/VACATION-PLANNING-STRUCTURE-2026.md`. Não mudaram fórmulas, datas, exclusões de novembro/dezembro, confirmações temporárias por cenário, cofre ou sincronização.

**Entrega confirmada:** [PR #221](https://github.com/AllyssonEstadulho92/Foco-Jornada/pull/221) integrado, merge `9e9d267fd7a9ed7de3a9afdc68cbc8a8d2b708b9`. Qualidade #1227 (head final) e #1228 (`main`) passaram auditoria de dependências, TypeScript, lint, Vitest, build, Worker dry-run e smoke Chromium. Publicar Foco & Jornada #260 concluiu com sucesso e gerou o build `4074f203c6788d30a4f542c951a6b94b62f86fad`; GitHub Pages #866 concluiu a publicação desse build com sucesso. **Não foi testado visualmente no iPhone real**: estes gates não demonstram ausência de overflow e não verificam todas as interações.

**Próximo passo:** validar captura e interações reais em `#/ferias/planeamento` no iPhone, incluindo seleção das quatro alternativas, calendário, detalhes, mudança de ano/filtros e reposição de vistos; depois Android, tablet e desktop com zoom e texto ampliado.

## Entrega anterior — PR #220

PR #220 refinou `#/ferias` e `#/ferias/planeamento` com leitura de 74rem, sombras discretas, saldo principal destacado e calendários contidos; corrigiu o skip link global do `AppShell` para `focusSection('main-content')` sem alterar o hash. Merge `8a45758f68462e8631edbaf65f0b802a2c60ee19`; Qualidade #1219/#1220, Publicar #259, build `eec8da024db5b3f65624433c66726e7c56e04cb0`, Pages #859, todos com sucesso. Teste real de navegação/aspeto pendente. Ver `docs/VACATION-UI-AUDIT-2026.md` e `docs/HASH-ROUTER-NAVIGATION.md`.

## Entregas anteriores — PR #219 e #218

PR #219 harmonizou navegação móvel, tipografia, espaçamento e cartões sem alterar domínio; merge `f96ced5532178bb0746db0e50ef52874e72710dc`, Qualidade #1209/#1210, Publicar #258, build `96c779f88ab2d0f941b7a54f690dd759fa909ec1`, Pages #854. PR #218 corrigiu o 404 no atalho de proveniência causado por `href="#vacation-evidence-title"` em `createHashRouter`: botão com foco/scroll e rota `*` de recuperação PT-PT; merge `89564f3ebbfe5d54e5d09dcf28db9e574b35cc50`, Qualidade #1201/#1202, Publicar #257, Pages #848. Teste físico do atalho pendente.

## Estado da aplicação e das férias

PWA React 19/TypeScript/Vite responsiva para iPhone, Android, tablet e computador, frontend GitHub Pages, IndexedDB/Dexie e cofre AES-GCM, sincronização opcional cifrada Cloudflare Worker/Durable Object; replicação não é instantânea garantida. `#/ferias` apresenta acumulação mensal, saldo, indicadores e proveniência (horas/turnos/plano); `#/ferias/planeamento` contém sugestões, calendário, simulação e férias a dois para o próximo ano. Julho pode ser predefinido; novembro/dezembro são excluídos segundo restrição comunicada pelo utilizador, sujeita a confirmação anual. A aplicação não verifica disponibilidade da parceira nem aprovação da ILUNION.

A meta anual de 28 dias é **pessoal e configurável**, não direito contratual automático. Acumulação intramensal em fração do mês local, atualização por minuto enquanto ativa e ao regressar (iOS pode suspender JS). Férias deduplicadas; segunda–sexta por omissão. 24/08–06/09/2026: 14 datas civis, dez úteis, quatro fins de semana ignorados sob regra padrão. Feriados, descanso alternativo, contrato/CCT, escala e aprovação exigem confirmação.

## Problemas e próximo passo transversal

- Validar visualmente no iPhone real as duas rotas, depois Android/tablet/desktop: zoom, texto ampliado, rotação, teclado e VoiceOver/TalkBack. Testar salto global sem 404, atalho e expansão de proveniência, filtros, mudança de ano, calendário e retorno após suspensão/sync.
- A vista inativa continua montada sob CSS; `VacationBalancePage` mantém coletor próprio distinto de `VacationYearRecords`. Comparar dados reais antes de qualquer unificação e não inventar saldo com cofre temporariamente inacessível.
- Preservar documentos históricos em `docs/history/PROJECT_STATE-pre-217.md` e restantes ficheiros do mesmo diretório; histórico recente nos PRs #217–#221.
