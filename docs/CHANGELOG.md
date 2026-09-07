# Changelog

## 2026-09-07 — auditoria de consistência móvel ↔ web

### Auditado

- Confirmado que telemóvel e computador executam a mesma PWA React/TypeScript, com as mesmas rotas, páginas, repositories e regras de negócio.
- Criada matriz factual em `docs/MOBILE-WEB-CONSISTENCY-AUDIT.md` antes das correções desta fase.
- Revistos IndexedDB, `localStorage`, `sessionStorage`, Zustand, Context, hooks, services, API, endpoint, cache/PWA, ambiente e CSS responsivo.
- Confirmado que `useWorkHoursStore` e `useNotificationStore` persistem através de `secureStorage` dentro do mesmo cofre cifrado.
- Confirmado que não existe API/mocks de negócio alternativos por plataforma.
- Confirmado que a diferença **Jornada ativa** no telemóvel versus **Pronto para começar** no computador representa estado/perfil/cofre diferente e não uma ocultação CSS da mesma jornada.

### Alterado

- `SecureAppBootstrap` passa a agendar reconciliação também quando a janela recupera `focus`.
- `AppTopBar` passa a apresentar **Sincronizado**, **Pendente**, **Pausada**, **Erro** ou **Conflito** com base no próprio `SecurityProfile.cloudSync`.
- O indicador adapta a densidade ao mobile e abre diretamente as definições de sincronização.
- `CloudSyncManager` aceita dependências injetáveis para teste, mantendo `SecurityProfileStore`, `EncryptedVaultStore` e `CloudSyncClient` como defaults de produção.

### Testes

- Adicionado `cloudSyncReplication.test.ts` com duas réplicas lógicas isoladas do mesmo perfil.
- Validada criação mobile → web, edição web → mobile e eliminação mobile → web.
- Validada convergência do `secureStorage` na mesma unidade de cofre.
- Validado conflito simultâneo sem sobrescrever nenhuma das cópias divergentes.
- No head funcional do PR #194, passaram auditoria de dependências, typecheck, lint, testes, build, `wrangler deploy --dry-run`, smoke test e criação do artefacto.
- **Workers Builds: foco-jornada** do PR #194 concluiu com sucesso.

### Preservado

- Sem mudança de framework, schema operacional, IndexedDB, cifragem ou protocolo de conflito.
- Sem reset, migração destrutiva ou eliminação de registos existentes.
- GitHub Pages continua frontend oficial e Cloudflare Worker continua backend apenas de sync/pairing cifrados.
- Timezone geral não foi migrado; a dependência do timezone do browser ficou registada para decisão futura.

## 2026-09-07 — associação de browser sem recriar PIN

### Corrigido

- Um navegador sem `SecurityProfile` deixa de abrir diretamente em **Criar acesso** quando o utilizador pode já possuir um perfil noutro dispositivo.
- O ecrã inicial de um browser vazio passa a mostrar **Já tens acesso noutro dispositivo?**, reduzindo a criação acidental de perfis independentes.
- Depois de uma associação bem-sucedida, o novo browser utiliza o mesmo PIN/palavra-passe já existente e obtém o cofre através da sincronização cifrada.

### Adicionado

- `BrowserPairingManager` para criar e redimir ligações temporárias de associação.
- Ação **Associar outro navegador** em **Privacidade e acesso → Sincronização móvel ↔ computador**.
- Ligação `#pair=...` com `pairingId`, endpoint e segredo raiz aleatório de 256 bits.
- Derivação separada de chave AES-GCM e token HTTP a partir do segredo raiz.
- `SecurityManager.importPairedProfile()` para validar/importar o perfil criptográfico sem criar nova credencial nem novo `profileId`.
- Rotas `PUT`, `GET` e `DELETE /v1/pair/:pairingId` no Worker.
- Expiração fixa de 10 minutos e limpeza por alarme do Durable Object.
- Eliminação do payload temporário depois de redenção bem-sucedida.
- Testes de aceitação/rejeição da estrutura das ligações temporárias.
- Estilos responsivos e compatíveis com `forced-colors` para o novo fluxo.

### Segurança

- O PIN, a palavra-passe, o código de recuperação e a `dataKey` continuam sem ser enviados ao Worker.
- O segredo raiz de associação não é enviado ao Worker; o servidor recebe apenas um token derivado e guarda o respetivo hash.
- O `SecurityProfile` é cifrado no cliente antes do envio temporário.
- O canal de associação não duplica o cofre operacional; os dados continuam a chegar pelo protocolo normal de sincronização, depois de o mesmo PIN/palavra-passe desbloquear a chave.
- A ligação temporária deve ser tratada como segredo durante os 10 minutos de validade.
- Endpoints continuam limitados a HTTPS `workers.dev`/localhost de desenvolvimento.

