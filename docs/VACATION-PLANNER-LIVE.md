# Planeamento de férias — ponto de situação em tempo real (PR #214)

## Objetivo

Na vista dedicada `#/ferias/planeamento`, apresentar o saldo atual antes das sugestões e simulações, sem misturar a consulta detalhada de `#/ferias` ou criar dados novos.

## Implementação

`VacationPlannerPanel` recebe `today`, `asOfDayProgress`, `settings` e `recordedVacationDates` de `VacationBalancePage`, que já mantém o relógio local: atualização a cada 60 segundos enquanto ativa, `focus` e `visibilitychange` ao regressar. O resumo volta a chamar a função de domínio `calculateVacationBalance` com esses **mesmos dados** e expõe `monthlyLiveAccruedDays`, `monthlyLiveAvailableBalanceDays`, `monthlyLiveProjectedBalanceDays` e `yearEndProjectedBalanceDays`. Não há segunda fórmula nem segundo timer; alterações de filtros e datas continuam a atualizar as sugestões e a simulação imediatamente.

A hora apresentada é aproximada ao minuto e derivada do mesmo progresso temporal do cálculo; não representa confirmação de sincronização remota. A secção informa explicitamente que o saldo após planeadas **não inclui** o período apenas simulado. Simular não grava ou aprova férias.

`vacation-planner-live.css` limita largura/grelha, ordena conteúdo em cartões de altura intrínseca, permite quebra de números e texto, preserva contraste forçado e reduz movimento. O teste `vacation-planner-live.test.ts` verifica reutilização de relógio e domínio, ausência de segundo intervalo, valores exibidos e contenção estrutural.

## Segurança e limites

Sem novo endpoint, dependência, schema, segredo, permissão, telemetria ou persistência. A meta de 28 dias continua **projeção pessoal**, separada do direito oficial. Tempo real significa recálculo local enquanto a página está ativa e ao regressar à PWA; o iOS pode suspender timers em segundo plano e a sincronização entre dispositivos não é instantânea garantida. Feriados, escalas particulares e aprovação não são inferidos.

## Validação

Executar auditoria, typecheck, lint, testes, build, Worker dry-run e smoke do browser no head final e em `main`; confirmar Pages. Testar posteriormente no iPhone real a hora, contenção dos quatro cartões, zoom, passagem de dia, novas datas/ajustes e reativação da PWA. Não declarar validação física com base em testes estruturais.
