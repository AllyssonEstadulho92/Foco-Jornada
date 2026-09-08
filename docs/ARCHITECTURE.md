# Arquitetura

Atualizado em: 2026-09-08

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

O botão do top bar representa diretamente esse estado:

```text
hambúrguer
   └─ click/tap
       └─ mobileMenuOpen = true
            ├─ drawer entra abaixo do top bar
            ├─ backdrop ativa abaixo do top bar
            ├─ top bar permanece visível
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

Após o PR #196, existe **um único X visível**: o próprio controlo hambúrguer transformado. O cabeçalho do drawer mantém apenas o `BrandLockup`; não possui um segundo botão de fecho. Fecho por backdrop, `Escape` e mudança de rota continua a convergir para `mobileMenuOpen = false`.

Os PR #197 e #198 procuraram remover a superfície branca residual do controlo mantendo apenas a zona do X acima do backdrop. A validação física posterior mostrou um efeito estrutural indesejado: o recorte do top bar fazia desaparecer identidade, relógio, sincronização, bloqueio e notificações durante o estado aberto.

A hierarquia atual corrige esse ponto: o top bar é uma camada persistente com `z-index` superior ao drawer/backdrop; não é recortado nem torna a identidade invisível. Drawer e backdrop começam abaixo da altura do top bar (`64px`), pelo que a navegação lateral deixa de competir pela mesma faixa vertical. O menu continua modal em relação ao conteúdo e bottom navigation, mas não substitui a barra superior da aplicação.

A animação é responsabilidade de `src/styles/mobile-shell.css`: React/TypeScript controla o estado, CSS controla movimento e geometria. Não foi criada biblioteca de animação nem novo componente de estado.

### Hierarquia visual do controlo móvel

O controlo do menu mantém duas dimensões distintas:

- **área funcional:** `44 × 44 px`, adequada a toque e acessibilidade;
- **área visual:** apenas os traços do hambúrguer ou do X.

A superfície do botão é transparente: sem `border`, fundo, cápsula ou sombra persistente. Em toque, `-webkit-tap-highlight-color: transparent` evita realce residual no iOS. Em teclado, `:focus-visible` apresenta um contorno discreto, sem alterar a geometria normal do ícone.

A linha central continua desenhada com `background-image`, e as linhas superior/inferior continuam em `::before`/`::after`. No estado aberto, a linha central desaparece e os dois pseudo-elementos rodam para formar o X. Em `forced-colors`, os traços usam `ButtonText`; com `prefers-reduced-motion`, as transições são removidas.

### Orçamento de largura do top bar móvel

Em mobile, o top bar usa duas colunas:

```css
grid-template-columns: minmax(0, 1fr) auto;
```

- coluna 1: botão menu + identidade textual compacta;
- coluna 2: relógio + indicador de sincronização + bloqueio + notificações.

O grupo operacional usa largura intrínseca (`auto`/`max-content`) e não é comprimido pela marca. A identidade pode encolher e aplicar ellipsis. Em ecrãs estreitos, o relógio mantém a hora e pode ocultar apenas o ícone.

O estado aberto preserva esta mesma grelha: não existe `clip-path` que reduza a barra ao botão, nem `visibility: hidden` aplicado à identidade. A hierarquia entre as camadas é feita por `z-index` e pela posição vertical do drawer/backdrop, não pela remoção de conteúdo do top bar.

`prototype-v2.css` mantém regras históricas que desenham um pseudo-logo/wordmark em `.mobileAppIdentity > strong`. A camada final `mobile-shell.css` neutraliza esses pseudo-elementos apenas no top bar móvel. O wordmark completo continua disponível no cabeçalho do drawer e na sidebar desktop.

`mobile-quick-access.css` contém regras históricas de `hover/focus-visible` com `!important`. Para evitar estados verdes persistentes em browsers móveis e impedir que o shorthand `background` remova a linha central do hambúrguer, `mobile-shell.css` redefine explicitamente `background-color`, `background-image`, `background-position`, `background-repeat` e `background-size` com prioridade final no controlo móvel.

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
- `src/presentation/layouts/AppShell.tsx`: estado do drawer, alternância abrir/fechar, reposição de foco e atributos ARIA do botão móvel.
- `src/styles/mobile-shell.css`: camada final de geometria do shell móvel, top bar persistente, orçamento de largura, hierarquia visual do controlo, drawer/backdrop abaixo da barra e transformação hambúrguer ↔ X.
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

Para alterações do shell móvel, acrescentar validação manual de abertura/fecho por toque, rato, teclado, `Escape`, backdrop, safe-area, estados de foco/hover e breakpoints antes de declarar a UX concluída. Em particular, o estado aberto deve preservar integralmente o top bar e posicionar drawer/backdrop abaixo dele.

## Distribuição

GitHub Pages continua a distribuir o frontend. Cloudflare Workers serve apenas a API remota de sync/pairing. A arquitetura principal permanece local-first com réplica remota cifrada para convergência cross-device.

## Acessibilidade e responsividade

- mesmas rotas e conteúdo funcional em todos os breakpoints;
- navegação adapta-se entre sidebar e bottom nav/drawer;
- o controlo hambúrguer/X tem alvo funcional de `44 × 44 px`, mas sem superfície visual persistente;
- existe um único X visível quando o drawer abre;
- o top bar permanece integralmente visível no estado aberto: identidade, hora, sync, bloqueio e notificações não são removidos nem recortados;
- drawer e backdrop começam abaixo da barra superior, mantendo uma hierarquia previsível entre navegação global e conteúdo modal;
- `aria-expanded` e `aria-label` refletem o estado do drawer, independentemente do efeito visual;
- fechar por `Escape`, backdrop e o próprio X continua suportado;
- a identidade textual pode encolher sem empurrar relógio/sync/bloqueio/notificações;
- `focus-visible` mantém indicação de foco para teclado sem reintroduzir uma caixa branca permanente;
- `prefers-reduced-motion` elimina as transições do ícone/drawer sem remover funcionalidade;
- `forced-colors` mantém as linhas do controlo através de cores de sistema;
- estado de sync tem `aria-label`/texto e não depende apenas de cor;
- dados compactados em células móveis permanecem acessíveis em editores/rotas funcionais;
- ações essenciais continuam disponíveis por toque, rato e teclado.

## Bootstrap visual de arranque

Antes da montagem do React existe um fallback estático em `src/index.html`. Esse fallback é responsável apenas por comunicar que a aplicação está a arrancar e por mostrar erros de bootstrap através de `src/boot.ts`.

No PR #200, o fallback passa a reutilizar `logo-mark.svg` e aplica animações CSS locais ao estado de carregamento:

- aro rotativo em torno do símbolo;
- pulso discreto do próprio logótipo;
- halo suave sem alterar layout ou bloquear interação;
- variantes de contraste para tema claro/escuro;
- `prefers-reduced-motion` desativa movimento e mantém o símbolo estático.

Esta camada não depende de React, não cria store, não lê dados operacionais e não participa em autenticação ou sincronização. O workflow `deploy-pages.yml` continua a executar `npm run build` e a publicar o `dist` resultante na raiz de `main`, pelo que a versão de GitHub Pages deriva sempre de `src/index.html`.
