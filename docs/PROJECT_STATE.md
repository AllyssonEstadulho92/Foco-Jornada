# Estado do Projeto

Atualizado em: 2026-09-18. PR #220 em validação; última publicação confirmada: PR #219. A validação física no iPhone ainda não ocorreu.

## Alteração em curso — PR #220

**Objetivo:** atualizar visualmente `#/ferias` e `#/ferias/planeamento` com uma leitura mais elegante e contida, e resolver o risco conhecido do atalho global «Saltar para o conteúdo». A branch `fix/vacation-polish-skiplink-20260918` altera apenas o CSS específico de férias (`vacation-visual-audit.css`), a importação/markup do salto em `AppShell.tsx` e testes: largura de leitura 74rem, sombras discretas, diferenciação clara do saldo e da seleção, títulos legíveis, ano e calendários contidos em 320–360 px CSS. O salto global é um botão que chama `focusSection('main-content')` e não substitui o hash da rota. Testes jsdom em três rotas e estruturais de apresentação. Nenhum cálculo, registo, cofre, sync ou backend foi modificado.

**Estado desta revisão:** PR #220 aberto em draft, CI final, integração e publicação ainda por confirmar. A auditoria estática e os critérios de validação constam em `docs/VACATION-UI-AUDIT-2026.md`. **Não alegar teste físico do iPhone**; confirmar com capturas do utilizador, texto ampliado, orientação e navegação real. O problema do skip link passa de pendência a correção implementada, mas ainda não publicada neste momento.

## Última alteração publicada — PR #219

**Objetivo e alteração:** harmonizar a apresentação das duas rotas de férias sem alterar o domínio. A auditoria estática dos componentes e estilos identificou navegação excessivamente alta em smartphone, sombras/raios/tipografia pouco uniformes, atalho de proveniência demasiado destacado e alturas mínimas desnecessárias. A camada `src/styles/vacation-visual-audit.css`, importada exclusivamente por `VacationWorkspacePage`, introduziu dois separadores compactos no móvel, destaque do estado ativo e saldo principal, hierarquia tipográfica, espaços/bordas coerentes, cartões de altura intrínseca, atalho secundário e salvaguardas de alto contraste e movimento reduzido. Nenhuma funcionalidade foi retirada; fórmulas, dados e URLs permaneceram iguais.

**Estado verificado:** [PR #219](https://github.com/AllyssonEstadulho92/Foco-Jornada/pull/219) integrado em `main`, merge `f96ced5532178bb0746db0e50ef52874e72710dc`. Qualidade #1209 (head final) e #1210 (`main`) terminaram com sucesso, incluindo auditoria, TypeScript, lint, Vitest, build, Worker dry-run e smoke Chromium. Publicar Foco & Jornada #258 gerou build `96c779f88ab2d0f941b7a54f690dd759fa909ec1`; GitHub Pages #854 concluiu com sucesso. **A validação visual e funcional no iPhone/Android reais ainda não foi feita**; CI e smoke de arranque não garantem ausência de overflow em todas as dimensões.

## Entrega anterior — PR #218

A captura no iPhone mostrou «Unexpected Application Error! / 404 Not Found» no atalho de dias registados. Causa comprovada: `href="#vacation-evidence-title"` substituía `#/ferias` no `createHashRouter`. PR #218 merge `89564f3ebbfe5d54e5d09dcf28db9e574b35cc50` substituiu-o por botão com scroll/foco sem alterar hash; rota residual `*` com recuperação PT-PT. Qualidade #1201 (head) e #1202 (`main`) passaram auditoria, TypeScript, lint, Vitest, build, Worker dry-run e smoke Chromium. Publicar #257 e Pages #848 concluíram com sucesso, build `42397a6c97d60044f5dbc1cf90723ee799b1d0ac`. Teste físico do atalho corrigido continua pendente. Ver `docs/HASH-ROUTER-NAVIGATION.md`.

## Estado da aplicação e das férias

PWA React 19/TypeScript/Vite responsiva para iPhone, Android, tablet e computador, frontend GitHub Pages, IndexedDB/Dexie e cofre AES-GCM, sincronização opcional cifrada Cloudflare Worker/Durable Object; replicação não é instantânea garantida. Em `main` estão as entregas de férias #203–#219. `#/ferias` apresenta acumulação mensal, saldo, indicadores e detalhe recolhido de proveniência (horas/turnos/plano); `#/ferias/planeamento` contém sugestões, calendário, simulação e férias a dois para o próximo ano. Julho pode ser predefinido; novembro/dezembro excluídos por restrição indicada pelo utilizador, sujeita a confirmação anual. O planeador não valida disponibilidade da parceira nem aprovação da ILUNION. PR #217 merge `61816f7ec3f1c43043d57b094f834bb116d19a27`, Qualidade #1192/#1193, Publicar #256, Pages #842, build `322b8b37f745e17233360af07e473f50e9fc79d5`.

A meta anual de 28 dias é **pessoal e configurável**, não um direito contratual automático. Acumulação intramensal em fração do mês local, atualização por minuto enquanto ativa e ao regressar (iOS pode suspender JS). Férias deduplicadas; segunda–sexta por omissão. 24/08–06/09/2026: 14 datas civis, dez úteis, quatro fins de semana ignorados sob regra padrão. Feriados, descanso alternativo, contrato/CCT, escala e aprovação exigem confirmação.

## Problemas e próximo passo

- Concluir CI do PR #220, integrar/publicar e confirmar GitHub Pages; atualizar provas documentais.
- Validar visualmente no iPhone, Android, tablet/desktop e com zoom, texto ampliado, orientação e teclado/VoiceOver/TalkBack. Testar salto global, salto/expansão da proveniência, filtros, mudança de ano, calendário e retorno após suspensão/sync.
- Confirmar consistência entre `VacationBalancePage` e `VacationYearRecords` com dados reais; cofre temporariamente inacessível pode dar lista parcial. Não alterar cálculo ou transferir saldos entre anos sem testes.
- Preservar documentos históricos em `docs/history/PROJECT_STATE-pre-217.md` e restantes ficheiros do mesmo diretório.
