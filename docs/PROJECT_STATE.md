# Estado do Projeto

Atualizado em: 2026-09-16

## Estado atual

O **Foco Jornada** é uma PWA React/TypeScript única e responsiva para telemóvel, tablet e computador, publicada em GitHub Pages. Persistência local-first em IndexedDB/cofre cifrado; sincronização opcional por Cloudflare Worker/Durable Objects transporta apenas o cofre cifrado.

Em `main` estão integrados turnos noturnos (#189), sincronização/associação cifrada de browsers (#191–#194), shell móvel (#195–#199), bootstrap animado (#200–#201), automação de jornada/pausas (#202), ferramenta/evolução de férias (#203–#209), simulador de períodos (#210), sugestões visuais (#211) e **separação das áreas de consulta e planeamento (#212)**.

## PR #213 — corrigir corte e espaço vazio no cabeçalho do planeamento

**Estado: alteração no branch `fix/vacation-planner-hero-spacing`, em validação; ainda não integrada/publicada nesta revisão.** A captura real mostra «Pré-visualização…» cortada à direita e uma caixa de cabeçalho demasiado alta. Causa provável no código: o painel de planeamento usa `display:grid`, que pode esticar a linha do cabeçalho, e partilha o estilo flexível de outros cabeçalhos sem orçamento próprio de largura.

Correção: `VacationPlannerPanel.tsx` passa a usar um `header.vacationPlannerHero` com título, explicação curta e badge contida; `vacation-planner.css` limita as colunas, permite quebra de texto e muda a vista dedicada para coluna flex de altura intrínseca. Em ecrãs até 820px a badge desce para a linha seguinte. Teste estrutural em `vacation-workspace.test.ts`. Não se alteraram fórmulas, 10 dias úteis de 24/08–06/09, meta pessoal de 28, fontes de dados, cofre, sync, API ou permissões. Especificação em `docs/VACATION-PLANNER-HEADER.md`.

**Próximo passo imediato:** validar head final no GitHub Actions, integrar apenas se passar, verificar Qualidade de `main`, publicação e Pages, e confirmar no iPhone com nova captura que a badge e a altura ficaram corretas. CI estrutural não equivale a teste visual físico.

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

React 19, TypeScript 5.9, Vite 7, Vitest 5, Node 22, npm 11.6.0. Gates: `npm audit --audit-level=high`, typecheck, lint, Vitest, build, Worker dry-run, smoke Chromium e artefacto. PR #212 passou no head final e em `main`; Publicar #251/Pages #826 bem-sucedidos. PR #213 aguarda gates finais.

## Limitações e validações abertas

1. Testar o cabeçalho corrigido no iPhone real, badge contida e altura sem vazio, também Android, tablet e desktop, zoom, orientação horizontal, texto ampliado e VoiceOver/TalkBack.
2. Confirmar 24/08–06/09 = dez úteis, sobreposição, atualização ao regressar à PWA e sincronização móvel/computador.
3. Testar navegação entre as duas rotas com perfil desbloqueado e simulação sem gravação implícita.
4. Avaliar feriados e descanso semanal alternativo apenas com contrato/CCT ou regras da entidade confirmados.
5. Continuar validação física da automação de jornada e sincronização cross-device.

## Última alteração

PR #213 em validação: novo cabeçalho compacto e planeador em coluna de altura intrínseca; código do domínio e dados intactos.

## Próximo passo

Confirmar CI, integrar/publicar PR #213 e pedir captura do iPhone atualizado; se persistir espaço vazio, recolher dimensões e inspecionar CSS computado no dispositivo. Não introduzir marcação automática sem confirmação explícita e verificação do direito oficial.
