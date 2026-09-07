# Decisões Técnicas

Atualizado em: 2026-09-07

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

## D-008 — Normalizar horas noturnas pela proximidade ao turno planeado

**Estado:** aceite, integrada no PR #189 e publicada em GitHub Pages.

**Decisão:** quando o turno planeado atravessa a meia-noite, uma hora civil real, de pausa ou de ocorrência é representada no dia inicial ou no dia seguinte conforme a opção que fica temporalmente mais próxima do intervalo planeado.

**Motivo:** a regra anterior deslocava para o dia seguinte qualquer hora inferior à hora de entrada planeada. Num turno **22:00–06:00**, isso transformava uma entrada antecipada às **21:00** numa hora do dia seguinte, quebrando a interseção entre trabalho realizado e trabalho planeado. A nova regra mantém **21:00** no próprio dia, associa **02:00** e **07:00** à manhã seguinte e preserva o comportamento dos turnos diurnos.

## D-009 — GitHub Pages é a distribuição oficial; integrações externas só contam quando documentadas

**Estado:** aceite.

**Decisão:** a publicação suportada do frontend permanece GitHub Pages. Serviços externos só passam a integrar a arquitetura quando têm finalidade, configuração versionada, limites de segurança e responsabilidade operacional documentados.

**Motivo:** um check externo por si só não define arquitetura nem deve mascarar o estado do pipeline oficial.

## D-010 — Cloudflare Workers como backend de sincronização cifrada

**Estado:** aceite; implementação validada no PR #191, pendente de bootstrap de produção.

**Decisão:** utilizar Cloudflare Workers exclusivamente como serviço remoto de sincronização, mantendo GitHub Pages como frontend oficial. O Worker guarda apenas o `EncryptedVaultRecord` já cifrado no cliente e metadados técnicos de concorrência. O estado de cada perfil é isolado num Durable Object.

A autenticação do protocolo é derivada da chave de dados já desbloqueada no cliente através de SHA-256 com contexto específico de sincronização. A chave AES original não é enviada ao servidor. O Worker guarda apenas um segundo hash do token apresentado.

A revisão remota é independente da revisão local do cofre. Cada escrita exige a revisão remota esperada; divergências devolvem conflito. O cliente mantém a última revisão e a impressão digital do cofre sincronizado para distinguir alteração local, alteração remota e edição concorrente.

Quando existem alterações independentes nos dois dispositivos, nenhuma cópia é escolhida automaticamente. O estado passa a conflito e os dados locais não são substituídos.

**Motivo:** móvel e computador precisam de uma fonte remota comum sem transformar o backend numa fonte de dados pessoais em texto simples. Durable Objects fornecem serialização por perfil, adequada a compare-and-set de revisão, e permitem manter o modelo local-first/offline existente.

**Consequências:**

- a funcionalidade depende de um endpoint remoto configurado na publicação GitHub Pages;
- o primeiro emparelhamento de outro dispositivo requer importar uma cópia segura do mesmo perfil para partilhar `profileId` e chave de dados;
- o serviço remoto não consegue desencriptar o payload armazenado;
- indisponibilidade de rede não impede o uso local;
- conflitos são bloqueados em vez de aplicar política destrutiva de “última escrita vence”.

## D-011 — Bootstrap inicial de Durable Object através do branch de produção

**Estado:** aceite para o PR #191.

**Decisão:** integrar a primeira criação da classe `SyncVault` em `main` depois de o código, o frontend e o bundle do Worker passarem nos quality gates locais/GitHub, mesmo que o check Cloudflare de preview do PR permaneça vermelho exclusivamente por não conseguir aplicar a alteração de ciclo de vida.

**Motivo:** Workers Builds usa por omissão `wrangler versions upload` em branches não produtivas. Esse mecanismo não pode criar, eliminar, renomear ou transferir classes Durable Object. O branch de produção usa `wrangler deploy`, que é o mecanismo suportado para aplicar a criação inicial. O bundle e a configuração são verificados previamente por `wrangler deploy --dry-run` na pipeline **Qualidade**.

**Limite:** esta decisão não autoriza ignorar erros de compilação, testes, segurança ou configuração. Se o `wrangler deploy` de produção falhar, a sincronização permanece desativada e a causa deve ser corrigida antes de configurar o frontend para o endpoint remoto.
