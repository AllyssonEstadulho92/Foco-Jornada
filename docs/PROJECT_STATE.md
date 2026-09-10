# Estado do Projeto

Atualizado em: 2026-09-10

## Estado atual

O **Foco Jornada** continua a ser uma única PWA React/TypeScript responsiva para telemóvel, tablet e computador, publicada por GitHub Pages. A persistência operacional é local-first num cofre IndexedDB cifrado; a sincronização entre instalações usa Cloudflare Worker/Durable Objects e transporta apenas o cofre cifrado.

O código publicado em `main` inclui, entre outras correções já integradas:

- turnos noturnos corrigidos no PR #189;
- sincronização cifrada e associação de outro navegador nos PR #191–#194;
- correções do menu móvel e top bar nos PR #195–#199;
- logótipo animado de bootstrap nos PR #200–#201;
- automação de jornada e pausas pelo horário configurado no PR #202.

## PR #202 — integrado e publicado

O PR #202 foi integrado em `main` no commit `62b0cb44db31fff957a4486b7ac24634c721e3ea` e publicado pelo GitHub Pages através do commit de deploy `08dc9fae23f683fc7cadf80ada7a54b2545da8b2`.

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

- `src/application/journey/reconcileScheduledWorkday.ts` — caso de uso de reconciliação temporal;
- `src/presentation/components/ScheduledWorkdayAutomation.tsx` — gatilho global enquanto o runtime está ativo;
- `src/presentation/events/appDataChanged.ts` — evento interno após mutações automáticas;
- `src/presentation/hooks/useAppDataRefresh.ts` — atualização dos controllers/relatórios sem reload;
- testes dedicados em `reconcileScheduledWorkday.test.ts`.

A automação usa timestamps absolutos e IDs determinísticos para registos automáticos do mesmo dia. O intervalo de execução serve apenas para detetar marcos; não é a fonte da verdade temporal.

## Qualidade e segurança

O primeiro workflow do PR #202 foi bloqueado por advisories novos em dependências de desenvolvimento. A correção atualizou `vitest` para `5.0.0`, aplicou `sharp` `0.35.4` por `overrides` e restaurou as dependências diretas do lint (`eslint`, `eslint-plugin-react-hooks`, `eslint-plugin-react-refresh`).

No head final do PR, a pipeline **Qualidade** concluiu com sucesso em todas as etapas:

- instalação de dependências;
- `npm audit --audit-level=high` com 0 vulnerabilidades;
- typecheck;
- lint;
- testes automatizados;
- build;
- `wrangler deploy --dry-run`;
- smoke test de browser;
- criação do artefacto.

Depois do merge, o workflow **Qualidade** de `main` voltou a concluir com sucesso e o workflow **Publicar Foco & Jornada** também concluiu com sucesso. O GitHub Pages publicou o commit `08dc9fae23f683fc7cadf80ada7a54b2545da8b2`.

Não foram adicionados segredos, tokens, permissões, endpoints ou dados pessoais. Não houve alteração do schema do cofre, cifragem, autenticação ou protocolo de sincronização.

## Limitação conhecida da PWA

Uma PWA pode ter JavaScript totalmente suspenso quando o sistema a coloca em segundo plano ou quando é encerrada. Assim, não é tecnicamente possível prometer que um callback execute fisicamente às 08:00 ou 17:00 com a aplicação fechada.

A regra implementada é de **reconciliação**: quando a aplicação está ativa ou regressa ao primeiro plano, grava os timestamps exatos configurados. Não usa a hora tardia do callback como substituto do horário planeado.

Se a aplicação nunca tiver sido aberta durante o turno e só abrir depois da saída, não existe evidência suficiente para criar silenciosamente um dia completo; nesse caso não é criado registo automático retroativo.

## Riscos e validações ainda abertas

1. **Dispositivo real:** confirmar no telemóvel e computador que ambos carregam a versão publicada e usam o mesmo perfil/cofre sincronizado.
2. **Jornada 08:00–17:00:** validar em uso real que a jornada usa 08:00 como entrada planeada e termina com 17:00 como saída.
3. **Pausa real de 60 minutos:** definir manualmente o início/fim em **Definições → Pausas** e confirmar início, fim e total acumulado automáticos.
4. **Pomodoro:** confirmar que continua totalmente manual.
5. **Cross-device:** continuar a validação física móvel ↔ computador com o mesmo perfil/cofre; conflitos simultâneos continuam conservadores, sem `last-write-wins`.
6. **Timezone:** a área geral de jornada continua dependente do timezone local do browser; os dois dispositivos devem usar o mesmo timezone durante validações.

## Última alteração

PR #202 integrado e publicado: automação de jornada e pausas pelo `WorkSchedule`, dependências de qualidade corrigidas e pipelines de PR/`main` concluídas com sucesso.

## Próximo passo

1. abrir a versão publicada no telemóvel e no computador;
2. confirmar que ambos apresentam o mesmo perfil/cofre e o estado de sincronização esperado;
3. definir a pausa real de 60 minutos em **Definições → Pausas**;
4. validar a jornada 08:00–17:00 em utilização real;
5. reportar qualquer divergência visual, temporal ou de sincronização com captura e hora observada.
