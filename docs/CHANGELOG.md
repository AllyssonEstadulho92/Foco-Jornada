# Changelog

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

- Primeira Qualidade #1143: sucesso integral no código com especificação do simulador; validar o head final antes de integrar.
- Integração/publicação e validação física: pendentes nesta revisão do changelog.

## 2026-09-16 — painel avançado de leitura de férias (PR #209)

### Adicionado

- Painel **O que tens, o que falta e o que vem a seguir** na rota `#/ferias`.
- Progresso anual da meta pessoal em percentagem.
- Dias ainda por acumular até à meta anual.
- Próximo marco inteiro da acumulação e respetiva data estimada pelo mesmo modelo mensal.
- Separação visual entre férias gozadas detetadas na app e dias introduzidos manualmente.
- Férias futuras planeadas e total `gozadas + planeadas`.
- Percentagem da meta pessoal já comprometida.
- Previsão pessoal para 31 de dezembro.
- Número de fins de semana registados como férias e ignorados pelo filtro padrão.
- Próximo fecho mensal, falta no mês e ritmo diário aproximado.

### Domínio

Novos campos derivados em `VacationBalance`:

- `annualAccrualProgressPercent`;
- `annualAccrualRemainingDays`;
- `usedAndPlannedDays`;
- `usedAndPlannedPercentOfTarget`;
- `yearEndProjectedBalanceDays`;
- `nextAccrualMilestoneDays`;
- `nextAccrualMilestoneDate`;
- `hasReachedAccrualTarget`.

A data do próximo marco é calculada usando a mesma distribuição `meta / 12`, sem introduzir uma segunda taxa de acumulação.

### UI/UX e acessibilidade

- Novo `vacation-insights.css` isolado dos estilos globais.
- Grelha fluida `auto-fit/minmax` para desktop/tablet/mobile.
- Barra anual com semântica `progressbar`.
- Destaque do próximo marco sem depender apenas da cor.
- Estado visual para projeção final negativa.
- Contenção de texto/valores, uma coluna em ecrãs estreitos, `forced-colors` e `prefers-reduced-motion`.

### Testes

- `VacationBalance.insights.test.ts` cobre progresso anual, restante, próximo marco/data, projeção final e meta concluída.
- Caso real 24/08/2026–06/09/2026 mantém 10 dias úteis e, sem outros ajustes, projeta 18 dias pessoais no fim do ano para meta 28.
- `vacation-insights.test.ts` protege grelha, contenção, mobile e acessibilidade estrutural.

### Compatibilidade e segurança

- Sem novo campo persistido ou migração IndexedDB.
- Sem novo endpoint, token, segredo, permissão, dependência ou telemetria.
- Referência laboral continua separada da projeção pessoal.
- Configuração e registos continuam protegidos pelo cofre cifrado existente.

### Qualidade, integração e publicação

- **Qualidade #1140** no head final do PR e **Qualidade #1141** em `main`: sucesso.
- PR #209 integrado em `main` no commit `8b7b6fc68c3330714b081865992de9adb5243d4c`.
- **Publicar Foco & Jornada #248**: sucesso.
- Build publicado: `ac121c3f687f86149d90e1bd78c4788b8c86d0a6`.
- **pages build and deployment #807**: sucesso.

## 2026-09-16 — hierarquia visual da evolução mensal de férias (PR #208)

### Aprimorado

- Grelha dos 12 meses passa a usar `auto-fit/minmax`, ajustando automaticamente 4, 3, 2 ou 1 coluna conforme o espaço real.
- Resumo vivo da secção também passa a adaptar automaticamente o número de colunas.
- Cartões recebem hierarquia visual mais clara entre mês, estado, valor acumulado, barra e texto auxiliar.
- Mês atual recebe destaque próprio por superfície, borda superior e valor principal.
- Meses concluídos ficam visualmente distintos dos futuros sem alterar o conteúdo funcional.
- A altura mínima usada no desktop é removida no mobile para reduzir espaço vazio.
- Em ecrãs estreitos, mês e estado passam para uma coluna e o badge fica abaixo do nome.

