# Arquitetura

Atualizado em: 2026-09-07

## Stack confirmada

- React 19 + TypeScript.
- Vite para desenvolvimento e build.
- Uma única PWA responsiva para telemóvel, tablet e computador.
- Cofre cifrado sobre IndexedDB para persistência operacional local/offline.
- Zustand apenas onde necessário; estado persistente funcional usa `secureStorage` dentro do mesmo cofre.
- Vitest para testes automatizados.
- GitHub Pages como frontend oficial.
- Cloudflare Worker + Durable Objects como backend de sincronização cifrada e associação temporária entre browsers.

## Princípio móvel ↔ web

Mobile e desktop **não são dois sistemas**. Ambos executam o mesmo bundle, as mesmas rotas, os mesmos componentes de página, os mesmos repositories e as mesmas regras de domínio.

```text
GitHub Pages / mesma PWA
  ├─ mobile: bottom nav + drawer + layout compacto
  └─ desktop: sidebar + layout largo
       └─ mesmo Router / Outlet
            └─ mesmo AppServicesProvider
                 └─ mesmos repositories e serviços
                      └─ AppDatabaseSnapshot cifrado
```

Diferenças permitidas são de densidade, navegação, gesto e capacidades do dispositivo. Dados e regras partilháveis não têm uma implementação alternativa por breakpoint.

## Navegação responsiva

`AppShell` mantém uma única árvore de navegação com duas apresentações:

- acima de 899 px: sidebar desktop, com controlo próprio de recolher/expandir;
- até 899 px: top bar + bottom navigation + drawer móvel.

No drawer móvel, `mobileMenuOpen` continua a ser estado local de `AppShell`; não é persistido nem sincronizado porque é apenas estado efémero de apresentação.

No PR #195, o botão do top bar deixa de ser apenas “abrir menu” e passa a alternar o mesmo estado:

```text
hambúrguer
   └─ click/tap
       └─ mobileMenuOpen = true
            ├─ drawer entra
            ├─ backdrop ativa
            ├─ aria-expanded = true
            └─ CSS transforma as três linhas em X

X
   └─ click/tap
       └─ mobileMenuOpen = false
            ├─ drawer sai
            ├─ backdrop desativa
            ├─ aria-expanded = false
            └─ CSS repõe o hambúrguer
```

Fecho por backdrop, `Escape`, mudança de rota e botão interno do drawer continua a convergir para `mobileMenuOpen = false`. O top bar é recortado enquanto o drawer está aberto para manter apenas a zona do botão acima do backdrop; o drawer respeita essa zona através de `max-width` e `safe-area`, evitando sobreposição do X.

A animação é responsabilidade de `src/styles/mobile-shell.css`: React/TypeScript controla o estado, CSS controla movimento e geometria. Não foi criada biblioteca de animação nem novo componente de estado.

## Dados e persistência

### Snapshot operacional

`AppDatabaseSnapshot` é a unidade persistente principal e inclui, entre outros:

- metadata/settings;
- journeys;
- breaks;
- activities;
- focusSessions;
- coffeeRecords;
- stockEntities;
- stockMovements;
- medicationSchedules;
- medicationDoseEvents;
- `secureStorage`.

`useWorkHoursStore` e `useNotificationStore` persistem através de `secureStorage`; por isso fazem parte do mesmo cofre cifrado e não constituem bases paralelas.

### Persistência local intencional

Existem dois IndexedDB técnicos por instalação:

- `foco-jornada-security-v1`: `SecurityProfile`, KDF, chaves embrulhadas, passkey e metadados de sync;
- `foco-jornada-vault-v1`: `EncryptedVaultRecord` cifrado com AES-GCM.

`localStorage` permanece apenas para preferências visuais/boot e seleção do perfil ativo, além de leitura durante migração legada. Não é a fonte atual dos registos operacionais. Não existe `sessionStorage` operacional.

O cofre IndexedDB é a réplica de trabalho offline. Para convergência entre instalações, a **revisão remota** do Worker é a referência de coordenação cross-device. O backend nunca se torna uma base de negócio desencriptada.

## Sincronização móvel ↔ computador

```text
AppDatabase
  └─ EncryptedVaultStore
       └─ EncryptedVaultRecord (AES-GCM no cliente)
            └─ CloudSyncManager
                 ├─ endpoint do SecurityProfile
                 │    └─ fallback: VITE_SYNC_API_URL
                 ├─ fingerprint SHA-256
                 ├─ token derivado da dataKey
                 ├─ GET /v1/vault/:profileId
                 └─ PUT /v1/vault/:profileId + expectedRevision
                      └─ Cloudflare Worker
                           └─ Durable Object SyncVault por profileId
```

