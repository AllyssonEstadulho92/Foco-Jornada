# Estado do Projeto

Atualizado em: 2026-09-16

## Estado atual

O **Foco Jornada** é uma única PWA React/TypeScript responsiva para telemóvel, tablet e computador, publicada em GitHub Pages. A persistência continua local-first num cofre IndexedDB cifrado; a sincronização opcional usa Cloudflare Worker/Durable Objects e transporta apenas o cofre cifrado.

Em `main` estão integrados, entre outros:

- turnos noturnos (PR #189);
- sincronização cifrada e associação de browsers (PR #191–#194);
- correções do shell móvel (PR #195–#199);
- bootstrap animado (PR #200–#201);
- automação de jornada/pausas (PR #202);
- ferramenta de saldo de férias (PR #203);
- acumulação mensal pessoal com meta de 28 dias por defeito (PR #204);
- contagem padrão de férias em dias úteis segunda–sexta (PR #205);
- evolução intramensal em tempo real (PR #206);
- contenção responsiva dos cartões mensais (PR #207);
- hierarquia visual adaptativa da evolução mensal (PR #208);
- painel avançado de leitura de férias (PR #209).

## PR #210 — simulação de períodos de férias

**Estado:** em validação na branch `feat/vacation-period-planner`, PR #210 em draft. O primeiro conjunto de código passou **Qualidade #1143**; validar novamente o head final após a documentação antes de integrar. Não afirmar que está publicado antes de confirmar build e Pages.

### Alteração em desenvolvimento

A rota existente `#/ferias` recebe o painel **Simula as próximas férias** entre os indicadores anuais e a evolução mensal. O utilizador escolhe início e fim de um período futuro no ano atual e obtém:

- dias de calendário, dias úteis padrão (segunda–sexta) e dias de fim de semana;
- dias úteis já registados no mesmo intervalo, sem desconto duplicado;
- número de dias úteis adicionais que a simulação consumiria;
- saldo pessoal estimado no início e fim do período;
- previsão pessoal de 31 de dezembro antes e depois da simulação;
- mensagens para datas inválidas, só fins de semana, intervalo já integralmente marcado ou previsão negativa;
- lista dos próximos grupos de dias úteis futuros marcados, agrupando sexta e segunda sem contar sábado/domingo;
- ligação ao mapa de turnos para o registo explícito, se o utilizador decidir avançar.

A simulação **não grava nem reserva férias**. Reutiliza o mesmo `calculateVacationBalance` para os saldos temporais, sem criar nova fórmula de acumulação ou campo persistido. O contador de 28 dias é projeção pessoal, não declaração de direito legal adquirido.

### Código e documentação

- `src/domain/vacation/VacationPlanner.ts` — domínio puro de períodos, sobreposições e previsão;
- `src/domain/vacation/VacationPlanner.test.ts` — datas, dias úteis, 24/08–06/09, sobreposições e projeções;
- `src/presentation/pages/VacationPlannerPanel.tsx` — formulário, resultados e próximos períodos;
- `src/styles/vacation-planner.css` e `.test.ts` — layout responsivo e regressão de acessibilidade;
- `src/presentation/pages/VacationBalancePage.tsx` — montagem do painel com a configuração e os registos existentes;
- `docs/VACATION-PLANNER.md` — semântica, limites e testes.

### Riscos e limites

- apenas períodos futuros dentro do ano civil atual; passagem de ano exige política explícita;
- regra atual exclui sábado/domingo, mas não infere feriados, descanso alternado ou CCT;
- dias não registados noutras áreas não são tratados como efetivamente gozados;
- valor antes/depois e previsão de dezembro continuam **projeções pessoais**, não aprovação de RH;
- validação visual no iPhone, Android/tablet/desktop e teste de sincronização em dispositivos reais continuam pendentes.

### Segurança e compatibilidade

Nenhuma alteração ao cofre cifrado, schema, autenticação, autorização, Worker, sincronização, API, dependências, segredos ou telemetria. O novo módulo não escreve dados.

## PR #209 — painel avançado de leitura de férias

**Estado:** integrado, validado e publicado.

- merge `8b7b6fc68c3330714b081865992de9adb5243d4c`;
- Qualidade #1140 no head final e Qualidade #1141 após o merge: sucesso;
- Publicar Foco & Jornada #248: sucesso;
- build `ac121c3f687f86149d90e1bd78c4788b8c86d0a6`;
- pages build and deployment #807: sucesso.

Entrega: progresso anual da meta pessoal, dias em falta, próximo marco/data estimada, gozadas, planeadas, total comprometido, projeção para dezembro, fins de semana ignorados e resumo de fecho mensal. Os indicadores são derivados de `VacationBalance`; não existe novo estado persistido.

## Estado anterior — PR #208

Integrado/publicado; merge `a41a0c3b9fdef1b0e5d67bc29ce6b453dbcbc4cf`, Qualidade #1138/#1139, Publicar #247 e Pages #801 verdes, build `a5a17750ffa43f506c9feb5af78a167f3b1f0f5c`. A grelha de evolução mensal adaptou colunas à largura e conteve badges/textos.

## Regras funcionais atuais de férias

### Referência laboral

- anos normais: mínimo geral suportado de 22 dias úteis;
- valor superior apenas quando configurado como condição mais favorável confirmada;
- ano de admissão: política conservadora de 2 dias por mês completo, até 20;
- marco de seis meses preservado;
- transitados, férias externas e ajustes dependem de confirmação explícita.

### Projeção pessoal

- meta anual configurável, 28 dias por defeito;
- marcos exatos: março 7, junho 14, setembro 21, dezembro 28;
- mês atual progride pela fração do calendário já decorrida;
- a página atualiza a cada 60 segundos enquanto ativa, recalculando em `focus` e `visibilitychange`;
- a PWA não promete execução contínua em background.

### Dias gozados/planeados

- férias vêm do mapa de turnos, plano mensal e calculadora de horas;
- datas são deduplicadas;
- segunda–sexta contam no regime padrão; sábado/domingo não reduzem saldo;
- 24/08/2026–06/09/2026 = 14 dias civis, 10 dias úteis, quatro dias de fim de semana ignorados.

Feriados, descanso semanal diferente e escalas especiais ainda não são inferidos automaticamente.

## Qualidade, CI e dependências

Stack: React 19, TypeScript 5.9, Vite 7, Vitest 5, Node 22 e npm 11.6.0 no CI.

Gates obrigatórios: `npm audit --audit-level=high`, typecheck, lint, Vitest, build, Worker dry-run, smoke test Chromium e artefacto do build. O código inicial do PR #210 passou esses gates em Qualidade #1143; o head final deve voltar a passar antes do merge.

## Limitações e validações abertas

1. Confirmar CI final do PR #210, integrar apenas após sucesso e verificar publicação/Pages.
2. Validar visualmente o simulador e a lista de períodos em iPhone, Android, tablet e desktop, incluindo zoom e aumento de texto.
3. Confirmar nos dispositivos reais a contagem 24/08–06/09 = dez dias e atualização viva ao regressar à PWA.
4. Confirmar sincronização das configurações entre telemóvel e computador.
5. Avaliar calendário laboral (feriados e descanso diferente) só com regras confirmadas.
6. Continuar validação física da automação de jornada e sincronização cross-device.

## Última alteração

PR #210 em validação: simulação de períodos futuros, saldos pessoais antes/depois e prevenção de desconto duplicado, sem mutações de dados.

## Próximo passo

Validar o head final do PR #210, integrar/publicar se todos os gates estiverem verdes e verificar em dispositivo real. Não introduzir marcação automática sem fluxo explícito e seguro.
