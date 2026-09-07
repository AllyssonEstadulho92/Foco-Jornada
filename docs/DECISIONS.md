# Decisões Técnicas

Atualizado em: 2026-09-07

## D-001 — Manter o menu `···` além do gesto de deslize

**Decisão:** o deslize acrescenta atalhos, mas não substitui o menu existente.

**Motivo:** o gesto não é descobrível por todos os utilizadores e não deve ser o único caminho para quem usa teclado, rato ou tecnologias de apoio.

## D-002 — Eliminação imediata na interface com tombstone lógico

**Decisão:** a ação visual **Eliminar** remove o horário da agenda ativa no próprio momento, mas não executa `delete()` físico na tabela `medicationSchedules`. O registo recebe `deletedAt` e uma validade encerrada antes do dia da eliminação.

**Motivo:** para o utilizador, “Eliminar” deve significar que o horário desaparece imediatamente e não volta a gerar tomas. Internamente, eventos de toma e correções dependem do `scheduleId`; manter um tombstone preserva integridade referencial, backups e auditoria.

## D-003 — Alterações de definição entram em vigor no dia seguinte

**Decisão:** **Definir** encerra o horário atual no dia de hoje e cria um sucessor válido a partir de amanhã.

**Motivo:** evita alterar retroativamente uma ocorrência que já existe no contexto do dia atual e mantém a relação entre a toma de hoje e a configuração que a originou.

## D-004 — Pointer Events com `touch-action: pan-y`

**Decisão:** o gesto usa Pointer Events e só assume controlo quando o movimento horizontal ultrapassa um limiar.

**Motivo:** permite funcionar em toque, caneta e rato sem bloquear a deslocação vertical normal da página.

## D-005 — Ação destrutiva com confirmação explícita

**Decisão:** tocar em **Eliminar** abre um diálogo de confirmação antes de alterar os dados.

**Motivo:** reduz eliminações acidentais e explica que o horário deixa a lista ativa, mas os registos anteriores permanecem protegidos.

## D-006 — Separar histórico funcional de auditoria técnica

**Decisão:** o separador Histórico abre em **Resumo**, excluindo checkpoints automáticos. Os pontos de proteção permanecem disponíveis em **Detalhes técnicos** e ambas as vistas usam paginação progressiva.

**Motivo:** checkpoints repetidos são importantes para auditoria, mas não devem dominar a leitura normal.

## D-007 — Eliminar toda a cadeia futura da mesma definição

**Decisão:** ao eliminar uma versão ativa, todas as versões futuras não eliminadas com o mesmo `order` também recebem o tombstone.

**Motivo:** preservar versões futuras faria o horário eliminado reaparecer automaticamente, contrariando a ação explícita do utilizador.

## D-008 — Normalizar horas noturnas pela proximidade ao turno planeado

**Estado:** aceite, integrada no PR #189 e publicada em GitHub Pages.

**Decisão:** quando o turno planeado atravessa a meia-noite, uma hora civil real, de pausa ou de ocorrência é representada no dia inicial ou no dia seguinte conforme a opção mais próxima do intervalo planeado.

**Motivo:** evita deslocar incorretamente entradas antecipadas para o dia seguinte e mantém horas após a meia-noite associadas à manhã seguinte.

## D-009 — GitHub Pages é a distribuição oficial; integrações externas só contam quando documentadas

**Estado:** aceite.

**Decisão:** a publicação suportada do frontend permanece GitHub Pages. Serviços externos só integram a arquitetura quando têm finalidade, configuração versionada, limites de segurança e responsabilidade operacional documentados.

**Motivo:** um check externo por si só não define arquitetura nem deve mascarar o estado do pipeline oficial.

## D-010 — Cloudflare Workers como backend de sincronização cifrada

**Estado:** aceite e integrada em produção através do PR #191.

**Decisão:** utilizar Cloudflare Workers exclusivamente como serviço remoto de sincronização, mantendo GitHub Pages como frontend oficial. O Worker guarda apenas o `EncryptedVaultRecord` já cifrado no cliente e metadados técnicos de concorrência. O estado de cada perfil é isolado num Durable Object.

A autenticação do protocolo é derivada da chave de dados desbloqueada no cliente através de SHA-256 com contexto específico. A chave AES original não é enviada ao servidor. A revisão remota é independente da revisão local e cada escrita exige a revisão remota esperada.

Quando existem alterações independentes nos dois dispositivos, nenhuma cópia é escolhida automaticamente.

