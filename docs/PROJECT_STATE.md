# Estado do Projeto

Atualizado em: 2026-09-15

## Estado atual

O **Foco Jornada** é uma única PWA React/TypeScript responsiva para telemóvel, tablet e computador, publicada por GitHub Pages. A persistência operacional continua local-first num cofre IndexedDB cifrado; a sincronização entre instalações usa Cloudflare Worker/Durable Objects e transporta apenas o cofre cifrado.

Em `main` estão integrados, entre outros, turnos noturnos (PR #189), sincronização cifrada e associação de browsers (PR #191–#194), correções do shell móvel (PR #195–#199), bootstrap animado (PR #200–#201), automação de jornada/pausas (PR #202) e a ferramenta de saldo de férias (PR #203).

## Alteração em curso — acumulação mensal de férias (PR #204)

Branch: `feat/monthly-vacation-accrual-28`.

Objetivo: acrescentar à área de férias um contador mensal automático para a meta pessoal de **28 dias no final do ano**, sem substituir nem adulterar a referência laboral/contratual já existente.

### Regra implementada

- meta mensal pessoal por defeito: 28 dias anuais;
- crédito proporcional: `meta anual / 12` por mês concluído;
- o mês só entra no acumulado quando chega ao último dia desse mês;
- o cálculo não soma valores arredondados mês a mês: usa a fração exata da meta e arredonda apenas o valor apresentado a duas casas decimais;
- com meta 28: janeiro 2,33; fevereiro 4,67; março 7; junho 14; setembro 21; dezembro 28;
- saldo acumulado pessoal = acumulado mensal + transitados + ajustes − férias gozadas/registadas;
- saldo projetado também desconta férias futuras já planeadas;
- férias já marcadas na Calculadora de horas e no Mapa de turnos continuam deduplicadas por data.

### Separação obrigatória de conceitos

O contador de 28 dias é uma **projeção pessoal** solicitada pelo utilizador. Ele não altera automaticamente `annualEntitlementDays`, não afirma que 28 dias são um direito legal geral e não substitui informação confirmada por RH, contrato ou CCT.

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
- `src/main.tsx` — carregamento da nova folha de estilos.

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

### Base preservada

- anos normais: período anual configurado nunca inferior ao mínimo geral de 22 dias úteis;
- valores acima de 22 continuam dependentes de condição mais favorável confirmada;
- ano de admissão: política conservadora de 2 dias por mês completo de contrato, até 20 dias;
- férias da Calculadora de horas (`reason = ferias`) e do Mapa de turnos/plano mensal (`kind = vacation`) são reutilizadas;
- a mesma data encontrada em mais de uma fonte conta apenas uma vez;
- dias transitados, férias gozadas fora da aplicação e ajustes dependem de confirmação explícita.

## Qualidade, CI e dependências

Os workflows de qualidade e publicação usam Node 22 com `npm@11.6.0`, mantendo `npm audit --audit-level=high`, typecheck, lint, testes, build, Worker dry-run, smoke test Chromium e artefacto.

O PR #204 permanece em draft até o head final passar todos estes gates.

## Limitações conhecidas

### Contador mensal de 28 dias

- é uma projeção pessoal configurável, não um direito legal presumido;
- o mês corrente não é creditado antes do último dia;
- valores intermédios podem ter casas decimais porque 28 ÷ 12 não é inteiro;
- a apresentação usa até duas casas decimais, mas o cálculo de cada marco parte diretamente da meta anual para evitar drift de arredondamento;
- CCT, contrato, RH, férias transitadas ou regras especiais podem produzir um saldo oficial diferente.

### PWA/background

A PWA pode ter JavaScript suspenso quando fechada; a automação de jornada mantém a reconciliação por timestamps planeados implementada no PR #202.

## Riscos e validações ainda abertas

1. Concluir os quality gates do PR #204.
2. Validar visualmente a grelha de 12 meses em iPhone, Android, tablet e desktop.
3. Confirmar no fim de um mês real que o contador muda apenas após o fecho do mês.
4. Confirmar que dias marcados como férias reduzem o saldo pessoal sem duplicação entre fontes.
5. Confirmar persistência/sincronização de `monthlyAccrualTargetDays` entre telemóvel e computador com o mesmo cofre.

## Última alteração

PR #204 aberto com acumulação mensal automática para uma meta pessoal de 28 dias, preservando separadamente a referência laboral existente.

## Próximo passo

Concluir CI, corrigir qualquer regressão sem enfraquecer os gates e integrar/publicar apenas depois de todos os testes estarem verdes.