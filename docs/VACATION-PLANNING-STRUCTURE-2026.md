# Estrutura do planeamento de férias — 18/09/2026

## Origem e problema observado

Referência: PDF de uma página fornecido pelo utilizador em 18/09, captura da rota de Planeamento no iPhone com ano 2027, mês julho, dez dias úteis e quatro propostas. A captura mostra, por esta ordem, cabeçalho e seletor anual, quatro cartões do saldo vivo de 2026, preferências de 2027, quatro cartões de alternativas, simulação selecionada, checklist de duas confirmações e um bloco extenso de pressupostos. É evidência da apresentação capturada; a exportação PDF não permite medir com exatidão CSS pixels, zoom, VoiceOver ou todos os estados interativos.

**Problema de arquitetura de informação:** as quatro métricas de 2026 aparecem antes das decisões do planeamento 2027; cada alternativa ocupa muito espaço vertical; instruções repetidas disputam atenção com datas, saldo estimado e confirmações. A captura não prova uma falha nos cálculos nem ausência de dados.

## Implementação delimitada — PR #221

- `VacationPlannerPanel.tsx`: usa os mesmos `calculateVacationBalance`, relógio e quatro valores do ano corrente. Para planeamento de 2027, apresenta primeiro `VacationJointPlanner` e só depois um `<details>` nativo para consultar a referência de 2026, recolhida por omissão, com valor do saldo atual no resumo e aviso explícito de que **não é saldo transferido para 2027**. Quando se escolhe o ano atual, o painel vivo completo mantém-se visível antes das sugestões. Não acrescenta timers.
- `VacationJointPlanner.tsx`: reorganiza a árvore de apresentação em quatro passos semanticamente identificados: 01 escolher mês/dias e ver meses excluídos; 02 comparar períodos por botões; 03 analisar saldo, período e calendário opcional; 04 checklist efémera da parceira e empregador. As notas pormenorizadas sobre cálculo ficam em `<details>` nativo; os avisos na checklist, a pré-visualização e a restrição de meses continuam visíveis.
- `vacation-planning-structure.css`: camada de **layout do fluxo** com seletores exclusivos de `.vacationWorkspace--planning`, separadores de conteúdo, alternativas mais compactas, grelha de duas colunas quando há espaço e uma coluna no móvel, valores legíveis, focos visíveis, alto contraste e movimento reduzido. É importada por último em `VacationWorkspacePage.tsx` para evitar uma nova cascata global. Não esconde opções nem usa `overflow-x: hidden` para mascarar problemas.
- `vacation-planning-structure.test.ts`: protege ordem de leitura de 2027, resumo de 2026 sem transporte, quatro passos, restrições novembro/dezembro, escopo de confirmação e regras CSS. Permanecem os testes de domínio, roteamento e segurança existentes.

## Preservação e limites

Sem alterações a `VacationBalance`, `VacationJointPlanning`, `VacationYearRecords`, IndexedDB/Dexie, cofre AES-GCM, cloud sync, autenticação, permissões, chaves, backend ou dependências. Mantêm-se as mesmas quatro sugestões e a seleção por `aria-pressed`, a simulação de datas, o calendário opcional e a `confirmationScope` dependente de ano/mês/dias/período/configurações/datas registadas. Os vistos continuam locais e não guardados; selecionar um cenário diferente faz reset dos vistos.

A meta pessoal configurável de 28 dias não é automaticamente um direito contratual. O período de descanso só corresponde aos 16 dias exibidos na captura se os fins de semana forem livres; feriados, escala real, saldo contratual e disponibilidade da parceira e da ILUNION não são verificados. O relógio é local e pode ser suspenso pelo iOS; não assegura sincronização instantânea entre dispositivos.

## QA necessário

Gate técnico: auditoria de dependências, TypeScript, lint, Vitest, build, Worker dry-run e smoke Chromium na branch e na `main`, mais deploy Pages. Teste físico **ainda pendente**: abrir `#/ferias/planeamento` e alternar anos, expandir a referência de 2026 e metodologia, selecionar cada alternativa e abrir calendário, mudar mês/dias e confirmar reposição de vistos, fazer scroll sem cortes e verificar 320–430 px CSS, texto ampliado, zoom, landscape, VoiceOver/teclado, Android/tablet/desktop. Não declarar resultado visual validado apenas com testes estruturais.
