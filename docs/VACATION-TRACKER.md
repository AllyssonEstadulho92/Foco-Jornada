# Ferramenta de saldo de férias

Atualizado em: 2026-09-15

## Objetivo

A área **Férias** do Foco Jornada mantém dois cálculos explicitamente separados:

1. **Referência laboral/contratual** — direito anual configurado, ano de admissão, dias transitados, férias gozadas e planeadas.
2. **Projeção mensal pessoal** — contador automático que acompanha uma meta anual configurável, por defeito **28 dias**, com marcos mensais e evolução do mês atual em tempo real.

Esta separação permite acompanhar a progressão pretendida pelo utilizador sem apresentar a meta pessoal de 28 dias como um direito legal ou contratual automaticamente adquirido.

A ferramenta não substitui o mapa oficial de férias, processamento de RH, contrato coletivo ou informação da entidade empregadora.

## Estado dos requisitos

### Confirmado

- A aplicação é uma PWA React/TypeScript única para telemóvel, tablet e computador.
- O cofre cifrado e `secureStorage` já fazem parte da persistência sincronizável.
- O mapa de turnos já suporta `kind: "vacation"` / **Férias**.
- A calculadora de horas já suporta `reason: "ferias"`.
- O Código do Trabalho prevê, em regra, um mínimo anual de 22 dias úteis e regras especiais no ano de admissão.
- O utilizador pretende acompanhar uma meta pessoal de 28 dias ao final do ano.
- O utilizador pretende também ver a evolução do mês corrente sem esperar pelo fecho do mês.
- Para a contagem padrão de dias gozados, sábado e domingo não devem ser descontados como dias úteis de férias.
- Todo o conteúdo da grelha mensal deve permanecer dentro da respetiva secção e cartão, sem cortar percentagens ou informação textual.

### Inferência aplicada

- O saldo deve reutilizar férias já registadas, em vez de obrigar a introduzir os mesmos dias novamente.
- Dias encontrados simultaneamente no mapa de turnos e na calculadora de horas devem contar uma única vez por data.
- A progressão pessoal deve ser calculada em runtime, não gravada como eventos artificiais.

### Decisão implementada

- Guardar apenas a configuração da ferramenta em `secureStorage`, sem migração do schema IndexedDB.
- Separar **saldo laboral** de **saldo mensal pessoal**.
- Separar **saldo acumulado agora** de **saldo após férias planeadas**.
- Não descrever a meta pessoal de 28 dias como regra legal.
- Manter os marcos mensais exatos em `meta × número do mês / 12`.
- Interpolar apenas o mês atual pela fração do mês já decorrida, incluindo a fração do dia local.
- Atualizar o valor vivo a cada minuto enquanto a página está ativa e recalcular ao recuperar foco/visibilidade.
- Não depender de timers em background para manter precisão.
- Deduplicar as datas registadas e, no regime semanal padrão suportado, descontar apenas segunda a sexta-feira; sábado e domingo permanecem reconhecidos como datas registadas, mas não reduzem o saldo.
- Permitir que cabeçalhos, badges e valores dos cartões mensais façam reflow dentro da própria largura, em vez de extravasarem ou serem truncados.

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

## Projeção mensal pessoal em tempo real

### Marcos mensais

Por defeito:

`meta anual pessoal = 28 dias`

Cada mês corresponde a exatamente:

`parcela mensal = meta anual pessoal / 12`

Os marcos de fecho continuam a ser calculados diretamente:

`marco do mês = meta anual pessoal × número do mês / 12`

Para meta de 28 dias:

| Fecho | Marco acumulado |
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

### Evolução do mês atual

A versão em tempo real preserva os marcos acima, mas não deixa o mês atual visualmente parado até ao último dia.

Para a data/hora local atual:

`progressoDoMes = (dias completos já decorridos + fração do dia atual) / número de dias do mês`

`ganhoNoMesAtual = parcela mensal × progressoDoMes`

`acumuladoVivo = meta anual × (meses anteriores + progressoDoMes) / 12`

`saldoVivo = acumuladoVivo + transitados + ajustes - férias gozadas/registadas - férias manuais externas`

`saldoVivoApósPlaneadas = saldoVivo - férias futuras registadas`

Exemplo estrutural para setembro:

- janeiro a agosto permanecem como meses fechados;
- setembro progride de 0% a 100% ao longo do próprio mês;
- o marco de setembro continua a ser exatamente 21 dias para uma meta anual de 28;
- antes do instante real do fim do mês, o valor vivo aproxima-se do marco sem o ultrapassar;
- no fecho, o valor vivo e o marco fechado coincidem.

### Precisão numérica

A aplicação não soma parcelas arredondadas. Tanto os marcos como o valor vivo derivam diretamente da meta anual.

- marcos mensais: apresentação até duas casas decimais;
- valores em tempo real: apresentação até quatro casas decimais;
- percentagem do mês: apresentação até duas casas decimais;
- cálculos vivos: recalculados a partir da meta, não do valor apresentado anteriormente.

Isto evita drift e garante que dezembro fecha exatamente na meta anual configurada.

## Atualização temporal da PWA

A página `#/ferias` mantém um relógio local apenas enquanto está montada:

- atualização periódica: **1 minuto**;
- atualização imediata ao recuperar `window.focus`;
- atualização imediata quando `document.visibilityState` volta a ativo.

A aplicação não afirma executar continuamente em segundo plano. iOS e outros sistemas podem suspender JavaScript de PWAs. Quando a página volta ao primeiro plano, o cálculo é reconstruído a partir da data/hora atual; não depende de callbacks que deveriam ter ocorrido durante a suspensão.

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

