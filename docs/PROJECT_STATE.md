# Estado do Projeto

Atualizado em: 2026-09-15

## Estado atual

O **Foco Jornada** é uma única PWA React/TypeScript responsiva para telemóvel, tablet e computador, publicada por GitHub Pages. A persistência operacional continua local-first num cofre IndexedDB cifrado; a sincronização entre instalações usa Cloudflare Worker/Durable Objects e transporta apenas o cofre cifrado.

Em `main` estão integrados, entre outros, turnos noturnos (PR #189), sincronização cifrada e associação de browsers (PR #191–#194), correções do shell móvel (PR #195–#199), bootstrap animado (PR #200–#201), automação de jornada/pausas (PR #202), a ferramenta de saldo de férias (PR #203), a acumulação mensal pessoal de férias (PR #204) e a contagem padrão de dias úteis nas férias (PR #205).

## PR #205 — contar apenas dias úteis padrão nas férias

Estado: **integrado, validado por CI e publicado**.

- PR integrado em `main` no commit `2e309975a38e0df975bf1958879fefb3c3b4b514`.
- Workflow **Qualidade #1113** passou integralmente no head final do PR.
- Workflow **Qualidade #1114** passou integralmente depois do merge em `main`.
- Workflow **Publicar Foco & Jornada #244** concluiu com sucesso.
- Build publicado na raiz de `main` no commit `26e8dcffca10589846dad4577e96ad03ea1e0608`.
- Workflow **pages build and deployment #785** concluiu com sucesso para o commit publicado.

### Regra entregue

- as datas de férias continuam agregadas e deduplicadas por `YYYY-MM-DD`;
- segunda a sexta-feira entram como dias de férias gozados/planeados;
- sábado e domingo ficam identificados como datas de fim de semana e não reduzem o saldo;
- a classificação passado/futuro é aplicada depois do filtro de dias úteis;
- o cálculo usa componentes UTC da data civil para evitar deriva de timezone/DST;
- o resultado é aplicado tanto ao saldo laboral como ao saldo mensal pessoal;
- `recordedIgnoredWeekendDays` é derivado em runtime para auditoria/testes, sem nova persistência.

### Caso de aceitação confirmado

Período **24/08/2026 a 06/09/2026**, inclusive:

- 14 dias de calendário;
- 10 dias úteis de segunda a sexta-feira;
- 4 dias de fim de semana ignorados: 29/08, 30/08, 05/09 e 06/09;
- resultado esperado e coberto por teste: **10 dias de férias descontados**.

### Limite conhecido

A regra atual trata a semana padrão segunda–sexta. Feriados nacionais/municipais, descanso semanal diferente, turnos especiais e outros calendários laborais ainda não são reinterpretados automaticamente; quando forem relevantes, exigem regra confirmada/calendário próprio antes de automatizar.

## PR #204 — acumulação mensal pessoal de férias

Estado: **integrado e publicado**.

- PR integrado em `main` no commit `131e6a721f03c3f5d9e22f1ebea885593607c315`.
- Build publicado na raiz de `main` no commit `9629239c2ccde1cac925d00a3197d645cc8ed308`.
- Workflow **Qualidade #1105** passou integralmente no head final do PR.
- Workflow **Qualidade #1106** passou integralmente depois do merge em `main`.
- Workflow **Publicar Foco & Jornada #237** concluiu com sucesso.
- Workflow **pages build and deployment #772** concluiu com sucesso para o commit publicado.

### Objetivo entregue

A área `#/ferias` inclui um contador mensal automático para uma meta pessoal anual configurável, com **28 dias por defeito**.

### Regra implementada

- meta pessoal por defeito: 28 dias anuais;
- crédito proporcional: `meta anual / 12` por mês de calendário concluído;
- o mês corrente só entra no acumulado no respetivo último dia;
- o cálculo não soma parcelas arredondadas: cada marco deriva diretamente da meta anual;
- a apresentação usa no máximo duas casas decimais;
- com meta 28: janeiro 2,33; fevereiro 4,67; março 7; junho 14; setembro 21; dezembro 28;
- saldo mensal pessoal = acumulado bruto + transitados + ajustes − férias gozadas/registadas − férias manuais externas;
- saldo mensal projetado também desconta férias futuras planeadas;
- dias de férias vindos de várias áreas continuam deduplicados por data.

Em 15 de setembro, por exemplo, janeiro a agosto estão concluídos: a projeção bruta é **18,67 dias**. Em 30 de setembro passa para **21 dias**.

### Separação obrigatória de conceitos

O contador de 28 dias é uma **projeção pessoal configurável**. Ele não altera automaticamente `annualEntitlementDays`, não afirma que 28 dias são um direito legal geral e não substitui informação confirmada por RH, contrato ou CCT.

A área mantém em paralelo:

- contador mensal pessoal;
- referência anual laboral configurada;
- regra específica do ano de admissão;
- dias transitados e ajustes confirmados.

### Implementação técnica

Alterados/criados:

- `src/domain/vacation/VacationBalance.ts` — acumulação mensal, saldo pessoal e cronograma de 12 meses;
- `src/domain/vacation/VacationBalance.test.ts` — testes de fecho mensal, dezembro = 28, precisão de arredondamento e contagem útil;
- `src/presentation/pages/VacationBalancePage.tsx` — cartões e grelha mensal;
- `src/styles/vacation-accrual.css` — layout responsivo da grelha de meses;
- `src/main.tsx` — carregamento da nova folha de estilos;
- `docs/VACATION-TRACKER.md` — especificação com separação entre projeção pessoal e referência laboral.

A configuração acrescenta `monthlyAccrualTargetDays` à mesma chave `foco-jornada-vacation-settings-v1`. Registos antigos sem o novo campo recebem 28 como valor por defeito, sem migração destrutiva.

### Segurança

Não foi criado novo endpoint, tabela IndexedDB, token, segredo, permissão, mecanismo de autenticação ou alteração de protocolo de sincronização. A nova preferência continua dentro do `secureStorage`/cofre cifrado existente.

## PR #203 — ferramenta de saldo de férias

Estado: **integrado e publicado**.

- PR integrado em `main` no commit `225e808a416ac6e18f23c1b7178e99886d7cecbf`.
- Build de publicação gerado no commit `d5dee6cd9418eaf4483ca4422c17b8331d915445`.
- Workflow **Qualidade #1097** passou integralmente no head final do PR.
- Workflow **Qualidade #1098** passou integralmente depois do merge em `main`.
- Workflow **Publicar Foco & Jornada #236** concluiu com sucesso.
- Workflow **pages build and deployment #767** concluiu build e deploy com sucesso para o commit publicado.

### Base laboral preservada

- anos normais: período anual configurado nunca inferior ao mínimo geral de 22 dias úteis;
- valores acima de 22 continuam dependentes de condição mais favorável confirmada;
- ano de admissão: política conservadora de 2 dias por mês completo de contrato, até 20 dias;
- férias da Calculadora de horas (`reason = ferias`) e do Mapa de turnos/plano mensal (`kind = vacation`) são reutilizadas;
- a mesma data encontrada em mais de uma fonte conta apenas uma vez;
- dias transitados, férias gozadas fora da aplicação e ajustes dependem de confirmação explícita.

## Qualidade, CI e dependências

Os workflows de qualidade e publicação usam Node 22 com `npm@11.6.0`, mantendo `npm audit --audit-level=high`, typecheck, lint, testes, build, Worker dry-run, smoke test Chromium e artefacto.

No PR #205 e em `main`, todos esses gates concluíram com sucesso. A publicação e o deploy do build final também concluíram com sucesso.

## Limitações conhecidas

### Contador mensal de 28 dias

- é uma projeção pessoal configurável, não um direito legal presumido;
- o mês corrente não é creditado antes do último dia;
- valores intermédios podem ter casas decimais porque 28 ÷ 12 não é inteiro;
- a apresentação usa até duas casas decimais, mas o cálculo de cada marco parte diretamente da meta anual para evitar drift de arredondamento;
- CCT, contrato, RH, férias transitadas ou regras especiais podem produzir um saldo oficial diferente.

### Contagem de dias úteis

- sábado/domingo são excluídos automaticamente da contagem padrão;
- feriados e regimes semanais especiais ainda exigem confirmação/ajuste específico;
- dias manuais continuam a ser responsabilidade do valor confirmado introduzido pelo utilizador.

### PWA/background

A projeção mensal é derivada quando a página é calculada e não depende de timers em background. A automação de jornada continua sujeita às limitações de suspensão da PWA e usa a reconciliação por timestamps planeados do PR #202.

## Riscos e validações ainda abertas

1. Validar em dispositivo real que 24/08/2026–06/09/2026 apresenta 10 dias descontados quando o intervalo está marcado.
2. Confirmar visualmente a grelha de 12 meses em iPhone, Android, tablet e desktop.
3. Confirmar persistência/sincronização de `monthlyAccrualTargetDays` entre telemóvel e computador com o mesmo cofre.
4. Validar feriados e regimes semanais especiais antes de qualquer automatização adicional.
5. Continuar as validações físicas pendentes da automação de jornada e da sincronização cross-device.

## Última alteração

PR #205 integrado e publicado: a ferramenta de férias passa a descontar apenas segunda a sexta-feira no regime semanal padrão, com teste de regressão que confirma **24/08/2026–06/09/2026 = 10 dias úteis**.

## Próximo passo

Validar o intervalo real na PWA instalada em telemóvel/computador e, se necessário, evoluir depois para um calendário laboral que trate feriados e regimes de descanso semanal diferentes sem inferir regras não confirmadas.