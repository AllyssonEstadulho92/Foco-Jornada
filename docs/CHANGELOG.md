# Changelog

## 2026-09-16 — sugestões de férias baseadas em critérios (PR #211)

### Adicionado

- Painel **Sugestão de férias** na área de planeamento de `#/ferias`, com hierarquia visual inspirada no protótipo aprovado: cabeçalho, período destacado, filtros, meses, calendário, alternativas e ações reais.
- Dias úteis pretendidos (1–30, padrão 10), mês a evitar e critérios alternativos «Juntar fins de semana», «Mais cedo» e «Maior saldo no fim».
- Candidatos futuros do ano atual, sem sobreposição com dias úteis já marcados ou passagem pelo mês excluído; um candidato por mês inicial.
- Contagem de descanso potencial com fins de semana adjacentes, saldo pessoal estimado no fim e projeção de dezembro.
- Calendário navegável no ano real com destaque de dias sugeridos, fins de semana abrangidos e férias registadas.
- Botão **Simular este período** que preenche o simulador existente sem marcar férias; ligação ao mapa de turnos para a ação explícita de registo.
- Mensagem clara quando não existe opção com saldo pessoal projetado não negativo para os filtros escolhidos.

### Integridade e segurança

- `VacationSuggestions.ts` usa `simulateVacationPeriod`/`VacationBalance` e não cria uma segunda fórmula para saldo ou dias úteis.
- Filtros e escolhas são estado efémero; sem novos dados persistidos, schema, token, API, dependências, permissões ou telemetria.
- As sugestões não afirmam aprovação de RH nem inferem feriados, escalas, preços ou disponibilidade. A meta pessoal de 28 permanece separada do direito laboral.
- CSS isolado `vacation-suggestions.css` com grelhas fluidas, contenção dos cartões, alvos acessíveis de 44px, navegação por teclado, `forced-colors` e `prefers-reduced-motion`.

### Testes e entrega

- `VacationSuggestions.test.ts` valida cenários futuros, 10 dias, exclusão de mês, datas duplicadas, sobreposição, preferências, saldo não negativo e fim de ano.
- `vacation-suggestions.test.ts` cobre montagem com dados existentes, controlos e acessibilidade estrutural.
- Qualidade inicial #1150 concluiu com sucesso (audit, typecheck, lint, testes, build, Worker, smoke e artefacto); head final, integração, publicação e validação em dispositivos ainda pendentes nesta revisão.

## 2026-09-16 — simulação de períodos futuros de férias (PR #210)

### Adicionado

- Novo painel **Simula as próximas férias** dentro de `#/ferias`, com início/fim e pré-visualização sem gravação.
- Contagem de dias civis, dias úteis padrão, fins de semana e dias úteis já registados; apenas os dias ainda não registados contam como adicionais.
- Saldo pessoal estimado no início e no fim do período, reutilizando `calculateVacationBalance`.
- Previsão pessoal de 31 de dezembro antes/depois da simulação e aviso quando se torna negativa.
- Lista dos próximos conjuntos de dias úteis futuros marcados, incluindo agrupamento de sexta a segunda.
- Ligação explícita ao mapa de turnos para registar férias, sem criar ou alterar registos na simulação.

### Precisão, segurança e testes

- Datas civis validadas com UTC; datas passadas, invertidas ou fora do ano atual são rejeitadas.
- Caso 24/08/2026–06/09/2026 mantém dez dias úteis e quatro fins de semana; meta 28 e dez dias novos produzem previsão final de 18 dias.
- Testes `VacationPlanner.test.ts` cobrem datas, sobreposição, saldos e agrupamento; `vacation-planner.test.ts` verifica integração, contenção e acessibilidade estrutural.
- Novo `vacation-planner.css` isolado, grelha fluida, uma coluna em mobile, `focus-visible`, `forced-colors` e `prefers-reduced-motion`.
- Sem nova persistência, schema, endpoint, segredo, autenticação, permissão, dependência ou telemetria. A referência laboral permanece separada da meta pessoal.

### Qualidade e publicação

- Qualidade #1143 e #1148 no head e #1149 após merge: sucesso integral.
- PR #210 integrado no commit `73a6c0f43caf40219a98b1224113bdddaaec420b`.
- Publicar Foco & Jornada #249 e GitHub Pages #814: sucesso; build publicado `8a79445d483ff2017e2cb860c94bccc77d2d33d0`.
- Validação física com dados reais permanece pendente.

## 2026-09-16 — painel avançado de leitura de férias (PR #209)

### Adicionado

- Painel **O que tens, o que falta e o que vem a seguir** na rota `#/ferias`.
- Progresso anual da meta pessoal em percentagem, dias por acumular, próximo marco/data estimada, férias gozadas automáticas/manuais e planeadas, total comprometido, previsão de 31 de dezembro, fins de semana ignorados e fecho mensal.

### Domínio

Novos campos derivados em `VacationBalance`: `annualAccrualProgressPercent`, `annualAccrualRemainingDays`, `usedAndPlannedDays`, `usedAndPlannedPercentOfTarget`, `yearEndProjectedBalanceDays`, `nextAccrualMilestoneDays`, `nextAccrualMilestoneDate` e `hasReachedAccrualTarget`. Data do marco baseada em `meta/12`, sem segunda taxa.

### UI/UX e testes

- `vacation-insights.css` isolado, grelha fluida, barra anual acessível, destaque do próximo marco, alerta de projeção final negativa, contenção, `forced-colors` e `prefers-reduced-motion`.
- `VacationBalance.insights.test.ts` cobre progresso, próximo marco/data e projeção; 24/08–06/09 mantém dez úteis e saldo projetado 18 com meta 28.
- `vacation-insights.test.ts` protege layout e acessibilidade; sem migração/endpoint/segredo/permissão/dependência ou telemetria.

