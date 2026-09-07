# Changelog

## 2026-09-07 — sincronização entre dispositivos

### Adicionado

- Cliente `CloudSyncManager` para sincronizar o `EncryptedVaultRecord` sem desencriptar os dados para transporte.
- Token remoto derivado da `dataKey` com contexto específico de sincronização e SHA-256.
- Fingerprint SHA-256 da última base sincronizada.
- Revisão remota independente com compare-and-set.
- Deteção conservadora de conflito quando móvel e computador têm alterações independentes.
- Evento de gravação local do cofre para agendar sincronização.
- Sincronização ao desbloquear, após gravações, ao regressar ao primeiro plano, ao recuperar rede e periodicamente.
- Controlo de ativação da sincronização nas definições de segurança.
- Cloudflare Worker com Durable Object isolado por `profileId`.
- `wrangler.toml` com configuração versionada do serviço remoto.
- Testes do token derivado, protocolo HTTP e rejeição de envelopes remotos incompatíveis.

### Segurança

- O Worker recebe apenas ciphertext/IV e metadados de revisão; não recebe PIN, palavra-passe, código de recuperação ou a chave AES original.
- O backend guarda apenas um hash adicional do token usado na autenticação.
- Escritas remotas exigem a revisão esperada e devolvem conflito em concorrência.
- Divergência simultânea local/remota não usa política destrutiva de “última escrita vence”.
- Respostas remotas são validadas estruturalmente antes de serem consideradas cofres válidos.
- Um cofre remoto é autenticado/desencriptado em memória e o snapshot é validado antes de qualquer substituição do cofre local.
- `connect-src` passa a autorizar a própria origem e endpoints HTTPS `workers.dev`.
- `.wrangler` e `.dev.vars*` passam a ser ignorados pelo Git.

### Qualidade

- Workflow GitHub **Qualidade** do PR #191 aprovado no commit `0ebafd13f3783f4eb08aae994d8a6987685c8250`.
- Auditoria de dependências, typecheck, lint, testes, build e smoke test concluídos com sucesso.
- Artefacto de build gerado com sucesso.

### Distribuição

- GitHub Pages continua a ser o frontend oficial.
- O workflow de publicação passa `VITE_SYNC_API_URL` a partir de uma variável do repositório.
- O check externo **Workers Builds: foco-jornada** falhou no build Cloudflare `21d899d0-3e66-4e45-9a42-3c0efef5127b`.
- O GitHub não contém a mensagem detalhada desse erro; é necessário consultar o log privado no Cloudflare e rever **Settings > Builds** antes de integrar em `main`.
- A sincronização permanece desativada em produção enquanto o Worker não publicar com sucesso e `VITE_SYNC_API_URL` não estiver definido.

## 2026-09-07

### Corrigido

- Normalização de horas reais em turnos que atravessam a meia-noite.
- Uma entrada antecipada antes da hora planeada deixa de ser deslocada incorretamente para o dia seguinte.
- Uma saída após o fim planeado continua corretamente associada à manhã seguinte.
- A interseção entre trabalho realizado e turno planeado deixa de transformar trabalho normal em horas extra ou horas não trabalhadas por erro de alinhamento temporal.

### Testes

- Adicionado caso **22:00–06:00** com entrada real às **21:00**.
- Adicionado caso **22:00–06:00** com saída real às **07:00**.
- Workflow **Qualidade** do PR #189 concluído com sucesso.
- Workflow **Qualidade** de `main` após integração concluído com sucesso.
- Build, lint, typecheck, testes e smoke test aprovados.

### Integração e publicação

- PR #189 integrado em `main`.
- Commit: `90d19791f7892e51c5baf2c27967d53e7b464b8c`.
- Workflow **Publicar Foco & Jornada** / GitHub Pages concluído com sucesso.
- A distribuição oficial permanece GitHub Pages.

### Observação operacional

- O check externo **Workers Builds: foco-jornada** da integração Cloudflare falhou no PR e no commit integrado.
- A causa não pode ser confirmada apenas a partir do GitHub, porque os detalhes estão nos logs externos do Cloudflare.
- A integração Cloudflare passou posteriormente a ter uma finalidade explícita de backend de sincronização, implementada na branch `feat/cloudflare-sync` e sujeita a nova validação.

## 2026-09-05

### Adicionado

- Gesto horizontal nas linhas de tomas programadas.
- Ação oculta **Definir** com edição de hora e quantidade.
- Ação oculta **Eliminar** com confirmação explícita.
- `MedicationScheduleService` para versionar e eliminar logicamente horários sem quebrar referências históricas.
- Campo opcional `deletedAt` em `MedicationSchedule` para tombstone auditável.
- Histórico compacto com vistas **Resumo** e **Detalhes técnicos**.
- Paginação progressiva do histórico com **Ver mais eventos / Mostrar menos**.
- Evento visual **Horário eliminado** e apresentação de versões sucessoras como **Horário alterado**.
- Diálogo responsivo com comportamento de bottom sheet em ecrãs pequenos.
- Suporte a `prefers-reduced-motion` e `forced-colors`.
- Testes do ciclo de vida, idempotência e eliminação imediata de horários.

### Alterado

- **Eliminar** passa a remover o horário imediatamente da lista de tomas em vez de o deixar visível como **Termina hoje**.
- Uma eliminação também neutraliza definições futuras da mesma cadeia (`order`), impedindo que o horário reapareça posteriormente.
- O resumo do histórico deixa de apresentar checkpoints automáticos de proteção, que permanecem consultáveis em **Detalhes técnicos**.
- `OperationalPersonalStockService` disponibiliza o histórico completo das versões de horários para construir a apresentação auditável.

### Preservado

- Menu `···`, ações Tomada/Adiar/Não tomada, correções e histórico existentes.
- Eventos de toma e movimentos de stock existentes.
- Registos técnicos dos horários eliminados, necessários para manter referências e auditoria.
- Checkpoints e cópia redundante local; apenas a apresentação padrão deixa de os expor em massa.