### Contenção e acessibilidade

- Mantidas as proteções do PR #207: `min-width: 0`, `max-width: 100%`, `overflow-wrap` e `overflow: hidden`.
- Barra de progresso continua limitada ao cartão.
- `forced-colors` e `prefers-reduced-motion` permanecem suportados.
- O teste `vacation-card-containment.test.ts` foi expandido para validar auto-fit, contenção e diferenciação do mês atual.

### Compatibilidade e segurança

- Nenhuma alteração em `VacationBalance`, cálculo, persistência, cofre, sincronização, API, autenticação, dependências ou dados pessoais.

### Qualidade, integração e publicação

- **Qualidade #1138** no head final do PR concluiu integralmente com sucesso.
- PR #208 integrado em `main` no commit `a41a0c3b9fdef1b0e5d67bc29ce6b453dbcbc4cf`.
- **Qualidade #1139** após o merge concluiu com sucesso: auditoria, typecheck, lint, testes, build, Worker dry-run, smoke test Chromium e artefacto.
- **Publicar Foco & Jornada #247** concluiu com sucesso.
- Build publicado: `a5a17750ffa43f506c9feb5af78a167f3b1f0f5c`.
- **pages build and deployment #801**: sucesso.

## 2026-09-15 — contenção visual dos cartões mensais de férias (PR #207)

### Corrigido

- O badge de estado/percentagem deixa de ultrapassar a borda do cartão.
- Nome do mês, estado, valor, descrições e barra ficam limitados à largura disponível.
- Removido truncamento por reticências do estado mensal.
- Em ecrãs estreitos, a grelha passa para uma coluna e o cabeçalho reorganiza mês/estado.
- Adicionado teste `src/styles/vacation-card-containment.test.ts`.

### Integração e publicação

- PR #207 integrado em `main` no commit `3a564251eece4a4c2870982ed3127c1638a68482`.
- **Qualidade #1131** no head e **Qualidade #1132** em `main`: sucesso.
- **Publicar Foco & Jornada #246**: sucesso.
- Build publicado: `ce2242b0f90fc4e884764df6d3c31c7dd43a60e9`.
- **pages build and deployment #796**: sucesso.

## 2026-09-15 — evolução mensal de férias em tempo real (PR #206)

### Adicionado

- Evolução intramensal da projeção pessoal de férias.
- `asOfDayProgress` opcional para a fração do dia local.
- `monthlyLiveAccruedDays`, `monthlyLiveAvailableBalanceDays` e `monthlyLiveProjectedBalanceDays`.
- Progresso, ganho, restante, ritmo diário e meta de fecho do mês atual.
- Atualização a cada minuto enquanto a página está ativa e reconciliação em `focus`/`visibilitychange`.
- Barras de progresso mensais.

### Precisão

- Marcos mensais continuam derivados diretamente por `meta × mês / 12`.
- Valor restante do mês passou a ser calculado diretamente da parcela mensal e do progresso exato, evitando diferença de 0,0001 dia por arredondamento intermédio.

### Integração e publicação

- PR #206 integrado em `main` no commit `15f4df15308a145f9d303cf56d699837f9516303`.
- **Qualidade #1122**, **Qualidade #1123**, **Publicar #245** e **Pages #790**: sucesso.
- Build publicado: `05e32a99bd0479fdb417876cb9a31f305a32866d`.

## 2026-09-15 — contagem de dias úteis nas férias (PR #205)

### Corrigido

- Sábado e domingo registados como férias deixam de reduzir o saldo na semana padrão.
- Datas são deduplicadas antes do filtro de dias úteis.
- O mesmo resultado alimenta referência laboral e contador mensal pessoal.

### Caso validado

- 24/08/2026–06/09/2026: 14 datas civis, 10 dias úteis contabilizados e 4 fins de semana ignorados.

### Integração e publicação