### Publicação

Qualidade #1140/#1141, Publicar #248 e Pages #807: sucesso; merge `8b7b6fc68c3330714b081865992de9adb5243d4c`, build `ac121c3f687f86149d90e1bd78c4788b8c86d0a6`.

## 2026-09-16 — hierarquia visual da evolução mensal de férias (PR #208)

- Grelha de 12 meses passou a `repeat(auto-fit, minmax(min(100%, 15rem), 1fr))`, adaptando colunas ao espaço real; resumo vivo com mínimo de 13rem.
- Hierarquia visual de mês, estado, valor, barra e auxiliar; mês atual diferenciado e mês futuro neutro.
- Removida altura mínima excessiva no mobile; cabeçalho em coluna; mantidas contenção/ARIA, `forced-colors` e `prefers-reduced-motion`.
- Teste `vacation-card-containment.test.ts` expandido. Nenhuma alteração a cálculos/cofre/sync/API.
- Qualidade #1138/#1139, Publicar #247 e Pages #801: sucesso; merge `a41a0c3b9fdef1b0e5d67bc29ce6b453dbcbc4cf`, build `a5a17750ffa43f506c9feb5af78a167f3b1f0f5c`.

## 2026-09-15 — contenção visual dos cartões mensais de férias (PR #207)

- Corrigido badge de setembro que transbordava; mês, estado, valores e barra limitados à largura, sem reticências.
- Mobile com uma coluna e cabeçalho organizado; teste `vacation-card-containment.test.ts`.
- Qualidade #1131/#1132, Publicar #246 e Pages #796: sucesso; merge `3a564251eece4a4c2870982ed3127c1638a68482`, build `ce2242b0f90fc4e884764df6d3c31c7dd43a60e9`.

## 2026-09-15 — evolução mensal de férias em tempo real (PR #206)

- Projeção intramensal com `asOfDayProgress`, `monthlyLiveAccruedDays`, `monthlyLiveAvailableBalanceDays`, `monthlyLiveProjectedBalanceDays`, progresso, ganho/restante, ritmo e marcos exatos.
- Atualização de minuto em minuto e em `focus`/`visibilitychange`, barras mensais e precisão sem erro de arredondamento intermédio.
- Qualidade #1122/#1123, Publicar #245 e Pages #790: sucesso; merge `15f4df15308a145f9d303cf56d699837f9516303`, build `05e32a99bd0479fdb417876cb9a31f305a32866d`.

## 2026-09-15 — contagem de dias úteis nas férias (PR #205)

- Sábado/domingo registados como férias não reduzem saldo padrão; datas deduplicadas antes de filtrar. 24/08–06/09 = 14 civis, dez úteis e quatro de fim de semana.
- Qualidade #1113/#1114, Publicar #244 e Pages #785: sucesso; merge `2e309975a38e0df975bf1958879fefb3c3b4b514`, build `26e8dcffca10589846dad4577e96ad03ea1e0608`.

## 2026-09-15 — acumulação mensal pessoal de férias (PR #204)

- Meta anual configurável, padrão 28; `monthlyAccrualTargetDays`; cronograma janeiro–dezembro e marcos `meta × mês/12` sem drift (março 7, junho 14, setembro 21, dezembro 28).
- Qualidade #1105/#1106, Publicar #237 e Pages #772: sucesso; merge `131e6a721f03c3f5d9e22f1ebea885593607c315`, build `9629239c2ccde1cac925d00a3197d645cc8ed308`.

## 2026-09-15 — ferramenta de saldo de férias (PR #203)

- Rota `#/ferias`, `VacationBalance` como módulo puro, referência laboral separada do planeamento, agregação de férias do mapa de turnos/plano mensal/calculadora e configuração em `secureStorage` cifrado.
- Qualidade #1097/#1098, Publicar #236 e Pages #767: sucesso; merge `225e808a416ac6e18f23c1b7178e99886d7cecbf`, build `d5dee6cd9418eaf4483ca4422c17b8331d915445`.

## 2026-09-10 — automação de jornada e pausas (PR #202)

- `reconcileScheduledWorkday` reconcilia entrada, pausas e saída a partir de `WorkSchedule`; Pomodoro/foco personalizado manuais.
- `ScheduledWorkdayAutomation` atua na PWA ativa/regresso do background; Vitest 5.0.0, sharp 0.35.4 via override e npm 11.6.0 nos workflows.
- PR #202 integrado `62b0cb44db31fff957a4486b7ac24634c721e3ea`, build `08dc9fae23f683fc7cadf80ada7a54b2545da8b2`.

## 2026-09-08 — logótipo animado no arranque (PR #200/#201)

`logo-mark.svg` com CSS progressivo, tema claro/escuro, `prefers-reduced-motion`, `role="status"` e `aria-live="polite"`.

## 2026-09-07 — shell e menu móvel (PR #195–#199)

Botão único hambúrguer ↔ X, sem segundo X; alvo 44×44px; top bar visível com drawer/backdrop abaixo; ARIA, safe-area e modos acessíveis.

## 2026-09-07 — sincronização móvel ↔ computador (PR #191–#194)

Cloudflare Worker/Durable Object só transporta cofre cifrado; token derivado de dataKey, conflitos bilaterais sem last-write-wins e associação temporária sem enviar PIN/palavra-passe/dataKey original.

## 2026-09-07 — turnos noturnos (PR #189)

Normalização de horas que atravessam meia-noite, preservando entrada antecipada e saída na madrugada.

## 2026-09-05 — medicação e histórico

Gesto horizontal em tomas programadas; definir/eliminar com confirmação; tombstone `deletedAt` e versionamento; Histórico com Resumo/Detalhes técnicos.
