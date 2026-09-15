# Estado do Projeto

Atualizado em: 2026-09-15

## Estado atual

O **Foco Jornada** é uma única PWA React/TypeScript responsiva para telemóvel, tablet e computador, publicada por GitHub Pages. A persistência operacional continua local-first num cofre IndexedDB cifrado; a sincronização entre instalações usa Cloudflare Worker/Durable Objects e transporta apenas o cofre cifrado.

Em `main` estão integrados, entre outros, turnos noturnos (PR #189), sincronização cifrada e associação de browsers (PR #191–#194), correções do shell móvel (PR #195–#199), bootstrap animado (PR #200–#201), automação de jornada/pausas (PR #202), a ferramenta de saldo de férias (PR #203) e a acumulação mensal pessoal de férias (PR #204).

## PR #204 — acumulação mensal pessoal de férias

Estado: **integrado e publicado**.

- PR integrado em `main` no commit `131e6a721f03c3f5d9e22f1ebea885593607c315`.
- Build publicado na raiz de `main` no commit `9629239c2ccde1cac925d00a3197d645cc8ed308`.
- Workflow **Qualidade #1105** passou integralmente no head final do PR.
- Workflow **Qualidade #1106** passou integralmente depois do merge em `main`.
- Workflow **Publicar Foco & Jornada #237** concluiu com sucesso.
- Workflow **pages build and deployment #772** concluiu com sucesso para o commit publicado.

### Objetivo entregue

A área `#/ferias` inclui agora um contador mensal automático para uma meta pessoal anual configurável, com **28 dias por defeito**.

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
- `src/domain/vacation/VacationBalance.test.ts` — testes de fecho mensal, dezembro = 28 e precisão de arredondamento;
- `src/presentation/pages/VacationBalancePage.tsx` — novos cartões e grelha mensal;
- `src/styles/vacation-accrual.css` — layout responsivo da grelha de meses;
- `src/main.tsx` — carregamento da nova folha de estilos;
- `docs/VACATION-TRACKER.md` — especificação atualizada com a separação entre projeção pessoal e referência laboral.

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

O PR #204 passou todos estes gates antes da integração e novamente em `main` depois do merge.

## Limitações conhecidas

### Contador mensal de 28 dias

- é uma projeção pessoal configurável, não um direito legal presumido;
- o mês corrente não é creditado antes do último dia;
- valores intermédios podem ter casas decimais porque 28 ÷ 12 não é inteiro;
- a apresentação usa até duas casas decimais, mas o cálculo de cada marco parte diretamente da meta anual para evitar drift de arredondamento;
- CCT, contrato, RH, férias transitadas ou regras especiais podem produzir um saldo oficial diferente.

### PWA/background

A projeção mensal é derivada quando a página é calculada e não depende de timers em background. A automação de jornada continua sujeita às limitações de suspensão da PWA e usa a reconciliação por timestamps planeados do PR #202.

## Riscos e validações ainda abertas

1. Validar visualmente a grelha de 12 meses em iPhone, Android, tablet e desktop.
2. Confirmar no fim de um mês real que o contador muda apenas após o fecho do mês.
3. Confirmar que dias marcados como férias reduzem o saldo pessoal sem duplicação entre fontes.
4. Confirmar persistência/sincronização de `monthlyAccrualTargetDays` entre telemóvel e computador com o mesmo cofre.
5. Continuar as validações físicas pendentes da automação de jornada e da sincronização cross-device.

## Última alteração

PR #204 integrado e publicado: contador mensal pessoal de férias com meta padrão de 28 dias, cronograma anual, cálculo sem drift de arredondamento e separação explícita da referência laboral.

## Próximo passo

Validar a nova área **Férias** em dispositivo real e confirmar a contagem com os dados de férias efetivamente marcados pelo utilizador.