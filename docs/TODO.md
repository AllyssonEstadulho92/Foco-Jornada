# TODO

Atualizado em: 2026-09-07

## P0 — Sincronização móvel e computador

- [x] Confirmar que o desalinhamento resultava de cofres locais independentes por dispositivo.
- [x] Definir Cloudflare Workers como backend de sincronização, mantendo GitHub Pages como frontend oficial.
- [x] Versionar `wrangler.toml` e Worker com Durable Object por perfil.
- [x] Manter o payload remoto cifrado; não enviar PIN, palavra-passe, código de recuperação ou `dataKey` original.
- [x] Derivar token de sincronização com contexto próprio e guardar apenas hash no backend.
- [x] Separar revisão remota da revisão local do cofre.
- [x] Implementar fingerprint da última base sincronizada e deteção de conflito bilateral.
- [x] Interromper sincronização sem sobrescrita quando local e remoto divergem em simultâneo.
- [x] Validar a estrutura e autenticação criptográfica do cofre remoto antes de o aceitar.
- [x] Reabrir o runtime após receber uma cópia remota para refletir os dados na interface.
- [x] Disparar sincronização após gravações locais, regresso ao primeiro plano, recuperação de rede e por intervalo.
- [x] Integrar PR #191 em `main` e publicar backend/frontend.
- [x] Criar fallback de configuração do endpoint no próprio perfil.
- [x] Validar endpoint runtime como HTTPS `workers.dev`, sem credenciais/query/hash.
- [x] Validar `/health` e a identidade `foco-jornada-sync` antes de guardar/ativar a ligação.
- [x] Integrar PR #192 em `main` e confirmar Workers Builds/GitHub Pages.
- [x] Confirmar em dispositivo real que um browser novo não conhece o `SecurityProfile` de outro browser.
- [x] Alterar browser vazio para **Já tens acesso noutro dispositivo?**.
- [x] Implementar ligação temporária de associação com segredo raiz de 256 bits.
- [x] Separar criptograficamente material de autenticação e cifragem da associação.
- [x] Enviar ao Worker apenas `SecurityProfile` cifrado, sem duplicar o cofre operacional.
- [x] Adicionar `PUT/GET/DELETE /v1/pair/:pairingId` sem nova classe Durable Object.
- [x] Aplicar expiração de 10 minutos e eliminação por redenção/alarme.
- [x] Importar perfil associado sem criar novo PIN/palavra-passe nem novo `profileId`.
- [x] Intercetar `#pair=...` antes do runtime, inclusive quando o browser já possui outro perfil local criado por engano.
- [x] Manter importação de cópia segura como fallback.
- [x] Adicionar testes de validação das ligações de associação.
- [x] Confirmar quality gates, Workers Builds e publicação do PR #193.

## P0 — Auditoria de consistência móvel ↔ web (PR #194)

