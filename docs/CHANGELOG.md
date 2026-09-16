# Changelog

## 2026-09-16 — sugestões de férias baseadas em critérios (PR #211)

### Adicionado

- Painel **Sugestão de férias** na área de planeamento de `#/ferias`, com hierarquia visual inspirada no protótipo aprovado: cabeçalho, período destacado, filtros, meses, calendário, alternativas e ações reais.
- Dias úteis pretendidos (1–30, padrão 10), mês a evitar e critérios alternativos «Juntar fins de semana», «Mais cedo» e «Maior saldo no fim».
- Candidatos futuros do ano atual, sem sobreposição com dias úteis já marcados ou passagem pelo mês excluído; um candidato por mês inicial.
- Contagem de descanso potencial com fins de semana adjacentes, saldo pessoal estimado no fim e projeção de dezembro.
- Calendário navegável no ano real com destaque de dias sugeridos, fins de semana abrangidos e férias registadas.
- Botão **Simular este período** que preenche o simulador existente sem marcar férias; ligação ao mapa de turnos para ação explícita de registo.
- Mensagem clara quando não existe opção com saldo pessoal projetado não negativo para os filtros escolhidos.

### Integridade e segurança

- `VacationSuggestions.ts` usa `simulateVacationPeriod`/`VacationBalance` e não cria uma segunda fórmula para saldo ou dias úteis.
- Filtros e escolhas são estado efémero; sem novos dados persistidos, schema, token, API, dependências, permissões ou telemetria.
- As sugestões não afirmam aprovação de RH nem inferem feriados, escalas, preços ou disponibilidade. A meta pessoal de 28 permanece separada do direito laboral.
- CSS isolado `vacation-suggestions.css` com grelhas fluidas, contenção dos cartões, alvos de 44px, navegação por teclado, `forced-colors` e `prefers-reduced-motion`.

### Testes e entrega

- `VacationSuggestions.test.ts` valida cenários futuros, dez dias, exclusão de mês, datas duplicadas, sobreposição, preferências, saldo não negativo e fim de ano.
- `vacation-suggestions.test.ts` cobre montagem com dados existentes, controlos e acessibilidade estrutural.
- **Qualidade #1150** (código inicial), **Qualidade #1156** (head final) e Qualidade em `main` (run `35127380594`) passaram auditoria, TypeScript, lint, testes, build, Worker dry-run, smoke Chromium e artefacto.
- PR #211 integrado no commit `b687673a467cf5fc5061160b41a254e4b55118cc`.
- **Publicar Foco & Jornada #250** e **GitHub Pages #819**: sucesso. Build publicado `271035a552cb6a1ecdbfe6ee8032bcafed7013ff`.
- Validação funcional e visual num iPhone/Android/tablet/desktop real ainda pendente; CI não a substitui.

## 2026-09-16 — simulação de períodos futuros de férias (PR #210)

### Adicionado

- Painel **Simula as próximas férias** em `#/ferias`, com início/fim e pré-visualização sem gravação.
- Contagem de dias civis, dias úteis padrão, fins de semana e dias já registados; apenas datas novas contam como adicionais.
- Saldo pessoal estimado no início e fim, reutilizando `calculateVacationBalance`.
- Previsão de 31 de dezembro antes/depois da simulação e aviso de saldo negativo.
- Lista dos conjuntos de dias úteis futuros marcados, agrupando sexta e segunda.
- Ligação ao mapa de turnos para registar férias por ação explícita.

### Precisão, segurança e testes

- Datas civis validadas com UTC; datas passadas, invertidas ou fora do ano atual rejeitadas.
- Caso 24/08/2026–06/09/2026: dez úteis e quatro fins de semana; meta 28 e dez dias novos projetam 18 dias restantes.
- `VacationPlanner.test.ts` cobre datas, sobreposição, saldos e agrupamento; `vacation-planner.test.ts` protege layout/acessibilidade.
- CSS isolado, grelha fluida, mobile numa coluna, `focus-visible`, `forced-colors` e `prefers-reduced-motion`.
- Sem nova persistência, schema, endpoint, segredo, autenticação, permissão, dependência ou telemetria. Referência laboral separada da meta pessoal.

### Qualidade e publicação

- Qualidade #1143/#1148 no head e #1149 após merge: sucesso integral.
- PR #210 integrado em `73a6c0f43caf40219a98b1224113bdddaaec420b`.
- Publicar #249, Pages #814 e build `8a79445d483ff2017e2cb860c94bccc77d2d33d0`: sucesso.
- Validação física com dados reais permanece pendente.

## 2026-09-16 — painel avançado de leitura de férias (PR #209)

- Painel **O que tens, o que falta e o que vem a seguir** em `#/ferias`: progresso anual, dias em falta, próximo marco/data, férias gozadas/planeadas, total comprometido, previsão dezembro, fins de semana ignorados e fecho mensal.
- `VacationBalance` passou a derivar `annualAccrualProgressPercent`, `annualAccrualRemainingDays`, `usedAndPlannedDays`, `usedAndPlannedPercentOfTarget`, `yearEndProjectedBalanceDays`, `nextAccrualMilestoneDays`, `nextAccrualMilestoneDate`, `hasReachedAccrualTarget` sem segunda taxa de acumulação.
- `vacation-insights.css` isolado, barra anual acessível, estado negativo, contenção, `forced-colors`, `prefers-reduced-motion` e testes de domínio/UI. 24/08–06/09 continua dez úteis e projeção 18 com meta 28; sem migração/segredos/API.
- Qualidade #1140/#1141, Publicar #248 e Pages #807 verdes; merge `8b7b6fc68c3330714b081865992de9adb5243d4c`, build `ac121c3f687f86149d90e1bd78c4788b8c86d0a6`.

