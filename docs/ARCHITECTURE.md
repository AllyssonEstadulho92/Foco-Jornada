# Arquitetura

Atualizado em: 2026-09-07

## Stack confirmada

- React 19 + TypeScript.
- Vite para desenvolvimento e build.
- Cofre cifrado sobre IndexedDB para persistência operacional local.
- Vitest para testes automatizados.
- GitHub Pages como frontend oficial.
- Cloudflare Worker + Durable Objects como backend de sincronização cifrada e associação temporária entre browsers.

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

## Bootstrap de um navegador novo

### Problema arquitetural

`SecurityProfile` e a seleção ativa são locais a cada browser. Um browser vazio não possui `profileId`, KDF, `wrappedDataKey` nem configuração de sincronização. Logo, embora o cofre cifrado exista no Worker, esse browser não consegue autenticá-lo/desencriptá-lo apenas com um formulário de PIN vazio.

### Fluxo de associação temporária

```text
Browser A já autorizado
  └─ SecuritySettingsPanel
       └─ BrowserPairingManager.create()
            ├─ exige cloudSync ativa + remoteRevision confirmada
            ├─ gera pairingId aleatório
            ├─ gera segredo raiz de 256 bits
            ├─ deriva chave AES de associação
            ├─ deriva token HTTP separado
            ├─ cifra SecurityProfile
            └─ PUT /v1/pair/:pairingId
                 └─ Durable Object SyncVault (namespace pair:)
                      ├─ ciphertext temporário
                      ├─ hash do token
                      └─ expiresAt + alarm (10 min)

Ligação #pair=... aberta no Browser B
  └─ SecurityGate
       └─ BrowserPairingManager.redeem()
            ├─ GET /v1/pair/:pairingId
            ├─ autentica/desencripta SecurityProfile
            ├─ SecurityManager.importPairedProfile()
            ├─ DELETE /v1/pair/:pairingId
            └─ pede o mesmo PIN/palavra-passe
                 └─ SecureAppBootstrap
                      └─ CloudSyncManager.reconcile()
                           └─ recebe e valida EncryptedVaultRecord remoto
```

O fragmento `#pair=...` contém endpoint, `pairingId` e segredo raiz. Fragmentos não fazem parte do pedido HTTP normal da página. O segredo raiz não é enviado ao Worker; dele são derivados localmente materiais diferentes para cifragem e autenticação.

O payload temporário contém apenas o `SecurityProfile` necessário para bootstrap, já cifrado pela chave de associação. O cofre de dados não é duplicado nesse canal: depois do mesmo PIN/palavra-passe desbloquear a `dataKey`, o browser usa a sincronização normal para descarregar o cofre remoto.

### Regras de segurança da associação

- segredo raiz aleatório de 256 bits;
- chave de cifragem e token HTTP derivados com contextos distintos;
- Worker armazena apenas ciphertext, hash do token e validade;
- associação expira em 10 minutos;
- redenção bem-sucedida elimina o payload remoto;
- alarme do Durable Object elimina associações não usadas após expiração;
- endpoint permanece restrito a HTTPS `workers.dev`/localhost de desenvolvimento;
- o PIN/palavra-passe nunca é enviado no fluxo de associação;
- perfis independentes não são fundidos.

### UX de browser vazio

Quando `profiles.length === 0`, `SecurityGate` abre **Já tens acesso noutro dispositivo?** em vez de **Criar acesso**. O utilizador pode:

- abrir/colar uma ligação temporária;
- importar uma cópia segura;
- criar um perfil novo apenas por escolha explícita.

## Rotas remotas

### `GET /health`

Confirma identidade e disponibilidade do serviço antes de guardar um endpoint runtime.

### `GET /v1/vault/:profileId`

Lê a última cópia cifrada. Exige `Authorization: Bearer <token derivado>`.

### `PUT /v1/vault/:profileId`

Grava uma nova cópia cifrada quando `expectedRevision` coincide com a revisão remota atual. Divergência devolve conflito e não grava.

### `PUT /v1/pair/:pairingId`

Cria um envelope temporário cifrado de associação. Exige token aleatório derivado do segredo raiz. TTL fixo: 10 minutos.

### `GET /v1/pair/:pairingId`

Lê o envelope temporário quando o token apresentado corresponde ao hash guardado e a associação ainda não expirou.

### `DELETE /v1/pair/:pairingId`

Remove a associação depois de o novo browser autenticar e desencriptar o perfil recebido.

## Componentes principais

### `src/security/cloudSync.ts`

Normaliza/valida endpoint, deriva autenticação, calcula fingerprints, implementa cliente HTTP, reconciliação e deteção de conflitos.

### `src/security/browserPairing.ts`

Gera/valida ligações temporárias, deriva material criptográfico separado para autenticação/cifragem, cifra/desencripta o `SecurityProfile` e coordena PUT/GET/DELETE das associações.

### `src/security/SecurityManager.ts`

Mantém criação/desbloqueio/recuperação local e passa a validar/importar um `SecurityProfile` associado sem criar nova credencial nem novo `profileId`.

### `src/security/SecurityGate.tsx`

Distingue browser vazio de utilizador novo. Num browser sem perfil apresenta associação/importação antes da criação de novo acesso e processa automaticamente ligações `#pair=...`.

### `src/security/SecurityContext.tsx`

Expõe ao UI estado, endpoint, configuração de sincronização e criação de associação temporária.

### `src/security/SecuritySettingsPanel.tsx`

Permite validar/atualizar o endpoint, gerir sincronização e gerar/partilhar a ligação temporária para outro browser.

### `src/security/SecureAppBootstrap.tsx`

Reconcilia antes de abrir a base, agenda sincronizações em runtime e reabre o runtime após um `pull` remoto.

### `cloudflare/sync-worker.js`

Valida origem, autenticação, payload e revisão. Usa o mesmo Durable Object `SyncVault`, com nomes distintos para cofres (`profileId`) e associações (`pair:<pairingId>`), sem introduzir nova classe/migração de Durable Object.

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
- Associação de browser possui formulário utilizável por teclado, toque e rato.
- Importação de cópia segura permanece disponível como alternativa.
- Ações destrutivas e estados de erro continuam textuais.
- `forced-colors` é preservado na nova área de associação.
