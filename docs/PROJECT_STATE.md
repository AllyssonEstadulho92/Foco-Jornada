# Estado do Projeto

Atualizado em: 2026-09-20. PR #223 em validação na branch `feat/vacation-prototype-layout-20260920`. Última publicação confirmada: PR #222. Verificação física no iPhone pendente.

## Alteração em curso — PR #223: protótipo de Férias e Planeamento

**Objetivo:** aproximar as duas rotas das imagens entregues em 20/09, mantendo as funções e os valores reais. Comparados os cinco documentos, `VacationWorkspacePage`, `VacationBalancePage`, `VacationPlannerPanel`, `VacationJointPlanner`, `VacationEvidencePanel`, domínio, estilos, testes e PDF do iPhone. Os protótipos mostram fotografia, números demonstrativos, pessoas fictícias, gráfico/tabela e submissão à entidade empregadora; esses exemplos não são dados da aplicação.

**Implementado:** cabeçalho panorâmico com ilustração SVG original local/offline, separadores compactos, cartões de saldo e indicadores harmonizados, percurso do planeamento responsivo; gráfico/tabela mensais interativos usam diretamente `balance.monthlyAccrualSchedule` e meta real, mantendo todos os cartões originais num `<details>` expansível. Configuração, referência laboral, proveniência, calendário, sugestões, simulação, confirmação efémera, anos e restrição comunicada de novembro/dezembro continuam disponíveis. Sem registos, chaves, dependências, APIs, autenticação ou sync novos. Documentação técnica em `docs/VACATION-PROTOTYPE-2026.md`.

**Limites expressos:** a paisagem vetorial substitui a fotografia; não importamos os nomes/valores exemplificativos nem simulamos um envio/aprovação inexistente pela ILUNION. Meta pessoal 28 não se converte em direito contratual. A vista escondida continua montada pelo React; não se afirma economia de computação nem sync instantânea. Testes de gráfico/tabela e CSS adicionados; CI final do head, integração e deploy ainda por confirmar. **Próximo passo:** CI final, merge após verde, CI main, publicação e Pages; testar o resultado real no iPhone/Android/tablet/desktop, zoom, VoiceOver, calendário, alternância gráfico/tabela e retoma da PWA. Confirmar separadamente data de admissão futura e referência laboral zero do PDF, sem alterar saldos por suposição.

## Última alteração publicada — PR #222

**Objetivo:** refinar as secções de Férias e Planeamento com menos ruído e sem espaço vazio artificial, preservando valores, registos e funções. A auditoria do código confirmou excesso de uniformidade nos indicadores e disposição vertical do planeamento em desktop. O PDF do iPhone de 19/09 mostrou grandes hiatos entre o título e o valor dos cabeçalhos «Evolução por mês» e «O que tens, o que falta e o que vem a seguir».

**Causa concreta encontrada no CSS:** em <=640px, `.vacationPanelHeader` passa de linha a coluna. Os títulos em `vacation-accrual.css` (`flex:1 1 240px`) e `vacation-insights.css` (`flex:1 1 260px`) passam a reservar essa altura vertical. `vacation-workspace.css` tinha ainda `flex-basis:100%` <=560px. A correção na folha `vacation-workspace.css` existente usa `flex:0 0 auto` e largura 100% nos cabeçalhos móveis, elimina a base de 100% e compacta cartões mensais, mantendo quebra de texto e conteúdos visíveis. Teste de regressão em `vacation-workspace.test.ts`; evidência em `docs/VACATION-MOBILE-SPACING-AUDIT-2026.md`.

**Outras mudanças visuais:** `vacation-insights.css` distingue progresso e próximo marco dos indicadores secundários, sem linhas decorativas repetidas; `vacation-planning-structure.css` distribui escolha/comparação em colunas apenas a partir de 1100px, mantém percurso sequencial em móvel e assegura quebra segura do resumo opcional <=440px. Sem nova folha global nem alterações a componentes TSX, domínio, fórmulas, autenticação, dados cifrados, Worker ou sincronização.

