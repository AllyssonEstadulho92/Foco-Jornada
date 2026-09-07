# Arquitetura

Atualizado em: 2026-09-07

## Stack confirmada

- React 19 + TypeScript.
- Vite para desenvolvimento e build.
- Cofre cifrado sobre IndexedDB para persistência operacional local.
- Vitest para testes automatizados.
- GitHub Pages como frontend oficial.
- Cloudflare Worker + Durable Objects como backend de sincronização cifrada.

## Sincronização móvel ↔ computador

```text
AppDatabase
  └─ EncryptedVaultStore
       └─ EncryptedVaultRecord (AES-GCM no cliente)
            └─ CloudSyncManager
                 ├─ endpoint do SecurityProfile
                 │    └─ fallback: VITE_SYNC_API_URL
                 ├─ SHA-256 fingerprint do cofre cifrado
                 ├─ token derivado da dataKey
                 ├─ GET /health
                 ├─ GET /v1/vault/:profileId
                 └─ PUT /v1/vault/:profileId + expectedRevision
                      └─ Cloudflare Worker
                           └─ Durable Object SyncVault por profileId
```

### Localização e validação do endpoint

O endpoint pode vir de `SecurityProfile.cloudSync.endpoint`. Se não existir, o cliente tenta `VITE_SYNC_API_URL` injetado no build.

Um endpoint introduzido pela interface é tratado como configuração pública, não como segredo. A aplicação só aceita HTTPS em `workers.dev` (ou localhost em desenvolvimento), rejeita credenciais, query string e fragmentos e chama `GET /health`. A configuração só é guardada quando a resposta identifica explicitamente `foco-jornada-sync`.

O endpoint guardado faz parte do `SecurityProfile` e, por consequência, acompanha a cópia segura do perfil para o segundo dispositivo.

### Segurança da sincronização

O backend não recebe o snapshot em texto simples. O cliente envia o `EncryptedVaultRecord` já protegido por AES-GCM. A `dataKey` original permanece no dispositivo e só existe em memória enquanto o perfil está desbloqueado.

O token HTTP é derivado localmente da `dataKey` com contexto próprio de sincronização e SHA-256. O Worker guarda apenas um segundo hash do token apresentado. O armazenamento remoto contém ciphertext, IV, revisão e metadados técnicos, não PIN, palavra-passe, código de recuperação nem a chave AES original.

Antes de substituir o cofre local por uma cópia remota, o cliente valida o envelope e autentica/desencripta o snapshot em memória com a chave do perfil.

### Concorrência e conflitos

A revisão local do `EncryptedVaultRecord` e a revisão remota são independentes. O Worker só aceita uma escrita quando `expectedRevision` coincide com a revisão remota atual. Cada `profileId` usa um Durable Object próprio, serializando as operações desse perfil.

O `SecurityProfile.cloudSync` guarda:

- `enabled`;
- `endpoint` opcional;
- última revisão remota confirmada;
- fingerprint do último cofre sincronizado;
- hora da última sincronização;
- último estado/erro.

Regras:

- só local mudou → enviar;
- só remoto mudou → validar, receber e reabrir `AppDatabase`;
- conteúdo igual → atualizar metadados;
- ambos mudaram → conflito, sem sobrescrita automática;
- endpoint mudou → limpar revisão/fingerprint remotas antes da nova reconciliação.

A sincronização é tentada no desbloqueio, após gravações locais, no regresso ao primeiro plano, quando a rede regressa e periodicamente. Falhas remotas não anulam gravações locais.

### Primeiro emparelhamento

Dois dispositivos só sincronizam automaticamente se representarem o mesmo perfil criptográfico. O dispositivo de referência valida/ativa o endpoint e exporta a cópia segura. O segundo dispositivo importa essa cópia, recebendo `profileId`, material de chave protegido, cofre e configuração do endpoint.

Perfis criados separadamente não são fundidos automaticamente.

## Rotas remotas

### `GET /health`

Confirma identidade e disponibilidade do serviço antes de guardar um endpoint runtime.

### `GET /v1/vault/:profileId`

Lê a última cópia cifrada. Exige `Authorization: Bearer <token derivado>`.

### `PUT /v1/vault/:profileId`

Grava uma nova cópia cifrada quando `expectedRevision` coincide com a revisão remota atual. Divergência devolve conflito e não grava.

## Componentes principais

### `src/security/cloudSync.ts`

Normaliza/valida endpoint, deriva autenticação, calcula fingerprints, implementa cliente HTTP, reconciliação e deteção de conflitos.

### `src/security/SecurityContext.tsx`

Expõe ao UI estado, endpoint, configuração e ativação/desativação da sincronização.

### `src/security/SecuritySettingsPanel.tsx`

Permite validar/atualizar o endpoint e apresenta o estado da sincronização em **Privacidade e acesso**.

### `src/security/SecureAppBootstrap.tsx`

Reconcilia antes de abrir a base, agenda sincronizações em runtime e reabre o runtime após um `pull` remoto.

### `cloudflare/sync-worker.js`

Valida origem, autenticação, payload e revisão; delega cada perfil ao Durable Object `SyncVault`.

### `wrangler.toml`

Define Worker, binding Durable Object, migração da classe `SyncVault`, `workers.dev` e origem GitHub Pages autorizada.

## Fluxo de horas de trabalho

```text
WorkHoursCalculatorPage
  └─ calculateWorkHours()
       ├─ normalização temporal
       ├─ pausas planeadas/reais
       ├─ ocorrências/ausências
       ├─ interseção com turno planeado
       └─ trabalhadas / não trabalhadas / extra / saldo
```

Turnos que atravessam a meia-noite são representados numa linha temporal contínua. A normalização escolhe a representação civil mais próxima do intervalo planeado, preservando entradas antecipadas e saídas tardias. A correção está em `main` desde o PR #189.

## Fluxo de medicação

```text
MedicationsStockPage
  ├─ MedicationDoseSwipeActions
  ├─ MedicationScheduleActionDialog
  └─ OperationalPersonalStockService
       └─ MedicationScheduleService
            └─ AppDatabase.medicationSchedules
```

A eliminação de horários continua lógica através de `deletedAt`/`effectiveUntil`, preservando referências históricas. O menu `···` permanece como alternativa acessível ao gesto horizontal.

## Dados e persistência

A sincronização não altera o schema de negócio do snapshot. Os metadados `cloudSync` pertencem ao `SecurityProfile`, separado das tabelas operacionais.

O cofre local continua a ser a fonte de trabalho durante a utilização. O remoto funciona como cópia coordenada entre instalações, não como base desencriptada central.

## Distribuição e qualidade

GitHub Pages continua a distribuir o frontend. Cloudflare Workers serve apenas a API remota. `VITE_SYNC_API_URL` continua suportado para configuração automática; o endpoint por perfil é fallback operacional quando a variável de build estiver ausente.

Quality gates obrigatórios: auditoria de dependências, typecheck, lint, testes, build frontend, `wrangler deploy --dry-run` e smoke test de browser.

## Acessibilidade e responsividade

- Controlo de sincronização usa texto e estado legível, sem depender apenas de cor.
- Campo do endpoint usa input de URL compatível com teclado móvel.
- Ações continuam disponíveis por teclado/rato/toque.
- `prefers-reduced-motion` e `forced-colors` continuam preservados nas áreas já suportadas.
