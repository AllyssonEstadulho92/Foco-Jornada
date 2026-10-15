# Medicação: organização do histórico e ações de edição/eliminação

Data: 15/10/2026. Estado: em revisão no PR #228.

## Auditoria factual

Na versão anterior, a secção Histórico em `MedicationPrototypeWorkspace` apresentava uma linha temporal longa, sem agrupamento por data nem filtro de tipos. Mostrava informação funcional e oferecia apenas alternância entre Resumo e Detalhes técnicos. O utilizador não encontrava aí botões de edição ou eliminação. As operações já existiam noutras partes da interface: `MedicationDoseSwipeActions` para horários, `PersonalStockService.undoMedicationDose` para desfazer tomas com stock, e `MedicationDoseStatusService.correctMedicationDoseStatus/replaceMedicationDoseStatus` para estados operacionais.

## Especificação aplicada

1. Histórico em ordem cronológica inversa, agrupado por dia e com data/hora nos cartões.
2. Filtro por Todos, Tomas, Horários, Stock e Outros; controlo Resumo/Detalhes técnicos conservado. O Resumo evita mostrar eventos de toma substituídos/corrigidos, mas os Detalhes técnicos mantêm as versões anteriores, correções e pontos de proteção.
3. Horários ainda ativos: botões **Editar** (definição válida a partir de amanhã) e **Eliminar** (retirada imediata da agenda ativa), ambos com o diálogo de confirmação já existente.
4. Eventos de toma ativos: **Editar** quando o evento representa `not_taken` ou `postponed` (substituição por nova versão com validação de hora), **Eliminar** para retirar o estado ativo do resumo através de correção auditável; na toma `taken`, a reversão repõe o stock com movimento de correção.
5. Stock inicial, reposições, movimentos corretivos, notas de perfil históricas e pontos de proteção não recebem um botão destrutivo que apague entradas diretamente. A gestão do stock corrente permanece na secção Configuração e stock.
6. A secção Tomas programadas apresenta agora botões visíveis **Editar horário** e **Eliminar**, além do gesto e do menu existentes.

## Segurança e consistência

- Nenhum registo histórico é fisicamente apagado do IndexedDB. A correção gera novos eventos e, quando aplicável, novos movimentos de stock.
- A alteração de horários não reescreve tomas passadas; alteração entra em vigor no dia seguinte.
- Correções/anulações exigem confirmação no ecrã. O conteúdo técnico completo pode ser consultado, mas não é disponibilizada eliminação física de histórico protegido.
- O código chama `recordCheckpoint` e `syncRedundantSnapshot` após a alteração, informando quando a cópia redundante adicional não fica disponível, sem mascarar o êxito operacional.
- Sem alteração de esquema, autenticação, Worker, dependências, backend ou sincronização. Os dados demonstrativos das pré-visualizações não são copiados para a aplicação.

## Testes e validação

Testes estruturais em `src/styles/medication-history-actions.test.ts` confirmam grupos, filtros, botões, diálogos, uso dos serviços existentes, ações de stock e estilos móveis. Conferir ainda CI completo (TypeScript, lint, Vitest, build, Worker e Chromium) e testar manualmente com dados **não pessoais**: editar horário, eliminar horário, adiar, editar adiamento, anular toma e verificar stock, repetir operação, consultar Detalhes técnicos, mudar de medicamento, testar 320 a 430 px, zoom, teclado, leitor de ecrã, tema escuro, backup e regresso da PWA.

**Limite pendente:** o workflow de Qualidade continua sujeito à remediação das vulnerabilidades de dependências registadas no Issue #229. Não integrar nem publicar sem resolver esse bloqueio de segurança e confirmar visualmente a interface.
