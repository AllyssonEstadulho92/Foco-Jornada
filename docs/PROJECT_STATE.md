# Estado do Projeto

Atualizado em: 2026-09-18. PR #220 integrado e publicado; teste físico no iPhone ainda pendente.

## Última alteração — PR #220

**Objetivo:** atualizar visualmente `#/ferias` e `#/ferias/planeamento` com leitura mais elegante e contida e corrigir o atalho global «Saltar para o conteúdo». A camada existente `vacation-visual-audit.css` agora limita a largura de leitura a 74rem, usa sombras discretas, diferencia saldo principal e seleção, limita títulos/badges e contém os calendários em grelhas de sete colunas também no móvel. `AppShell.tsx` substitui `href="#main-content"` por botão nativo que chama `focusSection('main-content')` sem mudar a rota. Testes jsdom verificam foco/hash em `#/ferias`, `#/ferias/planeamento` e `#/turnos`, além de regressões estruturais de CSS. Não foram alterados cálculo, registos, cofre, sync, autorização ou backend.

**Entrega confirmada:** [PR #220](https://github.com/AllyssonEstadulho92/Foco-Jornada/pull/220) integrado, merge `8a45758f68462e8631edbaf65f0b802a2c60ee19`; Qualidade #1219 no head final e #1220 em `main` concluíram auditoria, TypeScript, lint, Vitest, build, Worker dry-run e smoke Chromium com sucesso. Publicar Foco & Jornada #259 terminou com sucesso e gerou o build `eec8da024db5b3f65624433c66726e7c56e04cb0`; GitHub Pages #859 concluiu build e deploy com sucesso. **Não foi feito teste físico no iPhone/Android**, pelo que estes gates não provam ausência de overflow em todas as resoluções. Ver `docs/VACATION-UI-AUDIT-2026.md` e `docs/HASH-ROUTER-NAVIGATION.md`.

## Entregas anteriores — PR #219 e #218

PR #219 harmonizou a navegação móvel, tipografia, espaçamento e cartões sem alterar domínio; merge `f96ced5532178bb0746db0e50ef52874e72710dc`, Qualidade #1209/#1210, Publicar #258, build `96c779f88ab2d0f941b7a54f690dd759fa909ec1`, Pages #854. PR #218 corrigiu o 404 no atalho de proveniência causado por `href="#vacation-evidence-title"` em `createHashRouter`: botão com foco/scroll e rota `*` de recuperação PT-PT; merge `89564f3ebbfe5d54e5d09dcf28db9e574b35cc50`, Qualidade #1201/#1202, Publicar #257, Pages #848. A confirmação no iPhone do atalho de proveniência continua pendente.

## Estado da aplicação e das férias

PWA React 19/TypeScript/Vite responsiva para iPhone, Android, tablet e computador, frontend GitHub Pages, IndexedDB/Dexie e cofre AES-GCM, sincronização opcional cifrada Cloudflare Worker/Durable Object; replicação não é instantânea garantida. Em `main` estão as entregas de férias #203–#220. `#/ferias` apresenta acumulação mensal, saldo, indicadores e detalhe recolhido de proveniência (horas/turnos/plano); `#/ferias/planeamento` contém sugestões, calendário, simulação e férias a dois para o próximo ano. Julho pode ser predefinido; novembro/dezembro excluídos por restrição indicada pelo utilizador, sujeita a confirmação anual. O planeador não valida disponibilidade da parceira nem aprovação da ILUNION.

A meta anual de 28 dias é **pessoal e configurável**, não um direito contratual automático. Acumulação intramensal em fração do mês local, atualização por minuto enquanto ativa e ao regressar (iOS pode suspender JS). Férias deduplicadas; segunda–sexta por omissão. 24/08–06/09/2026: 14 datas civis, dez úteis, quatro fins de semana ignorados sob regra padrão. Feriados, descanso alternativo, contrato/CCT, escala e aprovação exigem confirmação.

## Problemas e próximo passo

- Validar visualmente no iPhone real as duas rotas, depois Android/tablet/desktop: zoom, texto ampliado, rotação, teclado e VoiceOver/TalkBack. Testar salto global sem 404, atalho e expansão de proveniência, filtros, mudança de ano, calendário e retorno após suspensão/sync. Os testes automáticos não medem o layout real.
- A vista inativa continua montada sob CSS; `VacationBalancePage` mantém coletor próprio distinto de `VacationYearRecords`. Comparar dados reais antes de qualquer unificação e não inventar saldo com cofre temporariamente inacessível.
- Preservar documentos históricos em `docs/history/PROJECT_STATE-pre-217.md` e restantes ficheiros do mesmo diretório; histórico mais recente está nos PRs #217–#220.
