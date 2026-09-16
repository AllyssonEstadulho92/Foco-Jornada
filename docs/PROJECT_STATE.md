# Estado do Projeto

Atualizado em: 2026-09-16

## Estado atual

O **Foco Jornada** é uma PWA React/TypeScript única e responsiva para telemóvel, tablet e computador, publicada em GitHub Pages. Persistência local-first em IndexedDB/cofre cifrado; sincronização opcional por Cloudflare Worker/Durable Objects transporta apenas o cofre cifrado.

Em `main` estão integrados turnos noturnos (#189), sincronização e associação cifrada de browsers (#191–#194), shell móvel (#195–#199), bootstrap animado (#200–#201), automação de jornada/pausas (#202), ferramenta e evolução de férias (#203–#209), simulador de períodos (#210) e sugestões visuais de férias (#211).

## PR #211 — sugestões de férias alinhadas com o protótipo

**Estado: integrado, validado por CI e publicado.** PR #211 integrado em `main` no commit `b687673a467cf5fc5061160b41a254e4b55118cc`; Qualidade #1150 (código inicial) e #1156 (head final) e Qualidade em `main` (run `35127380594`) concluíram com sucesso. Publicar Foco & Jornada #250 terminou com sucesso; build publicado `271035a552cb6a1ecdbfe6ee8032bcafed7013ff` e GitHub Pages #819 (`35127474577`) concluíram com sucesso.

A rota `#/ferias` oferece o painel **Sugestão de férias**, inspirado no protótipo visual aprovado: período destacado; filtros de dias úteis pretendidos (1–30, padrão 10), mês a evitar e preferência entre juntar fins de semana, mais cedo ou maior saldo pessoal no fim; comparação de meses, calendário navegável com legenda, alternativas e botão **Simular este período**, que preenche as datas do simulador existente. A ligação ao mapa de turnos continua separada e explícita.

**Cálculo:** `VacationSuggestions.ts` enumera apenas períodos futuros até dezembro do ano real, rejeitando sobreposições com dias úteis registados ou meses excluídos. Reutiliza `simulateVacationPeriod` e `VacationBalance`; mostra apenas candidatos com saldos pessoais estimados não negativos no fim e em dezembro. Os dias potenciais de descanso incluem sábados e domingos adjacentes, *se* forem folgas na escala concreta. Seleciona um candidato por mês de início para variedade. O ano é o da aplicação, não 2025 como na imagem ilustrativa.

**Exemplo de regressão:** dez dias já gozados em 24/08–06/09/2026, meta pessoal de 28 e mais dez dias novos sugeridos deixam uma previsão pessoal de oito dias em dezembro, sem outros ajustes/compromissos. Sugestões não são direitos oficiais nem analisam feriados, escala real, preços ou aprovação da entidade empregadora.

**Arquitetura e segurança:** motor puro em `src/domain/vacation/VacationSuggestions.ts`, UI em `src/presentation/pages/VacationSuggestionsPanel.tsx`, CSS isolado em `src/styles/vacation-suggestions.css`, testes de domínio e estrutura. Recebe as mesmas datas e definições da página; não cria registos, reserva férias, grava preferências, altera schema, cofre, autenticação, autorização, backend, dependências ou telemetria. Especificação em `docs/VACATION-SUGGESTIONS.md`.

**Validação ainda pendente:** exame visual/funcional no iPhone real, Android, tablet e desktop, zoom, VoiceOver/TalkBack, registos reais de sobreposição e sincronização cross-device. Confirmação de direito efetivo/descanso semanal/viabilidade com RH antes de marcar.

## PR #210 — simulador de períodos

Integrado e publicado: merge `73a6c0f43caf40219a98b1224113bdddaaec420b`, Qualidade #1148/#1149, Publicar #249, build `8a79445d483ff2017e2cb860c94bccc77d2d33d0`, Pages #814 verdes. Permite simular datas futuras no ano atual, dias de calendário/úteis/fins de semana, descontar apenas datas ainda não registadas, consultar saldo pessoal antes/depois e previsão de dezembro. Lista próximos grupos de dias úteis registados. Não grava nem aprova férias. Usa `VacationPlanner.ts`/`VacationPlannerPanel.tsx` e `docs/VACATION-PLANNER.md`. Limites: feriados, escalas e transição de ano não inferidos. Caso 24/08–06/09/2026: 14 civis, dez úteis e quatro fins de semana. Validação física permanece pendente.

## Entregas anteriores de férias

- PR #209: indicadores de progresso anual, próximo marco, dias gozados/planeados, previsão dezembro; merge `8b7b6fc68c3330714b081865992de9adb5243d4c`, Qualidade #1140/#1141, Publicar #248, build `ac121c3f687f86149d90e1bd78c4788b8c86d0a6`, Pages #807 verdes.
- PR #208: grelha mensal fluida e contenção; merge `a41a0c3b9fdef1b0e5d67bc29ce6b453dbcbc4cf`, Qualidade #1138/#1139, Publicar #247, build `a5a17750ffa43f506c9feb5af78a167f3b1f0f5c`, Pages #801 verdes.
- PR #203–#207: ferramenta original, meta pessoal de 28 configurável, dias úteis padrão, evolução intramensal e contenção responsiva; integrados e publicados.

## Regras funcionais

**Referência laboral:** ano normal com mínimo geral suportado de 22 dias úteis; valor superior só quando confirmado; ano de admissão modelado conservadoramente como dois dias por mês completo até 20, com marco dos seis meses. Transitados, férias externas e ajustes exigem confirmação.

**Projeção pessoal:** meta configurável (28 por defeito); março 7, junho 14, setembro 21, dezembro 28. Mês atual evolui pela fração temporal decorrida; atualiza a cada 60 segundos enquanto página ativa e em `focus`/`visibilitychange`, sem prometer execução contínua em background.

**Dias registados:** mapa de turnos, plano mensal e calculadora de horas; datas deduplicadas. Segunda–sexta contam na regra padrão; sábado/domingo não reduzem saldo. 24/08–06/09/2026 = dez úteis e quatro fins de semana ignorados. Feriados e escalas não padrão fora da inferência.

## Qualidade

React 19, TypeScript 5.9, Vite 7, Vitest 5, Node 22, npm 11.6.0. Gates: `npm audit --audit-level=high`, typecheck, lint, Vitest, build, Worker dry-run, smoke Chromium e artefacto. PR #211 passou integralmente em head e `main`; Publicar #250 e Pages #819 também passaram.

## Limitações e validações abertas

1. Testar a nova UI de sugestões em iPhone real, Android, tablet e desktop, inclusive zoom/aumento do texto e acessibilidade.
2. Confirmar no dispositivo a contagem 24/08–06/09, sobreposições e atualização ao regressar à PWA.
3. Confirmar sincronização dos registos e da configuração entre telemóvel e computador.
4. Avaliar feriados/descanso semanal alternativo somente com contrato/CCT ou regras da entidade confirmados.
5. Continuar validação física da automação de jornada e sincronização cross-device.

## Última alteração

PR #211 integrado e publicado: sugestões futuras com calendário e critérios explícitos, sem escrita de dados nem desconto duplicado.

## Próximo passo

Validar em iPhone real com dados verdadeiros. Antes de acrescentar marcação automática, especificar confirmação explícita, permissões e integridade dos registos; não confundir meta pessoal com saldo oficial.
