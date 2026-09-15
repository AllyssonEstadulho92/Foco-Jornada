# Changelog

## 2026-09-15 — evolução mensal de férias em tempo real (PR #206)

### Adicionado

- Evolução intramensal em tempo real para a projeção pessoal de férias.
- `asOfDayProgress` opcional no cálculo de domínio para representar a fração do dia local já decorrida.
- Campos derivados `monthlyLiveAccruedDays`, `monthlyLiveAvailableBalanceDays` e `monthlyLiveProjectedBalanceDays`.
- Progresso, ganho, restante, ritmo diário e meta acumulada de fecho do mês atual.
- Barras de progresso mensais na grelha de janeiro a dezembro.
- Relógio local com atualização a cada minuto enquanto a página está ativa e reconciliação ao recuperar foco/visibilidade.
- Testes dedicados à interpolação do mês atual e ao comportamento do último dia antes do fecho real.

### Compatibilidade

- `monthlyAccruedDays` continua a representar apenas meses efetivamente fechados.
- Os marcos mensais continuam calculados diretamente por `meta × mês / 12`, sem drift.
- A referência laboral/contratual do PR #203 permanece separada.
- A regra de segunda a sexta-feira do PR #205 permanece aplicada a férias gozadas e planeadas.
- Nenhum novo campo de configuração, endpoint, schema, segredo, token, permissão ou dependência foi criado.

### UI/UX e acessibilidade

- Novos cartões **Saldo agora**, **Acumulado agora**, **Após planeadas** e **Progresso do mês**.
- Resumo do mês atual com valor ganho, valor restante, ritmo diário e meta ao fecho.
- O mês atual mostra acumulado vivo e percentagem; meses fechados mantêm o marco final; meses futuros mostram a meta prevista.
- Valores vivos podem mostrar até quatro casas decimais; marcos fechados mantêm até duas.
- `forced-colors`, `prefers-reduced-motion` e breakpoints responsivos permanecem suportados.

### Precisão

- Um primeiro teste expôs diferença de `0,0001` dia causada por subtrair um valor intermédio já arredondado.
- O valor restante do mês passou a ser calculado diretamente a partir da parcela mensal e do progresso exato, eliminando esse arredondamento intermédio.

### Limite temporal

- A PWA não depende de timers em background. iOS/Android podem suspender JavaScript; ao regressar à aplicação, a evolução é recalculada a partir do relógio local atual.

### Qualidade, integração e publicação

- Workflow **Qualidade #1122** no head final do PR concluiu integralmente com sucesso.
- PR #206 integrado em `main` no commit `15f4df15308a145f9d303cf56d699837f9516303`.
- Workflow **Qualidade #1123** após o merge concluiu com sucesso: auditoria, typecheck, lint, testes, build, Worker dry-run, smoke test Chromium e artefacto.
- Workflow **Publicar Foco & Jornada #245** concluiu com sucesso.
- Build publicado na raiz de `main` no commit `05e32a99bd0479fdb417876cb9a31f305a32866d`.
- Workflow **pages build and deployment #790** concluiu com sucesso para o build publicado.

## 2026-09-15 — contagem de dias úteis nas férias (PR #205)

### Corrigido

- Dias de férias registados ao sábado ou domingo deixam de reduzir o saldo no regime semanal padrão suportado.
- A exclusão de fim de semana é aplicada depois da deduplicação por data e antes de separar férias já gozadas de férias futuras planeadas.
- O mesmo resultado alimenta a referência laboral e o contador mensal pessoal.
- A contagem continua baseada em datas civis `YYYY-MM-DD` com componentes UTC para evitar deriva de timezone/DST.

### Caso de regressão

- Período 24/08/2026–06/09/2026: 14 datas civis, 10 dias úteis contabilizados e 4 dias de fim de semana ignorados.
- Foram adicionados testes específicos para o intervalo e para sábado/domingo marcados isoladamente.

### Limite preservado

- Feriados nacionais/municipais, descanso semanal diferente e escalas especiais não são inferidos automaticamente nesta correção.
- Não foi criado endpoint, schema, token, segredo, permissão, dependência ou migração de dados.

### Qualidade, integração e publicação

- Workflow **Qualidade #1113** no head final do PR concluiu com sucesso: instalação, `npm audit --audit-level=high`, typecheck, lint, testes, build, Worker dry-run, smoke test Chromium e artefacto.
- PR #205 integrado em `main` no commit `2e309975a38e0df975bf1958879fefb3c3b4b514`.
- Workflow **Qualidade #1114** após o merge concluiu integralmente com sucesso.
- Workflow **Publicar Foco & Jornada #244** concluiu com sucesso.
- Build publicado na raiz de `main` no commit `26e8dcffca10589846dad4577e96ad03ea1e0608`.
- Workflow **pages build and deployment #785** concluiu com sucesso para o build publicado.

