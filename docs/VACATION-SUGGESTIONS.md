# Sugestões de férias — especificação funcional

## Objetivo

Transformar o protótipo «Sugestão de férias» em funcionalidade real dentro da rota `#/ferias`, preservando a simulação existente. Os períodos são **opções calculadas**, não férias marcadas, direitos oficiais, autorização de RH nem previsão de preços ou disponibilidade.

## Dados reutilizados

`VacationPlannerPanel` recebe `today`, `asOfDayProgress`, `VacationTrackerSettings` e as mesmas `recordedVacationDates` já agregadas/deduplicadas na página. `VacationSuggestionsPanel` passa estes dados ao módulo puro `VacationSuggestions.ts`, que consulta o mesmo `VacationPlanner.simulateVacationPeriod` e, por consequência, o mesmo `VacationBalance`. A projeção pessoal é distinta da referência laboral oficial. Não se escreve nada no cofre.

## Regras e controlos

- Número de dias úteis pretendidos: inteiro de 1 a 30, padrão 10.
- Mês a evitar: nenhum ou janeiro–dezembro. Nenhum dia do período pode pertencer ao mês evitado, inclusive em períodos que o atravessam.
- Critério: **Juntar fins de semana** maximiza os dias de descanso potencial consecutivos (período civil + sábado/domingo imediatamente anteriores/posteriores); **Mais cedo** escolhe inícios mais próximos; **Maior saldo no fim** compara o saldo pessoal estimado ao fim do período. Os critérios são explícitos; não existe alegação de período objetivamente melhor.
- Apenas datas posteriores ao dia atual e até 31 de dezembro do mesmo ano. O ano e os meses vêm da data real da aplicação, não das datas meramente ilustrativas do protótipo.
- Contagem padrão de segunda a sexta, sem inferir feriados ou turnos especiais.
- Se um período proposto se sobrepõe a um dia útil já registado, esse candidato não é sugerido; nunca sugere um novo desconto duplicado.
- Só aparecem períodos cujo saldo pessoal projetado no fim e em 31 de dezembro sejam não negativos. Se nenhum satisfaz os filtros, apresenta explicação e permite alterar os parâmetros ou recorrer à simulação manual existente.
- O painel escolhe no máximo uma opção por mês de início, evitando cartões duplicados de datas quase idênticas. O utilizador pode ver todos os meses disponíveis, alternar sugestões, consultar o calendário e enviar uma opção à simulação existente.
- O calendário mostra dias sugeridos, fins de semana abrangidos, férias já marcadas e o mês/ano selecionado. Se o período atravessar dois meses, essa limitação visual é explicitada; as datas completas continuam legíveis.

## Precisão do exemplo

No caso de dez dias úteis já gozados de 24/08/2026 a 06/09/2026, meta pessoal 28 e sem outros compromissos/ajustes, uma sugestão futura de dez dias adicionais deixa **8 dias** na projeção pessoal em 31 de dezembro. Os quatro fins de semana históricos não descontam. O saldo no fim de cada sugestão depende da data real e da acumulação mensal e é recalculado com o motor existente.

## Garantias

As opções não criam, editam, reservam ou aprovam férias. O botão **Simular este período** preenche o formulário do simulador já existente; a marcação efetiva exige ação separada no mapa de turnos. Não há campos novos, migração, novas permissões, endpoints, segredos, dependências nem envio de dados para servidores externos. O módulo e a UI contêm valores dentro dos cartões e preservam navegação por teclado, leitores de ecrã, `forced-colors` e `prefers-reduced-motion`.

## Validação

`VacationSuggestions.test.ts`: número de dias, períodos reais no ano, critérios, exclusão de mês, sobreposições, saldo não negativo, transição de ano e inputs inválidos. `vacation-suggestions.test.ts`: integração com painel existente, ausência de escrita, layout e acessibilidade estruturais. Gates: auditoria high, typecheck, lint, Vitest, build, Worker dry-run, smoke browser, deploy Pages. Validação física em iPhone/Android/tablet/desktop e sincronização de dados reais ainda dependem de teste em dispositivos.
