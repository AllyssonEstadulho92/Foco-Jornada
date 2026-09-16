# TODO

Atualizado em: 2026-09-16

## P0 — Cabeçalho do planeamento compacto e contido (PR #213)

- [x] Analisar screenshot real e comparar JSX, CSS de planeamento, workspace, router e testes.
- [x] Corrigir badge cortada, largura do título e vazio excessivo do cabeçalho com altura intrínseca.
- [x] Usar quebra segura, duas colunas limitadas e passagem para uma coluna até 820px.
- [x] Manter sugestões, simulador, cálculos, registos e segurança intactos.
- [x] Adicionar teste estrutural de regressão e `docs/VACATION-PLANNER-HEADER.md`.
- [x] Confirmar Qualidade #1172 no head final e #1173 após merge em `main`, incluindo audit, tipos, lint, testes, build, Worker e smoke Chromium.
- [x] Integrar PR #213: merge `88099b5200b371081822e19197d15f723a8c3f14`.
- [x] Confirmar Publicar Foco & Jornada #252, build `ddbdced0c2b380e546a8e0da29dbe5819a74d4f8` e GitHub Pages #832 com sucesso.
- [ ] Verificar visualmente o cabeçalho no iPhone real, com zoom/texto ampliado e nova captura; comparar Android/tablet/desktop.

## P0 — Separação do planeamento e refinamento de layout (PR #212)

- [x] Rever os cinco documentos de continuidade, código da página, router, estilos e testes existentes.
- [x] Preservar a única fonte de dados, cálculo, cofre e sugestões; sem API, schema, dependências ou gravação implícita.
- [x] Introduzir `#/ferias/planeamento`, mantendo `#/ferias` e navegação entre ambos com foco/estado ativo.
- [x] Separar visualmente a acumulação mensal e os indicadores do planeamento; ordenar a evolução mensal antes dos indicadores.
- [x] Melhorar largura máxima, padding, espaçamento, grelhas, contenção e leitura de valores no desktop/tablet/mobile.
- [x] Dar ao planeamento painel próprio com sugestões, filtros, calendário, simulação e ligação explícita ao mapa de turnos.
- [x] Proteger teclado, contraste forçado, movimento reduzido e H1 acessível na rota dedicada.
- [x] Adicionar teste de regressão `vacation-workspace.test.ts` e especificação `VACATION-WORKSPACE.md`.
- [x] Documentar limite atual: vista escondida via CSS continua montada; sem segunda agregação.
- [x] Verificar gates do head final: **Qualidade #1164**, auditoria, TypeScript, lint, testes, build, Worker, smoke e artefacto com sucesso.
- [x] Integrar PR #212 no commit `732bfea2e518a5651a71bc347fa9782f574584b0` e confirmar **Qualidade #1165** em `main` com sucesso.
- [x] Confirmar **Publicar Foco & Jornada #251**, build `2ff90745e506e48009347e10e19e90cea2ad5322` e **GitHub Pages #826**: sucesso.
- [x] Atualizar PROJECT_STATE, ARCHITECTURE, DECISIONS, TODO e CHANGELOG para a implementação; registar resultados finais de publicação.
- [ ] Testar iPhone real: alternar vistas, filtros, simulação, textos grandes, zoom, landscape e PWA retomada.
- [ ] Testar Android/tablet/desktop e VoiceOver/TalkBack; validar sync móvel ↔ computador.
- [ ] Avaliar extração futura de componentes/hook comuns para não montar painéis ocultos, após testes reais.

## P0 — Sugestões personalizadas de férias (PR #211)

- [x] Ler PROJECT_STATE, ARCHITECTURE, DECISIONS, TODO e CHANGELOG e confrontar com `VacationPlannerPanel`, `VacationPlanner` e `VacationBalance`.
- [x] Reproduzir protótipo: cabeçalho, destaque, filtros, meses, calendário, alternativas e ações; ano corrente dinâmico.
- [x] Filtros 1–30 dias, mês excluído, critérios juntar fins de semana/mais cedo/maior saldo.
- [x] Períodos futuros sem sobreposição, cálculo/saldo reutilizados do simulador, saldo não negativo, comparação de meses.
- [x] CSS e testes próprios, acessibilidade, limites de escala/feriados/aprovação, nenhuma gravação.
- [x] Especificação VACATION-SUGGESTIONS e cinco documentos de continuidade.
- [x] Qualidade #1150/#1156 no head e run `35127380594` em `main` verdes.
- [x] PR #211 integrado `b687673a467cf5fc5061160b41a254e4b55118cc`; Publicar #250, build `271035a552cb6a1ecdbfe6ee8032bcafed7013ff` e Pages #819 verdes.
- [ ] Validar em iPhone real sugestões, filtros, mês excluído, calendário, seleção/simulação e zoom.
- [ ] Validar Android/tablet/desktop, VoiceOver/TalkBack, PWA após suspensão e dados sincronizados.