### Endpoint

O endpoint vem de `SecurityProfile.cloudSync.endpoint` ou do fallback `VITE_SYNC_API_URL` do build. Um endpoint introduzido em runtime só é aceite se for HTTPS `workers.dev` (ou localhost em desenvolvimento), sem credenciais/query/hash, e se `GET /health` responder com `service: foco-jornada-sync`.

### Segurança

- o cliente envia o `EncryptedVaultRecord`, não o snapshot em plaintext;
- PIN, palavra-passe, código de recuperação e `dataKey` original não são enviados ao Worker;
- o token HTTP é derivado localmente da `dataKey` com contexto específico e SHA-256;
- o Worker guarda apenas hash do token, ciphertext, IV, revisão e metadados técnicos;
- um cofre remoto é validado estruturalmente e autenticado/desencriptado em memória antes de substituir a réplica local;
- requests de sync usam `cache: no-store`, `credentials: omit` e `referrerPolicy: no-referrer`.

### Concorrência

A revisão local do cofre e a revisão remota são independentes. Cada escrita remota exige `expectedRevision`.

Regras:

- só local mudou → push;
- só remoto mudou → pull, validação e reabertura do runtime;
- conteúdo igual → atualizar metadados de confirmação;
- ambos mudaram → conflito, sem sobrescrita automática;
- endpoint mudou → limpar base de revisão/fingerprint antes de nova reconciliação.

Não é usado `last-write-wins` silencioso.

### Gatilhos de reconciliação

A sincronização é tentada:

- no desbloqueio;
- após gravações do cofre;
- quando a rede regressa (`online`);
- quando o documento volta a `visible`;
- quando a janela recupera `focus`;
- periodicamente a cada 30 segundos.

A adição de `window.focus` no PR #194 reduz latência quando o utilizador alterna entre telemóvel e janela desktop sem introduzir WebSocket/realtime.

## Estado de sincronização na UI

`AppTopBar` lê diretamente `SecurityProfile.cloudSync`; não existe store paralelo. Estados apresentados:

- **Sincronizado**;
- **Pendente**;
- **Pausada**;
- **Erro**;
- **Conflito**.

Em ecrã largo, o texto é mostrado diretamente. Em mobile, o estado saudável é compactado para preservar espaço; erro/conflito mantêm indicação acessível e o link abre as definições. O significado não depende apenas de cor.

## Bootstrap de um navegador novo

### Problema

`SecurityProfile` é local por browser. Um browser vazio não possui `profileId`, KDF, `wrappedDataKey` nem configuração de sync e, portanto, não consegue autenticar/desencriptar um cofre remoto existente.

### Associação temporária

```text
Browser A autorizado
  └─ BrowserPairingManager.create()
       ├─ exige sync ativa + remoteRevision confirmada
       ├─ gera pairingId + segredo raiz 256 bits
       ├─ deriva chave AES e token HTTP separados
       ├─ cifra SecurityProfile
       └─ PUT /v1/pair/:pairingId

Browser B abre #pair=...
  └─ BrowserPairingBootstrap/SecurityGate
       └─ BrowserPairingManager.redeem()
            ├─ GET /v1/pair/:pairingId
            ├─ autentica/desencripta perfil
            ├─ SecurityManager.importPairedProfile()
            ├─ DELETE /v1/pair/:pairingId
            └─ pede o mesmo PIN/palavra-passe
                 └─ CloudSyncManager.reconcile()
```

A associação expira em 10 minutos. O segredo raiz permanece no fragmento `#pair=...`; o Worker recebe apenas perfil cifrado e hash do token. O cofre operacional não é duplicado no canal de associação.

A importação de cópia segura continua disponível como fallback.

## Rotas remotas

- `GET /health`: valida identidade/disponibilidade do serviço.
- `GET /v1/vault/:profileId`: obtém cofre cifrado.
- `PUT /v1/vault/:profileId`: grava cofre cifrado com compare-and-set por revisão.
- `PUT /v1/pair/:pairingId`: cria envelope temporário de associação.
- `GET /v1/pair/:pairingId`: lê envelope autenticado ainda válido.
- `DELETE /v1/pair/:pairingId`: elimina associação após redenção.

Não existe uma API REST alternativa por entidade para mobile ou desktop.

## Componentes principais

