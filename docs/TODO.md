# TODO

Atualizado em: 2026-09-16

## P0 — Simulador de períodos futuros de férias (PR #210)

- [x] Rever a rota `#/ferias`, `VacationBalance`, CSS, fontes de férias e documentação de `main`.
- [x] Manter a referência laboral separada da meta pessoal de 28 dias.
- [x] Introduzir início e fim de período futuro dentro do ano atual.
- [x] Validar datas civis, ordem e fronteiras do ano.
- [x] Contar segunda–sexta e apresentar fins de semana sem desconto.
- [x] Evitar novo desconto para datas já registadas, inclusive duplicadas.
- [x] Reutilizar `calculateVacationBalance` para saldos pessoais no início/fim, sem segunda fórmula de acumulação.
- [x] Mostrar previsão de 31 de dezembro antes/depois do novo período.
- [x] Agrupar dias úteis futuros consecutivos já registados, incluindo sexta–segunda.
- [x] Adicionar estados de datas inválidas, só fins de semana, período já integralmente marcado e saldo projetado negativo.
- [x] Garantir simulação sem escrita; registo real continua no mapa de turnos, por ação explícita.
- [x] Adicionar CSS isolado com contenção, mobile, `focus-visible`, `forced-colors` e `prefers-reduced-motion`.
- [x] Criar `VacationPlanner.test.ts` e regressão de layout `vacation-planner.test.ts`.
- [x] Documentar regras e limites em `VACATION-PLANNER.md`.
- [x] Confirmar ausência de novas tabelas, schema, API, segredos, autenticação, dependências e telemetria.
- [x] Obter primeira execução verde de audit, typecheck, lint, testes, build, Worker dry-run e smoke test (Qualidade #1143).
- [ ] Confirmar gates do **head final** com toda a documentação.
- [ ] Marcar PR #210 pronto, integrar em `main` e confirmar qualidade pós-merge.
- [ ] Confirmar publicação do build e sucesso de GitHub Pages.
- [ ] Atualizar nos cinco documentos o estado final da integração/publicação.
- [ ] Validar o simulador em iPhone real com períodos sobrepostos, fins de semana e zoom.
- [ ] Validar Android, tablet e desktop, incluindo VoiceOver/TalkBack e aumento de texto.
- [ ] Confirmar sincronização de registos/configuração entre telemóvel e computador.

## P0 — Validação física da área de férias já publicada

- [ ] Confirmar no iPhone que a evolução em tempo real atualiza ao regressar à PWA.
- [ ] Confirmar que percentagens e badges longos não extravasam após PR #207/#208.
- [ ] Confirmar com dados reais 24/08/2026–06/09/2026 = 10 dias úteis e quatro fins de semana ignorados.
- [ ] Confirmar sincronização de `monthlyAccrualTargetDays` e restantes definições.
- [ ] Validar Android/Chrome e tablet.

## P0 — Funcionalidades de férias já integradas

- [x] PR #203 — ferramenta de saldo, referência laboral e rota `#/ferias`.
- [x] PR #204 — meta pessoal mensal configurável, 28 dias por defeito.
- [x] PR #205 — exclusão padrão de sábado/domingo; 24/08–06/09 = 10 dias.
- [x] PR #206 — evolução intramensal em tempo real.
- [x] PR #207 — contenção de todos os cartões mensais.
- [x] PR #208 — grelha `auto-fit/minmax` e hierarquia visual adaptativa.
- [x] PR #209 — painel avançado com progresso anual, marco, férias comprometidas e projeção de fim do ano.
- [x] Qualidade #1141, Publicar #248 e Pages #807 verdes para PR #209.

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
- [ ] Possível gravação de períodos apenas com confirmação explícita e integração segura com o mapa de turnos.
- [ ] Seleção de ano/histórico e avisos opcionais de meta pessoal excedida.
- [ ] Fluxo explícito de resolução de conflitos de sync, eliminação autenticada da cópia remota, revogação de browsers e rate limiting quando necessário.
