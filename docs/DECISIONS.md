# Decisões Técnicas

Atualizado em: 2026-09-05

## D-001 — Manter o menu `···` além do gesto de deslize

**Decisão:** o deslize acrescenta atalhos, mas não substitui o menu existente.

**Motivo:** o gesto não é descobrível por todos os utilizadores e não deve ser o único caminho para quem usa teclado, rato ou tecnologias de apoio.

## D-002 — Não apagar fisicamente horários de medicação

**Decisão:** a ação visual **Eliminar** termina a validade do horário com `effectiveUntil`.

**Motivo:** eventos de toma, correções e proteção de dados dependem do `scheduleId`. Remover o registo quebraria a rastreabilidade e seria incompatível com a regra já presente na aplicação de preservar histórico auditável.

## D-003 — Alterações de definição entram em vigor no dia seguinte

**Decisão:** **Definir** encerra o horário atual no dia de hoje e cria um sucessor válido a partir de amanhã.

**Motivo:** evita alterar retroativamente uma ocorrência que já existe no contexto do dia atual e mantém a relação entre a toma de hoje e a configuração que a originou.

## D-004 — Pointer Events com `touch-action: pan-y`

**Decisão:** o gesto usa Pointer Events e só assume controlo quando o movimento horizontal ultrapassa um limiar.

**Motivo:** permite funcionar em toque, caneta e rato sem bloquear a deslocação vertical normal da página.

## D-005 — Ação destrutiva com confirmação explícita

**Decisão:** tocar em **Eliminar** abre um diálogo de confirmação antes de alterar os dados.

**Motivo:** reduz eliminações acidentais e explica que o histórico não é apagado.