## 2026-09-15 — acumulação mensal pessoal de férias (PR #204)

### Adicionado

- Contador mensal automático na rota `#/ferias` com meta anual pessoal configurável e valor por defeito de 28 dias.
- `monthlyAccrualTargetDays` na configuração existente `foco-jornada-vacation-settings-v1`.
- Cronograma visual de janeiro a dezembro com estados **Concluído**, **Em curso** e **Futuro**.
- Cartões para saldo acumulado, acumulado bruto, saldo após férias planeadas e meta anual.
- `vacation-accrual.css` para o cronograma responsivo em desktop, tablet e smartphone.
- Testes de fecho mensal, meta de 28 dias, dezembro exato e prevenção de drift por arredondamento.
- `docs/VACATION-TRACKER.md` atualizado para separar explicitamente projeção pessoal de referência laboral.

### Cálculo

- Cada mês só é creditado quando chega ao respetivo último dia.
- A fórmula é `meta anual × meses concluídos / 12`.
- O cálculo não soma parcelas arredondadas: cada marco é recalculado a partir da meta anual.
- Para meta 28: janeiro 2,33; fevereiro 4,67; março 7; junho 14; setembro 21; dezembro 28.
- Em 15 de setembro existem 8 meses concluídos, correspondendo a 18,67 dias brutos; em 30 de setembro passam a 21 dias.
- O saldo pessoal desconta férias gozadas/registadas e inclui transitados e ajustes confirmados.
- O saldo projetado desconta também férias futuras planeadas.

### Separação de conceitos

- O contador de 28 dias é apresentado como **projeção pessoal**.
- `annualEntitlementDays` e as regras laborais existentes do PR #203 permanecem separados.
- A aplicação não apresenta a meta pessoal de 28 dias como direito legal ou contratual automático.

### Compatibilidade e segurança

- Configurações antigas sem `monthlyAccrualTargetDays` recebem 28 como fallback, sem migração destrutiva.
- Nenhum novo endpoint, token, segredo, permissão, tabela IndexedDB ou mecanismo de autenticação foi criado.
- A preferência permanece no `secureStorage` e acompanha o mesmo cofre cifrado/sincronização existente.

### Qualidade, integração e publicação

- Workflow **Qualidade #1105** no head final do PR: instalação, `npm audit --audit-level=high`, typecheck, lint, testes, build, Worker dry-run, smoke test Chromium e artefacto concluídos com sucesso.
- PR #204 integrado em `main` no commit `131e6a721f03c3f5d9e22f1ebea885593607c315`.
- Workflow **Qualidade #1106** após o merge concluiu integralmente com sucesso.
- Workflow **Publicar Foco & Jornada #237** concluiu com sucesso.
- Build publicado na raiz de `main` no commit `9629239c2ccde1cac925d00a3197d645cc8ed308`.
- Workflow **pages build and deployment #772** concluiu com sucesso para o commit publicado.

## 2026-09-15 — ferramenta de saldo de férias (PR #203)

### Adicionado

- Nova rota `#/ferias` com acesso na navegação desktop e no acesso rápido móvel.
- `VacationBalance` como módulo de domínio puro para calcular direito estimado, saldo atual e saldo projetado.
- Testes de domínio para período anual mínimo, condição mais favorável, ano de admissão, limite de 20 dias, seis meses, deduplicação e datas futuras.
- `VacationBalancePage` com configuração, decomposição do cálculo e ligações às fontes de registo existentes.
- `vacation.css` com layout responsivo, foco por teclado, suporte a `forced-colors` e contraste reforçado do botão principal.
- `docs/VACATION-TRACKER.md` com especificação funcional, regras, riscos e critérios de aceitação.

### Comportamento

- Nos anos normais, a ferramenta parte do direito anual vencido/configurado e não representa a referência laboral como acumulação mensal contínua.
- O período anual configurado não pode ficar abaixo do mínimo geral de 22 dias úteis; valores superiores podem ser usados quando uma condição mais favorável estiver confirmada.
- No ano de admissão, a versão inicial usa 2 dias por mês completo de contrato, até 20 dias, e mostra separadamente o marco dos seis meses completos para o gozo.
- Férias já registadas na Calculadora de horas (`reason = ferias`) e no Mapa de turnos/plano mensal (`kind = vacation`) são agregadas automaticamente.
- A mesma data encontrada em várias fontes conta uma única vez.
- Datas passadas/atuais contam como gozadas/registadas; datas futuras do mesmo ano são apresentadas como planeadas.
- O saldo disponível hoje é separado do saldo projetado após férias futuras.

