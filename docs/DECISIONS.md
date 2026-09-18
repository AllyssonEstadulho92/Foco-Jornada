# Decisões técnicas

Atualizado em: 2026-09-18. Decisões D-001 a D-033, com texto integral, preservadas em `docs/history/DECISIONS-pre-217.md`. Este documento indexa decisões recentes.

## D-040 — Propostas antes de contexto antigo e planeamento progressivo

**Estado:** proposto no PR #221; aguarda CI final, integração e publicação. **Decisão:** no planeamento do próximo ano, apresentar primeiro as propostas e remeter a referência do saldo do ano corrente para `<details>` consultável, explicitando que não é saldo transferido. No ano corrente o resumo vivo mantém-se aberto. Reorganizar a proposta a dois em quatro etapas semânticas na ordem do DOM (preferências, comparação, simulação e confirmação), com opções compactas e notas detalhadas em `<details>`. **Motivo:** o PDF do utilizador mostrou quatro cartões de 2026 e alternativas altas antes da decisão sobre julho/2027; a melhoria reduz ruído e distingue horizonte atual de projeção futura. **Trade-off:** uma folha de layout `vacation-planning-structure.css` escopada à rota é adicionada para suportar os grupos reais, sem reformular a cascata global; detalhes nativos ocultam informação secundária até consulta, sem a eliminar. **Preservação:** mesmas funções de domínio, cofre, dados, quatro alternativas quando existentes, bloqueio declarado de novembro/dezembro, simulação e checklist efémera com `confirmationScope`; nenhuma aprovação externa. Testes estruturais + CI; validação física do iPhone ainda pendente. Ver `docs/VACATION-PLANNING-STRUCTURE-2026.md`.

## D-039 — Refinar as duas vistas sem nova camada e corrigir salto global

**Estado:** aceite, PR #220 integrado/publicado. **Decisão:** modificar a camada `vacation-visual-audit.css` existente, sem acrescentar outro tema nem alterar domínio, para largura de 74rem, superfícies consistentes e destaque do saldo. Limitar calendários a larguras compactas. No `AppShell`, trocar `href="#main-content"` por botão `focusSection('main-content')`. **Motivo:** o HashRouter interpreta `#main-content` como rota e pode produzir 404; a revisão visual anterior exigia ajuste. **Trade-off:** CSS estrutural não demonstra ausência de overflow real. **Segurança:** sem alteração de dados, chaves, backend, sync, cálculos ou aprovações. **Entrega:** merge `8a45758f68462e8631edbaf65f0b802a2c60ee19`, Qualidade #1219/#1220, Publicar #259, build `eec8da024db5b3f65624433c66726e7c56e04cb0`, Pages #859; validação física pendente. Ver `docs/VACATION-UI-AUDIT-2026.md`.

## D-033 — Ponto de situação local vivo no planeamento

**Estado:** aceite, PR #214 integrado. **Decisão:** reutilizar relógio da página e `calculateVacationBalance` para acumulado, saldo atual, após planeadas e projeção dezembro; não criar timer remoto, sincronização instantânea ou persistência adicional. **Motivo:** evitar divergência dos cálculos.

## D-034 — Planeamento do ano seguinte e férias a dois

**Estado:** aceite, PR #215 integrado/publicado. **Decisão:** oferecer seletor do ano atual/seguinte, julho como mês sugerido, excluir novembro/dezembro como restrição comunicada sujeita a confirmação; obter registos do ano escolhido do cofre sem transportar automaticamente saldo, ajustes ou dias manuais do ano anterior. **Motivo:** simulação coerente e não atribuir direitos nem aprovações inexistentes. **Limites:** feriados, escala e disponibilidade da parceira não são verificados.

## D-035 — Confirmar apenas o cenário escolhido, sem gravação

**Estado:** aceite, PR #216 integrado/publicado. **Decisão:** checklist temporária com confirmação declarativa da parceira e entidade empregadora; mudar dados, datas ou filtros limpa vistos por identidade do cenário. Nenhuma API ou marcação automática. **Motivo:** impedir confirmação antiga de ser confundida com aprovação de período diferente.

## D-036 — Rastreabilidade opcional do saldo por data e fonte

**Estado:** aceite, PR #217 integrado/publicado. **Decisão:** painel recolhido só em `#/ferias`, com datas civis válidas deduplicadas e enumeração das fontes cifradas. `collectVacationDatesForYear` deriva do coletor de proveniência, sem segundo algoritmo anual. Contar úteis gozados/futuros/fins de semana ignorados e identificar manuais sem data. **Motivo:** conferir registos sem cálculo novo ou exposição por defeito. **Trade-off:** `VacationBalancePage` mantém coletor próprio; dados cifrados indisponíveis podem dar consulta parcial. **Segurança:** leitura do cofre existente, sem nova API/backend nem inferência de aprovação, feriados ou direito automático de 28 dias. **Entrega:** merge `61816f7ec3f1c43043d57b094f834bb116d19a27`, Qualidade #1192/#1193, Publicar #256, Pages #842, build `322b8b37f745e17233360af07e473f50e9fc79d5`; validação real pendente.

## D-037 — O hash pertence ao Router; saltos para secções não o substituem

**Estado:** aceite, PR #218 integrado/publicado. **Decisão:** atalho «Ver de onde vêm os dias registados» trocado de `href="#vacation-evidence-title"` para botão com `focusSection`, scroll/foco em título `tabIndex={-1}` sem mudar `#/ferias`. Rota residual `*` mostra recuperação PT-PT. **Motivo:** o `createHashRouter` interpretava o fragmento como rota, 404 observado no iPhone. **Seguimento:** skip link global corrigido no PR #220. **Compatibilidade:** sem alterar modelo de férias, permissões, backend, cofre, sync, deps ou dados. **Entrega:** merge `89564f3ebbfe5d54e5d09dcf28db9e574b35cc50`, Qualidade #1201/#1202, Publicar #257, Pages #848, build `42397a6c97d60044f5dbc1cf90723ee799b1d0ac`.

## D-038 — Polimento visual escopado sem reestruturar a lógica

**Estado:** aceite, PR #219 integrado/publicado. **Decisão:** `vacation-visual-audit.css`, apenas em `VacationWorkspacePage`, harmoniza espaçamento, raios e hierarquia, compacta dois separadores móveis e reduz alturas fixas, sem ocultar valores/reordenar secções. Preserva foco, contraste e redução de movimento. **Motivo:** navegação alta e ênfase inconsistente. **Trade-off:** camada CSS específica sobre estilos existentes; consolidar só após testes em dispositivos. **Seguimento:** skip link global corrigido #220; vista oculta ainda montada. **Entrega:** merge `f96ced5532178bb0746db0e50ef52874e72710dc`, Qualidade #1209/#1210, Publicar #258, Pages #854, build `96c779f88ab2d0f941b7a54f690dd759fa909ec1`; testes físicos pendentes.
