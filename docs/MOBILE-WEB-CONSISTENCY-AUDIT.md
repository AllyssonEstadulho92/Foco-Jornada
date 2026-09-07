# Auditoria de consistência móvel ↔ web

Atualizado em: 2026-09-07

## Objetivo

Garantir que a aplicação instalada/aberta no telemóvel e a versão aberta no computador representam o mesmo perfil, o mesmo cofre operacional e as mesmas regras de negócio, preservando apenas diferenças justificadas de navegação, densidade e interação responsiva.

Esta matriz foi criada **antes de qualquer correção adicional desta auditoria**. O ponto de partida é `main` no commit `00ed181be0a0696b56c890204bce9d97c255d5a3`.

## Factos confirmados

1. Não existem duas aplicações funcionais independentes no repositório. Telemóvel e computador executam o mesmo frontend React/TypeScript publicado pelo GitHub Pages; o modo móvel é a mesma PWA/interface adaptada por CSS e navegação responsiva.
2. As rotas funcionais são únicas e usam o mesmo `AppShell`/`Outlet` e os mesmos componentes de página.
3. Os serviços de domínio e repositórios são criados uma única vez em `SecureAppBootstrap` e fornecidos a todas as páginas pelo mesmo `AppServicesProvider`.
4. Os dados operacionais persistentes vivem num único `AppDatabaseSnapshot` cifrado por perfil. O snapshot contém jornadas, pausas, atividades, foco, café, stock, medicação, metadados e `secureStorage`.
5. `useWorkHoursStore` e `useNotificationStore` persistem através de `secureStorage`, que em produção está ligado ao mesmo snapshot cifrado. Não constituem uma base separada por plataforma.
6. `localStorage` em produção é usado para preferências visuais e seleção do perfil ativo; o código legado apenas o lê durante migração. Não é a fonte atual dos registos operacionais.
7. Não foi encontrado uso de `sessionStorage`.
8. Existem dois IndexedDB técnicos por instalação: `foco-jornada-security-v1` para `SecurityProfile` e `foco-jornada-vault-v1` para o cofre cifrado. São isolados por browser/dispositivo.
9. A sincronização cross-device usa Cloudflare Worker + Durable Objects. O backend recebe o `EncryptedVaultRecord`, não o snapshot em texto simples.
10. O protocolo remoto usa `GET /v1/vault/:profileId` e `PUT /v1/vault/:profileId`, revisão remota, fingerprint e deteção conservadora de conflitos. O cliente usa `cache: no-store`.
11. O bootstrap de um novo browser é feito por associação temporária `PUT/GET/DELETE /v1/pair/:pairingId`; sem o mesmo `SecurityProfile`, dois browsers podem parecer a mesma aplicação mas representar perfis criptográficos diferentes.
12. O endpoint de produção vem de `SecurityProfile.cloudSync.endpoint` ou do fallback `VITE_SYNC_API_URL`. O endpoint runtime só aceita HTTPS `workers.dev` e é validado por `GET /health`.
13. O service worker não cria cache de API de sincronização. O runtime cache configurado é de navegação e usa `NetworkFirst`.
14. Não foram encontrados endpoints antigos ou mocks de negócio alternativos usados apenas no mobile ou apenas no desktop.
15. Não foram encontradas ramificações de regra de negócio baseadas em largura de ecrã. `matchMedia` é usado para tema, modo standalone e capacidades de notificação; diferenças de conteúdo funcional são tratadas por CSS/navegação, não por outro backend.

## Causa principal já confirmada

A inconsistência observada no ecrã inicial — telemóvel com jornada/durações existentes e computador sem esses registos — não pode ser explicada pelo layout: `HomeReferencePage` usa `TodayReferencePage` em ambos os tamanhos e os mesmos controllers/repositórios.

A causa confirmada foi a identidade/persistência por instalação:

- cada browser mantinha o seu próprio `SecurityProfile` e cofre local;
- um browser novo não conhecia o `profileId`/material criptográfico do telemóvel;
- sem associação ao mesmo perfil, o computador lia um cofre local diferente e por isso apresentava estado vazio;
- PRs #191–#193 adicionaram sincronização cifrada, endpoint configurável e associação segura de browsers.

A validação física do perfil real do utilizador continua pendente; não é possível concluir, só com testes de CI, que o telemóvel e o computador atuais já estão associados ao mesmo perfil.

## Matriz móvel vs web — antes das correções desta auditoria