## P0 — Simulador de períodos futuros de férias (PR #210)

- [x] Rever rota, domínio, CSS, fontes e documentos; manter direito oficial separado da meta 28.
- [x] Validar início/fim futuro no ano atual, datas civis, ordem, dias úteis e fins de semana.
- [x] Evitar duplicar datas já registadas, reutilizar `calculateVacationBalance` para antes/depois/dezembro.
- [x] Agrupar grupos futuros, tratar datas inválidas, só fins de semana e saldo negativo.
- [x] Não gravar; registar no mapa de turnos apenas explicitamente; CSS e testes acessíveis, sem schema/API/segredo.
- [x] Qualidade #1143/#1148 no head e #1149 em `main` verdes.
- [x] PR #210 integrado `73a6c0f43caf40219a98b1224113bdddaaec420b`; Publicar #249, build `8a79445d483ff2017e2cb860c94bccc77d2d33d0`, Pages #814 verdes; docs atualizados.
- [ ] Validar simulador no iPhone com sobreposições, fins de semana, zoom; Android/tablet/desktop e sync.

## P0 — Validação física da área de férias já publicada

- [ ] Confirmar atualização em tempo real ao regressar à PWA no iPhone.
- [ ] Confirmar que badges/percentagens não extravasam após PR #207/#208.
- [ ] Confirmar com dados reais 24/08/2026–06/09/2026 = dez úteis e quatro fins de semana ignorados.
- [ ] Confirmar sincronização de `monthlyAccrualTargetDays` e restantes definições; validar Android/Chrome e tablet.

## P0 — Funcionalidades de férias já integradas

- [x] PR #203 — ferramenta de saldo, referência laboral e rota `#/ferias`.
- [x] PR #204 — meta pessoal mensal configurável, 28 por defeito.
- [x] PR #205 — exclusão padrão de sábado/domingo; 24/08–06/09 = dez úteis.
- [x] PR #206 — evolução intramensal em tempo real.
- [x] PR #207 — contenção dos cartões mensais.
- [x] PR #208 — grelha auto-fit e hierarquia visual.
- [x] PR #209 — painel de progresso anual, próximo marco, férias comprometidas e previsão dezembro.
- [x] PR #210 — simulação futura sem desconto duplicado.
- [x] PR #211 — sugestões por critérios, comparação de meses e calendário.
- [x] PR #212 — vista de planeamento separada e layout equilibrado, Quality #1165 e Pages #826 verdes.
- [x] PR #213 — cabeçalho compacto e contido, Quality #1173 e Pages #832 verdes.

## P0 — Automação de jornada e pausas

- [x] Reconciliar entrada, pausas e saída a partir de `WorkSchedule`.
- [x] Manter Pomodoro/foco personalizado manuais; preservar timestamps exatos após background; integrar/publicar com testes.
- [ ] Validar dispositivo real jornada 08:00–17:00, pausa 60min, Pomodoro manual e saída automática.

## P0 — Segurança de dependências

- [x] Vitest `5.0.0`, `sharp` `0.35.4` via overrides e npm 11.6.0 nos workflows.
- [x] Manter `npm audit --audit-level=high` como gate obrigatório.

## P0 — Sincronização móvel ↔ computador em dispositivos reais

Implementação PR #191–#194 concluída; testes físicos pendentes.

- [ ] Confirmar **Sincronizado** e revisão remota no telemóvel.
- [ ] Associar navegador no computador com mesmo perfil/PIN; criar/editar/eliminar nos dois sentidos e confirmar convergência.
- [ ] Fechar/reabrir, testar offline → reconexão e conflito simultâneo sem perda silenciosa.
- [ ] Confirmar mesmo fuso horário entre dispositivos durante o teste.

## P1 — Interface e acessibilidade

- [ ] Validar Android/Chrome 360–480px, tablet 481–899px, ecrã horizontal/safe-area.
- [ ] Testar hambúrguer ↔ X, `focus-visible`, `forced-colors`, `prefers-reduced-motion` e top bar persistente.
- [ ] Testar medicação/stock no iPhone, scroll, eliminação imediata, resumo/detalhes e VoiceOver/TalkBack.

## P1 — Consistência temporal

- [ ] Decidir timezone global explícito para jornada/relatórios e migração compatível se aprovada; até lá validar cross-device no mesmo timezone.

## P2 — Evoluções futuras a avaliar

- [ ] Calendário laboral de feriados e descanso diferente, após contrato/CCT.
- [ ] Simulação entre anos com transição de saldo confirmada.
- [ ] Possível gravação de períodos apenas com confirmação explícita/integração segura com mapa de turnos.
- [ ] Seleção de ano/histórico e avisos opcionais de meta pessoal excedida.
- [ ] Fluxo explícito de conflitos de sync, eliminação autenticada da cópia remota, revogação de browsers e rate limiting quando necessário.