- [x] Criar matriz de comparação antes das correções em `docs/MOBILE-WEB-CONSISTENCY-AUDIT.md`.
- [x] Confirmar que mobile/desktop executam a mesma PWA, rotas, páginas e services.
- [x] Auditar origem dos dados, repositories, hooks, Context e Zustand.
- [x] Auditar IndexedDB, `localStorage`, `sessionStorage` e cache/service worker.
- [x] Confirmar que horas/notificações persistidas em Zustand usam `secureStorage` dentro do cofre cifrado.
- [x] Auditar API, endpoints, CORS e `VITE_SYNC_API_URL`/endpoint por perfil.
- [x] Confirmar que não existe endpoint/mocks de negócio exclusivo de mobile ou desktop.
- [x] Auditar CSS responsivo e confirmar que a divergência observada não é causada por `display:none` da jornada.
- [x] Adicionar sincronização ao recuperar `window.focus` sem introduzir realtime complexo.
- [x] Adicionar indicador acessível de estado de sincronização no top bar.
- [x] Manter o indicador ligado ao próprio `SecurityProfile.cloudSync`, sem estado duplicado.
- [x] Tornar dependências do `CloudSyncManager` injetáveis para testes sem mudar os defaults de produção.
- [x] Criar teste com duas réplicas lógicas do mesmo perfil.
- [x] Testar criação mobile → web em réplica simulada.
- [x] Testar edição web → mobile em réplica simulada.
- [x] Testar eliminação mobile → web em réplica simulada.
- [x] Testar `secureStorage` sincronizado na mesma unidade de cofre.
- [x] Testar conflito simultâneo sem sobrescrita.
- [x] Confirmar auditoria de dependências, typecheck, lint, testes, build, Worker dry-run e smoke test no head funcional do PR #194.
- [x] Confirmar Workers Builds do PR #194 no head funcional.
- [x] Integrar PR #194 em `main`.
- [ ] Confirmar publicação final de produção do PR #194 no fluxo operacional real.
- [ ] No telemóvel com os dados, confirmar estado **Sincronizado**/revisão remota concluída.
- [ ] Criar **Associar outro navegador** no telemóvel e abrir a ligação no computador.
- [ ] Confirmar que o computador pede o mesmo PIN/palavra-passe em vez de criar outro acesso.
- [ ] Confirmar que os dados aparecem no computador após desbloqueio e `pull` remoto.
- [ ] Criar um registo real no mobile e confirmar na web.
- [ ] Criar um registo real na web e confirmar no mobile.
- [ ] Editar no mobile e confirmar na web.
- [ ] Editar na web e confirmar no mobile.
- [ ] Eliminar, quando aplicável, e confirmar em ambos.
- [ ] Fechar/reabrir ambas as plataformas e confirmar persistência.
- [ ] Bloquear/voltar a entrar com a mesma credencial e confirmar o mesmo perfil.
- [ ] Atualizar a página web e testar com cache limpa.
- [ ] Validar offline → reconexão.
- [ ] Validar conflito simultâneo sem perda de nenhuma cópia em dispositivos reais.
- [ ] Validar resoluções mobile/tablet/desktop.
- [ ] Confirmar que telemóvel e computador usam o mesmo timezone do sistema durante o teste.

## P0 — Menu móvel hambúrguer ↔ X (PR #195)

- [x] Confirmar que existe um único drawer móvel em `AppShell` e que a mesma PWA serve telemóvel e web responsiva.
- [x] Fazer o botão do top bar alternar `mobileMenuOpen` em vez de apenas abrir.
- [x] Manter `aria-expanded` sincronizado com o estado real do drawer.
- [x] Alterar `aria-label` entre **Abrir menu principal** e **Fechar menu principal**.
- [x] Desenhar o hambúrguer em CSS com três linhas e transformar para **X** por `transform`/`transition`.
- [x] Ajustar o alvo de toque para `44 × 44 px`.
- [x] Reservar uma zona lateral para o botão enquanto o drawer está aberto, incluindo `safe-area`.
- [x] Manter apenas a zona do botão acima do backdrop, sem expor o resto do top bar.
- [x] Preservar fecho por backdrop, `Escape` e mudança de rota.
- [x] Preservar `prefers-reduced-motion` sem perder funcionalidade.
- [x] Preservar leitura das linhas em `forced-colors`.
- [x] Confirmar typecheck, lint, testes, build, Worker dry-run e smoke test no head final do PR #195.
- [x] Integrar PR #195 e confirmar publicação GitHub Pages.
- [x] Revalidar o comportamento visual do PR #195 através da correção do PR #196.

## P0 — Correção do shell móvel (PR #196)

- [x] Confirmar pelas capturas que aparecem dois X simultâneos com o drawer aberto.
- [x] Confirmar no código que o segundo X vinha do botão interno do `mobileDrawerHeader`.
- [x] Remover o botão interno duplicado e manter o próprio hambúrguer transformado como único X.
- [x] Confirmar conflito de `hover/focus-visible` verde com `!important` em `mobile-quick-access.css`.
- [x] Neutralizar o estado verde persistente sem perder `focus-visible` acessível.
- [x] Preservar explicitamente a linha central do hambúrguer contra shorthands `background` legados.
- [x] Confirmar pseudo-logo/wordmark legado em `prototype-v2.css` como causa de consumo excessivo de largura.
- [x] Neutralizar os pseudo-elementos no top bar móvel, mantendo o wordmark completo no drawer.
- [x] Reestruturar o top bar para `grid-template-columns: minmax(0, 1fr) auto`.
- [x] Garantir que o grupo relógio/sync/bloqueio/notificações não encolhe por causa da marca.
- [x] Compactar o relógio em ecrãs estreitos sem ocultar a hora.
- [x] Preservar safe-area, backdrop, `Escape`, mudança de rota, `forced-colors` e `prefers-reduced-motion`.
- [x] Confirmar quality gates no head final do PR #196.
- [x] Integrar PR #196 e confirmar publicação GitHub Pages.
- [x] Validar no iPhone que existe apenas um X e que o top bar já não apresenta o X duplicado.
- [ ] Revalidar no iPhone a aparência final do controlo através do PR #197, removendo a superfície branca ainda visível.
- [ ] Validar Android/Chrome entre 360 e 480 px.
- [ ] Validar tablet/viewport web entre 481 e 899 px.
- [ ] Validar orientação horizontal/safe-area quando aplicável.