- PR #205 integrado no commit `2e309975a38e0df975bf1958879fefb3c3b4b514`.
- **Qualidade #1113/#1114**, **Publicar #244** e **Pages #785**: sucesso.
- Build publicado: `26e8dcffca10589846dad4577e96ad03ea1e0608`.

## 2026-09-15 — acumulação mensal pessoal de férias (PR #204)

### Adicionado

- Meta anual pessoal configurável, 28 dias por defeito.
- `monthlyAccrualTargetDays` na configuração existente.
- Cronograma janeiro–dezembro com estados **Concluído**, **Em curso** e **Futuro**.
- Marcos calculados diretamente da meta para evitar drift.

### Marcos de referência para meta 28

- março: 7 dias;
- junho: 14 dias;
- setembro: 21 dias;
- dezembro: 28 dias.

### Integração e publicação

- PR #204 integrado em `main` no commit `131e6a721f03c3f5d9e22f1ebea885593607c315`.
- **Qualidade #1105/#1106**, **Publicar #237** e **Pages #772**: sucesso.
- Build publicado: `9629239c2ccde1cac925d00a3197d645cc8ed308`.

## 2026-09-15 — ferramenta de saldo de férias (PR #203)

### Adicionado

- Rota `#/ferias`.
- `VacationBalance` como módulo puro para referência laboral, saldo atual e saldo projetado.
- Agregação de férias do mapa de turnos, plano mensal e calculadora de horas.
- Configuração guardada em `secureStorage` no cofre cifrado existente.
- UI responsiva e documentação funcional.

### Integração e publicação

- PR #203 integrado no commit `225e808a416ac6e18f23c1b7178e99886d7cecbf`.
- Build publicado: `d5dee6cd9418eaf4483ca4422c17b8331d915445`.
- **Qualidade #1097/#1098**, **Publicar #236** e **Pages #767**: sucesso.

## 2026-09-10 — automação de jornada e pausas (PR #202)

- `reconcileScheduledWorkday` reconcilia entrada, pausas e saída a partir do `WorkSchedule`.
- `ScheduledWorkdayAutomation` atua enquanto a PWA está ativa ou regressa ao primeiro plano.
- Pomodoro e foco personalizado permanecem manuais.
- Vitest atualizado para `5.0.0`, `sharp` `0.35.4` via override e npm 11.6.0 fixado nos workflows.
- PR #202 integrado no commit `62b0cb44db31fff957a4486b7ac24634c721e3ea`.
- Build publicado: `08dc9fae23f683fc7cadf80ada7a54b2545da8b2`.

## 2026-09-08 — logótipo animado no arranque (PR #200 / #201)

- Bootstrap usa `logo-mark.svg` com animação CSS progressiva.
- Tema claro/escuro, `prefers-reduced-motion`, `role="status"` e `aria-live="polite"` preservados.

## 2026-09-07 — shell e menu móvel (PR #195–#199)

- O mesmo botão alterna hambúrguer ↔ X.
- Removido o segundo X e preservado alvo de toque de 44 × 44 px.
- Top bar permanece visível com drawer aberto; drawer/backdrop começam abaixo.
- ARIA, safe-area, `forced-colors` e `prefers-reduced-motion` preservados.

## 2026-09-07 — sincronização móvel ↔ computador (PR #191–#194)

- Cloudflare Worker + Durable Object para transporte do cofre cifrado.
- Token remoto derivado da `dataKey` e conflito bilateral sem `last-write-wins` silencioso.
- Associação temporária de outro navegador sem enviar PIN/palavra-passe/dataKey original ao backend.

## 2026-09-07 — turnos noturnos (PR #189)

- Normalização de horas reais em turnos que atravessam a meia-noite.
- Entrada antecipada e saída de madrugada continuam associadas ao turno correto.

## 2026-09-05 — medicação e histórico

- Gesto horizontal nas tomas programadas.
- Ações **Definir** e **Eliminar** com confirmação.
- Tombstone `deletedAt` e versionamento de horários.
- Histórico com **Resumo** e **Detalhes técnicos**.
