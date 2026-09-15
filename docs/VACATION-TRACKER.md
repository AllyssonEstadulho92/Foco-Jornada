# Ferramenta de saldo de férias

Atualizado em: 2026-09-15

## Objetivo

A área **Férias** do Foco Jornada mantém dois cálculos explicitamente separados:

1. **Referência laboral/contratual** — direito anual configurado, ano de admissão, dias transitados, férias gozadas e planeadas.
2. **Projeção mensal pessoal** — contador automático que acompanha uma meta anual configurável, por defeito **28 dias**, distribuída pelos meses concluídos.

Esta separação permite acompanhar a progressão pretendida pelo utilizador sem apresentar a meta pessoal de 28 dias como um direito legal ou contratual automaticamente adquirido.

A ferramenta não substitui o mapa oficial de férias, processamento de RH, contrato coletivo ou informação da entidade empregadora.

## Estado dos requisitos

### Confirmado

- A aplicação é uma PWA React/TypeScript única para telemóvel, tablet e computador.
- O cofre cifrado e `secureStorage` já fazem parte da persistência sincronizável.
- O mapa de turnos já suporta `kind: "vacation"` / **Férias**.
- A calculadora de horas já suporta `reason: "ferias"`.
- O Código do Trabalho prevê, em regra, um mínimo anual de 22 dias úteis e regras especiais no ano de admissão.
- O utilizador pretende acompanhar uma meta pessoal de 28 dias ao final do ano, somada progressivamente pelos meses.
- Para a contagem padrão de dias gozados, sábado e domingo não devem ser descontados como dias úteis de férias.

### Inferência aplicada

- O saldo deve reutilizar férias já registadas, em vez de obrigar a introduzir os mesmos dias novamente.
- Dias encontrados simultaneamente no mapa de turnos e na calculadora de horas devem contar uma única vez por data.
- A progressão mensal pessoal deve ser calculada, não gravada como 12 registos artificiais.

### Decisão implementada

- Guardar a configuração adicional da ferramenta em `secureStorage`, sem migração do schema IndexedDB.
- Separar **saldo laboral** de **saldo mensal pessoal**.
- Separar **saldo acumulado hoje** de **saldo após férias planeadas**.
- Não descrever a meta pessoal de 28 dias como regra legal: nos anos normais, a referência laboral continua a tratar o período anual como vencendo, em regra, em 1 de janeiro.
- Creditar a projeção pessoal apenas no fecho de cada mês civil.
- Deduplicar as datas registadas e, no regime semanal padrão suportado, descontar apenas segunda a sexta-feira; sábado e domingo permanecem reconhecidos como datas registadas, mas não reduzem o saldo.

## Referência laboral/contratual

### Ano normal após admissão

`direito do ano = max(22, dias anuais confirmados)`

`saldo laboral hoje = direito do ano + transitados + ajustes - férias gozadas/registadas - férias manuais externas`

`saldo laboral após planeadas = saldo laboral hoje - férias futuras registadas`

O número de dias anuais configurado nunca é aceite abaixo de 22 para o regime geral representado pela ferramenta. Um valor superior só deve ser usado quando existir condição mais favorável confirmada.

### Ano de admissão

A ferramenta usa uma política conservadora e determinística:

`direito adquirido estimado = min(20, meses completos de contrato × 2)`

O gozo é assinalado como disponível após seis meses completos de execução do contrato.

Existe discussão jurisprudencial sobre a proporcionalidade de meses incompletos no ano de admissão. Para não apresentar como certa uma interpretação discutida, esta versão usa **meses completos** e mostra essa limitação na interface.

## Projeção mensal pessoal de 28 dias

### Regra

Por defeito:

`meta anual pessoal = 28 dias`

`acumulado bruto = meta anual pessoal × meses de calendário concluídos / 12`

`saldo mensal hoje = acumulado bruto + transitados + ajustes - férias gozadas/registadas - férias manuais externas`

`saldo mensal após planeadas = saldo mensal hoje - férias futuras registadas`

O mês corrente só entra no acumulado no respetivo último dia. Assim, em 15 de setembro apenas janeiro a agosto estão concluídos; em 30 de setembro, setembro também passa a contar.

### Marcos com meta de 28 dias

| Mês concluído | Acumulado |
| --- | ---: |
| Janeiro | 2,33 dias |
| Fevereiro | 4,67 dias |
| Março | 7,00 dias |
| Abril | 9,33 dias |
| Maio | 11,67 dias |
| Junho | 14,00 dias |
| Julho | 16,33 dias |
| Agosto | 18,67 dias |
| Setembro | 21,00 dias |
| Outubro | 23,33 dias |
| Novembro | 25,67 dias |
| Dezembro | 28,00 dias |

### Precisão numérica

A aplicação **não soma 2,33 repetidamente**, porque isso introduziria erro acumulado. Cada marco é recalculado diretamente:

`meta × número do mês / 12`

O resultado é arredondado apenas para apresentação, até duas casas decimais. Desta forma, dezembro termina exatamente em 28 dias quando a meta é 28.

## Dias registados

São agregadas e deduplicadas por `YYYY-MM-DD`:

1. ocorrências da calculadora de horas com `reason === "ferias"`;
2. dias do mapa de turnos com `kind === "vacation"`;
3. plano de vencimento associado ao mapa com `kind === "vacation"`.

Depois da deduplicação, o cálculo aplica a semana útil padrão suportada nesta versão:

- segunda a sexta-feira: entram na contagem de férias gozadas/planeadas;
- sábado e domingo: não reduzem o saldo, mesmo quando fazem parte de um intervalo de férias marcado na aplicação.

