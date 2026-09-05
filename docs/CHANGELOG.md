# Changelog

## 2026-09-05

### Adicionado

- Gesto horizontal nas linhas de tomas programadas.
- Ação oculta **Definir** com edição de hora e quantidade.
- Ação oculta **Eliminar** com confirmação explícita.
- `MedicationScheduleService` para versionar e terminar horários sem apagar histórico.
- Diálogo responsivo com comportamento de bottom sheet em ecrãs pequenos.
- Suporte a `prefers-reduced-motion` e `forced-colors`.
- Testes do ciclo de vida e idempotência de horários.

### Alterado

- `AppServicesProvider` expõe o serviço operacional de stock, que inclui as novas operações auditáveis de horário.
- `OperationalPersonalStockService` delega as alterações de horários ao novo serviço especializado.
- A lista diária identifica horários cuja validade termina no próprio dia.

### Preservado

- Menu `···`, ações Tomada/Adiar/Não tomada, correções e histórico existentes.
- Eventos de toma e movimentos de stock existentes.
- Registos de horários anteriores, que deixam de estar ativos por data em vez de serem apagados.
