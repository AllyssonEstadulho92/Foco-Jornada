# Changelog

## 2026-09-15 — ferramenta de saldo de férias (PR #203)

### Adicionado

- Nova rota `#/ferias` com acesso na navegação desktop e no acesso rápido móvel.
- `VacationBalance` como módulo de domínio puro para calcular direito estimado, saldo atual e saldo projetado.
- Testes de domínio para período anual mínimo, condição mais favorável, ano de admissão, limite de 20 dias, seis meses, deduplicação e datas futuras.
- `VacationBalancePage` com configuração, decomposição do cálculo e ligações às fontes de registo existentes.
- `vacation.css` com layout responsivo, foco por teclado, suporte a `forced-colors` e contraste reforçado do botão principal.
- `docs/VACATION-TRACKER.md` com especificação funcional, regras, riscos e critérios de aceitação.

### Comportamento

- Nos anos normais, a ferramenta parte do direito anual vencido/configurado e não representa férias como acumulação mensal contínua.
- O período anual configurado não pode ficar abaixo do mínimo geral de 22 dias úteis; valores superiores podem ser usados quando uma condição mais favorável estiver confirmada.
- No ano de admissão, a versão inicial usa 2 dias por mês completo de contrato, até 20 dias, e mostra separadamente o marco dos seis meses completos para o gozo.
- Férias já registadas na Calculadora de horas (`reason = ferias`) e no Mapa de turnos/plano mensal (`kind = vacation`) são agregadas automaticamente.
- A mesma data encontrada em várias fontes conta uma única vez.
- Datas passadas/atuais contam como gozadas/registadas; datas futuras do mesmo ano são apresentadas como planeadas.
- O saldo disponível hoje é separado do saldo projetado após férias futuras.
- Dias transitados, férias gozadas fora da aplicação e ajustes continuam dependentes de confirmação explícita do utilizador.

### Segurança e integridade

- A nova configuração é guardada em `secureStorage` na chave `foco-jornada-vacation-settings-v1`, permanecendo dentro do cofre cifrado existente.
- Não foi criado novo endpoint, tabela IndexedDB, token, segredo, permissão ou mecanismo de autenticação.
- Não existe migração de schema nem alteração do protocolo de sincronização.
- A ferramenta não infere férias a partir de faltas, doença, folga ou ausência de jornada; só usa estados explicitamente marcados como férias.

### Enquadramento e limitações

- Regras gerais confrontadas com os artigos 237.º a 240.º do Código do Trabalho e gov.pt.
- A ferramenta é controlo pessoal e não substitui o mapa oficial de férias, RH, contrato ou instrumento de regulamentação coletiva.
- A política de meses completos no ano de admissão é deliberadamente conservadora e está documentada devido a divergência interpretativa sobre frações de mês.
- CCT, impedimento prolongado, cessação do contrato e outras situações especiais permanecem fora do cálculo automático até existir informação confirmada.

### CI e qualidade

- Os dois primeiros runs do PR falharam antes dos testes por um crash interno do npm 10.9.8: `Cannot read properties of null (reading 'edgesOut')`.
- Os workflows de qualidade e publicação passaram a fixar `npm@11.6.0` em Node 22, mantendo todos os gates.
- **Qualidade #1097**, no head final do PR: instalação, `npm audit --audit-level=high`, typecheck, lint, testes, build, Worker dry-run, smoke test Chromium e artefacto concluídos com sucesso.
- **Qualidade #1098**, depois do merge em `main`: todos os mesmos gates concluídos com sucesso.

### Integração e publicação

- PR #203 integrado em `main` no commit `225e808a416ac6e18f23c1b7178e99886d7cecbf`.
- Workflow **Publicar Foco & Jornada #236** concluído com sucesso.
- Build publicado na raiz de `main` no commit `d5dee6cd9418eaf4483ca4422c17b8331d915445`.
- Workflow **pages build and deployment #767** concluiu build e deploy com sucesso para o commit publicado.

