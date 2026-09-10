# Política de automatização temporal — Foco & Jornada

## Objetivo

Todo o valor temporal usado pela aplicação deve ter uma origem identificável. A interface pode calcular diferenças entre timestamps, mas não pode inventar horários, intervalos clínicos, durações de trabalho ou durações de sessão sem uma configuração explícita ou uma fonte oficial aplicável.

## Regra técnica comum

Os temporizadores devem guardar `startedAt` e/ou `deadlineAt` absolutos. A apresentação `HH:MM:SS` é sempre reconstruída por `deadlineAt - Date.now()`. `setTimeout` e `setInterval` servem apenas para pedir uma nova renderização; nunca são a fonte da verdade. Ao regressar de segundo plano, `visibilitychange`, `focus` e `pageshow` obrigam a uma resincronização imediata.

Esta regra existe porque browsers podem atrasar timers em separadores inativos. Referência técnica: MDN, `Window.setTimeout()`, secção sobre throttling em separadores inativos — https://developer.mozilla.org/en-US/docs/Web/API/Window/setTimeout.

## Matriz de autoridade

| Secção | Origem do tempo | Regra |
| --- | --- | --- |
| Medicação | Horários e quantidades registados pelo utilizador a partir da prescrição | Nunca criar um intervalo clínico por defeito. A próxima toma é a próxima ocorrência válida configurada. |
| Sessão do dispositivo de sticks | Preset do modelo/modo baseado na documentação oficial do fabricante já gravada no módulo | Aquecimento e duração são capturados no início da sessão e convertidos em timestamps absolutos. |
| Pomodoro | Preset clássico da técnica oficial | 25 min de foco e 5 min de pausa são suportados pela documentação oficial. Valores diferentes são configuração explícita da aplicação/utilizador, não “recomendação oficial”. |
| Horário de trabalho | Configuração de `WorkSchedule` | Início, fim e pausas vêm exclusivamente do horário gravado. Se faltar um valor, apresentar “não configurado”; não preencher automaticamente. |
| Jornada | Evento real `startedAt` / `endedAt` | Duração reconstruída dos timestamps registados. Quando a automação do horário está ativa, estes eventos podem ser criados/encerrados com os timestamps exatos do `WorkSchedule`, nunca com um valor estimado. |
| Pausas | Horário planeado ou duração escolhida explicitamente | Não aplicar duração genérica quando a pausa não tem duração configurada. Pausas planeadas podem ser reconciliadas automaticamente a partir do respetivo início/fim configurado. |
| Atividades | Eventos reais de início/fim | Cronómetro reconstruído dos timestamps; nunca de contagens acumuladas na UI. |
| Foco personalizado | Duração introduzida pelo utilizador | Converter para segundos uma única vez no início e guardar o valor efetivo da sessão. |

## Automação de jornada e pausas pelo horário configurado

A partir de 2026-09-10, a PWA pode reconciliar automaticamente a jornada com o `WorkSchedule` persistido, sem tornar o Pomodoro automático.

Regras:

1. antes da entrada planeada, não é criada qualquer jornada;
2. entre a entrada e a saída, se não existir jornada nesse dia, a aplicação pode criar a jornada com `startedAt` exatamente igual à entrada configurada;
3. uma jornada ativa é terminada com `endedAt` exatamente igual à saída configurada quando a aplicação deteta que esse limite foi atingido ou ultrapassado;
4. se o utilizador já terminou manualmente uma jornada nesse dia, a automação não cria uma segunda jornada;
5. se a aplicação só for aberta pela primeira vez depois da saída e não existir qualquer jornada desse dia, não é fabricada uma jornada completa retroativa;
6. cada pausa ativada em `WorkSchedule` usa exclusivamente o respetivo `startTime` e `endTime`; uma pausa de 60 minutos deve resultar de uma configuração explícita como, por exemplo, `14:00–15:00`, e não de uma duração hardcoded;
7. ao regressar depois de uma pausa já concluída, a aplicação pode reconstruir o registo com os timestamps configurados, desde que exista uma jornada válida do dia;
8. uma sessão de foco em execução pode ser pausada ao entrar numa pausa de trabalho, mas a automação nunca inicia Pomodoro, foco personalizado ou ciclos de foco;
9. o encerramento automático da jornada reutiliza o mesmo caso de uso que encerra de forma consistente pausa/atividade e cancela foco ainda aberto;
10. a automação não altera históricos já encerrados nem reinterpreta configurações futuras como se sempre tivessem existido.

### Limitação de execução da PWA

Browsers móveis podem suspender completamente JavaScript quando a PWA está em segundo plano ou encerrada. Por isso, a aplicação não promete que um callback executará fisicamente às `08:00`, `14:00`, `15:00` ou `17:00` enquanto o processo estiver suspenso. A garantia implementada é diferente: quando o runtime está ativo ou volta ao primeiro plano, reconcilia o estado usando os timestamps exatos configurados.

Assim, os intervalos periódicos servem apenas para detetar que um marco temporal foi atravessado; não são fonte de verdade e não acumulam segundos em memória.

## Fontes externas verificadas

- Pomodoro® Technique, temporizador clássico oficial: https://www.pomodorotechnique.com/solutions/pomodoro-classic-timer/ — confirma o ciclo clássico de 25 minutos e pausa de 5 minutos. Verificado em 2026-08-30.
- MDN Web Docs, `Window.setTimeout()`: https://developer.mozilla.org/en-US/docs/Web/API/Window/setTimeout — documenta atrasos/throttling de timers em separadores inativos. Verificado em 2026-08-30.
- As fontes oficiais do fabricante usadas para os presets do dispositivo permanecem gravadas em `GloSessionTimer.ts`, juntamente com a data de verificação e a nota de cada preset.

## Critérios de aceitação

1. Nenhum relógio regressivo depende de decrementos sucessivos em memória.
2. O tempo é recalculado após suspensão/retoma do browser.
3. Timestamps inválidos produzem erro ou estado indisponível; nunca um valor estimado silenciosamente.
4. Uma hora configurada não é reinterpretada como recomendação clínica.
5. Durações externas têm URL e data de verificação quando a aplicação as apresenta como oficiais.
6. Durações sem fonte externa exata são identificadas como configuração do utilizador/aplicação.
7. A alteração de uma configuração futura não reescreve eventos históricos já registados.
8. A automação não inicia a jornada antes da entrada configurada.
9. A saída automática usa o fim configurado como timestamp, mesmo quando a deteção ocorre depois.
10. Uma pausa planeada usa início/fim configurados e não uma duração genérica.
11. Uma jornada terminada manualmente não é reiniciada no mesmo dia.
12. O Pomodoro permanece totalmente manual.
