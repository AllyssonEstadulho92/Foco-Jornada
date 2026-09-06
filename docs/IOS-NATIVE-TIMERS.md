# Integração nativa iPhone — Jornada, Pausa e Foco

Atualizado em: 2026-09-06

## Objetivo

Permitir que o Foco & Jornada continue a usar a aplicação Web/PWA como fonte funcional e de dados, acrescentando uma camada nativa iOS para apresentar temporizadores no ecrã bloqueado e na Dynamic Island.

A integração não tenta controlar o temporizador da aplicação Relógio da Apple. O Foco & Jornada mantém os seus próprios registos e o iOS apresenta o respetivo estado através das APIs oficiais da plataforma.

## Âmbito desta fase

- Manter React/TypeScript e a persistência atual sem reescrever a aplicação.
- Adicionar uma ponte opcional Web -> iOS através de `WKScriptMessageHandler`.
- Jornada sem prazo fixo: Live Activity própria com tempo decorrido.
- Foco/Pomodoro em execução: countdown nativo através de AlarmKit em iOS 26 ou posterior.
- Pausa com duração planeada: countdown nativo através de AlarmKit em iOS 26 ou posterior.
- Foco pausado ou pausa sem duração definida: Live Activity própria, sem inventar um deadline.
- iOS anterior a 26: Live Activity + notificação local para deadlines conhecidos; não existe AlarmKit.
- A versão Web/PWA continua operacional quando não existe a ponte nativa.

## Fora do âmbito desta fase

- Não controlar a aplicação Relógio/Timer da Apple.
- Não permitir, nesta primeira fase, que ações executadas no ecrã bloqueado alterem diretamente a base de dados Web. Isto evita divergência entre o estado nativo e a fonte de verdade da aplicação.
- Não adicionar Firebase nem outro backend apenas para esta integração.
- Não alterar as regras de cálculo de jornada, pausa ou Pomodoro existentes.

## Fonte de verdade

A fonte de verdade continua a ser o domínio atual da aplicação:

- Jornada: `startedAt` / `endedAt`.
- Pausa: `startedAt` e, quando configurado, `plannedDurationMinutes`.
- Foco: `startedAt`, `plannedDurationSeconds`, `totalPausedSeconds`, `pausedAt` e `status`.

O bridge transmite timestamps absolutos. O lado nativo deriva o valor apresentado desses timestamps; não acumula segundos como fonte de verdade.

## Contrato Web -> iOS

O browser embebido expõe o handler:

```text
window.webkit.messageHandlers.focoJornadaTimer.postMessage(snapshot)
```

Payload versão 1:

```json
{
  "version": 1,
  "command": "sync",
  "journey": {
    "id": "...",
    "startedAt": "2026-09-06T08:00:00.000Z"
  },
  "phase": {
    "kind": "focus",
    "id": "...",
    "title": "Pomodoro · Foco",
    "startedAt": "2026-09-06T10:00:00.000Z",
    "deadlineAt": "2026-09-06T10:25:00.000Z",
    "state": "running"
  }
}
```

`phase` pode ser `focus` ou `break`. Se não existir fase ativa, é `null`. Um deadline só é transmitido quando existe uma duração real configurada.

## Comportamento nativo

### Jornada

Enquanto existe uma jornada e não existe countdown nativo prioritário, o iOS apresenta uma Live Activity com o tempo decorrido desde `startedAt`.

### Foco/Pomodoro

Quando o foco está `running` e existe um deadline futuro:

1. o bridge recebe o snapshot;
2. em iOS 26+, AlarmKit agenda um countdown com a duração restante;
3. o sistema pode apresentar o countdown no Lock Screen/Dynamic Island;
4. quando o foco é pausado na aplicação, o countdown AlarmKit é cancelado e o estado pausado passa para a Live Activity;
5. ao retomar, é criado um novo countdown a partir do novo deadline persistido.

### Pausa

Se `plannedDurationMinutes` estiver configurado, é criado um countdown AlarmKit em iOS 26+. Se a pausa não tiver duração definida, não é inventado um limite: a Live Activity apresenta apenas tempo decorrido.

Quando o tempo planeado da pausa termina, o registo da pausa não é terminado automaticamente. Mantém-se a regra atual: a pausa só termina quando o utilizador a encerra na aplicação.

## Segurança

- O `WKWebView` só navega internamente no domínio oficial configurado para o Foco & Jornada.
- Mensagens do bridge são aceites apenas do frame principal e da origem autorizada.
- O código nativo valida versão, comando, IDs, datas e duração máxima antes de criar atividade/alarme.
- Não são colocados passwords, tokens, chaves ou segredos no projeto iOS.
- URLs externas abrem fora da WebView.

## Compatibilidade

| Plataforma | Resultado |
| --- | --- |
| iOS 26+ | AlarmKit para countdowns + ActivityKit para estado contínuo |
| iOS 18–25 | ActivityKit + notificação local para deadlines conhecidos |
| PWA instalada no iPhone | Continua com o comportamento Web atual; sem AlarmKit/Live Activity própria |
| Desktop/Android Web | Bridge ausente; comportamento atual preservado |

## Critérios de aceitação

1. A PWA continua a compilar e funcionar sem `window.webkit`.
2. Iniciar uma jornada envia um snapshot com `startedAt` real.
3. Iniciar Pomodoro envia um deadline absoluto correto.
4. Pausar foco não inventa novo tempo; preserva o restante calculado a partir do estado persistido.
5. Pausa com duração planeada envia deadline; pausa sem duração não envia deadline.
6. O lado nativo rejeita mensagens de outra origem.
7. Bloquear o iPhone não altera a fonte de verdade temporal.
8. Terminar jornada/foco/pausa limpa o estado nativo correspondente.
9. Nenhuma alteração desta integração modifica os cálculos históricos existentes.

## Validação obrigatória antes de produção iOS

- Compilar com Xcode que inclua o SDK iOS 26 para validar AlarmKit.
- Testar num iPhone real autorização AlarmKit, Lock Screen, Dynamic Island e retorno à aplicação.
- Testar dispositivo sem Dynamic Island.
- Testar iOS 18–25 para o fallback ActivityKit/notificação local.
- Confirmar preservação do cofre local/WebKit entre atualizações da aplicação.

## Referências oficiais

- Apple Developer — ActivityKit: https://developer.apple.com/documentation/activitykit
- Apple Developer — AlarmKit: https://developer.apple.com/documentation/alarmkit
- Apple Developer — WKScriptMessageHandler: https://developer.apple.com/documentation/webkit/wkscriptmessagehandler
- Apple Human Interface Guidelines — Live Activities: https://developer.apple.com/design/human-interface-guidelines/live-activities