## 2026-09-10 — automação de jornada e pausas (PR #202)

### Adicionado

- `reconcileScheduledWorkday` para reconciliar jornada e pausas a partir do `WorkSchedule` persistido.
- `ScheduledWorkdayAutomation` como gatilho global enquanto a PWA está ativa ou regressa ao primeiro plano.
- Evento interno `foco-jornada:app-data-changed` e hook `useAppDataRefresh` para atualizar jornada, pausas, foco, atividades e relatório após mutações automáticas.
- IDs determinísticos para jornada/pausas automáticas do mesmo dia.
- Testes dedicados para entrada, pausa de 60 minutos, saída, abertura tardia e término manual.

### Comportamento

- Antes da entrada planeada, nenhuma jornada é iniciada.
- Durante o turno, quando ainda não existe jornada do dia, a aplicação pode iniciar automaticamente com `startedAt` exatamente igual à entrada configurada.
- A jornada ativa termina com `endedAt` exatamente igual à saída configurada quando o limite é atingido ou ultrapassado.
- Uma jornada terminada manualmente não é reiniciada no mesmo dia.
- Se a primeira abertura ocorrer apenas depois da saída e não existir jornada, não é fabricado um dia inteiro retroativo.
- Pausas ativadas usam apenas `startTime`/`endTime` configurados e podem ser reconstruídas após suspensão da PWA.
- Uma pausa de 60 minutos continua a depender de configuração explícita pelo utilizador; não foi criado um descanso hardcoded.
- Foco em execução pode ser pausado quando começa uma pausa laboral.
- Pomodoro e foco personalizado continuam manuais e nunca são iniciados pela automação.

### Integridade temporal

- O tick do runtime serve apenas para detetar marcos; não acumula tempo em memória.
- Ao retomar depois de suspensão, a aplicação usa os timestamps configurados exatos em vez da hora tardia do callback.
- O fecho automático reutiliza `finishJourneyWithProductivityState`, mantendo o tratamento existente de pausa, atividade e foco abertos.
- A limitação de background de PWA está documentada em `docs/TIME-AUTOMATION.md`.

### Segurança e qualidade

O primeiro workflow do PR #202 foi bloqueado por advisories novos em dependências de desenvolvimento. A branch foi corrigida sem enfraquecer os gates:

- `vitest` atualizado de `3.2.7` para `5.0.0`;
- `sharp` transitivo forçado para `0.35.4` através de `overrides`;
- restauradas as dependências diretas `eslint`, `eslint-plugin-react-hooks` e `eslint-plugin-react-refresh` exigidas pelo `eslint.config.js`.

No head final do PR, `npm audit`, typecheck, lint, testes, build, Worker dry-run, smoke test e artefacto concluíram com sucesso. Depois do merge, a pipeline **Qualidade** de `main` voltou a passar integralmente.

### Integração e publicação

- PR #202 integrado em `main` no commit `62b0cb44db31fff957a4486b7ac24634c721e3ea`.
- Workflow **Publicar Foco & Jornada** concluído com sucesso.
- Build publicado na raiz de `main` no commit `08dc9fae23f683fc7cadf80ada7a54b2545da8b2`.
- Workflow **pages build and deployment** do commit publicado concluiu com sucesso.

### Preservado

- schema do cofre, IndexedDB, cifragem, autenticação e associação de browsers;
- protocolo de sincronização e tratamento conservador de conflitos;
- rotas e arquitetura responsiva;
- cálculos existentes de jornada/pausas/atividades/foco;
- Pomodoro manual.

## 2026-09-08 — logótipo animado no arranque (PR #200 / PR #201)

### Alterado

