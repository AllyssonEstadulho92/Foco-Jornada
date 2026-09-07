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
7. PR #194 auditou e reforçou a consistência móvel ↔ web e está integrado em `main`;
8. PR #195 introduziu a transformação hambúrguer ↔ X e foi integrado/publicado;
9. PR #196 removeu o X duplicado, corrigiu o orçamento de largura do top bar móvel e foi integrado/publicado;
10. PR #197 refina a hierarquia visual do controlo do menu para apresentar apenas o glifo, sem caixa, fundo ou moldura persistente.

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

O PR #195 alterou o botão do top bar móvel para alternar o mesmo estado `mobileMenuOpen` e transformar as três linhas do hambúrguer num **X**. O alvo de toque passou a `44 × 44 px`, o drawer manteve safe-area e o efeito respeita `prefers-reduced-motion`/`forced-colors`.

O PR #195 foi integrado em `main`. A pipeline **Qualidade** e a publicação GitHub Pages do merge concluíram com sucesso.

## Correção do shell móvel — PR #196

As capturas reais de iPhone mostraram dois problemas após a publicação do PR #195:

1. existiam dois **X** ao mesmo tempo: o hambúrguer transformado no top bar e o botão **Fechar** dentro do cabeçalho do drawer;
2. a identidade móvel ocupava largura excessiva e competia com relógio, sincronização, bloqueio e notificações.

A revisão do código confirmou ainda dois conflitos de CSS legados:

- `mobile-quick-access.css` aplica `hover/focus-visible` verde com `!important`; em navegadores móveis com estado hover persistente isso podia fazer o X parecer selecionado e o shorthand `background` podia eliminar a linha central do hambúrguer;
- `prototype-v2.css` injeta um logo e um wordmark através de `::before`/`::after` em `.mobileAppIdentity > strong`, consumindo espaço no top bar mesmo existindo um wordmark completo dentro do drawer.

Implementado no PR #196:

- removido o botão X duplicado do cabeçalho do drawer;
- o único controlo explícito de fecho visível é o mesmo botão que alterna hambúrguer ↔ X;
- o X aberto fica neutro, sem preenchimento/seleção verde;
- a linha central do hambúrguer passa a ser preservada também contra regras legadas com `!important`;
- o top bar móvel passa a grelha `minmax(0, 1fr) auto`, separando identidade e grupo de estado;
- o top bar usa o texto real compacto **Foco Jornada**, neutralizando o pseudo-logo legado; o wordmark completo permanece no drawer;
- o relógio reduz densidade em ecrãs estreitos, ocultando apenas o ícone e mantendo a hora;
- o drawer mantém safe-area, backdrop, fecho por `Escape` e mudança de rota.

O PR #196 passou nos quality gates, foi integrado em `main` e a publicação GitHub Pages concluiu com sucesso.

## Hierarquia minimalista do controlo móvel — PR #197

A validação física após o PR #196 confirmou que o único X continuava visualmente dentro de uma superfície branca. O pedido atual é manter a área funcional de toque, mas remover a aparência de botão/cartão.

Implementado no branch `ui/minimal-mobile-menu-icon` / PR #197:

- alvo funcional permanece `44 × 44 px`;
- `border`, fundo, cápsula e sombra deixam de ser visíveis no estado hambúrguer e no estado X;
- apenas os traços do glifo ficam visíveis, mantendo três comprimentos no estado fechado e X no estado aberto;
- `-webkit-tap-highlight-color: transparent` evita realce residual no iOS;
- `focus-visible` continua disponível com contorno discreto apenas para navegação por teclado;
- a zona recortada do top bar passa a corresponder ao tamanho real do controlo, sem reservar o `gap` da identidade;
- o texto da identidade fica oculto enquanto o drawer está aberto, evitando qualquer fragmento visual junto ao X;
- `forced-colors` e `prefers-reduced-motion` continuam suportados.

## Segurança e integridade

- nenhum PIN, palavra-passe, código de recuperação ou `dataKey` é enviado ao Worker;
- o backend continua a guardar apenas o cofre cifrado e metadados técnicos;
- não houve alteração do schema operacional, cifragem, framework ou base de dados;
- não houve reset, limpeza ou migração dos dados existentes;
- conflito bilateral continua sem `last-write-wins` silencioso;
- CORS e CSP continuam limitados ao endpoint suportado;
- o service worker não cacheia a API de sincronização;
- PR #195, PR #196 e PR #197 são alterações de navegação/apresentação e não alteram persistência nem sincronização.

## Riscos/limitações ainda abertas

1. **Validação física de sincronização:** testes automáticos não substituem telemóvel e computador reais. É necessário associar os dois browsers e confirmar os registos reais.
2. **Validação visual do PR #197:** confirmar no iPhone que o hambúrguer/X aparece sem caixa branca, sem moldura e sem fragmentos da identidade junto ao controlo.
3. **Android/tablet:** confirmar o mesmo comportamento entre 360 e 899 px, incluindo orientação horizontal e safe-area quando aplicável.
4. **Acessibilidade:** confirmar `focus-visible`, `forced-colors` e redução de movimento em navegação por teclado/tecnologia de apoio.
5. **Timezone geral:** a jornada/relatórios gerais usam o timezone do browser em vários utilitários. Se os sistemas tiverem timezones diferentes, o mesmo timestamp pode ser apresentado noutro dia/hora.
6. **Edição simultânea:** o cofre é sincronizado como snapshot cifrado. Alterações independentes em dois dispositivos geram conflito conservador; não existe fusão granular automática.
7. **Permissões de dispositivo:** notificações do sistema e WebAuthn/passkeys são capacidades locais e não devem ser forçadas a ser idênticas entre browsers.

## Estado anterior preservado

A correção de turnos noturnos do PR #189 permanece integrada. A área de medicação mantém deslize, ações **Definir** e **Eliminar**, tombstone lógico e histórico funcional/técnico. O modo local-first continua funcional quando o serviço remoto estiver indisponível.

## Última alteração

Aberto o PR #197 para tornar o controlo hambúrguer/X visualmente minimalista: apenas o ícone fica visível, mantendo área de toque, estados ARIA, safe-area e mecanismos de fecho existentes.

## Próximo passo

1. concluir os quality gates do PR #197;
2. corrigir qualquer regressão de typecheck, lint, testes, build ou smoke test antes de integrar;
3. integrar o PR #197 apenas com CI verde;
4. confirmar publicação GitHub Pages;
5. validar no iPhone o estado fechado e aberto sem caixa branca/moldura;
6. validar Android/tablet e viewport web abaixo de 900 px;
7. continuar a validação física da sincronização móvel ↔ computador com o mesmo perfil/cofre.
