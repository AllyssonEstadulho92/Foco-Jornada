# Estado do Projeto

Atualizado em: 2026-09-16

## Estado atual

O **Foco Jornada** é uma PWA única React/TypeScript responsiva para telemóvel, tablet e computador, publicada em GitHub Pages. A persistência é local-first em IndexedDB/cofre cifrado; a sincronização opcional usa Cloudflare Worker/Durable Objects e transporta apenas o cofre cifrado.

Em `main` estão integrados: turnos noturnos (#189); sincronização cifrada e associação de browsers (#191–#194); shell móvel (#195–#199); bootstrap animado (#200–#201); automação de jornada/pausas (#202); ferramenta de férias, meta pessoal 28, dias úteis e evolução viva (#203–#206); contenção e hierarquia visual (#207–#208); indicadores avançados (#209); e **simulador de períodos de férias (#210)**.

## PR #210 — simulação de períodos de férias

**Estado: integrado, validado por CI e publicado.**

- PR #210 integrado em `main` no commit `73a6c0f43caf40219a98b1224113bdddaaec420b`;
- **Qualidade #1148** no head final e **Qualidade #1149** após merge em `main`: sucesso integral;
- **Publicar Foco & Jornada #249**: sucesso;
- build publicado na raiz de `main`: `8a79445d483ff2017e2cb860c94bccc77d2d33d0`;
- **pages build and deployment #814**: sucesso para esse build.

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

React 19, TypeScript 5.9, Vite 7, Vitest 5, Node 22, npm 11.6.0. Gates: `npm audit --audit-level=high`, typecheck, lint, Vitest, build, Worker dry-run, smoke test Chromium e artefacto. Qualidade #1148 (head final) e #1149 (`main`) passaram integralmente. Publicar #249 e Pages #814 passaram.

## Limitações e validações abertas

1. Validar visualmente o simulador e lista de períodos em iPhone, Android, tablet e desktop, incluindo zoom/aumento de texto.
2. Confirmar em dispositivo real 24/08–06/09 = dez úteis, sobreposição de datas e atualização viva após regressar à PWA.
3. Confirmar sincronização de registos e configurações entre telemóvel e computador.
4. Avaliar calendário laboral de feriados e descanso semanal alternativo somente com regras confirmadas.
5. Continuar testes físicos pendentes da automação de jornada e sincronização cross-device.

## Última alteração

PR #210 integrado e publicado: simulação de férias futuras sem desconto duplicado, com saldos pessoais antes/depois e impacto na previsão de dezembro, sem escrita de dados.

## Próximo passo

Verificar o painel em iPhone e restantes dispositivos com dados reais. Considerar integração de marcação apenas depois de validar fluxos, permissões e confirmação explícita do utilizador.