| Área / dado | Mobile | Web/desktop | Fonte lógica | Estado da auditoria |
| --- | --- | --- | --- | --- |
| Início / jornada atual | Mesmo `TodayReferencePage` | Mesmo `TodayReferencePage` | `journeys`, `breaks`, `activities`, `focusSessions` | Código consistente; dados divergem se o perfil/cofre divergir |
| Saída prevista / turno | Mesmo cálculo e settings | Mesmo cálculo e settings | `metadata/app-settings` + domínio `WorkSchedule` | Consistente no código |
| Pausas / efetivo / resumo do dia | Mesmos hooks e domínio | Mesmos hooks e domínio | cofre cifrado | Consistente no código |
| Jornada / calendário | Mesma rota `/calendario` | Mesma rota `/calendario` | repositórios do `AppDatabase` | Consistente no código |
| Foco | Mesma rota `/foco` | Mesma rota `/foco` | `focusSessions` + jornada/atividade | Consistente no código |
| Atividades | Mesma rota `/atividades` | Mesma rota `/atividades` | `activities` | Consistente no código |
| Histórico | Mesma página, layout adaptável | Mesma página | relatórios sobre repositórios | Consistente; textos auxiliares podem condensar em ecrã pequeno |
| Relatórios / estatísticas | Mesmos serviços de relatório | Mesmos serviços | repositórios + regras partilhadas | Consistente no código |
| Horas de trabalho | Zustand persistido em `secureStorage` | Mesmo store | `snapshot.secureStorage` | Deve sincronizar com o cofre; requer teste cross-device específico |
| Notificações internas | Zustand persistido em `secureStorage` | Mesmo store | `snapshot.secureStorage` | Histórico deve sincronizar; permissão/notificação do SO é por dispositivo e intencionalmente diferente |
| Stock pessoal | Mesmo serviço | Mesmo serviço | `stockEntities` + `stockMovements` | Consistente no código |
| Medicação | Mesmo serviço/modelos | Mesmo serviço/modelos | stock + schedules + dose events + metadata | Consistente no código; UI pode usar gesto no mobile e menu no desktop |
| glo / sticks | Mesmo serviço | Mesmo serviço | stock/movimentos + `secureStorage` protegido | Consistente no código |
| Definições de negócio | Mesmo `SettingsRepository` | Mesmo `SettingsRepository` | `metadata/app-settings` | Consistente e sincronizável |
| Tema / sidebar | Preferência local | Preferência local | `localStorage` (`foco-jornada-ui-v2`) | Diferença intencional, não é dado de negócio |
| Perfil ativo | Seleção local | Seleção local | `localStorage` + SecurityProfile IndexedDB | Pode causar aparência de contas diferentes se browsers não estiverem associados |
| Passkey/biometria | Dependente do dispositivo/browser | Dependente do dispositivo/browser | WebAuthn local + perfil | Diferença de capacidade intencional |
| Endpoint de sync | Perfil associado ou env | Perfil associado ou env | `SecurityProfile.cloudSync.endpoint` / `VITE_SYNC_API_URL` | Tem de coincidir para o mesmo perfil |
| Cache API | `no-store` | `no-store` | CloudSyncClient | Não foi encontrada divergência de cache da API |
| PWA/navegação | barra inferior/drawer | sidebar | mesma tabela de navegação + mesmas rotas | Diferença de layout intencional |
| Mapa de turnos | célula mensal compacta oculta detalhes secundários; editor mantém dados | célula mais detalhada | mesmo modelo | Condensação responsiva intencional; não é perda de dados |
| Datas/horas gerais | timezone do browser em utilitários gerais | timezone do browser | `Date`/`Intl(pt-PT)` | Risco latente se os dispositivos usarem timezones diferentes |
| Medicação/stock temporal | timezone explícito por entidade/Europe-Lisbon onde aplicável | igual | utilitários zoned | Mais determinístico que a área geral de jornada |

## Auditoria de APIs e backend

### API de sincronização

- `GET /health`: valida a identidade `foco-jornada-sync`.
- `GET /v1/vault/:profileId`: lê a cópia cifrada atual.
- `PUT /v1/vault/:profileId`: grava somente se `expectedRevision` coincidir com a revisão remota.
- `PUT/GET/DELETE /v1/pair/:pairingId`: canal temporário de associação de browser.

Não existe uma REST API separada para jornadas, pausas ou medicação. O Worker guarda o cofre cifrado como unidade; as regras de negócio continuam no cliente partilhado.

### Concorrência

- só local alterou → `push`;
- só remoto alterou → validação criptográfica + `pull`;
- ambos alteraram → conflito, sem `last-write-wins` silencioso;
- revisão remota é separada da revisão local do IndexedDB.

Isto preserva dados, mas significa que edição verdadeiramente simultânea em dois dispositivos pode exigir intervenção em vez de fusão automática.

## Auditoria de estado/persistência

### Fonte operacional

`AppDatabaseSnapshot` é a unidade persistente comum. O cofre local é uma réplica offline cifrada; para convergência entre dispositivos, a revisão do Worker é a referência de coordenação cross-device.

### Estado global

- Zustand de UI: apenas tema/sidebar, local e não sincronizado por decisão de UX.
- Zustand de horas e notificações: persistido dentro do `secureStorage` cifrado, portanto integra o mesmo cofre sincronizado.
- Context de serviços: único, sem implementação por plataforma.
- Context de segurança: único; expõe sessão, endpoint, estado de sync e associação.

## Auditoria de autenticação/identidade

O projeto não usa conta OAuth, `refreshToken`, tenant ou sessão de backend convencional.

A identidade operacional é:

