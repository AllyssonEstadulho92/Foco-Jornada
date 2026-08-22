# Mapa de turnos — especificação funcional

## Objetivo
Criar um mapa mensal de turnos com leitura visual estável em telemóvel e computador, integrado no menu principal e sincronizado com a planificação salarial existente.

## Fonte operacional
- Horário base, fins de semana e exceções manuais: `AppSettings.workSchedule`.
- Situação salarial do dia e horas extra: `PayrollDayPlan`.
- Cálculo salarial: `calculatePayroll`.
- Detalhe operacional do turno: armazenamento local `foco-jornada-shift-map-v1-<AAAA-MM>`.

## Situações RH suportadas
- Trabalho.
- Folga.
- Feriado.
- Férias.
- Falta justificada paga.
- Falta justificada não paga.
- Falta injustificada.

## Dados por dia
- Data.
- Situação RH.
- Entrada.
- Saída.
- Pausa total em minutos.
- Horas extra remuneráveis.
- Observação RH.

## Resumos
O mapa mostra total mensal de turnos de trabalho, horas planeadas, pausas, tempo efetivo e horas extra, além da contagem de folgas, feriados, férias e faltas.

## Integração contabilística
Ao guardar o mapa, a situação de cada dia, as horas extra e a observação são convertidas para `PayrollDayPlan` e gravadas na mesma chave usada pelo ecrã Vencimento. O mapa apresenta bruto, subsídio de refeição, horas extra, dedução por ausências, Segurança Social, IRS e líquido calculado pelo motor salarial existente.

O valor apresentado é exato face aos parâmetros guardados na aplicação. Não deve ser apresentado como garantia de coincidência com o recibo real quando existirem rubricas, CCT, regimes fiscais/contributivos ou ocorrências não configuradas.

## Regra sobre duração do turno
Entrada, saída e pausa servem para controlo operacional e cálculo de duração efetiva. Um turno mais longo não é convertido automaticamente em trabalho suplementar. As horas extra remuneráveis são registadas explicitamente para evitar criar remuneração suplementar sem confirmação.

## UX móvel
- A grelha mensal mantém sete colunas e não é reformatada em cartões isolados.
- Em ecrãs estreitos existe deslocação horizontal controlada, preservando o mapa espacial de segunda a domingo.
- O editor do dia selecionado fica abaixo da grelha.
- Guardar produz confirmação visual imediata e mantém registo no Centro de notificações.