**Motivo:** móvel e computador precisam de uma fonte remota comum sem transformar o backend numa fonte de dados pessoais em texto simples.

## D-011 — Bootstrap inicial de Durable Object através do branch de produção

**Estado:** concluído no PR #191.

**Decisão:** a primeira criação da classe `SyncVault` foi integrada em `main` depois de o código, frontend e bundle do Worker passarem nos quality gates. O Workers Builds de produção executou com sucesso.

**Motivo:** branches não produtivas usam `wrangler versions upload`, que não aplica alterações de ciclo de vida de Durable Objects; produção usa `wrangler deploy`.

## D-012 — Endpoint de sincronização pode ser configurado no próprio perfil

**Estado:** aceite, integrada no PR #192 e publicada.

**Decisão:** manter `VITE_SYNC_API_URL` como configuração automática de build, mas permitir um endpoint runtime guardado em `SecurityProfile.cloudSync.endpoint` quando a publicação não tiver essa variável disponível.

O endpoint runtime só é aceite se for HTTPS em `workers.dev` (ou localhost em desenvolvimento), sem credenciais, query string ou fragmento. Antes de guardar, o cliente chama `/health` e exige a identidade `foco-jornada-sync`. Uma alteração de endpoint limpa a revisão remota e a fingerprint conhecidas antes de nova reconciliação.

**Motivo:** o Worker de produção pode estar publicado sem que o seu subdomínio `workers.dev` esteja disponível ao pipeline GitHub. Bloquear toda a sincronização por falta de uma variável de build mantém móvel e computador desalinhados apesar de o backend existir.

**Consequências:**

- o endereço é configuração pública, não segredo;
- a cópia segura do perfil transporta o mesmo endpoint para o segundo dispositivo;
- o utilizador só precisa de introduzir o endpoint uma vez no dispositivo de referência quando a variável de build estiver ausente;
- um endpoint falso ou incompatível não é guardado porque precisa de responder corretamente a `/health`;
- custom domains continuam fora deste fluxo até CSP e origem permitida serem revistos explicitamente.

## D-013 — Browser novo associa-se ao perfil existente por canal temporário cifrado

**Estado:** aceite, integrada no PR #193 e publicada.

**Decisão:** um browser sem `SecurityProfile` não deve criar automaticamente outra credencial quando o utilizador já possui um perfil noutro dispositivo. O fluxo principal passa a ser **Associar outro navegador**.

O dispositivo já autorizado cria uma ligação temporária com segredo raiz aleatório de 256 bits. A partir desse segredo são derivados, com contextos criptográficos separados:

- uma chave AES-GCM para cifrar o `SecurityProfile` necessário ao bootstrap;
- um token HTTP de autenticação do canal temporário.

O segredo raiz permanece apenas na ligação `#pair=...` e não é enviado ao Worker. O Worker recebe o perfil já cifrado, guarda apenas um hash do token e aplica validade de 10 minutos. O payload é eliminado depois de uma redenção bem-sucedida e por alarme quando expira.

O canal temporário não transporta o cofre operacional. Depois de importar o perfil, o novo browser exige o mesmo PIN/palavra-passe existente; só depois deriva a `dataKey` e usa o protocolo normal de sincronização para obter e validar o `EncryptedVaultRecord` remoto.

**Motivo:** `IndexedDB` e `localStorage` são isolados entre browsers. Cloud sync por si só não consegue arrancar num browser vazio porque falta o material criptográfico local necessário para autenticar e desencriptar o cofre. Guardar PIN/palavra-passe no servidor ou permitir bootstrap remoto apenas com um PIN de 6 dígitos aumentaria materialmente o risco de força bruta/offline.

**Consequências:**

- mudar de browser deixa de implicar criar um novo PIN/perfil;
- a associação continua a ser uma operação explícita uma vez por browser;
- a ligação temporária deve ser tratada como segredo e não deve ser publicada;
- é necessária pelo menos uma sincronização remota concluída antes de gerar a ligação;
- a importação de cópia segura permanece como fallback;
- não existe fusão automática entre perfis independentes.

## D-014 — Uma aplicação responsiva, um modelo de dados, sincronização proporcional

**Estado:** aceite no PR #194 após auditoria móvel ↔ web.

**Decisão:** tratar telemóvel e computador como duas réplicas da mesma PWA e do mesmo perfil, não como produtos com regras ou APIs separadas. A unidade lógica cross-device continua a ser o cofre cifrado; a revisão remota do Worker coordena a convergência e o cofre IndexedDB permanece réplica de trabalho offline.

