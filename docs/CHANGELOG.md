# Changelog

Atualizado em: 2026-09-18. Alterações anteriores até ao PR #214 (texto completo e provas históricas) permanecem em `docs/history/CHANGELOG-pre-217.md`.

## 2026-09-18 — PR #220: refinar Férias e Planeamento; eliminar risco de 404 no salto global (integrado e publicado)

- Nas duas rotas de férias, a camada `vacation-visual-audit.css` existente recebeu largura de leitura de 74rem, superfícies/sombras mais subtis, contraste e hierarquia entre saldo e indicadores, cabeçalhos de planeamento mais contidos e calendários de sete colunas com células `min-width:0` e padding lateral reduzido no smartphone. Sem criar tema adicional, esconder funcionalidades ou alterar formulários/valores.
- O atalho global «Saltar para o conteúdo» em `AppShell` deixou de usar `href="#main-content"`; botão nativo chama `focusSection('main-content')` e foca o `<main tabIndex={-1}>` sem substituir a rota `#/ferias` ou `#/ferias/planeamento`.
- Testes jsdom verificam foco e hash intacto nas duas rotas e em turnos; testes estruturais protegem CSS de calendários, tamanhos compactos, alto contraste e movimento reduzido. Não altera fórmulas, dados cifrados, aprovações, segredos, sync ou backend.
- **Entrega verificada:** PR #220 integrado, merge `8a45758f68462e8631edbaf65f0b802a2c60ee19`; Qualidade #1219 (head final) e #1220 (`main`) passaram auditoria de dependências, TypeScript, lint, Vitest, build, Worker dry-run e smoke Chromium. Publicar Foco & Jornada #259 e GitHub Pages #859 concluíram com sucesso; build `eec8da024db5b3f65624433c66726e7c56e04cb0`. **Validação visual e funcional no iPhone real continua pendente.** Ver `docs/VACATION-UI-AUDIT-2026.md`.

## 2026-09-17 — PR #219: auditoria e refinamento visual das férias (integrado e publicado)

- Auditados os componentes e CSS das rotas `#/ferias` e `#/ferias/planeamento`. Relatório factual, critérios e limitações em `docs/VACATION-UI-AUDIT-2026.md`.
- Nova camada `vacation-visual-audit.css` importada só em `VacationWorkspacePage`: navegação móvel compacta em duas opções, estado ativo destacado, atalho de proveniência apresentado como ação secundária, hierarquia e largura dos títulos, espaços/raios/sombras uniformes, cartões de altura intrínseca e formulários/resultados do planeamento mais coerentes.
- Conservados os dados, cálculos, ano do planeamento, estados de interação, saltos sem alterar hash, foco visível e modos de alto contraste/movimento reduzido. Teste estrutural `vacation-visual-audit.test.ts` protege rotas, importação e principais limites móveis; não comprova visualmente todas as resoluções.
- **Entrega verificada:** PR #219 merge `f96ced5532178bb0746db0e50ef52874e72710dc`; Qualidade #1209 (head final) e #1210 (`main`) passaram auditoria, TypeScript, lint, testes, build, Worker dry-run e smoke Chromium. Publicar Foco & Jornada #258 e GitHub Pages #854 concluíram com sucesso; build publicado `96c779f88ab2d0f941b7a54f690dd759fa909ec1`. Confirmação visual em iPhone/Android/tablet/desktop continua pendente. O skip link global foi resolvido pelo PR #220.

## 2026-09-17 — PR #218: corrigir 404 do atalho de férias (integrado e publicado)

- Captura real no iPhone revelou `Unexpected Application Error! / 404 Not Found` após tocar em «Ver de onde vêm os dias registados». Causa confirmada: `href="#vacation-evidence-title"` substituía a rota `#/ferias` do `createHashRouter`.
- O atalho usa agora botão nativo, scroll e foco programático via `focusSection`, preservando o hash da rota. Título focável sem entrar na ordem normal de Tab; CSS mantém aparência e área de toque.
- Adicionada rota de recuperação `*` com mensagem em PT-PT e opções para regressar às férias ou ao início, evitando o fallback técnico do Router quando o URL é desconhecido.
- Testes jsdom verificam que o hash não muda e o título recebe foco; teste estrutural impede regressão do `href` incompatível e protege a rota de recuperação. Sem alterar cálculos, dias de férias, dados cifrados, sincronização, autenticação, backend ou dependências.
- **Entrega verificada:** Qualidade #1201 (head final) e #1202 (`main`) com sucesso; merge `89564f3ebbfe5d54e5d09dcf28db9e574b35cc50`; Publicar Foco & Jornada #257 e GitHub Pages #848 concluídos com sucesso; build `42397a6c97d60044f5dbc1cf90723ee799b1d0ac`. Teste físico do atalho corrigido ainda pendente. Ver `HASH-ROUTER-NAVIGATION.md`.

## 2026-09-17 — PR #217: origem dos dias de férias (integrado e publicado)

- `#/ferias` ganhou painel opcional, recolhido por defeito, «De onde vêm os teus dias?», com atalho, datas ordenadas, indicação das áreas de origem (horas, turnos e plano), úteis até hoje/futuros e fins de semana ignorados.
- `VacationYearRecords` expõe proveniência única por data e `collectVacationDatesForYear` deriva a mesma coleta para o ano futuro. Mantém datas civis válidas encontradas numa folha de outro mês do mesmo ano; rejeita datas impossíveis, fontes inválidas e indisponíveis sem inventar dias.
- Explicação legível do saldo pessoal, atualização manual e nota explícita sobre dias gozados manualmente sem data, que não aparecem como datas mas continuam a ser descontados no saldo. CSS fluido, foco, contraste forçado, movimento reduzido. Testes unitários/domínio/UI e `docs/VACATION-EVIDENCE.md`.
- Sem mudança de fórmula, direito oficial, meta pessoal 28, registos persistidos, cofre, autenticação, sync, API, segredos, dependências ou telemetria. **Entrega verificada:** Qualidade #1192 (implementação) e #1193 (head final) com sucesso; merge `61816f7ec3f1c43043d57b094f834bb116d19a27`; Publicar #256 e GitHub Pages #842 concluídos com sucesso; build `322b8b37f745e17233360af07e473f50e9fc79d5`. Testes físicos de iPhone/Android/tablet/desktop ainda pendentes.

## 2026-09-17 — PR #216: confirmação por cenário

- Checklist temporária e responsiva de férias a dois. Vistos da parceira e entidade empregadora são declarações locais, não aprovações externas; mudar cenário repõe os vistos. Corrigido teste após primeira falha de isolamento e obtida CI #1190 verde. PR integrado `faa8c064c13246654152c5eb66e7e7be65bdeaee`, Publicar #255, Pages #840 concluídos com sucesso.

## 2026-09-17 — PR #215: julho do ano seguinte

- Planeamento autónomo com ano atual/seguinte, propostas de férias a dois com julho predefinido, novembro/dezembro excluídos por restrição indicada sujeita a confirmação; simulação sem transportar saldos anteriores sem confirmação, sem registar datas ou assumir disponibilidade/autorizações. PR integrado.

## 2026-09-16 — PR #214: resumo vivo local no planeador

- Ponto de situação com acumulado, disponível, após planeadas e previsão dezembro usando o mesmo `VacationBalance` e relógio existente. PR integrado; sem prometer sync remoto instantâneo.
