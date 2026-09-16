# TODO

Atualizado em: 2026-09-16

## P0 — Sugestões personalizadas de férias (PR #211)

- [x] Ler PROJECT_STATE, ARCHITECTURE, DECISIONS, TODO e CHANGELOG e confrontar com `VacationPlannerPanel`, `VacationPlanner` e `VacationBalance`.
- [x] Reproduzir a hierarquia do protótipo: cabeçalho, destaque, filtros, meses, calendário, alternativas e ações.
- [x] Usar o ano corrente em vez das datas ilustrativas do protótipo.
- [x] Filtros: dias úteis 1–30, mês excluído, juntar fins de semana/mais cedo/maior saldo.
- [x] Enumerar apenas períodos futuros no ano atual, sem sobreposição com dias úteis registados.
- [x] Usar `simulateVacationPeriod` para contagem e saldos, sem fórmulas paralelas nem escrita.
- [x] Exigir saldos pessoais projetados não negativos ao fim do período e em dezembro.
- [x] Comparar um representante por mês, alternativas e calendário mensal navegável.
- [x] Reencaminhar escolha para simulador existente; registo real separado no mapa de turnos.
- [x] Indicar limites: escala, feriados, aprovação, custos/preços e meta pessoal diferente de direito oficial.
- [x] CSS isolado, contenção, alvos de 44px, teclado, `forced-colors` e `prefers-reduced-motion`.
- [x] Testes `VacationSuggestions.test.ts` e `vacation-suggestions.test.ts`; Qualidade inicial #1150 verde.
- [x] Especificação `VACATION-SUGGESTIONS.md` e atualização dos cinco documentos do projeto.
- [x] Confirmar os gates da Qualidade para o head final documentado (**#1156**).
- [x] Marcar PR #211 pronto e integrar em `main` (`b687673a467cf5fc5061160b41a254e4b55118cc`).
- [x] Confirmar Qualidade após o merge em `main` (run `35127380594`, sucesso).
- [x] Confirmar **Publicar Foco & Jornada #250**, build `271035a552cb6a1ecdbfe6ee8032bcafed7013ff` e **GitHub Pages #819**: sucesso.
- [x] Registar a entrega em PROJECT_STATE, ARCHITECTURE, DECISIONS, TODO e CHANGELOG.
- [ ] Validar visual e funcionalmente no iPhone real: sugestões, filtros, mês excluído, calendário, selecionar/simular e zoom.
- [ ] Validar Android/tablet/desktop, VoiceOver/TalkBack, PWA após suspensão e dados sincronizados.

## P0 — Simulador de períodos futuros de férias (PR #210)

- [x] Rever a rota `#/ferias`, `VacationBalance`, CSS, fontes de férias e documentação de `main`.
- [x] Manter referência laboral separada da meta pessoal de 28 dias.
- [x] Aceitar início/fim futuro dentro do ano atual; validar datas civis, ordem e limites.
- [x] Contar segunda–sexta, apresentar fins de semana e evitar desconto duplicado de datas já registadas.
- [x] Reutilizar `calculateVacationBalance` para saldo no início/fim e previsão de dezembro.
- [x] Agrupar dias úteis futuros registados, incluindo sexta–segunda.
- [x] Tratar datas inválidas, só fins de semana, períodos já marcados e saldo projetado negativo.
- [x] Simulação sem escrita; registo real no mapa de turnos por ação explícita.
- [x] CSS isolado, mobile, foco visível, cores forçadas e movimento reduzido.
- [x] Testes `VacationPlanner.test.ts` e `vacation-planner.test.ts`, especificação `VACATION-PLANNER.md`.
- [x] Sem novas tabelas, schema, API, segredos, autenticação, dependências ou telemetria.
- [x] Qualidade #1143/#1148 no head e #1149 em `main` integralmente verdes.
- [x] PR #210 integrado no commit `73a6c0f43caf40219a98b1224113bdddaaec420b`; Publicar #249, build `8a79445d483ff2017e2cb860c94bccc77d2d33d0` e Pages #814 verdes.
- [x] Atualizar PROJECT_STATE, ARCHITECTURE, DECISIONS, TODO e CHANGELOG.
- [ ] Validar simulador em iPhone com sobreposições, fins de semana e zoom.
- [ ] Validar Android, tablet, desktop, VoiceOver/TalkBack e texto ampliado.
- [ ] Confirmar sincronização de registos/configuração entre telemóvel e computador.

## P0 — Validação física da área de férias já publicada

- [ ] Confirmar atualização em tempo real ao regressar à PWA no iPhone.
- [ ] Confirmar que badges/percentagens não extravasam após PR #207/#208.
- [ ] Confirmar com dados reais 24/08/2026–06/09/2026 = dez dias úteis e quatro fins de semana ignorados.
- [ ] Confirmar sincronização de `monthlyAccrualTargetDays` e restantes definições.
- [ ] Validar Android/Chrome e tablet.

## P0 — Funcionalidades de férias já integradas

- [x] PR #203 — ferramenta de saldo, referência laboral e rota `#/ferias`.
- [x] PR #204 — meta pessoal mensal configurável, 28 dias por defeito.
- [x] PR #205 — exclusão padrão de sábado/domingo; 24/08–06/09 = dez úteis.
- [x] PR #206 — evolução intramensal em tempo real.
- [x] PR #207 — contenção dos cartões mensais.
- [x] PR #208 — grelha auto-fit e hierarquia visual.
- [x] PR #209 — painel de progresso anual, próximo marco, férias comprometidas e previsão de dezembro.
- [x] PR #210 — simulação de períodos futuros sem desconto duplicado.
- [x] PR #211 — sugestões com critérios, comparação de meses e calendário.

## P0 — Automação de jornada e pausas

- [x] Reconciliar entrada, pausas e saída a partir de `WorkSchedule`.
- [x] Manter Pomodoro/foco personalizado manuais.
- [x] Preservar timestamps exatos ao regressar do background.
- [x] Integrar/publicar com testes e quality gates verdes.
- [ ] Validar em dispositivo real jornada 08:00–17:00, pausa 60 min, Pomodoro manual e saída automática.

## P0 — Segurança de dependências

- [x] Vitest `5.0.0`, `sharp` `0.35.4` via overrides e npm 11.6.0 nos workflows.
- [x] Manter `npm audit --audit-level=high` como gate obrigatório.

## P0 — Sincronização móvel ↔ computador em dispositivos reais

Implementação dos PR #191–#194 concluída; testes físicos pendentes.

- [ ] Confirmar **Sincronizado** e revisão remota no telemóvel.
- [ ] Associar outro navegador e abrir a ligação no computador com o mesmo perfil/PIN.
- [ ] Criar, editar e eliminar registos nos dois sentidos; confirmar convergência.
- [ ] Fechar/reabrir, testar offline → reconexão e conflito simultâneo sem perda silenciosa.
- [ ] Confirmar mesmo fuso horário entre dispositivos durante o teste.

## P1 — Interface e acessibilidade

- [ ] Validar Android/Chrome 360–480 px, tablet 481–899 px e ecrã horizontal/safe-area.
- [ ] Testar hambúrguer ↔ X, `focus-visible`, `forced-colors` e `prefers-reduced-motion`.
- [ ] Confirmar top bar persistente, drawer abaixo e indicadores visíveis.
- [ ] Testar medicação/stock no iPhone, scroll, eliminação imediata, resumo/detalhes e VoiceOver/TalkBack.

## P1 — Consistência temporal

- [ ] Decidir timezone global explícito para jornada/relatórios e especificar migração compatível se aprovado.
- [ ] Até lá, validar cross-device no mesmo timezone do sistema.

## P2 — Evoluções futuras a avaliar

- [ ] Calendário laboral para feriados e descanso semanal diferente, após confirmar contrato/CCT.
- [ ] Simulação que atravessa anos, com política confirmada de transição de saldo.
- [ ] Possível gravação de períodos apenas com confirmação explícita e integração segura com mapa de turnos.
- [ ] Seleção de ano/histórico e avisos opcionais de meta pessoal excedida.
- [ ] Fluxo explícito de conflitos de sync, eliminação autenticada da cópia remota, revogação de browsers e rate limiting quando necessário.
