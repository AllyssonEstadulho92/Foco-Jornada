# Férias — proveniência dos dias

Atualizado: 2026-09-17. Alteração proposta no PR #217.

## Objetivo e âmbito

Na rota `#/ferias`, acrescentar um painel recolhido por defeito, acessível pelo atalho «Ver de onde vêm os dias registados». Ao abrir, são apresentadas datas civis deduplicadas, cada origem encontrada (calculadora de horas, mapa de turnos, plano mensal), distinção entre úteis até hoje, úteis futuros e sábados/domingos ignorados. O detalhe usa a mesma regra padrão de dias úteis de `VacationBalance` e permite atualizar manualmente a consulta; regressar ao primeiro plano refresca a data local. O planeamento `#/ferias/planeamento` permanece visualmente isolado, sem esta secção adicional.

## Dados e segurança

`collectVacationEvidenceForYear` lê entradas de `useWorkHoursStore` e as mesmas chaves `foco-jornada-shift-map-v1-AAAA-MM` / `foco-jornada-payroll-plan-v1-AAAA-MM` via função injetada de leitura do cofre (`secureStorage`). Ordena datas válidas, guarda apenas o conjunto de fontes para cada data e não soma duas vezes dias repetidos. `collectVacationDatesForYear` deriva as datas do mesmo resultado, sem duplicar o algoritmo no planeador anual. Datas válidas de outro mês encontradas numa folha do ano são preservadas, tal como na coleta anterior. Falha de uma fonte não gera datas artificiais. Não são usados `localStorage` em claro, APIs novas, permissões, segredos, alterações de schema, telemetria ou qualquer escrita; abrir/atualizar não marca férias.

A lista não apresenta entradas manuais sem data, mas essas continuam no cálculo do saldo em `VacationBalancePage`. A fórmula resumida usa a projeção pessoal: acumulado vivo + transitados + ajustes − gozadas (registadas e manuais); após planeadas subtrai também úteis futuros. Não atribuir à meta pessoal de 28 dias a natureza de direito laboral oficial. Os totais no painel são **apenas** os das datas existentes; não equivalem necessariamente a todo o saldo quando existem valores manuais.

## Validação, limites e continuidade

`VacationYearRecords.test.ts` valida sobreposição entre três fontes, deduplicação, fins de semana, datas inválidas, fontes indisponíveis e datas fora da folha mensal; `vacation-evidence.test.ts` protege separação de rotas, abertura/ocultação, responsividade e ausência de gravação/novo timer. CI verifica auditoria, tipos, lint, testes, build, Worker e smoke Chromium. Teste físico no iPhone, Android, tablet e desktop continua pendente; confirmar zoom/texto ampliado, navegação de teclado e coincidência entre contador e datas ao regressar à PWA ou após sincronização.

A área não garante sincronização remota instantânea, nem verifica feriados, descanso semanal alternativo, aprovação da empresa ou direito contratual. A sincronização existente do cofre mantém-se separada desta leitura. Próximo refinamento possível: unificar a recolha anual da `VacationBalancePage` com `VacationYearRecords` sem criar renderizações ocultas, depois de uma bateria de testes em dispositivos reais. Não inferir resultado de testes físicos da CI.
