# Estado do Projeto

Atualizado em: 2026-09-15

## Estado atual

O **Foco Jornada** é uma única PWA React/TypeScript responsiva para telemóvel, tablet e computador, distribuída por GitHub Pages. A persistência operacional continua local-first num cofre IndexedDB cifrado; a sincronização opcional entre instalações usa Cloudflare Worker/Durable Objects e transporta apenas o cofre cifrado.

Em `main` estão integrados, entre outros:

- turnos noturnos (PR #189);
- sincronização cifrada e associação de browsers (PR #191–#194);
- correções do shell móvel (PR #195–#199);
- bootstrap animado (PR #200–#201);
- automação de jornada/pausas (PR #202);
- ferramenta de saldo de férias (PR #203);
- acumulação mensal pessoal de férias com meta de 28 dias por defeito (PR #204);
- contagem automática de férias apenas em dias úteis padrão segunda–sexta (PR #205).

## Alteração em curso — evolução mensal de férias em tempo real

Branch: `feat/vacation-live-monthly-progress`.

PR: **#206**.

### Objetivo

Aprimorar `#/ferias` para que o mês atual deixe de parecer parado até ao último dia e passe a mostrar a evolução da meta pessoal ao longo do próprio mês.

### Regra implementada

A referência laboral permanece separada e inalterada. A evolução em tempo real aplica-se apenas à projeção pessoal configurável.

- cada mês continua a representar exatamente `meta anual / 12`;
- meses já terminados mantêm os respetivos marcos fechados;
- o mês atual usa a fração de calendário já decorrida, incluindo a fração do dia local;
- `acumulado vivo = meta × (meses anteriores + progresso do mês atual) / 12`;
- saldo vivo desconta férias já gozadas e inclui transitados/ajustes;
- saldo vivo projetado desconta também férias futuras planeadas;
- o cálculo é derivado diretamente da meta anual e não do último valor mostrado, evitando drift de arredondamento.

### Atualização temporal

A página usa a hora local do dispositivo e:

- atualiza `now` a cada 60 segundos enquanto a página está montada;
- recalcula imediatamente quando a janela recupera foco;
- recalcula quando a página volta a ficar visível;
- não depende de execução contínua em background.

Se iOS/Android suspender a PWA, ao regressar é usado o instante atual real. Não são fabricados ticks que teriam ocorrido enquanto o JavaScript esteve suspenso.

### UI entregue na branch

- cartões **Saldo agora**, **Acumulado agora**, **Após planeadas** e **Progresso do mês**;
- hora da última atualização;
- meta acumulada no fecho do mês atual;
- ganho já acumulado no mês;
- valor restante até ao fecho;
- ritmo diário aproximado;
- barra de progresso por mês;
- mês atual com percentagem, acumulado vivo, ganho e restante;
- valores vivos com até quatro casas decimais;
- suporte preservado para mobile/tablet/desktop, `forced-colors` e `prefers-reduced-motion`.

### Compatibilidade

`monthlyAccruedDays` continua a representar apenas meses fechados. Foram acrescentados campos derivados para a visualização viva, entre eles:

- `monthlyLiveAccruedDays`;
- `monthlyLiveAvailableBalanceDays`;
- `monthlyLiveProjectedBalanceDays`;
- `currentAccrualMonthProgress` / `currentAccrualMonthProgressPercent`;
- `currentAccrualMonthEarnedDays`;
- `currentAccrualMonthRemainingDays`;
- `currentAccrualMonthDailyRate`.

Não foi criada nova configuração persistida, migração, tabela, endpoint, token, segredo ou permissão.

## Estado da contagem de dias úteis — PR #205

Estado: **integrado e publicado**.

- PR #205 integrado em `main` no commit `2e309975a38e0df975bf1958879fefb3c3b4b514`;
- build publicado no commit `26e8dcffca10589846dad4577e96ad03ea1e0608`;
- quality gates em `main` concluídos com sucesso;
- publicação e GitHub Pages concluídas com sucesso.

Caso de regressão preservado:

- 24/08/2026–06/09/2026 = 14 datas civis;
- 10 dias úteis contabilizados;
- sábado/domingo ignorados no desconto padrão.

Limite: feriados, descanso semanal diferente e escalas especiais ainda não são inferidos automaticamente.

## Estado da acumulação mensal — PR #204

Estado: **integrado e publicado**.

A meta pessoal continua configurável, com 28 dias por defeito. Os marcos de referência permanecem:

- março: 7 dias;
- junho: 14 dias;
- setembro: 21 dias;
- dezembro: 28 dias.

A evolução em tempo real do PR #206 não substitui estes marcos; apenas interpola o mês atual até ao respetivo marco.

## Estado da ferramenta de saldo — PR #203

Estado: **integrado e publicado**.

A referência laboral continua a manter:

- anos normais com mínimo geral suportado de 22 dias úteis;
- valor superior apenas quando explicitamente configurado como condição mais favorável confirmada;
- ano de admissão com política conservadora de 2 dias por mês completo, até 20;
- marco de seis meses para o gozo no ano de admissão;
- dias transitados, férias externas e ajustes apenas por confirmação explícita;
- férias reutilizadas do Mapa de turnos, plano mensal e Calculadora de horas;
- deduplicação por data.

## Qualidade, CI e dependências

Stack atual:

- React 19;
- TypeScript 5.9;
- Vite 7;
- Vitest 5;
- Node 22 no CI;
- npm 11.6.0 fixado nos workflows;
- `npm audit --audit-level=high`, typecheck, lint, testes, build, Worker dry-run e smoke test Chromium como gates.

O PR #206 permanece em draft até o head final, incluindo documentação, concluir todos os gates com sucesso.

## Segurança

A alteração do PR #206:

- não cria novo endpoint;
- não altera autenticação/autorização;
- não altera o protocolo de sincronização;
- não persiste a hora atual nem os valores vivos;
- não cria segredo, token ou permissão;
- não adiciona dependência;
- mantém a configuração de férias dentro de `secureStorage`/cofre cifrado.

## Limitações conhecidas

### Projeção pessoal

- a meta de 28 dias é pessoal/configurável e não representa automaticamente o direito oficial;
- valores vivos são uma interpolação de planeamento, não aquisição legal diária;
- o saldo oficial continua dependente de RH, contrato, CCT e situações especiais.

### Tempo real na PWA

- atualização normal enquanto a página está ativa: 1 minuto;
- o sistema operativo pode suspender JavaScript em background;
- ao regressar, a aplicação reconcilia imediatamente pelo relógio local atual;
- não existe garantia de callback por minuto com a app encerrada/suspensa.

### Calendário laboral

- sábado/domingo são excluídos automaticamente na semana padrão;
- feriados nacionais/municipais e descanso semanal diferente ainda exigem regra/calendário confirmado.

## Riscos e validações ainda abertas

1. Concluir os quality gates do PR #206 no head final.
2. Validar em iPhone real que o valor vivo muda ao longo do tempo e é recalculado ao regressar à PWA.
3. Validar Android/Chrome e tablet para a nova grelha/barra de progresso.
4. Confirmar que suspensão e retoma não causam saltos incorretos de data/timezone.
5. Confirmar sincronização normal da configuração de férias entre telemóvel e computador; a evolução viva não deve exigir dados novos de sync.
6. Continuar validações físicas pendentes da automação de jornada e sincronização cross-device.

## Última alteração

Implementada no PR #206 a interpolação do mês atual em tempo real, mantendo os marcos mensais fechados e a referência laboral intacta.

## Próximo passo

Concluir documentação e quality gates do PR #206; com CI verde, integrar/publicar e validar a evolução viva num dispositivo real.