- `SecurityProfile.id` (`profileId`);
- posse da `dataKey` protegida pelo PIN/palavra-passe;
- token de sincronização derivado da `dataKey` e `profileId`.

Dois browsers só representam a mesma identidade se tiverem o mesmo perfil criptográfico. Criar outro PIN/perfil no computador cria outra identidade local, mesmo que a interface tenha o mesmo nome.

## Auditoria de ambiente

- Frontend oficial: GitHub Pages.
- Backend de sync: Cloudflare Worker `foco-jornada`.
- Origem autorizada no Worker: `https://allyssonestadulho92.github.io`.
- Build de Pages injeta `VITE_SYNC_API_URL` a partir de variável de repositório quando configurada.
- Fallback por perfil permite usar o endpoint validado mesmo sem variável de build.
- Não foram encontrados segredos privados hardcoded no cliente nesta revisão.

## Auditoria responsiva

Foram pesquisados `display:none`, media queries, shell móvel, sidebar recolhida, overflow e elementos compactados.

Constatações:

- mobile e desktop não trocam de componente de página por largura;
- a navegação móvel e a sidebar desktop apontam para as mesmas rotas;
- o CSS móvel contém correção explícita para impedir que o estado `sidebarCollapsed` esconda labels do drawer/barra inferior;
- existem ocultações de texto auxiliar, cabeçalhos e detalhes compactos em alguns breakpoints;
- no mapa de turnos, horário/pausa/extra deixam de caber na célula mensal móvel, mas permanecem no editor do dia;
- não foi identificada uma regra CSS capaz de explicar o caso observado de `Jornada ativa` no telemóvel versus `Pronto para começar` no computador. Essa diferença vem do estado/dados lidos.

## Riscos ainda encontrados

### R1 — Freshness quando uma janela desktop recupera foco

A sincronização é disparada após gravações locais, `online`, `visibilitychange` e a cada 30 segundos. Uma janela que permaneça `visible` mas recupere apenas foco pode aguardar o próximo ciclo. É uma latência de convergência, não uma fonte de dados diferente.

**Correção mínima recomendada:** agendar reconciliação também no evento `window.focus`, sem introduzir WebSocket/realtime.

### R2 — Cobertura automatizada ainda não prova o fluxo completo entre duas réplicas

Existem testes do token, endpoint, `/health`, envelopes e PUT, mas não um teste de integração com duas réplicas lógicas do mesmo perfil a executar sequência criar → sincronizar → editar → sincronizar → eliminar → sincronizar.

**Correção recomendada:** tornar dependências do `CloudSyncManager` injetáveis apenas para teste e criar uma simulação de dois dispositivos com remote revision realista.

### R3 — Estado de sincronização pouco visível fora de Definições

Erro/conflito e hora da última sincronização existem no perfil, mas a informação detalhada está concentrada em **Definições → Privacidade e acesso**. O utilizador pode comparar mobile/web sem perceber imediatamente que uma das réplicas está pendente ou em conflito.

**Correção mínima recomendada:** indicador discreto e acessível no top bar, sem duplicar regras nem criar estado paralelo.

### R4 — Timezone geral depende do ambiente do browser

A área geral de jornada usa `Date`/`Intl` no timezone do dispositivo. Se telemóvel e computador tiverem zonas horárias diferentes, o mesmo timestamp pode cair em hora/dia local diferentes. Não existe atualmente um timezone global explícito em `AppSettings`.

**Decisão nesta auditoria:** não migrar datas nem alterar a semântica histórica sem especificação/migração dedicada. Registar o risco e validar que os dispositivos reais usam a mesma zona durante os testes.

## Alteração mínima proposta após esta matriz

1. adicionar sincronização ao `window.focus`;
2. adicionar um estado de sincronização visível no top bar usando o `SecurityProfile.cloudSync` já existente;
3. acrescentar testes de integração de convergência com duas réplicas lógicas do mesmo perfil;
4. não alterar schema de negócio, framework, base de dados nem cifragem;
5. não apagar, migrar ou resetar dados existentes;
6. manter conflito conservador em edições simultâneas;
7. atualizar os cinco documentos operacionais após os quality gates.

## Critérios de aceitação

Automatizáveis:

- duas réplicas com o mesmo perfil convergem após criação, edição e eliminação sequenciais;
- uma réplica que só recebeu alteração remota faz `pull` e valida o snapshot;
- edição concorrente produz conflito sem sobrescrever nenhuma cópia;
- endpoint/requests continuam sem cache e sem envio de credenciais do browser;
- UI mostra estado textual de sincronização sem depender apenas de cor;
- typecheck, lint, testes, build, Worker dry-run e smoke test passam.

Obrigatoriamente manuais em hardware/browser real:

- associação telemóvel → computador com o mesmo PIN/palavra-passe;
- criar/editar/eliminar nos dois sentidos;
- fechar/reabrir, refresh e cache limpa;
- offline → reconexão;
- resoluções móvel/tablet/desktop;
- confirmar timezone do sistema e ausência de dados ocultos por breakpoint.