Exemplo validado para 2026:

- período marcado: **24 de agosto a 6 de setembro**, inclusive;
- 14 datas civis no intervalo;
- 10 dias úteis de segunda a sexta-feira;
- 4 dias de fim de semana ignorados: 29 e 30 de agosto, 5 e 6 de setembro;
- resultado: **10 dias de férias descontados**.

Datas até ao dia atual contam como gozadas/registadas. Datas posteriores, dentro do mesmo ano, contam como planeadas. A mesma data não é descontada duas vezes.

### Limite desta regra

A exclusão automática implementada é apenas para sábado/domingo na semana padrão. Feriados nacionais/municipais, descanso semanal diferente, turnos especiais e outras regras de calendário ainda não são reinterpretados automaticamente pelo módulo. Quando esses casos alterarem o saldo oficial, deve ser usado um ajuste confirmado ou feita uma evolução específica do calendário laboral antes de automatizar.

## Persistência

Chave no `secureStorage`:

`foco-jornada-vacation-settings-v1`

Conteúdo:

- `employmentStartDate`;
- `annualEntitlementDays`;
- `monthlyAccrualTargetDays` — 28 por defeito;
- `carriedDays`;
- `manualTakenDays`;
- `adjustmentDays`.

Configurações anteriores ao PR #204 que não tenham `monthlyAccrualTargetDays` recebem 28 como fallback de leitura. Não existe migração destrutiva.

Não é criado novo endpoint, tabela, token, segredo ou dado em texto simples fora do cofre existente.

## UX/UI

Rota: `#/ferias`

A página apresenta:

- data de referência;
- **Saldo acumulado** pela projeção mensal;
- **Acumulado bruto** por meses concluídos;
- **Após planeadas**;
- **Meta anual**;
- cronograma de janeiro a dezembro com estados **Concluído**, **Em curso** e **Futuro**;
- formulário para meta pessoal, data de admissão, referência anual confirmada, transitados, férias externas e ajustes;
- secção separada de referência laboral;
- ligação direta ao mapa de turnos e à calculadora de horas;
- aviso explícito de que o saldo oficial deve ser confirmado com a entidade empregadora.

A interface usa os tokens existentes, mantém alvos adequados a toque, foco por teclado, `forced-colors` e layout responsivo.

## Segurança e privacidade

- A data de admissão, meta pessoal e restantes valores são guardados no mesmo cofre cifrado já utilizado pela aplicação.
- Nenhum dado novo é enviado diretamente para um backend em texto simples.
- Não são adicionadas credenciais, segredos ou permissões.
- A leitura de registos existentes é local e deduplicada antes do cálculo.
- A projeção mensal é derivada em runtime; não cria 12 eventos persistidos nem exige timer em background.

## Testes mínimos

### Referência laboral

- período anual normal de 22 dias;
- valor contratual superior a 22;
- rejeição lógica de valor anual inferior a 22;
- ano de admissão com meses completos;
- limite de 20 dias no ano de admissão;
- período de espera de seis meses;
- deduplicação da mesma data em fontes diferentes;
- separação entre dias passados e dias futuros;
- data de admissão futura;
- exclusão de sábado e domingo da contagem automática;
- período 24/08/2026–06/09/2026 com 14 datas civis resulta em 10 dias úteis descontados e 4 dias de fim de semana ignorados.

### Projeção mensal

- antes do último dia do mês, esse mês não conta;
- no último dia, o mês passa a contar;
- 15 de setembro com meta 28 = 18,67 dias brutos;
- 30 de setembro = 21 dias;
- 31 de dezembro = 28 dias;
- os 12 marcos não apresentam drift de arredondamento;
- férias gozadas reduzem o saldo mensal;
- férias futuras reduzem apenas o saldo mensal projetado.

## Critérios de aceitação

1. A rota `#/ferias` abre em mobile e desktop.
2. O utilizador consegue guardar a meta pessoal sem alterar o schema do cofre.
3. Férias já registadas noutras áreas são detetadas automaticamente e sem duplicação por data.
4. Um intervalo 24/08/2026–06/09/2026 desconta 10 dias úteis, não 14 dias civis.
5. Sábado e domingo marcados como férias não reduzem o saldo na semana padrão.
6. O contador mostra claramente o acumulado por meses concluídos.
7. Com meta 28, dezembro termina exatamente em 28 dias.
8. A interface distingue projeção pessoal de referência laboral/contratual.
9. O ano de admissão continua tratado separadamente.
10. Testes, typecheck, lint, build, Worker dry-run e smoke test permanecem verdes antes da integração.
11. `PROJECT_STATE.md`, `ARCHITECTURE.md`, `DECISIONS.md`, `TODO.md` e `CHANGELOG.md` permanecem atualizados.

## Fontes oficiais da referência laboral

- Código do Trabalho, artigos 237.º a 240.º — Diário da República, versão consolidada em vigor: https://diariodarepublica.pt/dr/legislacao-consolidada/lei/2009-34546475-46747075
- Artigo 238.º — duração mínima de 22 dias úteis: https://diariodarepublica.pt/dr/legislacao-consolidada/lei/2009-34546475-56360079
- gov.pt — Trabalhar em Portugal, férias e subsídio de férias: https://www.gov.pt/guias/trabalhar-em-portugal

Estas fontes fundamentam apenas a **referência laboral**. A meta mensal de 28 dias é uma configuração pessoal da aplicação e deve ser confrontada com RH, contrato ou instrumento de regulamentação coletiva quando o utilizador pretender tratá-la como saldo oficial.