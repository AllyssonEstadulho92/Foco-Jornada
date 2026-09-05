# Arquitetura

Atualizado em: 2026-09-05

## Stack confirmada

- React 19 + TypeScript.
- Vite para desenvolvimento e build.
- Dexie/IndexedDB para persistência local.
- Vitest para testes automatizados.

## Fluxo relevante — medicação

```text
MedicationsStockPage
  ├─ MedicationDoseSwipeActions
  ├─ MedicationScheduleActionDialog
  └─ useAppServices()
       └─ OperationalPersonalStockService
            ├─ PersonalStockService
            └─ MedicationScheduleService
                 └─ AppDatabase.medicationSchedules

MedicationPrototypeWorkspace
  ├─ histórico funcional (Resumo)
  └─ auditoria técnica (Detalhes técnicos)
```

## Responsabilidades

### `MedicationsStockPage`

Mantém o estado visual da lista de tomas, abre/fecha a linha deslizada e coordena os diálogos de definição e eliminação. As alterações continuam a usar o fluxo `run(...)` existente para recarregar dados e atualizar os mecanismos de proteção da medicação.

### `MedicationDoseSwipeActions`

Controla o gesto horizontal por Pointer Events, limita o deslocamento à largura das ações e mantém `touch-action: pan-y` para preservar o scroll vertical. O menu `···` permanece como alternativa acessível ao gesto.

### `MedicationScheduleActionDialog`

Apresenta edição e confirmação destrutiva. O diálogo de eliminação informa que o horário desaparece imediatamente da lista, enquanto tomas e correções anteriores permanecem protegidas.

### `MedicationScheduleService`

Aplica o ciclo de vida dos horários sem quebrar referências históricas:

- **Definir:** encerra a versão atual no dia anterior à nova configuração e cria um sucessor com o mesmo `order`.
- **Eliminar:** grava `deletedAt` e torna a versão inválida a partir do próprio dia da eliminação, definindo `effectiveUntil` para o dia anterior.
- Ao eliminar uma versão ativa, versões futuras não eliminadas do mesmo `order` são também tombstonadas para evitar reaparecimento posterior.
- O registo não é removido fisicamente da tabela.
- Repetir a eliminação é idempotente.
- Uma versão com `deletedAt` já não pode ser redefinida.

### `MedicationPrototypeWorkspace`

Carrega os horários ativos e o histórico completo de versões. O histórico é apresentado em duas vistas:

- **Resumo:** eventos funcionais e compreensíveis para o utilizador; exclui `protection`.
- **Detalhes técnicos:** checkpoints automáticos e registos de proteção.

Versões posteriores do mesmo `order` são apresentadas como **Horário alterado**. Um tombstone gera um único evento visual **Horário eliminado**, mesmo quando a eliminação afeta mais de uma versão futura da mesma cadeia.

## Dados e auditoria

`MedicationSchedule` inclui o campo opcional `deletedAt`. A combinação `deletedAt` + `effectiveUntil` funciona como tombstone lógico. Os filtros existentes baseados em `effectiveFrom/effectiveUntil` deixam automaticamente de devolver o horário eliminado no dia da operação e nas previsões futuras.

A tabela `medicationSchedules` mantém todas as versões necessárias para que `MedicationDoseEvent.scheduleId` continue a apontar para um registo existente. Não é feito `delete()` físico nesta funcionalidade.

Depois de operações iniciadas pela página, o mecanismo existente continua a criar checkpoints quando a assinatura dos dados muda e tenta sincronizar a cópia redundante local.

## Acessibilidade e responsividade

- Alvos compatíveis com toque.
- Ações destrutivas têm texto e ícone e não dependem apenas da cor.
- Histórico compacto usa botões reais com `aria-pressed` para alternar resumo/detalhes técnicos.
- Paginação do histórico reduz comprimento vertical sem remover informação.
- `prefers-reduced-motion` mantém-se aplicado ao deslize.
- `forced-colors` mantém os novos controlos distinguíveis.
- O menu `···` continua disponível para teclado, rato e tecnologias de apoio.
