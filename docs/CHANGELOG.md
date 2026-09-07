# Changelog

## 2026-09-07

### Corrigido

- Normalização de horas reais em turnos que atravessam a meia-noite.
- Uma entrada antecipada antes da hora planeada deixa de ser deslocada incorretamente para o dia seguinte.
- Uma saída após o fim planeado continua corretamente associada à manhã seguinte.
- A interseção entre trabalho realizado e turno planeado deixa de transformar trabalho normal em horas extra ou horas não trabalhadas por erro de alinhamento temporal.

### Testes

- Adicionado caso **22:00–06:00** com entrada real às **21:00**.
- Adicionado caso **22:00–06:00** com saída real às **07:00**.
- Workflow **Qualidade** do PR #189 concluído com sucesso.
- Workflow **Qualidade** de `main` após integração concluído com sucesso.
- Build, lint, typecheck, testes e smoke test aprovados.

### Integração e publicação

- PR #189 integrado em `main`.
- Commit: `90d19791f7892e51c5baf2c27967d53e7b464b8c`.
- Workflow **Publicar Foco & Jornada** / GitHub Pages concluído com sucesso.
- A distribuição oficial permanece GitHub Pages.

### Observação operacional

- O check externo **Workers Builds: foco-jornada** da integração Cloudflare falhou no PR e no commit integrado.
- A causa não pode ser confirmada apenas a partir do GitHub, porque os detalhes estão nos logs externos do Cloudflare.
- A integração Cloudflare fica registada como tarefa de manutenção: deve ser configurada/documentada se for necessária ou removida/desativada se não fizer parte da arquitetura pretendida.

## 2026-09-05

### Adicionado

- Gesto horizontal nas linhas de tomas programadas.
- Ação oculta **Definir** com edição de hora e quantidade.
- Ação oculta **Eliminar** com confirmação explícita.
- `MedicationScheduleService` para versionar e eliminar logicamente horários sem quebrar referências históricas.
- Campo opcional `deletedAt` em `MedicationSchedule` para tombstone auditável.
- Histórico compacto com vistas **Resumo** e **Detalhes técnicos**.
- Paginação progressiva do histórico com **Ver mais eventos / Mostrar menos**.
- Evento visual **Horário eliminado** e apresentação de versões sucessoras como **Horário alterado**.
- Diálogo responsivo com comportamento de bottom sheet em ecrãs pequenos.
- Suporte a `prefers-reduced-motion` e `forced-colors`.
- Testes do ciclo de vida, idempotência e eliminação imediata de horários.

### Alterado

- **Eliminar** passa a remover o horário imediatamente da lista de tomas em vez de o deixar visível como **Termina hoje**.
- Uma eliminação também neutraliza definições futuras da mesma cadeia (`order`), impedindo que o horário reapareça posteriormente.
- O resumo do histórico deixa de apresentar checkpoints automáticos de proteção, que permanecem consultáveis em **Detalhes técnicos**.
- `OperationalPersonalStockService` disponibiliza o histórico completo das versões de horários para construir a apresentação auditável.

### Preservado

- Menu `···`, ações Tomada/Adiar/Não tomada, correções e histórico existentes.
- Eventos de toma e movimentos de stock existentes.
- Registos técnicos dos horários eliminados, necessários para manter referências e auditoria.
- Checkpoints e cópia redundante local; apenas a apresentação padrão deixa de os expor em massa.