### Segurança e integridade

- A configuração é guardada em `secureStorage` na chave `foco-jornada-vacation-settings-v1`, dentro do cofre cifrado existente.
- Não foi criado novo endpoint, tabela IndexedDB, token, segredo, permissão ou mecanismo de autenticação.
- Não existe migração de schema nem alteração do protocolo de sincronização.

### Integração e publicação

- PR #203 integrado em `main` no commit `225e808a416ac6e18f23c1b7178e99886d7cecbf`.
- Build publicado no commit `d5dee6cd9418eaf4483ca4422c17b8331d915445`.
- **Qualidade #1097** no PR e **Qualidade #1098** em `main` concluíram com sucesso.
- **Publicar Foco & Jornada #236** e **pages build and deployment #767** concluíram com sucesso.

## 2026-09-10 — automação de jornada e pausas (PR #202)

### Adicionado/corrigido

- `reconcileScheduledWorkday` para reconciliar jornada e pausas a partir do `WorkSchedule` persistido.
- `ScheduledWorkdayAutomation` como gatilho global enquanto a PWA está ativa ou regressa ao primeiro plano.
- IDs determinísticos e testes para entrada, pausa de 60 minutos, saída, abertura tardia e término manual.
- Antes da entrada não é criada jornada; durante o turno pode ser criada com o timestamp planeado; na saída é encerrada com o timestamp configurado.
- Uma jornada terminada manualmente não é reiniciada e não é fabricado um dia completo quando a primeira abertura ocorre só depois da saída.
- Pomodoro e foco personalizado permanecem manuais.

### Segurança e publicação

- Vitest atualizado para `5.0.0`, `sharp` forçado para `0.35.4` e dependências do lint restauradas sem enfraquecer gates.
- PR #202 integrado no commit `62b0cb44db31fff957a4486b7ac24634c721e3ea`.
- Build publicado no commit `08dc9fae23f683fc7cadf80ada7a54b2545da8b2`.
- Audit, typecheck, lint, testes, build, Worker dry-run e smoke test concluíram com sucesso.

## 2026-09-08 — logótipo animado no arranque (PR #200 / PR #201)

- O fallback de bootstrap passou a apresentar o `logo-mark.svg` oficial com animação CSS progressiva.
- Tema claro/escuro, `prefers-reduced-motion`, `role="status"` e `aria-live="polite"` permanecem suportados.
- Não houve alteração de dados, schema, autenticação, API ou sincronização.

## 2026-09-07 — shell e menu móvel (PR #195–#199)

- O mesmo botão do top bar alterna hambúrguer ↔ X e representa `mobileMenuOpen`.
- Removido o segundo X e preservado alvo de toque de `44 × 44 px`.
- Top bar permanece visível quando o drawer abre; drawer/backdrop começam abaixo dele.
- Foram preservados ARIA, `forced-colors`, safe-area e `prefers-reduced-motion`.

## 2026-09-07 — auditoria e sincronização móvel ↔ computador (PR #191–#194)

- Cloudflare Worker + Durable Object como backend de sincronização cifrada, mantendo GitHub Pages como frontend oficial.
- Token remoto derivado da `dataKey`, revisão remota independente e conflito bilateral sem `last-write-wins` silencioso.
- Associação temporária de outro navegador sem recriar PIN/palavra-passe nem transportar o cofre operacional no canal de pairing.
- PIN, palavra-passe, código de recuperação e `dataKey` original não são enviados ao Worker.

## 2026-09-07 — turnos noturnos (PR #189)

- Normalização de horas reais em turnos que atravessam a meia-noite.
- Entrada antecipada deixa de ser deslocada incorretamente para o dia seguinte.
- Saída após o fim planeado continua associada à manhã seguinte.

## 2026-09-05 — medicação e histórico

- Gesto horizontal nas tomas programadas.
- Ações **Definir** e **Eliminar** com confirmação explícita.
- Tombstone lógico `deletedAt` e versionamento de horários sem quebrar referências históricas.
- Histórico com vistas **Resumo** e **Detalhes técnicos** e paginação progressiva.
- Suporte a `prefers-reduced-motion` e `forced-colors`.