### Qualidade e publicação

- Typecheck, lint, testes, build, Worker dry-run e smoke test finais do PR #193 concluídos com sucesso.
- Workers Builds do PR e de produção concluídos com sucesso.
- PR #193 integrado em `main` no commit `4e879e6d0abf578981ae09d212f25f43d17232cb`.
- GitHub Pages republicado com sucesso.
- Workflow **Qualidade** de produção concluído com sucesso.

## 2026-09-07 — endpoint runtime da sincronização

### Alterado

- `CloudSyncProfileState` passa a aceitar o endpoint público do Worker no próprio perfil.
- `CloudSyncManager` usa o endpoint do perfil antes do fallback `VITE_SYNC_API_URL`.
- A área **Privacidade e acesso** permite introduzir, validar e atualizar o endereço do Worker diretamente na aplicação.
- Uma ligação válida ativa a sincronização e reinicia a base de revisão remota se o servidor tiver mudado.
- A cópia segura passa a transportar naturalmente o endpoint juntamente com os restantes metadados do perfil.

### Segurança

- Endpoints introduzidos em runtime só são aceites em HTTPS `workers.dev` (ou localhost em desenvolvimento).
- URLs com credenciais, query string ou fragmento são rejeitadas.
- Antes de guardar, a aplicação chama `/health` e exige `ok: true` e `service: foco-jornada-sync`.
- O endpoint é configuração pública; PIN, palavra-passe, código de recuperação e `dataKey` continuam sem sair do cliente.

### Testes e publicação

- Adicionados testes de normalização/rejeição de endpoint.
- Adicionados testes de validação da identidade do serviço através de `/health`.
- PR #192 aprovado em auditoria de dependências, typecheck, lint, testes, build, `worker:check` e smoke test.
- Check **Workers Builds: foco-jornada** do PR #192 concluído com sucesso.
- PR #192 integrado em `main` no commit `15a580440575142589c577b1dd32a96d51f8326f`.
- Workers Builds de produção concluído com sucesso após a integração.
- GitHub Pages republicado com sucesso.

## 2026-09-07 — sincronização entre dispositivos

### Adicionado

- Cliente `CloudSyncManager` para sincronizar o `EncryptedVaultRecord` sem desencriptar os dados para transporte.
- Token remoto derivado da `dataKey` com contexto específico de sincronização e SHA-256.
- Fingerprint SHA-256 da última base sincronizada.
- Revisão remota independente com compare-and-set.
- Deteção conservadora de conflito quando móvel e computador têm alterações independentes.
- Evento de gravação local do cofre para agendar sincronização.
- Sincronização ao desbloquear, após gravações, ao regressar ao primeiro plano, ao recuperar rede e periodicamente.
- Reabertura controlada do runtime após receber uma cópia remota, permitindo que a interface passe a ler o cofre recebido.
- Controlo de ativação da sincronização nas definições de segurança.
- Cloudflare Worker com Durable Object isolado por `profileId`.
- `wrangler.toml` com configuração versionada do serviço remoto.
- Testes do token derivado, protocolo HTTP e rejeição de envelopes remotos incompatíveis.
- `worker:check` com `wrangler deploy --dry-run` integrado na pipeline **Qualidade**.

### Segurança

- O Worker recebe apenas ciphertext/IV e metadados de revisão; não recebe PIN, palavra-passe, código de recuperação ou a chave AES original.
- O backend guarda apenas um hash adicional do token usado na autenticação.
- Escritas remotas exigem a revisão esperada e devolvem conflito em concorrência.
- Divergência simultânea local/remota não usa política destrutiva de “última escrita vence”.
- Respostas remotas são validadas estruturalmente antes de serem consideradas cofres válidos.
- Um cofre remoto é autenticado/desencriptado em memória e o snapshot é validado antes de qualquer substituição do cofre local.
- `connect-src` passa a autorizar a própria origem e endpoints HTTPS `workers.dev`.
- `.wrangler` e `.dev.vars*` passam a ser ignorados pelo Git.

### Qualidade e distribuição

- Workflow GitHub **Qualidade** do PR #191 aprovado com auditoria de dependências, typecheck, lint, testes, build, smoke test e artefacto.
- Bundle e configuração do Worker aprovados por `wrangler deploy --dry-run`.
- PR #191 integrado em `main`.
- Workers Builds do branch de produção concluído com sucesso e Durable Object `SyncVault` publicado.
- GitHub Pages continua a ser o frontend oficial e foi republicado após a integração.

## 2026-09-07 — turnos noturnos

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
