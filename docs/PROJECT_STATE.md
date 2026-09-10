# Estado do Projeto

Atualizado em: 2026-09-10

## Estado atual

O **Foco Jornada** continua a ser uma única PWA React/TypeScript responsiva para telemóvel, tablet e computador, publicada por GitHub Pages. A persistência operacional é local-first num cofre IndexedDB cifrado; a sincronização entre instalações usa Cloudflare Worker/Durable Objects e transporta apenas o cofre cifrado.

O código publicado em `main` inclui, entre outras correções já integradas:

- turnos noturnos corrigidos no PR #189;
- sincronização cifrada e associação de outro navegador nos PR #191–#194;
- correções do menu móvel e top bar nos PR #195–#199;
- logótipo animado de bootstrap nos PR #200–#201.

## Alteração em curso — PR #202

Branch: `feat/automatic-workday-schedule`

Objetivo: reduzir ações manuais previsíveis na jornada sem alterar o Pomodoro.

### Comportamento implementado

- `WorkSchedule` continua a ser a fonte única do horário planeado;
- antes da entrada configurada não é criada jornada;
- durante o turno, se ainda não existir jornada nesse dia, a aplicação cria-a com `startedAt` exatamente igual à entrada configurada;
- uma jornada ativa é encerrada com `endedAt` exatamente igual à saída configurada quando esse limite é atingido ou ultrapassado;
- se o utilizador terminar manualmente a jornada antes da saída, a automação não cria uma segunda jornada nesse dia;
- se a aplicação for aberta pela primeira vez apenas depois da saída e não existir jornada do dia, não é fabricada uma jornada completa retroativa;
- pausas ativadas em **Definições → Pausas** usam os respetivos `startTime`/`endTime` e passam a ser reconciliadas automaticamente;
- uma pausa de 60 minutos continua a ser definida manualmente pelo utilizador através do horário de início/fim; não existe um descanso de 60 minutos hardcoded;
- se a PWA regressar depois de uma pausa planeada já terminada, o registo pode ser reconstruído com os timestamps configurados;
- foco em execução pode ser pausado ao entrar numa pausa de trabalho;
- Pomodoro e foco personalizado permanecem totalmente manuais e nunca são iniciados pela automação;
- o encerramento automático reutiliza `finishJourneyWithProductivityState`, preservando o tratamento existente de pausa, atividade e foco abertos.

### Implementação técnica

Novos elementos:

- `src/application/journey/reconcileScheduledWorkday.ts` — caso de uso de reconciliação temporal;
- `src/presentation/components/ScheduledWorkdayAutomation.tsx` — gatilho global enquanto o runtime está ativo;
- `src/presentation/events/appDataChanged.ts` — evento interno após mutações automáticas;
- `src/presentation/hooks/useAppDataRefresh.ts` — atualização dos controllers/relatórios sem reload;
- testes dedicados em `reconcileScheduledWorkday.test.ts`.

A automação usa timestamps absolutos e IDs determinísticos para registos automáticos do mesmo dia. O intervalo de execução serve apenas para detetar marcos; não é a fonte da verdade temporal.

## Limitação conhecida da PWA

Uma PWA pode ter JavaScript totalmente suspenso quando o sistema a coloca em segundo plano ou quando é encerrada. Assim, não é tecnicamente possível prometer que um callback execute fisicamente às 08:00 ou 17:00 com a aplicação fechada.

A regra implementada é de **reconciliação**: quando a aplicação está ativa ou regressa ao primeiro plano, grava os timestamps exatos configurados. Não usa a hora tardia do callback como substituto do horário planeado.

Se a aplicação nunca tiver sido aberta durante o turno e só abrir depois da saída, não existe evidência suficiente para criar silenciosamente um dia completo; nesse caso não é criado registo automático retroativo.

## Segurança e qualidade

O primeiro workflow **Qualidade** do PR #202 parou em `npm audit` antes de typecheck/testes. A falha não foi causada pelo código da automação: em 2026-09-10 foram detetados advisories novos nas dependências de desenvolvimento `vitest/@vitest/mocker` e `sharp` transitivo de Wrangler.

Correção adicionada ao PR:

- `vitest` atualizado de `3.2.7` para `5.0.0`;
- override de `sharp` para `0.35.4`.

A integração permanece bloqueada até um novo workflow confirmar:

- `npm audit --audit-level=high`;
- typecheck;
- lint;
- testes;
- build;
- `wrangler deploy --dry-run`;
- smoke test de browser.

Não foram adicionados segredos, tokens, permissões, endpoints ou dados pessoais. Não houve alteração do schema do cofre, cifragem, autenticação ou protocolo de sincronização.

## Riscos e validações ainda abertas

1. **CI do PR #202:** confirmar que as atualizações de segurança eliminam os advisories e que Vitest 5 não introduz regressões de testes.
2. **Execução real hoje:** após publicação, confirmar no dispositivo que o horário configurado é reconhecido e que a jornada reflete a entrada prevista; se a publicação ocorrer depois das 08:00 mas antes das 17:00, a reconciliação deve usar 08:00 como `startedAt`.
3. **Pausa real de 60 minutos:** definir manualmente o início/fim em **Definições → Pausas** e confirmar início, fim e total acumulado.
4. **Saída real:** confirmar que a jornada ativa termina com timestamp 17:00 sem exigir toque manual.
5. **Pomodoro:** confirmar que não é iniciado pela automação e continua dependente de ação explícita.
6. **Cross-device:** continuar a validação física móvel ↔ computador com o mesmo perfil/cofre; conflitos simultâneos continuam conservadores, sem `last-write-wins`.
7. **Timezone:** a área geral de jornada continua dependente do timezone local do browser; os dois dispositivos devem usar o mesmo timezone durante validações.
8. **Android/tablet:** permanecem pendentes validações físicas de alguns ajustes do shell móvel anteriores.

## Última alteração

PR #202: implementação de reconciliação automática da jornada e pausas pelo `WorkSchedule`, testes de regressão e atualização das dependências de desenvolvimento sinalizadas pelo `npm audit`.

## Próximo passo

1. aguardar e inspecionar o novo workflow **Qualidade** do PR #202;
2. corrigir qualquer falha de typecheck/lint/teste sem enfraquecer os quality gates;
3. atualizar `ARCHITECTURE.md`, `TODO.md` e `CHANGELOG.md` com o estado final do PR;
4. marcar o PR como pronto apenas com CI verde;
5. integrar em `main` e confirmar o workflow de publicação GitHub Pages;
6. validar no dispositivo real a jornada 08:00–17:00 e a pausa manual de 60 minutos.
