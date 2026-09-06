# Decisões Técnicas

Atualizado em: 2026-09-06

## D-001 — Manter o menu `···` além do gesto de deslize

**Decisão:** o deslize acrescenta atalhos, mas não substitui o menu existente.

**Motivo:** o gesto não é descobrível por todos os utilizadores e não deve ser o único caminho para quem usa teclado, rato ou tecnologias de apoio.

## D-002 — Eliminação imediata na interface com tombstone lógico

**Decisão:** a ação visual **Eliminar** remove o horário da agenda ativa no próprio momento, mas não executa `delete()` físico na tabela `medicationSchedules`. O registo recebe `deletedAt` e uma validade encerrada antes do dia da eliminação.

**Motivo:** para o utilizador, “Eliminar” deve significar que o horário desaparece imediatamente e não volta a gerar tomas. Internamente, eventos de toma e correções dependem do `scheduleId`; manter um tombstone preserva integridade referencial, backups e auditoria sem expor o comportamento antigo “Termina hoje”.

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

**Motivo:** checkpoints repetidos são importantes para auditoria, mas não devem dominar a leitura normal. A separação reduz ruído visual sem apagar nem esconder definitivamente informação técnica.

## D-007 — Eliminar toda a cadeia futura da mesma definição

**Decisão:** ao eliminar uma versão ativa, todas as versões futuras não eliminadas com o mesmo `order` também recebem o tombstone.

**Motivo:** uma definição futura já criada representa a continuação do mesmo horário. Preservá-la faria o horário eliminado reaparecer automaticamente no dia seguinte, contrariando a ação explícita do utilizador.

## D-008 — Não controlar o Timer da aplicação Relógio

**Decisão:** a integração iOS usa ActivityKit e AlarmKit para temporizadores pertencentes ao Foco & Jornada; não tenta iniciar, alterar ou assumir o Timer da aplicação Relógio da Apple.

**Motivo:** mantém propriedade clara do estado, usa APIs suportadas e evita depender de comportamentos de outra aplicação que não constituem uma API de integração do projeto.

## D-009 — Manter o domínio Web como fonte de verdade

**Decisão:** jornada, pausa e foco continuam a ser persistidos e calculados pelas entidades/repositórios atuais. O iOS recebe snapshots temporais e atua como camada de apresentação/sistema.

**Motivo:** evita duplicação de regras, preserva o comportamento já testado e mantém a regra arquitetural de derivar timers a partir de timestamps persistidos.

## D-010 — Bridge WebKit opcional e versionado

**Decisão:** a comunicação usa `window.webkit.messageHandlers.focoJornadaTimer` com contrato `version: 1`. Na ausência do handler, a PWA continua sem erro.

**Motivo:** permite evolução nativa sem quebrar browser, Android, desktop ou a PWA já publicada.

## D-011 — AlarmKit apenas para fases com deadline real

**Decisão:** AlarmKit é usado em iOS 26+ apenas quando foco/pausa está em execução e existe um deadline derivado dos dados persistidos. Jornada aberta, pausa sem duração e foco pausado usam ActivityKit.

**Motivo:** não inventar duração onde a regra de negócio não a definiu e usar cada API para o tipo de estado que representa corretamente.

## D-012 — Sem ações bidirecionais no Lock Screen nesta fase

**Decisão:** esta primeira integração não permite que um botão nativo de pausa/retoma/terminar altere diretamente os registos Web.

**Motivo:** sem um canal transacional bidirecional, uma ação nativa poderia alterar o AlarmKit sem atualizar IndexedDB, criando divergência. A leitura/apresentação nativa é segura; escrita nativa exige uma fase própria com App Intents, sincronização e testes.

## D-013 — Não migrar implicitamente o armazenamento Safari/PWA

**Decisão:** a shell nativa não tenta copiar automaticamente IndexedDB, cookies ou storage da PWA instalada no Safari para o sandbox da `WKWebView`.

**Motivo:** os contentores são distintos e uma migração implícita colocaria em risco o cofre e a integridade dos dados. A transferência deve ser explícita, verificável e reversível.

## D-014 — Limpar apresentação nativa ao bloquear o cofre

**Decisão:** o cleanup do runtime seguro cancela o estado nativo visível, mas não encerra nem modifica a jornada persistida.

**Motivo:** reduz exposição de informação no Lock Screen quando a aplicação é bloqueada, mantendo simultaneamente o registo real intacto para reconstrução após novo desbloqueio.
