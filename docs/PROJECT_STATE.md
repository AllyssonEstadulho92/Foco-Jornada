# Estado do Projeto

Atualizado em: 2026-09-20. **PR #223 integrado e publicado**; visualização física no iPhone ainda por confirmar. A atualização não aparecia ao utilizador porque o PR permanecia em rascunho e fora de `main`; esta pendência foi resolvida nesta sessão.

## Última alteração publicada — PR #223: protótipo de Férias e Planeamento

**Objetivo:** aproximar as duas rotas das imagens entregues em 20/09, mantendo as funções e os valores reais. Comparados os cinco documentos, `VacationWorkspacePage`, `VacationBalancePage`, `VacationPlannerPanel`, `VacationJointPlanner`, `VacationEvidencePanel`, domínio, estilos, testes e PDF do iPhone. Os protótipos mostram fotografia, números demonstrativos, pessoas fictícias, gráfico/tabela e submissão à entidade empregadora; esses exemplos não são dados da aplicação.

**Implementado:** cabeçalho panorâmico com ilustração SVG original local/offline, separadores compactos, cartões de saldo e indicadores harmonizados, percurso do planeamento responsivo; gráfico/tabela mensais interativos usam diretamente `balance.monthlyAccrualSchedule` e meta real, mantendo todos os cartões originais num `<details>` expansível. Configuração, referência laboral, proveniência, calendário, sugestões, simulação, confirmação efémera, anos e restrição comunicada de novembro/dezembro continuam disponíveis. Sem registos, chaves, dependências, APIs, autenticação ou sync novos. Documentação técnica em `docs/VACATION-PROTOTYPE-2026.md`.