- `src/security/cloudSync.ts`: endpoint, token, fingerprint, protocolo e reconciliação. Dependências podem ser injetadas em teste sem alterar defaults de produção.
- `src/security/browserPairing.ts`: criação/redenção do canal temporário.
- `src/security/SecurityManager.ts`: perfis, credenciais, recuperação e importação de perfil associado.
- `src/security/SecurityGate.tsx` / `BrowserPairingBootstrap.tsx`: bootstrap de browser vazio/associação.
- `src/security/SecureAppBootstrap.tsx`: abertura do runtime, rehydrate e agendamento de sync.
- `src/security/SecurityContext.tsx`: sessão e operações de segurança/sync para UI.
- `src/presentation/components/AppTopBar.tsx`: estado operacional, indicador de sync e botão físico do menu móvel.
- `src/presentation/layouts/AppShell.tsx`: estado do drawer, alternância abrir/fechar, foco e sincronização dos atributos ARIA do botão móvel.
- `src/styles/mobile-shell.css`: geometria do shell móvel, drawer/backdrop e transformação visual hambúrguer ↔ X.
- `src/presentation/providers/AppServicesProvider.tsx`: fonte única dos services/repositories usados por todas as páginas.
- `cloudflare/sync-worker.js`: CORS, autenticação, validação, Durable Object, vault/pairing.
- `wrangler.toml`: configuração versionada do Worker/Durable Object/origem autorizada.

## Regras de negócio partilhadas

### Jornada/relatórios

Páginas e hooks usam os mesmos repositories e funções de domínio. `TodayReferencePage` é o mesmo componente em mobile/desktop; uma diferença como **Jornada ativa** versus **Pronto para começar** representa diferença de estado/cofre, não uma variante responsiva do componente.

### Horas de trabalho

`WorkHoursCalculatorPage` usa `calculateWorkHours()` e normalização temporal partilhada. A correção de turnos que atravessam meia-noite permanece integrada desde o PR #189.

### Medicação/stock

`MedicationsStockPage` e restantes páginas de stock usam `OperationalPersonalStockService` e serviços de horário/toma comuns. O gesto de deslize em mobile é apenas uma interação adicional; o menu `···` preserva caminho equivalente para desktop/teclado.

## Datas e timezone

Medicação/stock possuem timezone explícito em entidades/utilitários relevantes. A área geral de jornada usa em vários pontos o timezone local do browser (`Date`/`Intl`). Se dois dispositivos tiverem timezones diferentes, o mesmo instante pode ser apresentado noutro dia/hora.

Este risco foi registado no PR #194, mas **não** foi feita migração temporal automática porque poderia alterar a interpretação de histórico existente. Requer decisão/migração dedicada se for necessário fixar um timezone global de projeto.

## Cache/PWA

- `CloudSyncClient` usa `cache: no-store`.
- Workbox não mantém runtime cache da API de sincronização; o runtime cache configurado é de navegação.
- A PWA verifica atualizações ao arrancar, regressar ao primeiro plano/foco, recuperar rede e periodicamente.

Logo, o caso observado de dados presentes num dispositivo e ausentes noutro não é explicado por cache de API.

## Testes de consistência

Além dos testes existentes de endpoint/token/envelope, `cloudSyncReplication.test.ts` simula duas réplicas isoladas do mesmo perfil e valida:

- criação mobile → web;
- edição web → mobile;
- eliminação mobile → web;
- `secureStorage` dentro do mesmo cofre;
- conflito por edição simultânea sem sobrescrita.

Quality gates obrigatórios continuam a ser auditoria de dependências, typecheck, lint, testes, build frontend, `wrangler deploy --dry-run` e smoke test de browser.

Para alterações do shell móvel, acrescentar validação manual de abertura/fecho por toque, rato, teclado, `Escape`, backdrop, safe-area e breakpoints antes de declarar a UX concluída.

## Distribuição

GitHub Pages continua a distribuir o frontend. Cloudflare Workers serve apenas a API remota de sync/pairing. A arquitetura principal permanece local-first com réplica remota cifrada para convergência cross-device.

## Acessibilidade e responsividade

- mesmas rotas e conteúdo funcional em todos os breakpoints;
- navegação adapta-se entre sidebar e bottom nav/drawer;
- o controlo hambúrguer/X tem alvo de `44 × 44 px` e continua disponível por toque, rato e teclado;
- `aria-expanded` e `aria-label` refletem o estado do drawer, independentemente do efeito visual;
- fechar por `Escape`, backdrop e botão interno continua suportado;
- `prefers-reduced-motion` elimina as transições do ícone/drawer sem remover funcionalidade;
- `forced-colors` mantém as linhas do controlo através de cores de sistema;
- estado de sync tem `aria-label`/texto e não depende apenas de cor;
- dados compactados em células móveis permanecem acessíveis em editores/rotas funcionais;
- ações essenciais continuam disponíveis por toque, rato e teclado.