## 2026-09-16 — hierarquia visual da evolução mensal de férias (PR #208)

- Grelha de doze meses `repeat(auto-fit, minmax(min(100%, 15rem), 1fr))`, resumo com 13rem, mês atual diferenciado, tipografia/hierarquia previsíveis e mobile sem altura excessiva.
- Contenção, ARIA, `forced-colors`, `prefers-reduced-motion` e teste `vacation-card-containment.test.ts` expandido; sem alterar cálculo/cofre/sync/API.
- Qualidade #1138/#1139, Publicar #247 e Pages #801 verdes; merge `a41a0c3b9fdef1b0e5d67bc29ce6b453dbcbc4cf`, build `a5a17750ffa43f506c9feb5af78a167f3b1f0f5c`.

## 2026-09-15 — contenção visual dos cartões mensais de férias (PR #207)

- Corrigido badge de setembro que transbordava; mês, estado, valores e barra limitados à largura, sem reticências. Mobile com uma coluna, cabeçalho organizado e teste estrutural.
- Qualidade #1131/#1132, Publicar #246 e Pages #796 verdes; merge `3a564251eece4a4c2870982ed3127c1638a68482`, build `ce2242b0f90fc4e884764df6d3c31c7dd43a60e9`.

## 2026-09-15 — evolução mensal de férias em tempo real (PR #206)

- `asOfDayProgress`, `monthlyLiveAccruedDays`, `monthlyLiveAvailableBalanceDays`, `monthlyLiveProjectedBalanceDays`, progresso/ganho/restante/ritmo/barra e marcos exatos sem drift de arredondamento.
- Atualização a cada minuto e em `focus`/`visibilitychange`. Qualidade #1122/#1123, Publicar #245, Pages #790; merge `15f4df15308a145f9d303cf56d699837f9516303`, build `05e32a99bd0479fdb417876cb9a31f305a32866d`.

## 2026-09-15 — contagem de dias úteis nas férias (PR #205)

- Datas deduplicadas antes de filtrar; sábado/domingo não reduzem saldo padrão. 24/08–06/09 = 14 civis, dez úteis e quatro de fim de semana.
- Qualidade #1113/#1114, Publicar #244, Pages #785; merge `2e309975a38e0df975bf1958879fefb3c3b4b514`, build `26e8dcffca10589846dad4577e96ad03ea1e0608`.

## 2026-09-15 — acumulação mensal pessoal de férias (PR #204)

- Meta anual configurável (padrão 28), cronograma janeiro–dezembro e marcos `meta × mês/12` sem drift; março 7, junho 14, setembro 21, dezembro 28.
- Qualidade #1105/#1106, Publicar #237, Pages #772; merge `131e6a721f03c3f5d9e22f1ebea885593607c315`, build `9629239c2ccde1cac925d00a3197d645cc8ed308`.

## 2026-09-15 — ferramenta de saldo de férias (PR #203)

- Rota `#/ferias`, `VacationBalance` puro, referência laboral distinta do planeamento, agregação de férias do mapa de turnos/plano mensal/calculadora e configuração em `secureStorage` cifrado.
- Qualidade #1097/#1098, Publicar #236, Pages #767; merge `225e808a416ac6e18f23c1b7178e99886d7cecbf`, build `d5dee6cd9418eaf4483ca4422c17b8331d915445`.

## 2026-09-10 — automação de jornada e pausas (PR #202)

- `reconcileScheduledWorkday` reconcilia jornada/pausas pelo `WorkSchedule`; Pomodoro/foco personalizado manual. `ScheduledWorkdayAutomation` atua com PWA ativa ou ao regressar do background.
- Vitest 5.0.0, sharp 0.35.4 via override e npm 11.6.0; merge `62b0cb44db31fff957a4486b7ac24634c721e3ea`, build `08dc9fae23f683fc7cadf80ada7a54b2545da8b2`.

## 2026-09-08 — logótipo animado no arranque (PR #200/#201)

`logo-mark.svg` com CSS progressivo, tema claro/escuro, `prefers-reduced-motion`, `role="status"` e `aria-live="polite"`.

## 2026-09-07 — shell e menu móvel (PR #195–#199)

Botão único hambúrguer ↔ X, sem segundo X; alvo 44×44px; top bar visível com drawer/backdrop abaixo; ARIA, safe-area e modos acessíveis.

## 2026-09-07 — sincronização móvel ↔ computador (PR #191–#194)

Worker/Durable Object transporta apenas cofre cifrado; token derivado de dataKey, conflitos bilaterais sem last-write-wins e associação temporária sem enviar PIN/palavra-passe/dataKey original.

## 2026-09-07 — turnos noturnos (PR #189)

Normalização de horas que atravessam meia-noite, preservando entrada antecipada e saída de madrugada.

## 2026-09-05 — medicação e histórico

Gesto horizontal em tomas programadas; definir/eliminar com confirmação; tombstone `deletedAt` e versionamento; Histórico com Resumo/Detalhes técnicos.
