# Estado do Projeto

Atualizado em: 2026-09-16

## Estado atual

O **Foco Jornada** é uma PWA React/TypeScript única e responsiva para telemóvel, tablet e computador, publicada em GitHub Pages. Persistência local-first em IndexedDB/cofre cifrado; sincronização opcional por Cloudflare Worker/Durable Objects transporta apenas o cofre cifrado.

Em `main` estão integrados turnos noturnos (#189), sincronização/associação cifrada de browsers (#191–#194), shell móvel (#195–#199), bootstrap animado (#200–#201), automação de jornada/pausas (#202), ferramenta/evolução de férias (#203–#209), simulador de períodos (#210) e sugestões visuais de férias (#211).

## PR #212 — separar evolução e planeamento, melhorar largura e espaçamento

**Estado: em validação na branch `feat/vacation-workspace-layout`; NÃO integrado/publicado nesta revisão.**

O utilizador pediu: (1) «Férias acumuladas mês a mês» com progressão/meses, (2) «O que tens, o que falta e o que vem a seguir» com indicadores, (3) «PLANEAMENTO · 2026 — Planeia as próximas férias» numa área autónoma, sem misturar tudo. Implementado `VacationWorkspacePage.tsx` com navegação real: `#/ferias` apresenta cabeçalho, métricas, evolução mensal **antes** dos indicadores, e no fim configuração, referência e fontes; `#/ferias/planeamento` apresenta apenas sugestões, calendário, simulação e registo explícito no mapa de turnos. O ano do cabeçalho do planeador continua dinâmico, não fixado em 2026.

`vacation-workspace.css` restringe o contentor a 80rem fluidos, controla largura/overflow, usa `clamp` para padding e gaps, grelha auto-fit para métricas, navegação 2→1 colunas no mobile e cartões de planeamento com espaço próprio. `vacation-workspace.test.ts` valida rotas, ordem, visibilidade, controlo por teclado, contenção, contraste e movimento reduzido. Especificação em `docs/VACATION-WORKSPACE.md`.

**Limite de implementação explícito:** o mesmo `VacationBalancePage` é renderizado em ambas as rotas, com zonas não aplicáveis escondidas por CSS (`display:none`). Preserva a única agregação, configurações e cálculo e evita duplicar domínio/estado; os componentes escondidos permanecem montados em React. Extrair componentes/hook comuns para desmontar blocos ocultos é melhoria futura, com regressões. A visibilidade por CSS não cria direito, férias ou reservas.

**Segurança e integridade:** nenhuma alteração ao cofre, schema, auth, autorização, Worker, API, dependências, segredos ou sincronização. A meta pessoal de 28 continua separada do direito oficial. Testes físicos em iPhone/Android/tablet/desktop e quality gates finais ainda pendentes.

## PR #211 — sugestões de férias alinhadas com o protótipo

**Estado: integrado, validado por CI e publicado.** PR #211 integrado em `main` no commit `b687673a467cf5fc5061160b41a254e4b55118cc`; Qualidade #1150 (código inicial), #1156 (head final) e Qualidade em `main` (run `35127380594`) concluíram com sucesso. Publicar Foco & Jornada #250 e Pages #819 concluíram com sucesso; build publicado `271035a552cb6a1ecdbfe6ee8032bcafed7013ff`.

O planeador oferece **Sugestão de férias**: período destacado, dias úteis pretendidos (1–30, padrão 10), mês a evitar, preferência juntar fins de semana/mais cedo/maior saldo pessoal, comparação de meses, calendário navegável e botão «Simular este período» que preenche o simulador existente. A ligação ao mapa de turnos permanece explícita. `VacationSuggestions.ts` enumera períodos futuros até dezembro, rejeita sobreposição de úteis e meses excluídos, reutiliza `simulateVacationPeriod`/`VacationBalance`, filtra saldo pessoal não negativo no fim/dezembro. O ano da aplicação é real, não 2025 ilustrativo. Fins de semana adjacentes representam descanso potencial apenas se forem folgas na escala concreta.

Exemplo de regressão: dez dias gozados de 24/08 a 06/09/2026, meta pessoal 28 e mais dez úteis sugeridos → previsão de oito dias em dezembro, sem outros ajustes/compromissos. Sem inferir direito oficial, feriados, escala, preços ou aprovação. Motor `src/domain/vacation/VacationSuggestions.ts`, UI `VacationSuggestionsPanel.tsx`, CSS e testes isolados, `docs/VACATION-SUGGESTIONS.md`. Sem novas gravações, schema, auth, backend, dependências ou telemetria. Validação física ainda pendente.

## PR #210 — simulador de períodos

Integrado e publicado: merge `73a6c0f43caf40219a98b1224113bdddaaec420b`, Qualidade #1148/#1149, Publicar #249, build `8a79445d483ff2017e2cb860c94bccc77d2d33d0`, Pages #814 verdes. Simula início/fim futuro no ano atual, dias civis/úteis/fins de semana, desconta apenas datas ainda não registadas, calcula saldo pessoal antes/depois e previsão de dezembro. Lista grupos de dias úteis futuros registados. Não grava nem aprova férias. Usa `VacationPlanner.ts`/`VacationPlannerPanel.tsx` e `docs/VACATION-PLANNER.md`. Limites: feriados, escalas e transição de ano. Caso 24/08–06/09/2026: 14 civis, dez úteis, quatro fins de semana. Validação física pendente.

## Entregas anteriores de férias

- PR #209: indicadores de progresso anual, próximo marco, gozados/planeados e previsão dezembro; merge `8b7b6fc68c3330714b081865992de9adb5243d4c`, Qualidade #1140/#1141, Publicar #248, build `ac121c3f687f86149d90e1bd78c4788b8c86d0a6`, Pages #807 verdes.
- PR #208: grelha mensal fluida e contenção; merge `a41a0c3b9fdef1b0e5d67bc29ce6b453dbcbc4cf`, Qualidade #1138/#1139, Publicar #247, build `a5a17750ffa43f506c9feb5af78a167f3b1f0f5c`, Pages #801 verdes.
- PR #203–#207: ferramenta original, meta pessoal 28 configurável, dias úteis padrão, evolução intramensal e contenção responsiva; integrados/publicados.

## Regras funcionais

**Referência laboral:** ano normal com mínimo geral suportado de 22 úteis; superior apenas confirmado. Ano de admissão modelado conservadoramente como dois dias por mês completo até 20, marco dos seis meses. Transitados, férias externas e ajustes exigem confirmação.

**Projeção pessoal:** meta configurável (28 por defeito); março 7, junho 14, setembro 21, dezembro 28. Mês atual evolui pela fração temporal; atualiza a cada 60 segundos enquanto página ativa e em `focus`/`visibilitychange`, sem garantir background.

**Dias registados:** mapa de turnos, plano mensal e calculadora de horas; datas deduplicadas. Segunda–sexta contam na regra padrão; sábado/domingo não reduzem saldo. 24/08–06/09/2026 = dez úteis e quatro fins de semana ignorados. Feriados/escala especial fora da inferência.

## Qualidade

React 19, TypeScript 5.9, Vite 7, Vitest 5, Node 22, npm 11.6.0. Gates: `npm audit --audit-level=high`, typecheck, lint, Vitest, build, Worker dry-run, smoke Chromium e artefacto. PR #211 passou head/`main` e publicação. PR #212 precisa de gates no head final e após merge.

## Limitações e validações abertas

1. Validar áreas separadas e UI de sugestões no iPhone real, Android, tablet/desktop, zoom, aumento de texto e VoiceOver/TalkBack.
2. Confirmar 24/08–06/09 = dez úteis, sobreposição, atualização ao regressar à PWA e sincronização móvel/computador.
3. Testar mudança entre as duas rotas com o PIN desbloqueado e registo/simulação sem escrita implícita.
4. Avaliar feriados e descanso semanal alternativo apenas depois de confirmar contrato/CCT/regras da entidade.
5. Continuar validação física da automação de jornada e sync cross-device.

## Última alteração

PR #212 em validação: separação visual do planeamento em rota própria, ordenação mês→indicadores, largura e espaçamento fluidos; domínio e dados intactos.

## Próximo passo

Confirmar a Qualidade no head final de #212, integrar/publicar apenas após gates verdes; testar navegação e UI no iPhone. Não introduzir marcação automática sem confirmação explícita e verificação do direito oficial.
