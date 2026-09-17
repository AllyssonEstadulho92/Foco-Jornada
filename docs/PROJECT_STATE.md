# Estado do Projeto

Atualizado em: 2026-09-17. Auditoria visual PR #219 em validação; o PR #218 está integrado e publicado. Não confundir CI com teste físico.

## Alteração atual — PR #219

**Objetivo:** harmonizar apresentação das duas rotas de férias sem alterar domínio. Auditoria estática de componentes e CSS em `docs/VACATION-UI-AUDIT-2026.md` encontrou navegação demasiado alta em smartphone, sombras/raios/textos inconsistentes entre grupos de cartões, destaque excessivo do atalho de proveniência e alturas mínimas desnecessárias. A branch `style/vacation-visual-audit-2026` introduz `vacation-visual-audit.css` (apenas nestas rotas) e `vacation-visual-audit.test.ts`: duas opções compactas de navegação em smartphone, destaque do estado ativo e saldo principal, hierarquia tipográfica, espaçamento/bordas coerentes, cartões de altura intrínseca, realce secundário do atalho e salvaguardas de alto contraste/movimento reduzido. Sem esconder funções, alterar fórmulas, dados ou URLs. **Estado nesta revisão:** PR #219 aberto em draft, CI e integração/publicação por confirmar. Verificar head final antes de merge.

**Riscos pendentes:** não há validação por captura de ecrã no iPhone real. O `AppShell` ainda contém `href="#main-content"`, risco de 404 no HashRouter; manter correção própria no TODO. A vista inativa continua montada e o saldo do ano corrente tem coletor distinto do detalhe por data. Não misturar estas refatorizações com CSS.

## Última entrega publicada — PR #218

Captura no iPhone mostrou «Unexpected Application Error! / 404 Not Found» no atalho de dias registados. Causa comprovada: `href="#vacation-evidence-title"` substituía `#/ferias` no `createHashRouter`. PR #218 merge `89564f3ebbfe5d54e5d09dcf28db9e574b35cc50` substituiu-o por botão com scroll/foco sem alterar hash; rota residual `*` com recuperação PT-PT. Qualidade #1201 (head) e #1202 (`main`) passaram auditoria, TypeScript, lint, Vitest, build, Worker dry-run e smoke Chromium. Publicar #257 e Pages #848 com sucesso, build `42397a6c97d60044f5dbc1cf90723ee799b1d0ac`. Teste físico do atalho corrigido ainda pendente. Ver `docs/HASH-ROUTER-NAVIGATION.md`.

## Estado da aplicação e das férias

PWA React 19/TypeScript/Vite responsiva para iPhone, Android, tablet e computador, frontend GitHub Pages, IndexedDB/Dexie e cofre AES-GCM, sincronização opcional cifrada Cloudflare Worker/Durable Object; replicação não é instantânea garantida. Em `main` estão as entregas de férias #203–#218. `#/ferias` apresenta acumulação mensal, saldo, indicadores e detalhe recolhido de proveniência (horas/turnos/plano); `#/ferias/planeamento` tem sugestões, calendário, simulação e férias a dois para o próximo ano. Julho pode ser predefinido; novembro/dezembro excluídos por restrição indicada pelo utilizador, sujeita a confirmação anual. O planeador não valida disponibilidade da parceira nem aprovação da ILUNION. PR #217 merge `61816f7ec3f1c43043d57b094f834bb116d19a27`, Qualidade #1192/#1193, Publicar #256, Pages #842, build `322b8b37f745e17233360af07e473f50e9fc79d5`.

A meta anual de 28 dias é **pessoal e configurável**, não um direito contratual automático. Acumulação intramensal em fração do mês local, atualização por minuto enquanto ativa e ao regressar (iOS pode suspender JS). Férias deduplicadas; segunda–sexta por omissão. 24/08–06/09/2026: 14 datas civis, dez úteis, quatro fins de semana ignorados sob regra padrão. Feriados, descanso alternativo, contrato/CCT, escala e aprovação exigem confirmação.

## Problemas e próximo passo

- Verificar CI final, integrar/publicar PR #219 apenas com gates verdes, atualizar provas nos cinco documentos.
- Validar visualmente no iPhone, Android, tablet/desktop e com zoom, texto ampliado, orientação e teclado/VoiceOver/TalkBack. Testar salto e expansão da proveniência, filtros, mudança de ano, calendário e retorno após suspensão/sync.
- Corrigir o skip link global `AppShell` incompatível com HashRouter em tarefa autónoma; evitar novo 404.
- Confirmar consistência entre `VacationBalancePage` e `VacationYearRecords` com dados reais; cofre temporariamente inacessível pode dar lista parcial. Não alterar cálculo ou transferir saldos entre anos sem testes.
- Preservar documentos históricos em `docs/history/PROJECT_STATE-pre-217.md` e restantes ficheiros do mesmo diretório.
