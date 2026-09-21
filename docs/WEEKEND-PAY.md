# Acréscimos de fim de semana no Vencimento

Data: 2026-09-21. Implementação em revisão no PR #226.

## Objetivo e evidência

O utilizador pediu que a página `#/vencimento` contasse automaticamente o valor associado ao trabalho ao sábado e domingo e que a lista «Situação do dia» da configuração incluísse sábado e domingo. A captura do ecrã mostra salário base de 920 €, 22 dias de alimentação, ausência de horas extra e nenhum suplemento próprio. **A captura não identifica a taxa de sábado, a taxa de domingo, o CCT aplicável nem a classificação dos turnos.** Não converter referência a percentagens de recibos anteriores em regra contratual sem o documento.

## Fontes e decisão laboral

- Código do Trabalho, artigo 268.º, Diário da República: https://diariodarepublica.pt/dr/legislacao-consolidada/lei/2009-34546475-211441912. O trabalho suplementar em dia de descanso semanal/feriado tem acréscimos legais variáveis com o acumulado anual; isso **não cria uma taxa universal para trabalho normal ao fim de semana**.
- Código do Trabalho, artigo 269.º: https://diariodarepublica.pt/dr/legislacao-consolidada/lei/2009-34546475-211441913. O trabalho normal em feriado tem regras próprias e não é equiparado automaticamente a sábado ou domingo.
- Confirmar percentagens de trabalho normal no recibo, contrato ou instrumento de regulamentação coletiva aplicável. Uma percentagem sem fonte permanece `null` (por confirmar).

## Especificação funcional e fórmula

O utilizador regista os dias como `work` no Mapa de turnos e guarda o mapa. A conversão `toPayrollDayPlan` transmite `workedHours` apenas para trabalho normal aos sábados/domingos com turno válido, usando `(saída - entrada - pausa) / 60`. Sem horas medidas, o motor estima `weeklyHours / 5`, abatendo eventual ausência parcial registada. Turnos que atravessem a meia-noite continuam a requerer divisão por data civil e não devem ser considerados apurados com exatidão.

Na configuração salarial existente (`foco-jornada-payroll-config-v1`) existem `saturdayPremiumRate` e `sundayPremiumRate`, inicialmente `null`; o utilizador preenche a taxa confirmada, em percentagem. `0` representa taxa expressamente nula e é diferente de `null`. Não se guardam dados pessoais novos.

Em `#/vencimento/configurar`, a lista «Situação do dia» contém agora **Sábado (trabalho normal)** e **Domingo (trabalho normal)**, para além de Trabalho, Folga, Feriado, Férias e faltas. Só se pode escolher a opção correspondente à data selecionada: sábado num sábado e domingo num domingo. Quando um plano existente já contém `kind='work'` numa destas datas, a lista mostra automaticamente a opção correspondente. A escolha grava o `kind='work'` já existente, sem criar novos códigos de faltas ou mudar chaves de armazenamento. A data civil é validada em UTC para evitar classificações dependentes do fuso do dispositivo. Folga não é convertida automaticamente em trabalho; trabalho suplementar em folga continua separado. O componente `PayrollDayKindSelect` tem testes específicos de sábado, domingo, compatibilidade e seleção inválida.

Para cada dia civil elegível, acumular horas normais de sábado e domingo separadamente. Valor hora: o mesmo valor exato usado no motor salarial, respeitando o eventual ajuste manual. Acréscimo sábado = horas normais sábado × valor hora × taxa sábado / 100; domingo análogo. Arredondar a cêntimos os dois abonos e somá-los. **Não voltar a remunerar a parcela de horas já incluída no salário base**. Não aplicar o suplemento de horas normais a dias `rest`, `holiday`, `vacation` ou ausências. `overtimeHours` mantém a remuneração própria, existente em `calculateOvertimePay`, incluindo as taxas legais para horas suplementares em descanso.

Adicionar o suplemento ao bruto, rendimento normal sujeito a IRS e base contributiva; recalcular descontos e líquido pela lógica já existente. Exibir, no resumo de Vencimento, as horas de sábado e domingo, taxas guardadas, suplementos e total atualizado. O Mapa de turnos e a página de configuração usam o motor partilhado, logo mostram o mesmo total após guardar o mapa e voltar à página. O editor de percentagens aparece no resumo e guarda automaticamente na configuração atual.

## Riscos e critérios de aceitação

1. Com taxas por confirmar, horas são visíveis mas não há acréscimo monetário presumido.
2. Domingo de 8 h com 50% **configurados a título de exemplo**, salário base 920 € e 40 h semanais, gera 21,23 € de suplemento normal; não implica que a empresa deva essa taxa.
3. Sábado, domingo e ausências parciais calculam sem duplicar horas extra; taxas distintas não se confundem.
4. Trabalho em folga com `overtimeHours` entra exclusivamente em Horas extra; feriados seguem a regra separada atual.
5. Sem horário efetivo medido, assinalar que a duração é uma estimativa contratual. Um turno de 08:00–17:00, com pausa de 60 minutos, representa 8 horas e não 9.
6. Dados anteriores mantêm-se legíveis pela composição com os valores por defeito. Não mudar a versão/chave de armazenamento nem limpar dados para atualizar a PWA.
7. Validar `npm run typecheck`, `npm run lint`, `npm test`, `npm run build`, `npm run worker:check` e smoke Chromium via CI, e depois confirmar em iPhone e com recibo real antes de tratar estimativa como valor efetivo.

## Limitações conhecidas

Não há ligação automática a um recibo oficial, CCT, efetiva presença do trabalhador nem registo certificado das horas. O cálculo não infere que sábado/domingo sejam folgas a partir do nome do dia. A classificação do turno e percentagens dependem de confirmação. O mapeamento de turnos a atravessar a meia-noite precisa de divisão de horas pela data civil. O motor de IRS de 2026 e tratamentos de feriado preexistentes não são auditados por esta alteração.
