# Planeamento de férias a dois — próximo ano (PR #215)

## Objetivo e alcance

Implementação do protótipo de planeamento responsivo na rota **`#/ferias/planeamento`**, sem copiar números, imagens de destinos ou perfis fictícios da imagem. O desenho utiliza o shell e os tokens da aplicação, com seletor **Este ano / Próximo ano**, cabeçalho contido, resumo atual em tempo real, sugestões para julho do ano seguinte, alternativas selecionáveis, calendário e confirmações temporárias. No contexto de setembro de 2026, «Próximo ano» corresponde a **2027**; em anos seguintes muda automaticamente. O utilizador pode alterar o mês (janeiro a outubro) e os dias pretendidos (1–30).

O utilizador indicou que novembro e dezembro estão indisponíveis na ILUNION. Estes meses estão **desativados no seletor do cenário futuro** e qualquer período que os atravesse é rejeitado. Isto é uma restrição comunicada pelo utilizador, **não uma política da entidade empregadora verificada** nem um bloqueio global das outras ferramentas da aplicação.

## Dados, fórmulas e projeção

`VacationJointPlanning.ts` enumera inícios futuros no mês escolhido, inclui apenas dias úteis padrão de segunda a sexta e valida cada candidato com o **simulador existente** (`simulateVacationPeriod`), que reutiliza `calculateVacationBalance`. Rejeita dias já registados, intervalos que atravessem meses excluídos, saldos pessoais negativos e períodos que ultrapassem 31 de dezembro. Dá prioridade à comparação de semanas completas (inícios à segunda-feira), até quatro alternativas distintas. O descanso potencial adiciona sábados e domingos adjacentes **apenas se forem folgas efetivas de ambos**. Não se assume feriado, turno especial, preço ou disponibilidade da parceira.

Para um ano futuro, o cenário usa a meta pessoal configurada (28 dias por defeito), mas **não transpõe automaticamente** `carriedDays`, `manualTakenDays` ou `adjustmentDays` do ano anterior. Os registos do ano futuro já existentes nas três fontes são considerados, deduplicados pelo módulo `VacationYearRecords.ts`: calculadora de horas (`reason = ferias`), mapa de turnos e plano mensal (`kind = vacation`) no `secureStorage` cifrado. Não cria férias nem altera o cofre. Não infere o direito laboral futuro ou autorizações da empresa.

Exemplo **sem outras férias de 2027 registadas**, meta pessoal 28 e dez dias úteis pedidos: 05–16/07/2027, 12–23/07/2027 ou 19–30/07/2027, cada um com dez úteis e até 16 dias corridos de descanso incluindo fins de semana adjacentes. O saldo pessoal projetado em 31/12/2027 seria 18, **não um direito confirmado**. Com registos reais, ajustes aprovados ou escala diferente, a disponibilidade e os valores devem ser revistos.

## Tempo real, hierarquia e acessibilidade

A página pai fornece a data e `asOfDayProgress`; atualiza-se a cada minuto enquanto ativa e em foco/visibilidade. O módulo futuro reutiliza esse ciclo para reler as fontes cifradas e recalcular as alternativas. Mudanças de mês, dias e opção selecionada atualizam imediatamente. Não existe timer adicional, polling remoto nem promessa de sincronização instantânea entre equipamentos. Em segundo plano, iOS/Android podem suspender temporizadores.

O saldo da parte superior é explicitamente rotulado com o **ano corrente** e não se confunde com a projeção do **ano seguinte**, que aparece junto de cada cenário. As caixas têm largura contida, grelhas fluidas, zoom responsivo, controlos de toque >= 44 px, estados `aria-pressed`/`aria-expanded`, `focus-visible`, `forced-colors` e `prefers-reduced-motion`. O calendário não grava datas. A caixa de confirmação da parceira e da entidade empregadora é apenas estado React efémero: não se comunica, não se regista e não se presume qualquer aprovação.

## Segurança e validação

Sem dependências, autenticação nova, endpoint, segredo, migração, telemetria ou escrita. `secureStorage.getItem` continua dentro do cofre, com falhas/JSON inválido tratados sem inventar férias. Os dados não são enviados a serviços externos. Testes: datas concretas de julho de 2027, dias úteis/descanso, novembro/dezembro, conflitos com registos, fronteira anual, não transportar saldos; recolha cifrada, estrutura responsive e estados acessíveis. CI completa antes do merge e publicação. **Pendente**: inspeção física no iPhone, Android, tablet, desktop, zoom, PWA suspensa, dados reais de 2027 e confirmação de regras com a ILUNION/parceira.

## Limite arquitetural conhecido

A vista de planeamento ainda partilha a montagem da `VacationBalancePage` com a vista de saldo, ocultando regiões via CSS conforme PR #212. A recolha do ano futuro foi extraída para módulo testável, enquanto o coletor existente do ano corrente continua em `VacationBalancePage` para não alterar a lógica publicada sem teste de regressão amplo. Um passo posterior pode unificar os dois coletores, com testes de equivalência e sincronização.
