# Ferramenta de saldo de férias

Atualizado em: 2026-09-15

## Objetivo

Adicionar ao **Foco Jornada** uma ferramenta pessoal que mostre, com regras explícitas e auditáveis:

- direito de férias estimado para o ano em curso;
- dias transitados confirmados pelo utilizador;
- férias já gozadas/registadas na aplicação;
- férias planeadas para datas futuras;
- saldo disponível hoje;
- saldo projetado depois das férias planeadas;
- próxima data normal de vencimento do período anual.

A ferramenta não substitui o mapa oficial de férias, processamento de RH, contrato coletivo ou informação da entidade empregadora.

## Estado dos requisitos

### Confirmado

- A aplicação é uma PWA React/TypeScript única para telemóvel, tablet e computador.
- O cofre cifrado e `secureStorage` já fazem parte da persistência sincronizável.
- O mapa de turnos já suporta `kind: "vacation"` / **Férias**.
- A calculadora de horas já suporta `reason: "ferias"`.
- O Código do Trabalho prevê, em regra, um mínimo anual de 22 dias úteis e regras especiais no ano de admissão.

### Inferência aplicada

- O saldo deve reutilizar férias já registadas, em vez de obrigar a introduzir os mesmos dias novamente.
- Dias encontrados simultaneamente no mapa de turnos e na calculadora de horas devem contar uma única vez por data.

### Recomendação implementada

- Guardar apenas a configuração adicional da ferramenta em `secureStorage`, evitando migração do schema IndexedDB e preservando o modelo de cofre atual.
- Separar **saldo hoje** de **saldo após planeadas** para não tratar férias futuras como já gozadas.
- Não apresentar uma falsa acumulação mensal nos anos normais: o período anual vence, em regra, em 1 de janeiro.

### Por definir / depende de confirmação externa

- Dias acima do mínimo legal por contrato, CCT ou política empresarial.
- Dias transitados do ano anterior e respetiva validade/condições de gozo.
- Ajustes manuais decorrentes de informação oficial de RH.
- Situações especiais como impedimento prolongado, cessação do contrato ou regime coletivo específico.

## Regras de cálculo

### Ano normal após admissão

`direito do ano = max(22, dias anuais confirmados)`

`saldo hoje = direito do ano + transitados + ajustes - férias gozadas/registadas - férias manuais externas`

`saldo após planeadas = saldo hoje - férias futuras registadas`

O número de dias anuais configurado nunca é aceite abaixo de 22 para o regime geral representado pela ferramenta.

### Ano de admissão

A ferramenta usa uma política conservadora e determinística:

`direito adquirido estimado = min(20, meses completos de contrato × 2)`

O gozo é assinalado como disponível após seis meses completos de execução do contrato.

Existe discussão jurisprudencial sobre a proporcionalidade de meses incompletos no ano de admissão. Para não apresentar como certa uma interpretação discutida, a versão inicial usa **meses completos** e mostra essa limitação na interface.

### Dias registados

São agregadas e deduplicadas por `YYYY-MM-DD`:

1. ocorrências da calculadora de horas com `reason === "ferias"`;
2. dias do mapa de turnos com `kind === "vacation"`;
3. plano de vencimento associado ao mapa com `kind === "vacation"`.

Datas até ao dia atual contam como gozadas/registadas. Datas posteriores, dentro do mesmo ano, contam como planeadas.

## Persistência

Chave nova no `secureStorage`:

`foco-jornada-vacation-settings-v1`

Conteúdo:

- `employmentStartDate`;
- `annualEntitlementDays`;
- `carriedDays`;
- `manualTakenDays`;
- `adjustmentDays`.

Não é criado novo endpoint, tabela, token, segredo ou dado em texto simples fora do cofre existente.

## UX/UI

Rota: `#/ferias`

A página apresenta:

- cabeçalho com data de referência;
- cartões de saldo atual, saldo projetado, direito do ano e dias gozados;
- formulário de configuração com validações numéricas;
- explicação da regra do ano normal ou do ano de admissão;
- decomposição do cálculo;
- ligação direta ao mapa de turnos e à calculadora de horas;
- aviso explícito de que o saldo oficial deve ser confirmado com a entidade empregadora;
- ligações para fontes legais/institucionais.

A interface usa os tokens existentes, mantém alvos adequados a toque, foco por teclado, `forced-colors` e layout responsivo.

## Segurança e privacidade

- A data de admissão e os valores de férias são guardados no mesmo cofre cifrado já utilizado pela aplicação.
- Nenhum dado novo é enviado diretamente para um backend em texto simples.
- Não são adicionadas credenciais, segredos ou permissões.
- A leitura de registos existentes é local e deduplicada antes do cálculo.

## Testes mínimos

- período anual normal de 22 dias;
- valor contratual superior a 22;
- rejeição lógica de valor anual inferior a 22;
- ano de admissão com meses completos;
- limite de 20 dias no ano de admissão;
- período de espera de seis meses;
- deduplicação da mesma data em fontes diferentes;
- separação entre dias passados e dias futuros;
- data de admissão futura;
- saldo negativo visível como alerta, sem truncar silenciosamente para zero.

## Critérios de aceitação

1. A rota `#/ferias` abre em mobile e desktop.
2. O utilizador consegue guardar a configuração sem alterar o schema do cofre.
3. Férias já registadas noutras áreas são detetadas automaticamente e sem duplicação por data.
4. O saldo atual e o projetado têm fórmulas transparentes.
5. A ferramenta não descreve o direito anual normal como acumulação mensal.
6. O ano de admissão é tratado separadamente.
7. Testes, typecheck, lint e build permanecem verdes.
8. `PROJECT_STATE.md`, `ARCHITECTURE.md`, `DECISIONS.md`, `TODO.md` e `CHANGELOG.md` são atualizados antes da integração.

## Fontes oficiais usadas

- Código do Trabalho, artigos 237.º a 240.º — Diário da República, versão consolidada em vigor: https://diariodarepublica.pt/dr/legislacao-consolidada/lei/2009-34546475-46747075
- Artigo 238.º — duração mínima de 22 dias úteis: https://diariodarepublica.pt/dr/legislacao-consolidada/lei/2009-34546475-56360079
- gov.pt — Trabalhar em Portugal, férias e subsídio de férias: https://www.gov.pt/guias/trabalhar-em-portugal

As fontes confirmam o enquadramento geral. Situações particulares devem ser confrontadas com o contrato, instrumento de regulamentação coletiva aplicável e informação oficial de RH/ACT.
