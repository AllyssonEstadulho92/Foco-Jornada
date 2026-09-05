# Decisões Técnicas

Atualizado em: 2026-09-05

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
