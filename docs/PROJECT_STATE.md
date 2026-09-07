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
6. PR #193 adicionou associação segura de outro navegador sem recriar PIN/palavra-passe;
7. PR #194 auditou e reforçou a consistência móvel ↔ web e está integrado em `main`.

A associação física dos dispositivos reais do utilizador continua a ser um critério obrigatório antes de declarar o problema operacional de sincronização totalmente encerrado.

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

O PR #194 foi integrado em `main` em 2026-09-07.

## Menu hambúrguer ↔ X — PR #195

Foi aberta a alteração `ui/hamburger-morph` para tornar o mesmo controlo de menu coerente entre a PWA instalada no telemóvel e a versão web responsiva.

Implementado:

- o botão do top bar passa a alternar abrir/fechar o drawer em vez de apenas abrir;
- o estado visual usa a classe já existente `appShellMobileMenuOpen`, sem novo store ou estado duplicado;
- o hambúrguer é desenhado em CSS com três linhas de comprimentos progressivos e transforma-se num **X** por `transform`/`transition`;
- o alvo de toque passa a `44 × 44 px`;
- o botão permanece visível e clicável acima do backdrop enquanto o drawer está aberto;
- o resto do top bar fica recortado durante o drawer para não escapar ao escurecimento;
- o drawer respeita uma zona lateral reservada ao botão, incluindo `safe-area`;
- `aria-expanded` e `aria-label` acompanham o estado real do menu;
- continuam suportados fecho por backdrop, `Escape` e botão interno do drawer;
- `prefers-reduced-motion` remove a animação e `forced-colors` mantém as linhas legíveis.

A sidebar desktop acima de 899 px não foi alterada.

## Segurança e integridade

- nenhum PIN, palavra-passe, código de recuperação ou `dataKey` é enviado ao Worker;
- o backend continua a guardar apenas o cofre cifrado e metadados técnicos;
- não houve alteração do schema operacional, cifragem, framework ou base de dados;
- não houve reset, limpeza ou migração dos dados existentes;
- conflito bilateral continua sem `last-write-wins` silencioso;
- CORS e CSP continuam limitados ao endpoint suportado;
- o service worker não cacheia a API de sincronização;
- o PR #195 é exclusivamente de navegação/apresentação e não toca na persistência nem na sincronização.

## Riscos/limitações ainda abertas

1. **Validação física de sincronização:** testes automáticos não substituem telemóvel e computador reais. É necessário associar os dois browsers e confirmar os registos reais.
2. **Validação visual do PR #195:** deve ser confirmada em iPhone/Android, tablet e viewport web inferior a 900 px, incluindo safe-area, modo escuro, `forced-colors` e redução de movimento.
3. **Timezone geral:** a jornada/relatórios gerais usam o timezone do browser em vários utilitários. Se os sistemas tiverem timezones diferentes, o mesmo timestamp pode ser apresentado noutro dia/hora.
4. **Edição simultânea:** o cofre é sincronizado como snapshot cifrado. Alterações independentes em dois dispositivos geram conflito conservador; não existe fusão granular automática.
5. **Permissões de dispositivo:** notificações do sistema e WebAuthn/passkeys são capacidades locais e não devem ser forçadas a ser idênticas entre browsers.

## Estado anterior preservado

A correção de turnos noturnos do PR #189 permanece integrada. A área de medicação mantém deslize, ações **Definir** e **Eliminar**, tombstone lógico e histórico funcional/técnico. O modo local-first continua funcional quando o serviço remoto estiver indisponível.

## Última alteração

Aberto o PR #195 para transformar o menu hambúrguer em **X** com animação CSS e permitir que o mesmo botão abra e feche o drawer, preservando a arquitetura responsiva única.

## Próximo passo

1. aguardar os quality gates do PR #195;
2. corrigir qualquer regressão de typecheck, lint, testes, build ou smoke test antes de integrar;
3. validar manualmente o gesto hambúrguer → X → hambúrguer em telemóvel, tablet e web responsiva;
4. integrar o PR #195 e confirmar publicação GitHub Pages;
5. continuar a validação física da sincronização móvel ↔ computador com o mesmo perfil/cofre;
6. testar refresh, cache limpa, fechar/reabrir, offline → reconexão e diferentes resoluções;
7. confirmar que ambos os dispositivos usam o mesmo timezone do sistema durante a validação de sincronização.
