# Cálculo auditado — Turnos, Horas e Vencimento (2026)

## Objetivo

Manter uma cadeia de cálculo coerente entre:

1. **Mapa de turnos** — planificação do mês;
2. **Horas & ausências** — apuramento real ao minuto;
3. **Vencimento** — previsão das rubricas salariais.

O cálculo não deve inventar remuneração nem descontar tempo sem uma regra explícita.

## Regras de tempo

- Um dia marcado como `Trabalho` pode ter entrada, saída e pausa.
- Folga, feriado, férias e faltas não herdam horas antigas do editor.
- O tempo efetivo é `duração do turno - pausas`.
- Turnos que passam a meia-noite são suportados.
- Na calculadora de horas existe um único apuramento por data; guardar novamente o mesmo dia substitui o anterior, evitando duplicação no total mensal.
- Ausências parciais podem ser apuradas ao minuto.

## Valor da retribuição horária

Para o cálculo automático é usada a fórmula do artigo 271.º do Código do Trabalho:

`(remuneração mensal × 12) / (52 × período normal semanal)`

A aplicação mantém a precisão completa da fórmula durante os cálculos e arredonda a dois cêntimos apenas os montantes finais. O valor/hora apresentado ao utilizador continua a ser mostrado com duas casas decimais.

## Trabalho suplementar

O cálculo automático segue os acréscimos do artigo 268.º do Código do Trabalho:

- até 100 horas anuais, dia útil: +25% na primeira hora/fração e +37,5% nas seguintes;
- até 100 horas anuais, descanso/feriado: +50%;
- acima de 100 horas anuais, dia útil: +50% na primeira hora/fração e +75% nas seguintes;
- acima de 100 horas anuais, descanso/feriado: +100%.

O campo `Horas extra acumuladas antes deste mês` é necessário para saber em que lado do limite anual de 100 horas se encontra cada segmento.

## Ausências não remuneradas

- Falta integral: por omissão usa as horas diárias contratuais (`horas semanais / 5`).
- Falta parcial: quando são fornecidas horas exatas, o desconto usa essas horas e não volta a somar um dia completo.
- Fórmula automática: `horas não remuneradas × valor hora legal`.
- O ajuste manual continua disponível quando o contrato, CCT ou recibo use uma regra específica diferente.

## IRS 2026 — Continente

O cálculo automático implementa as Tabelas I, II e III do Despacho n.º 233-A/2026 e Circular n.º 1/2026 da Autoridade Tributária, para trabalhadores sem deficiência fiscalmente relevante:

- Tabela I — não casado sem dependentes / casado dois titulares;
- Tabela II — não casado com um ou mais dependentes;
- Tabela III — casado, único titular.

A fórmula é `remuneração × taxa marginal - parcela a abater - parcela por dependente`, quando aplicável. Com três ou mais dependentes é aplicada a redução de um ponto percentual à taxa marginal, mantendo as parcelas a abater.

Subsídios de férias e Natal são retidos autonomamente. Trabalho suplementar é tratado autonomamente segundo o artigo 99.º-C do CIRS e as instruções do Despacho n.º 233-A/2026.

## Segurança Social

A taxa padrão configurada é 11% para trabalhador por conta de outrem no regime geral. O campo permanece editável porque existem enquadramentos contributivos diferentes.

## Subsídio de refeição

Para 2026, o limite diário de referência da Administração Pública é 6,15 €. A parte tributável é calculada acima do limite aplicável; para cartão/vale refeição a aplicação usa 10,46 € como limite diário operacional (6,15 € acrescido de 70%, arredondado ao cêntimo).

## Limites para coincidir com o recibo

Nenhuma aplicação consegue garantir coincidência com um recibo real se faltarem rubricas ou regras específicas da entidade empregadora. Para coincidência ao cêntimo devem estar corretos, no mínimo:

- remuneração base;
- período normal semanal;
- dias com direito a subsídio de refeição;
- forma e valor do subsídio de refeição;
- situação de IRS e dependentes;
- taxa contributiva;
- horas suplementares remuneráveis e acumulado anual anterior;
- faltas/ausências remuneradas e não remuneradas;
- subsídios de férias/Natal;
- prémios, comissões e outros abonos/descontos;
- regras específicas do contrato ou CCT.

Perfis de deficiência fiscalmente relevante, IRS Jovem, ex-residentes, Regiões Autónomas e outros regimes especiais não devem ser tratados como automáticos pelas Tabelas I–III. Nestes casos deve usar-se a parametrização/ajuste aplicável antes de considerar a previsão validada.

## Fontes oficiais verificadas

- Código do Trabalho, artigos 268.º e 271.º — Diário da República.
- Despacho n.º 233-A/2026, de 6 de janeiro — Autoridade Tributária / Diário da República.
- Circular n.º 1/2026 — Autoridade Tributária.
- Código do IRS, artigo 99.º-C — Autoridade Tributária.
- Segurança Social — regime geral dos trabalhadores por conta de outrem.
- DGAEP / Portaria n.º 51-B/2026/1 — subsídio de refeição de 6,15 € em 2026.
