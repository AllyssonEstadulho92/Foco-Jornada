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
| Jornada | Evento real `startedAt` / `endedAt` | Duração reconstruída dos timestamps registados. |
| Pausas | Horário planeado ou duração escolhida explicitamente | Não aplicar duração genérica quando a pausa não tem duração configurada. |
| Atividades | Eventos reais de início/fim | Cronómetro reconstruído dos timestamps; nunca de contagens acumuladas na UI. |
| Foco personalizado | Duração introduzida pelo utilizador | Converter para segundos uma única vez no início e guardar o valor efetivo da sessão. |

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
