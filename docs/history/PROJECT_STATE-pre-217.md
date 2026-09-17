# Estado do Projeto

Atualizado em: 2026-09-16

## Estado atual

O **Foco Jornada** é uma PWA React/TypeScript única e responsiva para telemóvel, tablet e computador, publicada em GitHub Pages. Persistência local-first em IndexedDB/cofre cifrado; sincronização opcional por Cloudflare Worker/Durable Objects transporta apenas o cofre cifrado.

Em `main` estão integrados turnos noturnos (#189), sincronização/associação cifrada de browsers (#191–#194), shell móvel (#195–#199), bootstrap animado (#200–#201), automação de jornada/pausas (#202), ferramenta/evolução de férias (#203–#209), simulador de períodos (#210), sugestões visuais (#211), separação das áreas de consulta/planeamento (#212) e correção do cabeçalho do planeamento (#213).

## PR #214 — ponto de situação local em tempo real no planeamento

**Estado: implementação no branch `feat/vacation-planner-live-overview`; aguarda gates finais, integração e publicação.** A vista `#/ferias/planeamento` apresenta agora antes das sugestões um resumo compacto com acumulado atual, saldo após gozadas, saldo após férias já planeadas e previsão para 31 de dezembro. Exibe hora local do cálculo. Os valores são obtidos da função pura `calculateVacationBalance` com os mesmos `today`, `asOfDayProgress`, configurações e datas já usados na página; não se introduziu nova fórmula, relógio ou escrita.

O relógio já existente atualiza a cada 60 segundos quando ativo e em `focus`/`visibilitychange`; os filtros e datas simuladas recalculam imediatamente. O resumo diferencia claramente «após planeadas» de «após a simulação», que não está incluída no primeiro valor. CSS isolado e responsivo em `vacation-planner-live.css`, testes em `vacation-planner-live.test.ts`, especificação em `docs/VACATION-PLANNER-LIVE.md`. Sem novos endpoints, autenticação, dependências, segredos, schema ou telemetria. A meta de 28 dias permanece projeção pessoal, não direito oficial.

**Limite:** o iOS pode suspender timers em segundo plano; não alegar sincronização remota instantânea nem validação física. **Próximo passo imediato:** confirmar CI no head final, integrar PR #214, verificar Qualidade `main`, publicação/Pages e recolher captura no iPhone.

## PR #213 — corrigir corte e espaço vazio no cabeçalho do planeamento

**Estado: integrado, CI e publicação confirmadas.** PR #213 integrado no commit `88099b5200b371081822e19197d15f723a8c3f14`; Qualidade #1172 (head final) e Qualidade #1173 em `main` passaram auditoria, TypeScript, lint, Vitest, build, Worker dry-run, smoke Chromium e artefacto. Publicar Foco & Jornada #252 concluiu com sucesso; build `ddbdced0c2b380e546a8e0da29dbe5819a74d4f8` e GitHub Pages #832 concluíram com sucesso.

**Facto observado na captura:** «Pré-visualização…» cortada à direita e caixa de cabeçalho demasiado alta. **Causa provável no código:** painel de planeamento em grid esticava a primeira linha e o cabeçalho genérico não limitava adequadamente a segunda coluna. Não foi possível verificar o CSS computado do iPhone.

**Correção publicada:** `VacationPlannerPanel.tsx` usa `header.vacationPlannerHero` com título, descrição curta e badge informativa. `vacation-planner.css` limita colunas e permite quebra segura; até 820px a badge desce para linha própria. O painel autónomo usa coluna flex e cabeçalho de altura intrínseca para não esticar a caixa. Teste estrutural em `vacation-workspace.test.ts`; detalhes em `docs/VACATION-PLANNER-HEADER.md`.

**Sem alterações** a fórmulas, dez dias úteis de 24/08–06/09, meta pessoal de 28, fontes, registos, cofre, autenticação, sync, API ou permissões. **Pendente:** validar visualmente o cabeçalho publicado no iPhone real, com nova captura, zoom e texto ampliado; CI não substitui teste físico.

## PR #212 — separar evolução e planeamento, melhorar largura e espaçamento

**Estado: integrado, CI concluída e publicado.** O PR #212 foi integrado em `main` no commit `732bfea2e518a5651a71bc347fa9782f574584b0`. Qualidade #1158 (código inicial), #1164 (head final) e **#1165 em `main`** concluíram com sucesso: auditoria, TypeScript, lint, Vitest, build, Worker dry-run, smoke Chromium e artefacto. **Publicar Foco & Jornada #251** e **GitHub Pages #826** concluíram com sucesso. Build publicado `2ff90745e506e48009347e10e19e90cea2ad5322`.

A aplicação apresenta duas vistas navegáveis: `#/ferias` mostra «Férias acumuladas mês a mês», as métricas e **a evolução mensal antes** do painel «O que tens, o que falta e o que vem a seguir», mantendo configuração, referência e fontes; `#/ferias/planeamento` apresenta isoladamente «PLANEAMENTO · ano atual — Planeia as próximas férias», com sugestões, calendário, filtros, simulação e ligação explícita ao mapa de turnos. O ano continua dinâmico, não fixo em 2026. `VacationWorkspacePage.tsx` cria as duas rotas e navegação; `vacation-workspace.css` limita a largura a 80rem fluidos e melhora espaçamento, cabeçalhos, grelhas, contenção e experiência móvel; `vacation-workspace.test.ts` protege a estrutura. Especificação em `docs/VACATION-WORKSPACE.md`.

**Limite técnico explícito:** ambas as rotas renderizam `VacationBalancePage`; as regiões não aplicáveis são ocultadas por CSS (`display:none`) mas permanecem montadas em React. A opção preserva a única agregação de dados e os cálculos; extração futura de componentes/hook comum pode evitar trabalho oculto, mediante regressões. O CSS não altera os dados, as férias nem o direito.

**Segurança/integridade:** não houve alteração ao cofre, schema, autenticação, autorização, Worker, API, dependências, segredos ou sincronização. A meta pessoal de 28 continua separada do direito oficial. **A validação visual e funcional em dispositivos reais ainda está pendente** (iPhone, Android, tablet, desktop, zoom, VoiceOver/TalkBack).

## PR #211 — sugestões de férias alinhadas com o protótipo

**Estado: integrado, validado por CI e publicado.** Merge `b687673a467cf5fc5061160b41a254e4b55118cc`; Qualidade #1150/#1156 e `main` run `35127380594`, Publicar #250 e Pages #819 concluídos com sucesso; build `271035a552cb6a1ecdbfe6ee8032bcafed7013ff`.

O planeador oferece sugestões com dias úteis pretendidos (1–30, padrão 10), mês a evitar, preferência juntar fins de semana/mais cedo/maior saldo, comparação de meses, calendário navegável e «Simular este período», que preenche o formulário sem registar férias. `VacationSuggestions.ts` reutiliza simulação e saldo, exclui úteis sobrepostos/meses excluídos e filtra projeções pessoais negativas. Ano corrente real, não 2025 da imagem. Fins de semana adjacentes só são descanso se o forem na escala concreta. Dez úteis gozados de 24/08–06/09/2026, meta pessoal 28 e mais dez úteis sugeridos dão projeção de oito dias em dezembro, sem outros ajustes. Sem inferir direito oficial, feriados, escala, preços ou aprovação; sem nova persistência/API/telemetria. Código, CSS, testes e `docs/VACATION-SUGGESTIONS.md` existentes.

## PR #210 — simulador de períodos

Integrado/publicado: merge `73a6c0f43caf40219a98b1224113bdddaaec420b`, Qualidade #1148/#1149, Publicar #249, Pages #814; build `8a79445d483ff2017e2cb860c94bccc77d2d33d0`. Simula início/fim futuros dentro do ano atual, conta dias civis/úteis/fins de semana, não duplica úteis registados, prevê saldo antes/depois e dezembro, e lista grupos futuros. Não grava nem aprova férias. `VacationPlanner.ts`/`VacationPlannerPanel.tsx` e `docs/VACATION-PLANNER.md`. Limites: feriados, escala e transição de ano. 24/08–06/09/2026 = 14 civis, dez úteis, quatro fins de semana.

## Entregas anteriores de férias

- PR #209: indicadores de progresso anual, próximo marco, gozados/planeados e previsão dezembro; merge `8b7b6fc68c3330714b081865992de9adb5243d4c`, Qualidade #1140/#1141, Publicar #248, build `ac121c3f687f86149d90e1bd78c4788b8c86d0a6`, Pages #807.
- PR #208: grelha mensal fluida e contenção; merge `a41a0c3b9fdef1b0e5d67bc29ce6b453dbcbc4cf`, Qualidade #1138/#1139, Publicar #247, build `a5a17750ffa43f506c9feb5af78a167f3b1f0f5c`, Pages #801.
- PR #203–#207: ferramenta original, meta pessoal 28 configurável, úteis padrão, evolução intramensal e contenção responsiva; integrados/publicados.

## Regras funcionais

**Referência laboral:** ano normal com mínimo geral suportado de 22 úteis; direito superior apenas quando confirmado. Ano de admissão modelado conservadoramente como dois dias por mês completo até 20, marco dos seis meses. Transitados, férias externas e ajustes exigem confirmação.

**Projeção pessoal:** meta configurável (28 por defeito); março 7, junho 14, setembro 21, dezembro 28. Mês atual evolui pela fração temporal; atualiza a cada 60 segundos enquanto página ativa e em `focus`/`visibilitychange`, sem execução garantida em background.

**Dias registados:** mapa de turnos, plano mensal e calculadora de horas; datas deduplicadas. Segunda–sexta contam na regra padrão; sábado/domingo não reduzem saldo. 24/08–06/09/2026 = dez úteis e quatro fins de semana ignorados. Feriados/escalas especiais fora da inferência.

## Qualidade

React 19, TypeScript 5.9, Vite 7, Vitest 5, Node 22, npm 11.6.0. Gates: `npm audit --audit-level=high`, typecheck, lint, Vitest, build, Worker dry-run, smoke Chromium e artefacto. PR #213 passou no head final e em `main`; Publicar #252/Pages #832 bem-sucedidos. PR #214 aguarda gates finais.

## Limitações e validações abertas

1. Validar o ponto de situação vivo, passagem de dia, badge e contenção dos quatro cartões no iPhone real, Android, tablet e desktop, com zoom, texto ampliado e VoiceOver/TalkBack.
2. Confirmar 24/08–06/09 = dez úteis, sobreposição, atualização ao regressar à PWA e sincronização móvel/computador.
3. Testar navegação entre as duas rotas com perfil desbloqueado e simulação sem gravação implícita.
4. Avaliar feriados e descanso semanal alternativo apenas com contrato/CCT ou regras da entidade confirmados.
5. Continuar validação física da automação de jornada e sincronização cross-device.

## Última alteração

PR #214 em validação: resumo vivo local no planeamento, reuso de `calculateVacationBalance`, CSS isolado e testes; domínio e dados intactos.

## Próximo passo

Confirmar CI, integrar/publicar PR #214 e testar o ponto de situação no iPhone ao regressar à PWA. Não introduzir marcação automática sem confirmação explícita e verificação do direito oficial.