A exclusão automática implementada é apenas para sábado/domingo na semana padrão. Feriados nacionais/municipais, descanso semanal diferente, turnos especiais e outras regras de calendário ainda não são reinterpretados automaticamente pelo módulo.

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

A evolução em tempo real não acrescenta campos persistidos. `asOfDayProgress`, percentagens, ritmos e saldos vivos são valores derivados em runtime.

Configurações anteriores ao PR #204 que não tenham `monthlyAccrualTargetDays` recebem 28 como fallback de leitura. Não existe migração destrutiva.

Não é criado novo endpoint, tabela, token, segredo ou dado em texto simples fora do cofre existente.

## UX/UI

Rota: `#/ferias`

A página apresenta:

- data e hora da última atualização local;
- **Saldo agora**;
- **Acumulado agora**;
- **Após planeadas**;
- **Progresso do mês atual**;
- meta acumulada no fecho do mês;
- ganho já obtido no mês;
- valor restante no mês;
- ritmo diário aproximado;
- cronograma de janeiro a dezembro com estados **Concluído**, **Em curso** e **Futuro**;
- barra de progresso por mês;
- no mês atual, acumulado vivo, percentagem, ganho e restante;
- formulário para meta pessoal, data de admissão, referência anual confirmada, transitados, férias externas e ajustes;
- secção separada de referência laboral;
- ligação direta ao mapa de turnos e à calculadora de horas.

### Contenção dos cartões mensais

A grelha mensal deve manter toda a informação dentro da própria secção, inclusive com zoom ou texto ampliado.

- cabeçalho de cada cartão pode quebrar linha;
- badge `Concluído` / `Em curso · xx%` / `Futuro` não força largura externa ao cartão;
- nomes, valores e descrições usam limites de largura e quebra segura;
- não se usa `text-overflow: ellipsis` para esconder percentagem/estado;
- a barra de progresso fica limitada à largura do cartão;
- abaixo de 520 px a grelha fica em uma coluna e o cabeçalho organiza mês/estado verticalmente;
- os 12 meses usam a mesma regra de contenção, não apenas o mês corrente.

A interface usa os tokens existentes, mantém alvos adequados a toque, foco por teclado, `forced-colors`, `prefers-reduced-motion` e layout responsivo.

## Segurança e privacidade

- A data de admissão, meta pessoal e restantes valores continuam no mesmo cofre cifrado.
- O relógio local e os valores vivos não são persistidos nem enviados como nova telemetria.
- Nenhum dado novo é enviado diretamente para um backend em texto simples.
- Não são adicionadas credenciais, segredos, permissões ou dependências.
- A leitura de registos existentes é local e deduplicada antes do cálculo.
- A correção de contenção do PR #207 é apenas CSS/testes e não modifica dados ou regras de domínio.

## Testes mínimos

### Referência laboral e dias úteis

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

- os marcos fechados continuam sem drift;
- 30 de setembro no fecho = 21 dias para meta 28;
- 31 de dezembro no fecho = 28 dias;
- o mês atual expõe percentagem e ganho proporcional;
- o último dia não é tratado como completamente fechado antes do fim real do dia quando existe informação horária;
- saldo vivo desconta férias já gozadas;
- saldo vivo projetado desconta também férias futuras;
- o cartão do mês atual expõe acumulado vivo e meta de fecho separadamente.

### Regressão visual estrutural

- cabeçalho mensal contém `flex-wrap`;
- badge mensal permite quebra e não usa `white-space: nowrap`;
- valor/texto/barra respeitam `max-width: 100%`;
- grelha passa a uma coluna abaixo de 520 px;
- não existe `text-overflow: ellipsis` no estado mensal.

## Critérios de aceitação

1. A rota `#/ferias` abre em mobile e desktop.
2. O utilizador consegue guardar a meta pessoal sem alterar o schema do cofre.
3. Férias já registadas noutras áreas são detetadas automaticamente e sem duplicação por data.
4. Um intervalo 24/08/2026–06/09/2026 desconta 10 dias úteis, não 14 dias civis.
5. Sábado e domingo marcados como férias não reduzem o saldo na semana padrão.
6. A evolução do mês atual é visível antes do fecho do mês.
7. O valor vivo atualiza a cada minuto quando a página está ativa e é reconciliado ao regressar à app.
8. Os marcos mensais permanecem exatos; dezembro termina exatamente na meta anual.
9. A interface distingue projeção pessoal de referência laboral/contratual.
10. Nenhum nome de mês, badge, percentagem, valor, descrição ou barra de progresso ultrapassa a borda do respetivo cartão.
11. O estado mensal permanece legível sem ser truncado com reticências.
12. Nenhum novo dado sensível ou estado temporal é persistido para suportar o relógio vivo.
13. Testes, typecheck, lint, build, Worker dry-run e smoke test permanecem verdes antes da integração.
14. `PROJECT_STATE.md`, `ARCHITECTURE.md`, `DECISIONS.md`, `TODO.md` e `CHANGELOG.md` permanecem atualizados.

## Fontes oficiais da referência laboral

- Código do Trabalho, artigos 237.º a 240.º — Diário da República, versão consolidada em vigor: https://diariodarepublica.pt/dr/legislacao-consolidada/lei/2009-34546475-46747075
- Artigo 238.º — duração mínima de 22 dias úteis: https://diariodarepublica.pt/dr/legislacao-consolidada/lei/2009-34546475-56360079
- gov.pt — Trabalhar em Portugal, férias e subsídio de férias: https://www.gov.pt/guias/trabalhar-em-portugal

Estas fontes fundamentam apenas a **referência laboral**. A meta mensal de 28 dias e a interpolação em tempo real são funcionalidades de controlo pessoal da aplicação e devem ser confrontadas com RH, contrato ou instrumento de regulamentação coletiva quando o utilizador pretender tratá-las como saldo oficial.