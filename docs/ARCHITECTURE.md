# Arquitetura

Atualizado em: 2026-09-17. O histórico integral anterior foi preservado em `docs/history/ARCHITECTURE-pre-217.md`.

## Plataforma e camadas

Uma PWA React 19/TypeScript 5.9/Vite 7/React Router, publicada em GitHub Pages. AppShell responsivo (desktop sidebar, mobile top bar/bottom nav/drawer); o mesmo bundle e perfil servem todos os dispositivos. Domain isolado para férias/jornada/horas; aplicação coordena casos de uso, presentation renderiza componentes e Zustand agrega registos de horas. IndexedDB/Dexie e `secureStorage` fazem parte do cofre cifrado AES-GCM; replicação opcional por Cloudflare Worker/Durable Object transporta cofre cifrado, não passwords/PIN/dataKey.

## Férias — rotas e dados

`#/ferias` → `VacationWorkspacePage(view="overview")` → `VacationBalancePage` + `VacationEvidencePanel` (apenas overview). `#/ferias/planeamento` → mesmo `VacationBalancePage` com secções não aplicáveis ocultas via CSS; `VacationPlannerPanel` mostra resumo vivo, `VacationSuggestionsPanel`, `VacationJointPlanner`, calendário/simulação. **Limite atual:** a vista ocultada continua montada; não alegar que o isolamento CSS evita toda a computação. CSS de layout `vacation-workspace.css`, `vacation-evidence-layout.css`, `vacation-evidence.css`; demais estilos de férias mantidos.

`VacationBalance.ts` é a autoridade para referência laboral e projeção pessoal. Meta anual pessoal configurável (28 por omissão): acumulado vivo calculado diretamente da meta, meses anteriores e fração do mês local; saldo vivo = acumulado + transitados + ajustes − gozadas, saldo após planeadas subtrai dias úteis futuros. Contagem normaliza datas civis, deduplica e desconta seg.–sex. por defeito; dias manuais sem data continuam descontados, não são transformados em datas individuais.

`VacationYearRecords.ts` lê `useWorkHoursStore` (`reason="ferias"`), `foco-jornada-shift-map-v1-AAAA-MM` e `foco-jornada-payroll-plan-v1-AAAA-MM` (registos `kind="vacation"`) através de leitura injetada do cofre. `collectVacationEvidenceForYear` valida YYYY-MM-DD, reúne a proveniência única ordenada (`horas`, `turnos`, `plano`); `collectVacationDatesForYear` deriva as datas dessa mesma coleta para o planeador do ano seguinte. Uma data válida no mesmo ano encontrada numa folha de outro mês é mantida. `VacationEvidencePanel` lê essas fontes somente quando o detalhe está aberto, não escreve e oferece refresh manual, além de foco/visibilidade. A página do ano corrente ainda tem coletor próprio: reconciliar depois de testes, não pressupor equivalência em fonte cifrada indisponível.

## Segurança, riscos e QA

PR #217 não altera autenticação, autorização, sessões, CSRF, backend, esquema de dados, Worker, segredos, dependências ou mecanismo de sync; não usa HTML injetado, não grava nem envia pedidos de férias. Links internos usam `NavLink`, botões têm `aria-expanded`/`aria-controls`, painel oculto usa `[hidden]`, foco visível, contraste forçado e movimento reduzido. Testes `VacationYearRecords.test.ts` e `vacation-evidence.test.ts` cobrem fontes duplicadas/indisponíveis, datas válidas/inválidas, resultados do domínio e estrutura responsiva. CI: auditoria, TypeScript, ESLint, Vitest, build, Worker dry-run e smoke Chromium. Testes físicos cross-device pendentes.

Feriados, escalas diferentes de segunda–sexta, aprovação, disponibilidade da parceira e valores contratuais requerem confirmação externa. Ver também `docs/VACATION-EVIDENCE.md`, `docs/VACATION-PLANNER-LIVE.md`, `docs/VACATION-PLANNER.md` e `docs/VACATION-SUGGESTIONS.md`.