**Entrega verificada:** [PR #222](https://github.com/AllyssonEstadulho92/Foco-Jornada/pull/222) integrado, merge `b5f34b9b8adf8e2ecacd210ecfbeb7f9d6c0614a`. Qualidade #1240 (head final) e #1241 (`main`) concluíram com sucesso: auditoria de dependências, TypeScript, lint, Vitest, build, Worker dry-run e smoke Chromium. Publicar Foco & Jornada #261 concluiu com sucesso; build `112d2dbb7a56925d8a42dec2aaf0d9bae967a0fe`; GitHub Pages #869 publicou esse build com sucesso. Os testes CSS são estruturais e o smoke Chromium não mede todos os ecrãs: **não há confirmação visual da correção no iPhone real**.

**Próximo passo:** comparar uma nova captura real do iPhone com PDF de 19/09, testando zoom, texto ampliado, orientação, VoiceOver, atalho de origem e área de planeamento. No PDF, «Data de admissão» mostra 30/09/2026, futura face a 19/09, e referência laboral 0 dias embora «Dias anuais confirmados» mostre 22. Confirmar a data real e o contexto da referência, sem corrigir valores por suposição nem misturar o diagnóstico de dados com esta alteração visual.

## Entrega anterior — PR #221

O PDF anterior mostrou as propostas de julho/2027 precedidas por cartões de 2026 e alternativas altas. Para o ano seguinte, `VacationJointPlanner` aparece primeiro; referência de 2026 fica em `<details>` opcional com aviso de que não é saldo transferido para 2027. No ano corrente, resumo vivo completo antecede sugestões. Percurso de quatro passos (escolher, comparar, simular, confirmar), opções compactas e metodologia expansível. Mantidas datas, restrição comunicada de novembro/dezembro, confirmações locais por cenário, cálculo e cofre.

**Entrega verificada:** [PR #221](https://github.com/AllyssonEstadulho92/Foco-Jornada/pull/221) integrado, merge `9e9d267fd7a9ed7de3a9afdc68cbc8a8d2b708b9`. Qualidade #1227/#1228 passaram auditoria, TypeScript, lint, Vitest, build, Worker dry-run e smoke Chromium. Publicar #260 gerou build `4074f203c6788d30a4f542c951a6b94b62f86fad`; Pages #866 publicou com sucesso. Não houve teste físico iPhone após essa entrega.

## Entregas anteriores — PRs #217–#220

PR #220: leitura a 74rem, superfícies/calendários contidos, skip link global sem mudar hash, merge `8a45758f68462e8631edbaf65f0b802a2c60ee19`, Qualidade #1219/#1220, Publicar #259, Pages #859. PR #219: harmonização móvel, merge `f96ced5532178bb0746db0e50ef52874e72710dc`, Qualidade #1209/#1210, Publicar #258, Pages #854. PR #218: 404 do atalho de proveniência corrigido por `focusSection` e rota PT-PT de recuperação, merge `89564f3ebbfe5d54e5d09dcf28db9e574b35cc50`, Qualidade #1201/#1202, Publicar #257, Pages #848. PR #217: origem de férias por dia e fonte, merge `61816f7ec3f1c43043d57b094f834bb116d19a27`, Qualidade #1192/#1193, Publicar #256, Pages #842. Todos os testes físicos do atalho e da apresentação continuam pendentes.

## Estado da aplicação e das férias

PWA React 19/TypeScript/Vite responsiva para iPhone, Android, tablet e computador, GitHub Pages, IndexedDB/Dexie e cofre AES-GCM, sync cifrada opcional Cloudflare Worker/Durable Object; sincronização entre aparelhos não é instantânea garantida. `#/ferias`: acumulação mensal, saldo, indicadores e proveniência (horas/turnos/plano). `#/ferias/planeamento`: sugestões, calendário, simulação e férias a dois para o próximo ano. Julho pode ser predefinido; novembro/dezembro são excluídos segundo restrição informada pelo utilizador, sujeita a confirmação anual. Não verifica disponibilidade da parceira ou aprovação da ILUNION.

Meta anual de 28 dias é pessoal e configurável, não direito contratual automático; acumulação intramensal evolui com fração do mês local e atualiza por minuto quando ativa e ao regressar (iOS suspende JS em segundo plano). Férias são deduplicadas e contadas de segunda a sexta por omissão; 24/08–06/09/2026 compreende 14 datas civis, dez úteis e quatro fins de semana ignorados na regra padrão. Feriados, descanso alternativo, contrato/CCT, escala e aprovação exigem confirmação.

## Problemas transversais e próximos passos

- Validar as duas rotas em iPhone real e depois Android/tablet/desktop: zoom, texto ampliado, orientação, teclado, VoiceOver/TalkBack, salto sem 404, expansão de proveniência, filtros, mudança de ano, calendário e retorno após suspensão/sync.
- Vista inativa permanece montada sob CSS; `VacationBalancePage` mantém coletor próprio distinto de `VacationYearRecords`. Comparar com dados reais antes de unificar e não inferir saldo quando o cofre estiver temporariamente indisponível.
- Preservar os documentos históricos em `docs/history/PROJECT_STATE-pre-217.md` e ficheiros associados; PRs #217–#223 e documentos dedicados guardam alterações recentes.