Não é introduzido WebSocket/realtime. A reconciliação existente é suficiente e passa também a ser agendada quando a janela recupera `focus`, além de gravações locais, `online`, `visibilitychange`, desbloqueio e intervalo periódico.

O estado de sincronização passa a ser visível no top bar a partir de `SecurityProfile.cloudSync`; não é criado um segundo estado de sync. `CloudSyncManager` aceita dependências injetáveis apenas para tornar testável, de forma isolada, a convergência entre duas réplicas.

**Motivo:** a auditoria confirmou que mobile e desktop já partilham rotas, componentes, repositories, regras e schema. O problema não exige reconstrução nem API por entidade; exige garantir que ambos usam o mesmo perfil/cofre e tornar a convergência verificável e observável.

**Consequências:**

- nenhuma alteração de framework, schema operacional, base de dados ou cifragem;
- nenhum reset ou migração destrutiva;
- estados de `Sincronizado`, `Pendente`, `Pausada`, `Erro` e `Conflito` ficam observáveis na navegação normal;
- edições simultâneas continuam a parar em conflito em vez de usar `last-write-wins` silencioso;
- timezone geral continua dependente do ambiente do browser e fica registado como risco a validar separadamente antes de qualquer migração temporal.

## D-015 — O mesmo controlo móvel abre e fecha o drawer com animação CSS

**Estado:** aceite no PR #195 e publicada.

**Decisão:** o botão hambúrguer do top bar móvel deve representar o estado real do drawer. Quando fechado, apresenta três linhas; ao abrir, as linhas transformam-se num **X** e o mesmo controlo passa a fechar o drawer. React/TypeScript mantém apenas `mobileMenuOpen`; a transformação visual é executada em CSS.

O controlo usa alvo de toque `44 × 44 px`, atualiza `aria-expanded` e `aria-label`, mantém o botão visível acima do backdrop e reserva lateralmente a zona necessária para que o drawer não o cubra. O resto do top bar é recortado enquanto o drawer está aberto. `prefers-reduced-motion` elimina a transição e `forced-colors` mantém contraste funcional.

**Motivo:** o estado aberto/fechado deve ser imediatamente legível e reversível no mesmo ponto de interação, sem criar dois comportamentos visuais diferentes entre a PWA instalada e a versão web responsiva. CSS é suficiente para o movimento e evita dependência adicional de animação.

**Consequências:**

- não existe novo store, persistência ou regra de negócio;
- sidebar desktop continua inalterada;
- backdrop, `Escape` e mudança de rota continuam caminhos válidos de fecho;
- qualquer caminho de fecho repõe `mobileMenuOpen = false`, o hambúrguer e o estado ARIA.

## D-016 — Um único X e orçamento explícito de largura no top bar móvel

**Estado:** implementada no PR #196.

**Decisão:** quando o drawer está aberto, não deve existir um segundo botão **Fechar** dentro do cabeçalho. O único X visível é o próprio botão hambúrguer transformado, que continua a alternar `mobileMenuOpen`.

No top bar móvel, a identidade e o grupo operacional passam a ocupar duas colunas explícitas: `minmax(0, 1fr)` para a identidade e `auto` para relógio/sync/bloqueio/notificações. O pseudo-logo/wordmark legado de `prototype-v2.css` é neutralizado no top bar; o wordmark completo permanece no drawer. Em ecrãs estreitos, o relógio pode ocultar o ícone mas não a hora.

O estado visual do menu não deve depender de `hover` verde persistente. As regras finais de `mobile-shell.css` preservam as três linhas do hambúrguer e mantêm o X em cor neutra, inclusive quando regras históricas usam `!important`.

**Motivo:** as capturas reais mostraram dois X simultâneos, um X com aparência de selecionado e competição de largura entre marca e estado operacional. A correção deve reduzir ruído sem criar outro estado ou remover informação funcional.

**Consequências:**

- o drawer mantém o wordmark completo, mas deixa de ter um segundo X;
- o top bar usa uma identidade textual compacta e previsível;
- relógio, sync, bloqueio e sino ficam isolados do crescimento da marca;
- nenhum dado, regra de negócio, persistência, API ou mecanismo de sincronização é alterado;
- validação física em iPhone/Android continua obrigatória antes de considerar a correção visual encerrada.
