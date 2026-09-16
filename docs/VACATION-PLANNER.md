# Planeador de períodos de férias — PR #210

Atualizado em: 2026-09-16

## Âmbito

O painel **Simula as próximas férias**, na rota `#/ferias`, permite avaliar um intervalo futuro do ano civil atual **sem gravar, marcar ou reservar férias**. O utilizador escolhe início e fim e vê dias úteis, fins de semana, dias já registados, dias adicionais, saldo pessoal no início e no fim e efeito sobre a projeção pessoal de 31 de dezembro. Lista ainda os próximos conjuntos de dias úteis futuros já marcados.

O contador pessoal de 28 dias é uma meta configurável, **não uma declaração de direito legal adquirido**. A referência laboral/contratual existente em `VacationBalance` não é alterada.

## Origem dos dados

O componente recebe diretamente da página de férias `settings`, `recordedVacationDates` e `today`. As datas registadas já foram agregadas do mapa de turnos, plano de vencimento e calculadora de horas pela lógica existente da página. O simulador não adiciona novo leitor de dados nem escreve no `secureStorage` ou no cofre.

## Validação e dias contabilizados

- Datas em `YYYY-MM-DD` são validadas com UTC para detetar datas impossíveis e evitar erros de mudança de hora.
- O início deve ser posterior ao dia atual; o fim deve ser igual ou posterior ao início.
- Início e fim devem pertencer ao ano civil atual. A simulação entre anos fica para uma alteração com política explícita de transição de saldo.
- Segunda–sexta contam como dias úteis no regime padrão atual; sábado e domingo não descontam. Feriados, folgas alternadas, CCT e escalas especiais não são inferidos.
- Datas já registadas são deduplicadas; os dias úteis já marcados no intervalo são mostrados separadamente e **não voltam a ser descontados**.
- Um intervalo sem dias úteis ou totalmente já registado não altera a previsão do final do ano.

## Cálculos e semântica temporal

`diasAdicionais = diasÚteisNoIntervalo − diasÚteisJáRegistadosNoIntervalo`

`previsãoPessoalDezembroDepois = previsãoPessoalDezembroAntes − diasAdicionais`

O saldo pessoal **antes** do período é calculado com o `calculateVacationBalance` existente no **fim do dia anterior ao início**. O saldo pessoal **depois** é calculado com o mesmo domínio no **fim do último dia**, passando apenas os novos dias úteis da simulação como datas adicionais temporárias. Dessa forma, os números incluem a evolução da meta mensal entre essas duas datas e o efeito das férias já planeadas anteriores/contidas no período. São estimativas da projeção pessoal, não validação automática do saldo oficial.

### Exemplo de regressão

24/08/2026–06/09/2026, numa simulação feita antes do período:

- 14 dias de calendário, 10 dias úteis, quatro dias de fim de semana;
- se nenhum desses dias estiver já registado, dez dias adicionais;
- meta anual pessoal 28, sem mais registos, transitados ou ajustes: projeção final de 18 dias;
- se parte dos dez dias já estiver registada, apenas os restantes são adicionais.

## Lista de próximos períodos

A lista filtra datas futuras válidas do ano corrente, exclui fins de semana e agrupa dias úteis consecutivos. Sexta e segunda podem fazer parte do mesmo conjunto. O início e o fim exibidos são o **primeiro e o último dia útil marcado**, não uma promessa de que todo o intervalo civil foi autorizado.

## UX, acessibilidade e segurança

- Inputs de data explicitamente rotulados, com limite até 31 de dezembro.
- Pré-visualização recalculada ao alterar datas ou configuração, sem botão de gravação enganador.
- `aria-live="polite"` no resultado, mensagens para datas inválidas, fins de semana sem dias úteis, sobreposição total e previsão pessoal negativa.
- `vacation-planner.css` isolado com `auto-fit/minmax`, contenção de texto/números, uma coluna em mobile, `focus-visible`, `forced-colors` e `prefers-reduced-motion`.
- Ligação explícita ao mapa de turnos para registar as férias **fora do simulador**, sob controlo do utilizador.
- Sem alteração de API, banco de dados, schema, autenticação, permissões, segredos, dependências, sincronização ou telemetria.

## Testes e aceitação

`VacationPlanner.test.ts` cobre intervalo de agosto/setembro de dez dias úteis, fins de semana, deduplicação de dias já registados, saldo antes/depois, previsão de dezembro, intervalo totalmente registado, datas inválidas/invertidas/passadas/fora do ano e agrupamento sexta–segunda. `vacation-planner.test.ts` protege a montagem no ecrã original, grid responsiva e acessibilidade estrutural.

Validação física ainda necessária em iPhone, Android, tablet e computador. O smoke test genérico de arranque não substitui verificação visual com dados reais.
