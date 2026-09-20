# Changelog

Atualizado em: 2026-09-20. Alterações anteriores até ao PR #214 (texto completo e provas históricas) em `docs/history/CHANGELOG-pre-217.md`.

## 2026-09-20 — Refinamento de Férias inspirado no novo painel (branch em análise)

- `VacationWorkspacePage` agrupa «Visão geral», «Planeamento» e botão «Registos» na mesma barra. As duas primeiras opções continuam as rotas existentes; «Registos» desloca o foco para as fontes locais via `focusSection`, sem reescrever o hash nem criar uma rota ou histórico de aprovações.
- `vacation-elegance.css` introduz refinamentos escopados ao módulo: navegação arredondada e acessível, saldo pessoal com destaque verde e variante de perigo, cartões responsivos e datas/fontes em linha temporal decorativa. Não acrescenta valores exemplificativos do mockup, dados, calendário autónomo, novas operações, dependências, serviços ou permissões.
- Testes estruturais `vacation-elegance.test.ts`, documentação em `VACATION-ELEGANCE-2026-09-20.md` e atualização dos cinco documentos de continuidade. **Estado:** CI, inspeção física iPhone/Android/tablet/desktop e comparação com a PR #224 ainda pendentes; não integrado ou publicado.

## 2026-09-20 — PR #223: adaptar visualmente Férias e Planeamento aos dois protótipos (em validação)

- Duas imagens do utilizador orientaram o desenho para desktop e móvel: separadores, paisagem, quatro métricas, evolução mês a mês em gráfico/tabela, indicadores e planeamento em etapas. Os números, nomes de colaboradores e botão de submissão presentes no mockup são ilustrativos; não foram importados para o produto nem foi criada uma aprovação fictícia.
- `vacation-coast.svg` é uma paisagem costeira vetorial local e original; `vacation-prototype.css` aplica a linguagem visual às duas rotas, com cartões compactos, hero contido, foco, alto contraste e movimento reduzido. `vacation-month-visual.css` dá largura/altura adaptativas ao gráfico e tabela de meses. Sem imagens externas, dados inventados ou alterações ao AppShell global.
- `VacationMonthlyVisualization` permite alternar Gráfico/Tabela alimentados pelo **mesmo** `monthlyAccrualSchedule` e meta real de `VacationBalance`; valor do mês em curso usa `liveCumulativeDays` e não soma arredondamentos. Os doze cartões e quatro métricas detalhadas permanecem disponíveis num `details` expansível, não apagados. `VacationBalancePage` conserva cofre, registos, cálculo, relógio por minuto, configuração, referência laboral, fontes, precisão e simulação.
- `VacationJointPlanner` conserva mês/dias, julho por omissão no ano seguinte, bloqueios declarados de novembro/dezembro, propostas, calendário opcional e checklist efémera por cenário. Não há API de submissão à ILUNION nem confirmação da parceira/empresa verificada automaticamente. Meta pessoal de 28 dias continua separada do direito contratual.
- Testes `VacationMonthlyVisualization.test.tsx` e `vacation-prototype.test.ts` verificam valores recebidos do domínio, comutação, rotas, assets locais, responsividade e ausência de submissão; Qualidade preliminar #1244 passou auditoria de dependências, TypeScript, lint, testes, build, Worker dry-run e smoke Chromium. **Estado:** CI final, merge, Pages e validação física do iPhone ainda por confirmar. Ver `docs/VACATION-PROTOTYPE-2026.md`.

## 2026-09-19 — PR #222: auditoria de espaços e refinamento das secções (integrado e publicado)

- Inspecionado PDF exportado do iPhone em 19/09: títulos de «Evolução por mês» e «O que tens, o que falta e o que vem a seguir» separados dos valores por grandes espaços vazios. O CSS confirmou que as bases `flex:1 1 240px`/`flex:1 1 260px` dos títulos se convertiam em alturas quando o cabeçalho passava para coluna <=640px; `flex-basis:100%` genérico agravava o risco. Ver `VACATION-MOBILE-SPACING-AUDIT-2026.md`.
- `vacation-workspace.css`: títulos móveis com `flex:0 0 auto`, largura inteira, gap contido e altura intrínseca; cartões mensais <=560px mais compactos, mês e estado lado a lado quando possível, com quebra de linha quando necessário. Mantidos todos os meses e descrições.
- `vacation-insights.css`: progresso anual e próximo marco recebem maior destaque relativo; outros indicadores têm menos decoração e margens/altura menores, incluindo no telemóvel. `vacation-planning-structure.css`: escolher/comparar lado a lado apenas em desktop >=1100px, percurso vertical no móvel e resumo opcional do ano anterior com quebra segura <=440px. Não existe uma nova camada CSS.
- Testes `vacation-workspace.test.ts`, `vacation-insights.test.ts` e `vacation-planning-structure.test.ts` protegem responsividade e contenção. Alterações apenas de CSS/testes/documentação: sem modificar componentes TSX, cálculos, registos, feriados, confirmação da empresa, autenticação, cofre, Worker ou sincronização. **Entrega verificada:** merge `b5f34b9b8adf8e2ecacd210ecfbeb7f9d6c0614a`, Qualidade #1240 (head final) e #1241 em `main` com auditoria, TypeScript, lint, Vitest, build, Worker dry-run e smoke Chromium aprovados; Publicar #261 e GitHub Pages #869 com sucesso, build `112d2dbb7a56925d8a42dec2aaf0d9bae967a0fe`. **Validação física no iPhone continua pendente**; não confundir a captura anterior à mudança com prova de resultado.
- O PDF exibe data de admissão de 30/09/2026 em 19/09/2026 e referência laboral 0 apesar de campo anual 22. Discrepância registada para confirmação dos dados, não corrigida por suposição nesta alteração visual.

