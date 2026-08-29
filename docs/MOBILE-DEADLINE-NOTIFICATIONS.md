# Notificações móveis dos deadlines

## Objetivo

Todos os módulos que possuem um prazo real de conclusão usam o mesmo mecanismo de notificação. O prazo é sempre um timestamp absoluto; a notificação não cria, arredonda nem prolonga o tempo configurado.

## Deadlines atualmente ligados

- Medicação: horários ativos registados na aplicação, incluindo uma toma adiada para uma nova hora explícita.
- Pomodoro/foco: `startedAt + plannedDurationSeconds + totalPausedSeconds` enquanto a sessão está em execução.
- Pausas da jornada: `startedAt + plannedDurationMinutes` quando existe duração planeada.
- Sessão glo: `endsAt` capturado no snapshot da sessão e derivado do preset técnico selecionado.
- Horário de trabalho: hora de saída da configuração `WorkSchedule`, apenas enquanto existe uma jornada ativa.

Atividades e jornadas sem hora de fim planeada não recebem um deadline inventado. Continuam a medir duração por timestamps reais até o utilizador terminar a operação.

## Entrega

1. O coordenador recolhe deadlines persistidos/configurados e agenda o próximo despertar.
2. Ao atingir ou ultrapassar `deadlineAt`, o evento é guardado no centro de notificações da aplicação.
3. Se a permissão do sistema estiver concedida, a aplicação usa `ServiceWorkerRegistration.showNotification()` para apresentar também uma notificação persistente do sistema.
4. A entrega é deduplicada por um identificador que inclui a identidade do evento e o timestamp real do deadline.
5. Ao regressar de suspensão, `visibilitychange`, `focus`, `pageshow` e alterações relevantes forçam reconciliação imediata.
6. Para medicação, o coordenador revê ocorrências de ontem, hoje e amanhã; uma ocorrência passada sem estado confirmado pode ser recuperada na abertura seguinte sem inventar um novo horário.

## Permissão

A permissão é pedida apenas através do botão explícito **Ativar notificações** no centro de notificações. A aplicação não dispara um pedido de permissão inesperado durante o arranque.

## Limitação da plataforma

Uma PWA estática não consegue garantir execução JavaScript exatamente no segundo de um deadline quando o browser/PWA foi totalmente terminado pelo sistema. Timers em páginas podem ser atrasados e um service worker não fica continuamente ativo.

Para receber um aviso enquanto a aplicação não está em execução é necessário Web Push: um serviço externo envia uma mensagem à subscrição e o browser inicia o service worker quando a mensagem chega. Isso exige um componente servidor/push e muda a fronteira local-first do projeto, portanto não é simulado com `setTimeout`.

A implementação local atual garante que:

- o timestamp nunca deriva de decrementos acumulados;
- atrasos de execução não alteram o deadline original;
- quando a aplicação volta a executar, deadlines vencidos são reconciliados imediatamente;
- nenhum horário clínico é criado para compensar uma execução suspensa.

## Fontes técnicas

- MDN, Using the Notifications API: https://developer.mozilla.org/en-US/docs/Web/API/Notifications_API/Using_the_Notifications_API
- MDN, `ServiceWorkerRegistration.showNotification()`: https://developer.mozilla.org/en-US/docs/Web/API/ServiceWorkerRegistration/showNotification
- MDN, Push API: https://developer.mozilla.org/en-US/docs/Web/API/Push_API
- MDN, Offline and background operation in PWAs: https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/Guides/Offline_and_background_operation
