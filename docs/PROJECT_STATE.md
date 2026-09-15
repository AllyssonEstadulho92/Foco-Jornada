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
- contagem automática de férias apenas em dias úteis padrão segunda–sexta (PR #205);
- evolução intramensal da projeção pessoal em tempo real (PR #206).

## PR #207 — contenção visual dos cartões mensais de férias

Estado: **em validação** na branch `fix/vacation-card-containment`.

### Problema confirmado

Na grelha **Evolução por mês**, o cabeçalho de um cartão podia exceder a respetiva largura quando o nome do mês e o badge de estado/percentagem competiam pelo mesmo espaço. O caso observado em setembro mostrava `Em curso · xx%` a ultrapassar visualmente a borda do cartão.

### Correção implementada

- todos os cartões mensais permitem quebra segura no cabeçalho;
- nome do mês, estado, percentagem, valor, descrições e barra de progresso ficam limitados à largura do cartão;
- `min-width: 0` e `max-width: 100%` são aplicados nos elementos flex/grid relevantes;
- o badge deixa de usar `white-space: nowrap` e passa a poder quebrar sem truncar informação;
- removida a estratégia de `text-overflow: ellipsis` no estado mensal;
- o resumo superior da própria secção e o cabeçalho do painel também ficam protegidos contra overflow;
- abaixo de 520 px a grelha mensal e o resumo passam para uma coluna, preservando legibilidade;
- `forced-colors` e `prefers-reduced-motion` permanecem suportados.

### Regressão

Foi adicionado `src/styles/vacation-card-containment.test.ts` para impedir o regresso de regras que forcem o conteúdo para fora dos cartões ou voltem a truncar o estado mensal.

Não há alteração em cálculos, dados, persistência, sincronização, autenticação, API ou dependências.

## PR #206 — evolução mensal de férias em tempo real

Estado: **integrado e publicado**.

- PR #206 integrado em `main` no commit `15f4df15308a145f9d303cf56d699837f9516303`;
- **Qualidade #1122** passou integralmente no head final do PR;
- **Qualidade #1123** passou integralmente após o merge em `main`;
- **Publicar Foco & Jornada #245** concluiu com sucesso;
- build publicado na raiz de `main` no commit `05e32a99bd0479fdb417876cb9a31f305a32866d`;
- **pages build and deployment #790** concluiu com sucesso para o build publicado.

### Regra entregue

A referência laboral permanece separada e inalterada. A evolução em tempo real aplica-se apenas à projeção pessoal configurável.

- cada mês continua a representar exatamente `meta anual / 12`;
- meses terminados mantêm marcos fechados;
- o mês atual usa a fração de calendário já decorrida, incluindo a fração do dia local;
- `acumulado vivo = meta × (meses anteriores + progresso do mês atual) / 12`;
- saldo vivo desconta férias já gozadas e inclui transitados/ajustes;
- saldo vivo projetado desconta também férias futuras planeadas;
- os cálculos derivam diretamente da meta anual, evitando drift por arredondamentos intermédios.

### Atualização temporal

A página `#/ferias`:

- atualiza a referência temporal a cada 60 segundos enquanto está montada;
- recalcula imediatamente quando a janela recupera foco;
- recalcula quando a página volta a ficar visível;
- não depende de execução contínua em background.

Se iOS/Android suspender a PWA, ao regressar é usado o instante atual real. Não são fabricados ticks que teriam ocorrido enquanto JavaScript esteve suspenso.

### UI entregue

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

### Compatibilidade e segurança

`monthlyAccruedDays` continua a representar apenas meses fechados. Os valores vivos são derivados em runtime; não foi criada nova configuração persistida, migração, tabela, endpoint, token, segredo, permissão, dependência ou alteração de autenticação/sincronização.

## Estado da contagem de dias úteis — PR #205

Estado: **integrado e publicado**.

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

O PR #206 não substitui estes marcos; interpola apenas o mês atual até ao respetivo marco.

## Estado da ferramenta de saldo — PR #203

Estado: **integrado e publicado**.

A referência laboral mantém:

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

O primeiro ensaio do PR #206 expôs um arredondamento intermédio de 0,0001 dia no valor restante do mês. A causa foi corrigida no domínio: o restante passou a derivar diretamente da taxa mensal e do progresso exato, em vez de subtrair um valor já arredondado. O head final e `main` passaram todos os gates.

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

1. Concluir os quality gates do PR #207 e validar visualmente que nenhum mês extravasa a respetiva secção em desktop, tablet e telemóvel.
2. Validar em iPhone real que o valor vivo muda ao longo do tempo e é recalculado ao regressar à PWA.
3. Validar Android/Chrome e tablet para a grelha/barra de progresso.
4. Confirmar que suspensão e retoma não causam saltos incorretos de data/timezone.
5. Confirmar sincronização normal da configuração de férias entre telemóvel e computador; a evolução viva não deve exigir estado temporal novo de sync.
6. Continuar validações físicas pendentes da automação de jornada e sincronização cross-device.

## Última alteração

PR #207 em validação: correção de contenção para impedir nome, badge, percentagem, valor ou texto de qualquer cartão mensal de ultrapassar a respetiva secção.

## Próximo passo

Concluir CI do PR #207, integrar/publicar com gates verdes e validar visualmente a grelha mensal em iPhone, Android/tablet e desktop.