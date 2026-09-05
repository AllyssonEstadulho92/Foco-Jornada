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
```

## Responsabilidades

### `MedicationsStockPage`

Mantém o estado visual da lista de tomas, abre/fecha a linha deslizada e coordena os diálogos de definição e eliminação. As alterações continuam a usar o fluxo `run(...)` existente para recarregar dados e atualizar os mecanismos de proteção da medicação.

### `MedicationDoseSwipeActions`

Componente de interação. Controla o gesto horizontal por Pointer Events, limita o deslocamento à largura das ações e mantém `touch-action: pan-y` para preservar o scroll vertical. O menu `···` existente não é removido.

### `MedicationScheduleActionDialog`

Apresenta a confirmação e os campos necessários. Suporta Escape, foco inicial, `role="dialog"`, `aria-modal` e layout de bottom sheet em ecrãs pequenos.

### `MedicationScheduleService`

Aplica as regras de ciclo de vida do horário sem apagar registos:

- **Definir:** o horário atual recebe `effectiveUntil` e é criado um sucessor com novo `id` e `effectiveFrom` no dia seguinte.
- **Eliminar:** atualiza `effectiveUntil`; o registo original continua armazenado.
- Repetir exatamente a mesma definição é idempotente.
- Um segundo sucessor concorrente para a mesma ordem/data é rejeitado.

## Dados e auditoria

A tabela `medicationSchedules` mantém o horário anterior e o sucessor como registos distintos. Os eventos de toma continuam ligados ao `scheduleId` que os originou. Não é feito `delete()` de horários nesta funcionalidade.

Depois de uma operação iniciada pela página, o fluxo existente de proteção cria um checkpoint e tenta sincronizar a cópia redundante local.

## Acessibilidade e responsividade

- Alvos de interação compatíveis com toque.
- Ações destrutivas têm texto e ícone; não dependem exclusivamente da cor.
- `prefers-reduced-motion` remove a animação do deslize.
- `forced-colors` mantém controlos distinguíveis.
- O menu de ações já existente permanece como caminho alternativo ao gesto.