## 2026-09-18 — PR #221: estrutura progressiva do Planeamento de Férias (integrado e publicado)

- O PDF de planeamento anterior mostrou métricas de 2026 antes das opções de julho de 2027. Confirmada a ordem no código, sem erro de cálculo demonstrado.
- `VacationPlannerPanel` coloca propostas do ano seguinte antes de `details` opcional do saldo atual com aviso de não transferência; no ano corrente preserva resumo completo e simulação. Mesmo `calculateVacationBalance` e relógio.
- `VacationJointPlanner` usa percurso 01 escolher, 02 comparar, 03 simular, 04 confirmar; alternativas compactas e explicações expansíveis. Preservados novembro/dezembro excluídos, julho por omissão, seleção, calendário, `confirmationScope` e checklist sem gravação.
- `vacation-planning-structure.css` é exclusivo da rota de planeamento, com responsividade, foco, alto contraste e movimento reduzido. Testes e `VACATION-PLANNING-STRUCTURE-2026.md`.
- **Entrega verificada:** merge `9e9d267fd7a9ed7de3a9afdc68cbc8a8d2b708b9`, Qualidade #1227/#1228, Publicar #260, build `4074f203c6788d30a4f542c951a6b94b62f86fad`, Pages #866; todos com sucesso. Teste físico pendente.

## 2026-09-18 — PR #220: refinar as duas vistas e corrigir salto global

- `vacation-visual-audit.css` recebeu largura de leitura de 74rem e hierarquia dos cartões, calendário de sete colunas contido. Sem esconder funções nem alterar valores.
- «Saltar para o conteúdo» usa botão `focusSection('main-content')` em vez de `href="#main-content"`; preserva hash do Router. Testes jsdom de foco/hash e CSS, sem alterar segurança, cálculos ou sync.
- **Entrega verificada:** merge `8a45758f68462e8631edbaf65f0b802a2c60ee19`, Qualidade #1219/#1220, Publicar #259, build `eec8da024db5b3f65624433c66726e7c56e04cb0`, Pages #859. Teste iPhone pendente.

## 2026-09-17 — PR #219: auditoria e refinamento visual das férias (integrado e publicado)

- Componentes/CSS auditados em `VACATION-UI-AUDIT-2026.md`; `vacation-visual-audit.css` harmoniza navegação móvel, tipografia, espaçamento, sombras, cartões intrínsecos e formulários. Mantidos dados, cálculo, foco e contraste. Testes estruturais não substituem dispositivos.
- **Entrega verificada:** merge `f96ced5532178bb0746db0e50ef52874e72710dc`, Qualidade #1209/#1210, Publicar #258, build `96c779f88ab2d0f941b7a54f690dd759fa909ec1`, Pages #854. Teste físico pendente.

## 2026-09-17 — PR #218: corrigir 404 no atalho de férias (integrado e publicado)

- Captura real no iPhone revelou `Unexpected Application Error! / 404 Not Found`: o `href="#vacation-evidence-title"` substituía a rota `#/ferias`. Botão nativo com `focusSection`, foco em título `tabIndex={-1}` e rota residual `*` com recuperação PT-PT. Testes jsdom e estruturais.
- **Entrega:** merge `89564f3ebbfe5d54e5d09dcf28db9e574b35cc50`, Qualidade #1201/#1202, Publicar #257, Pages #848, build `42397a6c97d60044f5dbc1cf90723ee799b1d0ac`. Teste físico pendente.

## 2026-09-17 — PR #217: origem dos dias de férias (integrado e publicado)

- `#/ferias` recebeu painel opcional «De onde vêm os teus dias?», datas/fontes deduplicadas, úteis gozados/futuros, fins de semana ignorados e manuais sem data que continuam descontados. `VacationYearRecords` expõe proveniência única e valida datas, com leitura do cofre existente e testes de domínio/UI.
- Sem alterar fórmula, meta pessoal 28, direito contratual, persistência, autenticação ou sync. **Entrega:** merge `61816f7ec3f1c43043d57b094f834bb116d19a27`, Qualidade #1192/#1193, Publicar #256, Pages #842, build `322b8b37f745e17233360af07e473f50e9fc79d5`. Teste físico pendente.

## 2026-09-17 — PR #216: confirmação por cenário

- Checklist temporária local da parceira e empregador; mudança de cenário repõe vistos. Qualidade #1190, merge `faa8c064c13246654152c5eb66e7e7be65bdeaee`, Publicar #255, Pages #840.

## 2026-09-17 — PR #215: julho do ano seguinte

- Planeamento autónomo ano atual/seguinte, julho predefinido, novembro/dezembro excluídos segundo restrição comunicada; sem transportar saldos, registar datas ou assumir aprovação. PR integrado.

## 2026-09-16 — PR #214: resumo vivo local no planeador

- Acumulado, disponível, após planeadas e previsão dezembro pelo mesmo `VacationBalance` e relógio, sem prometer sync instantânea. PR integrado.
