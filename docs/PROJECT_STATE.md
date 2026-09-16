# Estado do Projeto

Atualizado em: 2026-09-16

## Estado atual

O **Foco Jornada** é uma PWA única React/TypeScript responsiva para telemóvel, tablet e computador, publicada em GitHub Pages. A persistência é local-first em IndexedDB/cofre cifrado; a sincronização opcional usa Cloudflare Worker/Durable Objects e transporta apenas o cofre cifrado.

Em `main` estão integrados: turnos noturnos (#189); sincronização cifrada e associação de browsers (#191–#194); shell móvel (#195–#199); bootstrap animado (#200–#201); automação de jornada/pausas (#202); ferramenta de férias, meta pessoal 28, dias úteis e evolução viva (#203–#206); contenção e hierarquia visual (#207–#208); indicadores avançados (#209); e simulador de períodos de férias (#210).

## PR #211 — sugestões de férias alinhadas com o protótipo

**Estado: em validação na branch `feat/vacation-suggestions`; não publicado ainda.** Código inicial passou Qualidade #1150; ainda é necessário validar o head final após atualizar os documentos, integrar, verificar a qualidade em `main` e confirmar a publicação Pages.

A rota `#/ferias` passa a oferecer no planeador existente o painel **Sugestão de férias**, inspirado no protótipo visual aprovado, com destaque de período, filtros de dias úteis pretendidos (1–30, padrão 10), mês a evitar, preferência entre juntar fins de semana/mais cedo/maior saldo pessoal no fim, comparação de meses, calendário navegável, legenda, outras sugestões e botão **Simular este período** que preenche as datas da simulação já existente. A ligação ao mapa de turnos continua explícita.

**Cálculo:** `VacationSuggestions.ts` enumera apenas períodos futuros do ano atual e exclui candidatos com dias úteis já registados ou meses evitados. Reutiliza `VacationPlanner.simulateVacationPeriod` e `VacationBalance` para a contagem e o saldo; por defeito, só mostra períodos com saldo pessoal projetado não negativo no fim e em dezembro. Os dias potenciais de descanso incluem os sábados/domingos imediatamente adjacentes ao intervalo quando estes são descanso na escala. Seleciona um candidato por mês inicial para diversidade. O ano é o atual, não 2025 como na ilustração.

**Exemplo:** 10 dias já gozados em 24/08–06/09/2026, meta pessoal 28 e novos 10 dias sugeridos → previsão pessoal de 8 dias no fim do ano, sem outros ajustes/compromissos. As sugestões não afirmam direito oficial nem analisam feriados, escala real, preços ou aprovação da entidade empregadora.

**Arquitetura/segurança:** novas funções puras em `src/domain/vacation/VacationSuggestions.ts`, UI em `src/presentation/pages/VacationSuggestionsPanel.tsx`, CSS isolado `src/styles/vacation-suggestions.css` e testes específicos de domínio/estrutura. O painel recebe as mesmas datas e definições já carregadas; não cria registos, reserva férias, grava preferências, altera schema, cofre, autenticação, autorização, backend, dependências ou telemetria.

**Pendente:** verificar qualidade do head final, integrar/publicar, testar no iPhone real, Android/tablet/desktop (incluindo zoom, leitura de ecrã e PWA após suspensão), testar cenários reais de sobreposição, confirmar sincronização dos dados entre dispositivos. Conferir disponibilidade oficial e regime de descanso com RH antes de marcar.

## PR #210 — simulação de períodos de férias

**Estado: integrado, validado por CI e publicado.**

- PR #210 integrado em `main` no commit `73a6c0f43caf40219a98b1224113bdddaaec420b`;
- Qualidade #1148 no head final e Qualidade #1149 após merge em `main`: sucesso integral;
- Publicar Foco & Jornada #249: sucesso;
- build publicado na raiz de `main`: `8a79445d483ff2017e2cb860c94bccc77d2d33d0`;
- pages build and deployment #814: sucesso para esse build.

### Funcionalidade entregue

A rota `#/ferias` inclui **Simula as próximas férias** entre os indicadores anuais e a evolução mensal. Um início e fim futuros dentro do ano atual permitem ver dias de calendário, dias úteis padrão, fins de semana, dias já marcados sem duplicação, dias adicionais, saldo pessoal estimado no início/fim e previsão de 31 de dezembro antes/depois. O painel lista também os próximos grupos de dias úteis já registados, agrupando sexta e segunda quando consecutivos.

A simulação **não grava, reserva ou aprova férias**. O registo real exige ação explícita no mapa de turnos. `VacationPlanner.ts` reutiliza `calculateVacationBalance`; não cria outra fórmula de acumulação nem registos artificiais. Código em `src/domain/vacation/VacationPlanner.ts`, UI em `src/presentation/pages/VacationPlannerPanel.tsx`, CSS isolado em `src/styles/vacation-planner.css`, testes de domínio/UI e especificação em `docs/VACATION-PLANNER.md`.

**Regressões:** 24/08/2026–06/09/2026 são 14 dias civis, 10 úteis e 4 de fim de semana; dez dias novos com meta pessoal 28 e sem outros ajustes levam a previsão pessoal de 18 dias em 31 de dezembro. Datas inválidas, passadas, invertidas, transição de ano, fins de semana e sobreposições têm testes. CI completo passou; teste físico com dados reais ainda não foi executado.

**Segurança/compatibilidade:** sem alterações ao cofre, schema, autenticação, autorização, Worker, sincronização, API, dependências, segredos ou telemetria. O novo módulo é de leitura; os valores são derivados. A meta 28 continua projeção pessoal, não direito oficial.

### Limites

Só períodos futuros do mesmo ano; feriados, descanso semanal alternativo e CCT não são inferidos. Saldos antes/depois e previsão do ano são projeções pessoais, não aprovação de RH. A lista de períodos apresenta o primeiro e último dia útil marcado, não um intervalo civil integral de descanso aprovado.

## Entregas anteriores de férias

- **PR #209:** progresso anual, dias em falta, próximo marco/data, gozadas/planeadas e previsão de dezembro. Merge `8b7b6fc68c3330714b081865992de9adb5243d4c`, Qualidade #1140/#1141, Publicar #248, build `ac121c3f687f86149d90e1bd78c4788b8c86d0a6`, Pages #807: sucesso.
- **PR #208:** grelha mensal fluida e contenção; merge `a41a0c3b9fdef1b0e5d67bc29ce6b453dbcbc4cf`, Qualidade #1138/#1139, Publicar #247, build `a5a17750ffa43f506c9feb5af78a167f3b1f0f5c`, Pages #801: sucesso.
- **PR #203–#207:** ferramenta original, meta pessoal configurável de 28, dias úteis padrão, evolução intramensal e contenção responsiva; integrados e publicados.

## Regras funcionais atuais

**Referência laboral:** ano normal com mínimo geral suportado 22 dias úteis; valor superior só quando confirmado; ano de admissão modelado conservadoramente como 2 dias por mês completo até 20, com marco de seis meses. Transitados, férias externas e ajustes exigem confirmação.

**Projeção pessoal:** meta configurável (28 por defeito); marcos março 7, junho 14, setembro 21, dezembro 28; mês atual evolui pela fração já decorrida. Atualização a cada 60 segundos enquanto página ativa e recálculo em `focus`/`visibilitychange`; não se promete execução contínua em background.

**Dias registados:** agregação do mapa de turnos, plano mensal e calculadora de horas; datas deduplicadas. Segunda–sexta contam no regime padrão, sábado/domingo não reduzem saldo; 24/08–06/09/2026 = 10 úteis e quatro fins de semana ignorados. Feriados e escalas não padrão permanecem fora da inferência.

## Qualidade, CI e dependências

React 19, TypeScript 5.9, Vite 7, Vitest 5, Node 22, npm 11.6.0. Gates: `npm audit --audit-level=high`, typecheck, lint, Vitest, build, Worker dry-run, smoke test Chromium e artefacto. Qualidade #1148 (head final) e #1149 (`main`) passaram integralmente para PR #210; PR #211 teve execução inicial #1150 verde.

## Limitações e validações abertas

1. Validar PR #211, publicação e o painel no iPhone com os dados reais; testar também Android, tablet e desktop, zoom e aumento do texto.
2. Confirmar em dispositivo real 24/08–06/09 = dez úteis, sobreposição de datas e atualização viva após regressar à PWA.
3. Confirmar sincronização de registos e configurações entre telemóvel e computador.
4. Avaliar calendário laboral de feriados e descanso semanal alternativo somente com regras confirmadas.
5. Continuar testes físicos pendentes da automação de jornada e sincronização cross-device.

## Última alteração

PR #211 em validação: opções futuras com calendário e critérios explícitos, sem escrita de dados nem duplicação de dias.

## Próximo passo

Validar o head final de #211, publicar apenas com gates verdes e testar os períodos no iPhone. Não introduzir marcação automática sem confirmação explícita e verificação do direito real de férias.