## P0 — Hierarquia minimalista do menu móvel (PR #197)

- [x] Confirmar pela captura física que o único X ainda aparece dentro de uma superfície branca independente.
- [x] Manter o alvo funcional de toque em `44 × 44 px`.
- [x] Remover `border`, fundo, cápsula e sombra visíveis do controlo hambúrguer/X.
- [x] Manter as três linhas do hambúrguer e a transformação para X sem alterar `mobileMenuOpen`.
- [x] Remover o realce de toque do iOS com `-webkit-tap-highlight-color: transparent`.
- [x] Manter `focus-visible` discreto e explícito para teclado.
- [x] Reduzir a zona recortada do top bar à safe-area esquerda + 44 px do controlo.
- [x] Ocultar a identidade textual enquanto o drawer está aberto para evitar fragmentos junto ao X.
- [x] Preservar `forced-colors` e `prefers-reduced-motion`.
- [ ] Confirmar auditoria de dependências, typecheck, lint, testes, build, Worker dry-run e smoke test no head final do PR #197.
- [ ] Validar no iPhone: hambúrguer sem caixa branca/moldura.
- [ ] Validar no iPhone: X sem caixa branca/moldura e sem fragmento de texto ao lado.
- [ ] Validar toque repetido abrir ↔ fechar sem estado verde residual.
- [ ] Validar navegação por teclado e `focus-visible` em viewport responsiva.
- [ ] Validar Android/Chrome e tablet.
- [ ] Integrar PR #197 apenas com CI verde e confirmar publicação GitHub Pages.

## P0 — Correção de turnos noturnos

- [x] Reproduzir logicamente o erro de entrada antecipada num turno **22:00–06:00**.
- [x] Corrigir a normalização temporal para não deslocar **21:00** para o dia seguinte.
- [x] Preservar a associação de horas após a meia-noite, como **02:00** e **07:00**, à manhã seguinte.
- [x] Criar testes de regressão para entrada antecipada e saída tardia em **22:00–06:00**.
- [x] Confirmar workflow **Qualidade**, integração e publicação.
- [ ] Validar manualmente um registo real de turno noturno com entrada antecipada.
- [ ] Validar manualmente um registo real de turno noturno com saída tardia.

## P1 — Validação de interface em dispositivo real

- [ ] Testar o deslize de medicação num iPhone real, incluindo scroll vertical da página.
- [ ] Confirmar que um horário eliminado desaparece imediatamente sem apresentar **Termina hoje**.
- [ ] Confirmar o seletor **Resumo / Detalhes técnicos** e a paginação do histórico em ecrã pequeno.
- [ ] Testar em Android/Chrome e tablet.
- [ ] Verificar VoiceOver/TalkBack e navegação por teclado através do menu `···`.
- [ ] Confirmar contraste no modo claro/escuro e em `forced-colors`.

## P1 — Consistência temporal

- [ ] Decidir se jornada/relatórios devem usar um timezone global explícito em `AppSettings`.
- [ ] Se aprovado, especificar migração compatível antes de alterar a interpretação de timestamps existentes.

## P2 — Melhoria futura

- [ ] Criar um fluxo explícito de resolução de conflitos apenas depois de validar o comportamento conservador atual em uso real.
- [ ] Avaliar eliminação autenticada da cópia remota quando um perfil é removido localmente.
- [ ] Avaliar revogação/listagem de browsers associados apenas se surgir necessidade operacional; a associação temporária atual não cria sessão remota persistente separada.
- [ ] Avaliar proteção adicional contra abuso de armazenamento do endpoint público (rate limiting/Turnstile ou autenticação de criação) caso o serviço deixe de ser estritamente pessoal.
- [ ] Avaliar um indicador discreto de que a linha de medicação admite deslize sem aumentar ruído visual.
- [ ] Avaliar um filtro adicional por tipo de evento apenas se o volume de histórico funcional justificar.
