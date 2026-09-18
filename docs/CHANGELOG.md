# Changelog

Atualizado em: 2026-09-18. Alterações anteriores até ao PR #214 (texto completo e provas históricas) em `docs/history/CHANGELOG-pre-217.md`.

## 2026-09-18 — PR #221: estrutura progressiva do Planeamento de Férias (em validação)

- O PDF fornecido pelo utilizador mostra o ecrã de 2027 com quatro cartões do saldo atual de 2026 antes das propostas e uma lista extensa de alternativas, simulação, checklist e notas. Confirmada no código a ordem de apresentação; não se detetou neste pedido erro de cálculo.
- `VacationPlannerPanel`: apresenta primeiro as propostas do ano seguinte e deixa o saldo atual de 2026 num `details` opcional, com resumo do saldo e aviso de não transferência; no ano corrente preserva o painel completo e a simulação anterior. Mesmo `calculateVacationBalance` e relógio; sem novo timer.
- `VacationJointPlanner`: percurso 01 escolher, 02 comparar, 03 simular, 04 confirmar; alternativas compactas e metodologia detalhada expansível. Preservados novembro/dezembro excluídos, julho por omissão, seleção, calendário, `confirmationScope` e checklist sem gravação.
- Novo módulo de layout exclusivo da rota `vacation-planning-structure.css`, importado por último; regras de uma coluna móvel, foco, alto contraste e movimento reduzido. Teste estrutural `vacation-planning-structure.test.ts` e documentação em `docs/VACATION-PLANNING-STRUCTURE-2026.md`.
- **Estado:** PR #221 em validação; CI final, merge, publicação e teste físico ainda por confirmar. Nenhuma alteração a saldos, fórmulas, registos, cofre, backend, autorizações ou sincronização.

## 2026-09-18 — PR #220: refinar Férias e Planeamento; eliminar risco de 404 no salto global (integrado e publicado)

- Nas duas rotas de férias, `vacation-visual-audit.css` recebeu largura de leitura de 74rem, superfícies/sombras discretas, contraste e hierarquia entre saldo e indicadores, cabeçalhos de planeamento contidos e calendários com sete colunas e `min-width:0` no smartphone. Sem esconder funções nem alterar valores.
- «Saltar para o conteúdo» em `AppShell` deixou `href="#main-content"`; botão nativo chama `focusSection('main-content')` e foca `<main tabIndex={-1}>` sem substituir o hash.
- Testes jsdom verificam foco e hash nas duas rotas e turnos; testes CSS verificam calendários, alto contraste e movimento reduzido. Sem alterar fórmulas, dados cifrados, segredos, sync ou backend.
- **Entrega verificada:** PR #220 merge `8a45758f68462e8631edbaf65f0b802a2c60ee19`, Qualidade #1219/#1220, Publicar #259, build `eec8da024db5b3f65624433c66726e7c56e04cb0`, Pages #859; todos com sucesso. Teste real iPhone pendente. Ver `docs/VACATION-UI-AUDIT-2026.md`.

## 2026-09-17 — PR #219: auditoria e refinamento visual das férias (integrado e publicado)

- Auditados componentes/CSS das rotas; relatório em `docs/VACATION-UI-AUDIT-2026.md`.
- `vacation-visual-audit.css` só em `VacationWorkspacePage`: navegação móvel compacta em duas opções, ativo destacado, atalho de proveniência secundário, tipografia/espaçamentos/sombras uniformes, cartões de altura intrínseca, formulários e resultados coerentes.
- Preservados dados, cálculo, ano, interação e foco; contraste forçado e movimento reduzido. `vacation-visual-audit.test.ts` protege regressões estruturais, não todas as resoluções.
- **Entrega verificada:** PR #219 merge `f96ced5532178bb0746db0e50ef52874e72710dc`, Qualidade #1209/#1210, Publicar #258, build `96c779f88ab2d0f941b7a54f690dd759fa909ec1`, Pages #854. Teste físico pendente. Skip link global resolvido no PR #220.

## 2026-09-17 — PR #218: corrigir 404 do atalho de férias (integrado e publicado)

- Captura real no iPhone mostrou `Unexpected Application Error! / 404 Not Found` ao tocar «Ver de onde vêm os dias registados»: `href="#vacation-evidence-title"` substituía a rota `#/ferias` do `createHashRouter`.
- Botão nativo passa a usar `focusSection`, scroll/foco preservando o hash; título `tabIndex={-1}`. Rota `*` com recuperação PT-PT em vez de fallback técnico.
- Testes jsdom de hash/foco e estrutural do Router. Sem alterar cálculos, dias, dados cifrados, sync, auth, backend ou dependências.
- **Entrega:** PR #218 merge `89564f3ebbfe5d54e5d09dcf28db9e574b35cc50`, Qualidade #1201/#1202, Publicar #257, Pages #848, build `42397a6c97d60044f5dbc1cf90723ee799b1d0ac`. Teste físico pendente.

## 2026-09-17 — PR #217: origem dos dias de férias (integrado e publicado)

- `#/ferias` ganhou painel opcional «De onde vêm os teus dias?», datas ordenadas e fontes (horas/turnos/plano), úteis gozados/futuros e fins de semana ignorados.
- `VacationYearRecords` expõe proveniência única por data e usa mesma coleta para o ano futuro, com validação de datas impossíveis e preservação de datas válidas encontradas em outras folhas do ano.
- Saldo pessoal explicado, refresh e indicação de dias manuais sem data descontados mas ausentes da lista. CSS fluido, foco, alto contraste, movimento reduzido e testes de domínio/UI.
- Sem alterar fórmula, direito oficial, meta pessoal 28, persistência, cofre, auth, sync, API, segredos, deps ou telemetria. **Entrega:** merge `61816f7ec3f1c43043d57b094f834bb116d19a27`, Qualidade #1192/#1193, Publicar #256, Pages #842, build `322b8b37f745e17233360af07e473f50e9fc79d5`. Teste físico pendente.

## 2026-09-17 — PR #216: confirmação por cenário

- Checklist temporária, só local, da parceira e entidade empregadora; alteração de cenário repõe vistos. Teste de isolamento corrigido e Qualidade #1190 verde. PR integrado `faa8c064c13246654152c5eb66e7e7be65bdeaee`, Publicar #255, Pages #840.

## 2026-09-17 — PR #215: julho do ano seguinte

- Planeamento autónomo ano atual/seguinte, julho predefinido, novembro/dezembro excluídos segundo restrição indicada; sem transportar saldos anteriores, registar datas ou assumir disponibilidade/autorizações. PR integrado.

## 2026-09-16 — PR #214: resumo vivo local no planeador

- Acumulado, disponível, após planeadas e previsão dezembro pelo mesmo `VacationBalance` e relógio, sem prometer sincronização remota instantânea. PR integrado.
