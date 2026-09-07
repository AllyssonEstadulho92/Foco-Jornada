# Estado do Projeto

Atualizado em: 2026-09-07

## Estado atual

A aplicação móvel e a versão aberta no computador são a mesma PWA React/TypeScript publicada pelo GitHub Pages. Não existem dois frontends funcionais independentes nem duas implementações de regras de negócio.

A causa principal da inconsistência de dados foi confirmada como identidade/persistência por instalação:

1. cada browser/dispositivo possui `SecurityProfile` e cofre IndexedDB locais;
2. antes da sincronização remota, esses cofres eram independentes;
3. mesmo depois de existir um cofre remoto, um browser novo não conseguia abrir a mesma cópia sem receber o perfil criptográfico correspondente;
4. PR #191 introduziu Cloudflare Workers/Durable Objects para sincronização cifrada;
5. PR #192 tornou o endpoint `workers.dev` configurável e validável no perfil;
6. PR #193 adicionou associação segura de outro navegador sem recriar PIN/palavra-passe.

O PR #193 está integrado e publicado. A associação física dos dispositivos reais do utilizador continua a ser um critério obrigatório antes de declarar o problema operacional totalmente encerrado.

## Auditoria móvel ↔ web — PR #194

Foi criada `docs/MOBILE-WEB-CONSISTENCY-AUDIT.md` antes das alterações desta auditoria. A matriz confirma:

- mesmas rotas e mesmas páginas em mobile/desktop;
- mesmo `AppServicesProvider`, repositories e regras de domínio;
- mesmo `AppDatabaseSnapshot` cifrado para jornadas, pausas, atividades, foco, café, stock e medicação;
- `useWorkHoursStore` e `useNotificationStore` persistidos no `secureStorage` do mesmo cofre;
- preferências de tema/sidebar permanecem locais por serem apenas apresentação;
- sem `sessionStorage` operacional;
- sem API de negócio alternativa, endpoint antigo ou mock exclusivo por plataforma;
- API de sync usa `GET/PUT /v1/vault/:profileId` com revisão remota e `cache: no-store`;
- associação usa `PUT/GET/DELETE /v1/pair/:pairingId`;
- não foi encontrado CSS capaz de explicar `Jornada ativa` num dispositivo e `Pronto para começar` noutro: essa diferença representa estado/cofre diferente.

## Alterações implementadas no PR #194

- `SecureAppBootstrap` agenda reconciliação também em `window.focus`, reduzindo o tempo para refletir uma alteração quando o utilizador regressa à janela do computador.
- `AppTopBar` mostra o estado derivado do próprio `SecurityProfile.cloudSync`: **Sincronizado**, **Pendente**, **Pausada**, **Erro** ou **Conflito**.
- O indicador é textual/acessível e adapta a densidade no mobile sem criar outro estado de sincronização.
- `CloudSyncManager` mantém a mesma implementação de produção, mas passou a aceitar stores/cliente injetáveis para testes isolados.
- Foi adicionado teste com duas réplicas lógicas do mesmo perfil que valida criação mobile → web, edição web → mobile, eliminação mobile → web e conflito simultâneo sem sobrescrita.
- O teste inclui `secureStorage`, cobrindo a unidade persistente que contém horas/notificações.

## Qualidade do PR #194

Na execução `Qualidade` do head funcional `c9cbf54a7848d5fcda3f7b85825f8a2b230f1370`:

- instalação de dependências: aprovada;
- auditoria de dependências: aprovada;
- TypeScript/typecheck: aprovado;
- lint: aprovado;
- testes automatizados: aprovados;
- build do frontend: aprovado;
- `wrangler deploy --dry-run`: aprovado;
- smoke test de browser: aprovado;
- artefacto de build: criado;
- Workers Builds do PR: aprovado.

As alterações documentais posteriores não alteram runtime e voltam a passar pela mesma pipeline antes de integração.

## Segurança e integridade

- nenhum PIN, palavra-passe, código de recuperação ou `dataKey` é enviado ao Worker;
- o backend continua a guardar apenas o cofre cifrado e metadados técnicos;
- não houve alteração do schema operacional, cifragem, framework ou base de dados;
- não houve reset, limpeza ou migração dos dados existentes;
- conflito bilateral continua sem `last-write-wins` silencioso;
- CORS e CSP continuam limitados ao endpoint suportado;
- o service worker não cacheia a API de sincronização.

## Riscos/limitações ainda abertas

1. **Validação física:** testes automáticos não substituem telemóvel e computador reais. É necessário associar os dois browsers e confirmar os registos reais.
2. **Timezone geral:** a jornada/relatórios gerais usam o timezone do browser em vários utilitários. Se os sistemas tiverem timezones diferentes, o mesmo timestamp pode ser apresentado noutro dia/hora. Não foi feita migração temporal nesta auditoria porque poderia alterar semântica histórica.
3. **Edição simultânea:** o cofre é sincronizado como snapshot cifrado. Alterações independentes em dois dispositivos geram conflito conservador; não existe fusão granular automática.
4. **Permissões de dispositivo:** notificações do sistema e WebAuthn/passkeys são capacidades locais e não devem ser forçadas a ser idênticas entre browsers.

## Estado anterior preservado

A correção de turnos noturnos do PR #189 permanece integrada. A área de medicação mantém deslize, ações **Definir** e **Eliminar**, tombstone lógico e histórico funcional/técnico. O modo local-first continua funcional quando o serviço remoto estiver indisponível.

## Última alteração

Foi concluída a auditoria técnica de consistência móvel ↔ web e implementada a alteração mínima para melhorar convergência/observabilidade sem reconstruir a arquitetura.

## Próximo passo

1. integrar o PR #194 após os quality gates do head final;
2. confirmar publicação GitHub Pages/Workers de produção;
3. no telemóvel com os dados, confirmar estado **Sincronizado**;
4. usar **Associar outro navegador** e abrir a ligação no computador;
5. introduzir o mesmo PIN/palavra-passe;
6. validar criar, editar e eliminar nos dois sentidos;
7. testar refresh, cache limpa, fechar/reabrir, offline → reconexão e diferentes resoluções;
8. confirmar que ambos os dispositivos usam o mesmo timezone do sistema durante a validação.
