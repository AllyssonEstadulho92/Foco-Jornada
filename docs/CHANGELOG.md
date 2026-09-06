# Changelog

## 2026-09-06

### Adicionado — integração nativa iPhone

- Especificação `docs/IOS-NATIVE-TIMERS.md` para jornada, pausa e foco no iOS.
- Contrato temporal Web -> iOS baseado em timestamps persistidos.
- Bridge opcional `focoJornadaTimer` através de `WKScriptMessageHandler`.
- Coordenador Web que sincroniza jornada, pausa e foco ativos sem alterar o domínio.
- Shell SwiftUI com `WKWebView` restrita à origem oficial do projeto.
- ActivityKit para Live Activities da jornada e estados contínuos.
- AlarmKit em iOS 26+ para countdowns de Pomodoro/foco e pausas planeadas.
- Widget Extension para Lock Screen e Dynamic Island.
- Fallback de notificação local já autorizada para sistemas sem AlarmKit.
- Projeto iOS reproduzível por XcodeGen em `ios/project.yml`.
- Documentação de instalação, assinatura, segurança, testes físicos e limitação de migração em `ios/README.md`.
- Testes unitários TypeScript para deadlines, pausas acumuladas, foco pausado e prioridade da pausa.

### Alterado

- O runtime seguro passa a instalar o coordenador iOS apenas quando o bridge nativo está disponível.
- Ao terminar/bloquear o runtime seguro, a apresentação nativa é limpa sem modificar os registos persistidos.

### Preservado

- A PWA permanece funcional em browsers sem bridge nativo.
- Jornada, pausa e foco continuam a usar os repositórios e regras existentes como fonte de verdade.
- Não foi introduzida dependência de Firebase/backend para esta integração.
- Não foi alterado o cálculo de tempo efetivamente trabalhado.
- Os dados existentes da PWA não são apagados nem migrados implicitamente para a `WKWebView`.

### Pendente de validação

- CI Web do Pull Request.
- Compilação Swift num Mac com Xcode/SDK iOS 26.
- Teste físico de Lock Screen, Dynamic Island, AlarmKit e permissões.
- Fluxo explícito e auditado de migração do cofre PWA para a aplicação nativa.

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