**Entrega verificada:** [PR #223](https://github.com/AllyssonEstadulho92/Foco-Jornada/pull/223) integrado, merge `49cf48d1abc6bed68eabd7e8b5e1da4931a50c02`. Qualidade #1250 (head final) e #1251 (`main`) passaram auditoria de dependências, TypeScript, lint, testes, build, Worker dry-run e smoke Chromium. Publicar Foco & Jornada #262 passou e gerou o commit de build `ae506c4a0e73a6a2a6aa5fecf5cb221ab70c8a41`; GitHub Pages #875 publicou esse build com sucesso. Estas provas não equivalem a inspeção visual real em iPhone.

**Limites e próximo passo:** a paisagem vetorial substitui a fotografia; não importamos nomes/valores exemplificativos nem simulamos envio/aprovação inexistente pela ILUNION. A meta pessoal de 28 dias não se converte em direito contratual. A vista escondida continua montada pelo React; não se afirma economia de computação nem sync instantânea. Comparar as rotas públicas no iPhone/Android/tablet/desktop com as imagens de referência, incluindo zoom, VoiceOver, calendário, alternância gráfico/tabela e retoma da PWA. Não limpar dados do site para forçar atualização: podem incluir registos locais. Confirmar separadamente data de admissão futura e referência laboral zero do PDF, sem alterar saldos por suposição.

## Entrega anterior — PR #222

O PDF do iPhone de 19/09 mostrou grandes hiatos entre os títulos e os valores de «Evolução por mês» e «O que tens, o que falta e o que vem a seguir». A auditoria do código confirmou que, em <=640px, `.vacationPanelHeader` mudava de linha para coluna, enquanto bases `flex:1 1 240px` e `flex:1 1 260px` passavam a alturas verticais. `vacation-workspace.css` também usava `flex-basis:100%` <=560px. A correção usa `flex:0 0 auto`, largura 100% e altura intrínseca, compacta os cartões e conserva valores e quebras de texto. `vacation-insights.css` distingue progresso/marco de indicadores secundários e `vacation-planning-structure.css` distribui escolha/comparação em colunas a partir de 1100px sem mudar a ordem móvel. Ver `docs/VACATION-MOBILE-SPACING-AUDIT-2026.md`.

**Entrega verificada:** PR #222 integrado, merge `b5f34b9b8adf8e2ecacd210ecfbeb7f9d6c0614a`. Qualidade #1240/#1241, Publicar #261, build `112d2dbb7a56925d8a42dec2aaf0d9bae967a0fe` e Pages #869 passaram. Alterações só de CSS, testes e documentação; não se confirmou visualmente em dispositivo físico.

## Entrega anterior — PR #221

No planeamento do ano seguinte, `VacationJointPlanner` aparece antes do resumo de 2026 em `<details>` opcional, sem sugerir transferência de saldo. No ano corrente, resumo vivo antecede sugestões. Percurso de quatro passos (escolher, comparar, simular, confirmar); alternativas compactas e metodologia expansível. Mantidas datas, restrição comunicada de novembro/dezembro, confirmações locais por cenário, cálculo e cofre.

**Entrega verificada:** PR #221 integrado, merge `9e9d267fd7a9ed7de3a9afdc68cbc8a8d2b708b9`; Qualidade #1227/#1228, Publicar #260, build `4074f203c6788d30a4f542c951a6b94b62f86fad`, Pages #866 com sucesso.

## Entregas anteriores — PRs #217–#220

PR #220: largura de leitura 74rem e salto global sem alterar hash, merge `8a45758f68462e8631edbaf65f0b802a2c60ee19`, Qualidade #1219/#1220, Publicar #259, Pages #859. PR #219: harmonização móvel, merge `f96ced5532178bb0746db0e50ef52874e72710dc`, Qualidade #1209/#1210, Publicar #258, Pages #854. PR #218: 404 de atalho corrigido via `focusSection` e recuperação PT-PT, merge `89564f3ebbfe5d54e5d09dcf28db9e574b35cc50`, Qualidade #1201/#1202, Publicar #257, Pages #848. PR #217: proveniência de férias por dia e fonte, merge `61816f7ec3f1c43043d57b094f834bb116d19a27`, Qualidade #1192/#1193, Publicar #256, Pages #842. Testes físicos da apresentação e dos saltos continuam pendentes.

## Estado da aplicação e das férias

PWA React 19/TypeScript/Vite responsiva para iPhone, Android, tablet e computador, GitHub Pages, IndexedDB/Dexie e cofre AES-GCM, sync cifrada opcional Cloudflare Worker/Durable Object; sincronização entre aparelhos não é instantânea garantida. `#/ferias`: acumulação mensal, gráfico/tabela e fichas expansíveis, saldo, indicadores e proveniência (horas/turnos/plano). `#/ferias/planeamento`: sugestões, calendário, simulação e férias a dois para o próximo ano. Julho pode ser predefinido; novembro/dezembro são excluídos segundo restrição informada pelo utilizador, sujeita a confirmação anual. Não verifica disponibilidade da parceira ou aprovação da ILUNION.

Meta anual de 28 dias é pessoal e configurável, não direito contratual automático; acumulação intramensal evolui com fração do mês local e atualiza por minuto quando ativa e ao regressar (iOS suspende JS em segundo plano). Férias são deduplicadas e contadas de segunda a sexta por omissão; 24/08–06/09/2026 compreende 14 datas civis, dez úteis e quatro fins de semana ignorados na regra padrão. Feriados, descanso alternativo, contrato/CCT, escala e aprovação exigem confirmação.

## Problemas transversais e próximos passos

- Validar as duas rotas em iPhone real e depois Android/tablet/desktop: zoom, texto ampliado, orientação, teclado, VoiceOver/TalkBack, salto sem 404, alternância gráfico/tabela, expansão das 12 fichas, proveniência, filtros, ano, calendário e regresso após suspensão/sync.
- Vista inativa permanece montada sob CSS; `VacationBalancePage` mantém coletor próprio distinto de `VacationYearRecords`. Comparar com dados reais antes de unificar e não inferir saldo quando o cofre estiver temporariamente indisponível.
- Confirmar data de admissão 30/09/2026 e referência laboral zero no PDF de 20/09, sem corrigir por suposição.
- Preservar os documentos históricos em `docs/history/PROJECT_STATE-pre-217.md` e associados; PRs #217–#223 e documentos dedicados guardam alterações recentes.
