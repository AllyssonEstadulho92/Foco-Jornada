# Decisões técnicas

Atualizado em: 2026-09-17. As decisões D-001 a D-033, com texto integral e motivos, foram preservadas sem alterações em `docs/history/DECISIONS-pre-217.md`. Este documento é o índice de decisões recentes; consultar também `docs/ARCHITECTURE.md` e as especificações dedicadas.

## D-033 — Ponto de situação local vivo no planeamento

**Estado:** aceite, PR #214 integrado. **Decisão:** reutilizar relógio da página e `calculateVacationBalance` para acumulado, saldo atual, após planeadas e projeção dezembro; não criar timer remoto, sincronização instantânea ou persistência adicional. **Motivo:** evitar divergência dos cálculos.

## D-034 — Planeamento do ano seguinte e férias a dois

**Estado:** aceite, PR #215 integrado/publicado. **Decisão:** oferecer seletor do ano atual/seguinte, julho como mês sugerido, excluir novembro/dezembro como restrição comunicada e sujeita a confirmação; obter registos do ano escolhido do cofre sem transportar automaticamente saldo, ajustes ou dias manuais do ano anterior. **Motivo:** simulação coerente e não atribuir direitos nem aprovações inexistentes. **Limites:** feriados, escala e disponibilidade da parceira não são verificados.

## D-035 — Confirmar apenas o cenário escolhido, sem gravação

**Estado:** aceite, PR #216 integrado/publicado. **Decisão:** checklist temporária com confirmação declarativa da parceira e da entidade empregadora; mudar dados, datas ou filtros limpa os vistos por identidade do cenário. Nenhuma API ou marcação automática. **Motivo:** impedir que confirmações antigas sejam confundidas com aprovação de um período diferente.

## D-036 — Rastreabilidade opcional do saldo por data e fonte

**Estado:** aceite, PR #217 integrado/publicado. **Decisão:** painel recolhido só em `#/ferias` com atalho, datas civis válidas deduplicadas e enumeração das fontes cifradas por data. `collectVacationDatesForYear` deriva do mesmo coletor de proveniência, sem segundo algoritmo para o planeador anual. Contar úteis até hoje, futuros e fins de semana ignorados; indicar que dias manuais sem data não constam da lista mas permanecem descontados no saldo. **Motivo:** permitir conferir os registos e detetar divergências sem acrescentar um novo cálculo ou expor mais informação por defeito. **Trade-off:** `VacationBalancePage` mantém coletor próprio para o ano atual e os dados cifrados indisponíveis podem produzir consulta parcial. **Segurança:** leitura apenas do cofre existente, sem nova persistência/API/backend, sem inferir aprovação, feriados ou direito automático de 28 dias. Detalhes em `docs/VACATION-EVIDENCE.md`. **Entrega:** merge `61816f7ec3f1c43043d57b094f834bb116d19a27`, Qualidade #1192/#1193, Publicar #256, Pages #842 e build `322b8b37f745e17233360af07e473f50e9fc79d5`; validação em dispositivos reais ainda pendente.