- O fallback de bootstrap passou a apresentar o `logo-mark.svg` oficial, aro rotativo, pulso discreto e halo suave.
- Tema claro/escuro mantém contraste próprio.
- `prefers-reduced-motion` remove as animações e mantém o símbolo estático.
- `role="status"`, `aria-live="polite"` e a mensagem de carregamento permanecem.
- O PR #201 garantiu que a animação continua visível durante o bootstrap React.

### Preservado

- Sem alteração a dados, repositories, rotas, schema, autenticação, cifragem, API ou sincronização.
- Sem biblioteca adicional de animação.

## 2026-09-07 — shell e menu móvel (PR #195–#199)

### Corrigido

- O mesmo botão do top bar alterna hambúrguer ↔ X e representa `mobileMenuOpen`.
- Removido o segundo X do cabeçalho do drawer.
- Alvo de toque mantido em `44 × 44 px`.
- Estados verdes residuais de `hover/focus` no iOS foram neutralizados sem remover `focus-visible`.
- Pseudo-logo/wordmark legado deixou de competir com relógio, sincronização, bloqueio e notificações.
- Top bar passou a duas colunas (`minmax(0, 1fr)` + `auto`).
- A superfície visual do controlo tornou-se transparente, mantendo apenas os traços do hambúrguer/X.
- A correção final manteve o top bar integralmente visível quando o drawer abre e colocou drawer/backdrop abaixo dos `64px` superiores.

### Acessibilidade

- `aria-expanded` e `aria-label` refletem o estado real.
- Fecho por X, backdrop, `Escape` e mudança de rota permanece.
- `forced-colors`, safe-area e `prefers-reduced-motion` continuam suportados.

### Preservado

- Sem alterações a dados, repositories, schema, cifragem, API, backend ou sincronização.

## 2026-09-07 — auditoria e sincronização móvel ↔ computador (PR #191–#194)

### Adicionado/corrigido

- Cloudflare Worker + Durable Object como backend de sincronização cifrada, mantendo GitHub Pages como frontend oficial.
- Token remoto derivado da `dataKey`, revisão remota independente e fingerprint da última base sincronizada.
- Conflito bilateral sem `last-write-wins` silencioso.
- Endpoint runtime validado por `/health` quando a variável de build não estiver disponível.
- Associação temporária de outro navegador sem recriar PIN/palavra-passe nem transportar o cofre operacional no canal de pairing.
- Reconciliação adicional ao recuperar `window.focus`.
- Estado de sincronização visível no top bar a partir do próprio `SecurityProfile.cloudSync`.
- Testes com duas réplicas lógicas cobrindo criação, edição, eliminação e conflito.

### Segurança

- PIN, palavra-passe, código de recuperação e `dataKey` original não são enviados ao Worker.
- O backend guarda ciphertext/IV, revisão, hash do token e metadados técnicos.
- Cofre remoto é validado/autenticado antes de substituir a réplica local.
- `cache: no-store`, `credentials: omit` e política de origem restrita permanecem.

## 2026-09-07 — turnos noturnos (PR #189)

### Corrigido

- Normalização de horas reais em turnos que atravessam a meia-noite.
- Entrada antecipada deixa de ser deslocada incorretamente para o dia seguinte.
- Saída após o fim planeado continua associada à manhã seguinte.
- Testes adicionados para turno `22:00–06:00` com entrada `21:00` e saída `07:00`.

## 2026-09-05 — medicação e histórico

### Adicionado

- Gesto horizontal nas tomas programadas.
- Ações **Definir** e **Eliminar** com confirmação explícita.
- Tombstone lógico `deletedAt` e versionamento de horários sem quebrar referências históricas.
- Histórico com vistas **Resumo** e **Detalhes técnicos** e paginação progressiva.
- Suporte a `prefers-reduced-motion` e `forced-colors`.

### Alterado

- **Eliminar** remove imediatamente o horário da lista ativa e neutraliza versões futuras da mesma cadeia.
- Checkpoints técnicos deixam de dominar o resumo normal, permanecendo disponíveis na vista técnica.
