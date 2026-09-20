# Férias e Planeamento — adaptação do protótipo (20/09/2026)

## Referências e objetivos

As duas imagens fornecidas em 20/09 mostram (1) Férias com separadores, paisagem panorâmica, quatro indicadores, evolução mensal em gráfico/tabela, próximos marcos e origem dos dias, e (2) Planeamento com hero costeiro, seleção de meses, propostas, simulação/calendário e verificação com a parceira e empresa. A exportação PDF do iPhone de 20/09 mostra a aplicação anterior: valores reais, configuração, referência laboral e 12 meses. São referências visuais; não representam dados aprovados ou medições exatas de CSS pixels.

## Implementação no PR #223

- `src/assets/vacation-coast.svg`: ilustração costeira vetorial original, local/offline, sem tráfego para bancos de imagem ou reutilização de uma captura de ecrã como interface. Não corresponde à fotografia do protótipo pixel a pixel.
- `src/styles/vacation-prototype.css`: linguagem visual escopada a `.vacationWorkspace` e às duas rotas; separadores horizontais, cabeçalho panorâmico, cartões de saldo com destaque controlado, grelha mensal/indicadores responsiva, painel de planeamento e propostas. CSS com contenção, altura intrínseca, breakpoints 1040/680/420/340px, foco, contraste forçado e movimento reduzido. Reutiliza tokens do produto; não altera `AppShell` nem inventa páginas.
- `VacationMonthlyVisualization.tsx`/`vacation-month-visual.css`: controlo Gráfico/Tabela, 12 barras com altura **calculada** de `liveCumulativeDays / monthlyAccrualTargetDays` no mês atual e `cumulativeDays / target` nos restantes; tabela semântica com estado e data de fecho. Os dados vêm diretamente do `VacationBalance` já calculado na página, sem nova leitura ao cofre nem arredondamento acumulativo. Fichas detalhadas e os quatro indicadores intramensais continuam disponíveis num `<details>` expansível, em vez de 12 cartões volumosos permanentemente abertos. O estado da vista é efémero.
- `VacationBalancePage.tsx`: conserva chaves cifradas, recolha/deduplicação anterior, relógio por minuto e ao retomar, cálculos do domínio, configuração, referência laboral, links de origem e notas de precisão. A mudança substitui a apresentação mensal inicial pela visualização interativa, mantendo a grelha antiga consultável. `VacationWorkspacePage.tsx` importa apenas estilos locais novos; rotas e salto `focusSection` mantidos.
- Planeamento: os mesmos `VacationPlannerPanel`, `VacationJointPlanner`, `VacationSuggestionsPanel` e `VacationConfirmationChecklist` permanecem. A seleção do mês atual/seguinte, julho por omissão no ano seguinte, novembro/dezembro excluídos segundo declaração do utilizador, alternativas, simulação de dias úteis e confirmação efémera conservam-se; **não existe submissão/aprovação automática à ILUNION**.

## Fidelidade e limites deliberados

Os nomes de colaboradores, ano fixo 2025/2026 e valores 20/14/10/22 presentes nas imagens são ilustrativos e não são importados. São apresentados os valores e o ano reais da aplicação. A ilustração panorâmica SVG substitui a fotografia sem dependências externas. O menu global continua o do Foco Jornada: não se criam áreas fictícias de equipa ou aprovação. O botão visual «Submeter pedido» do protótipo não é implementado sem API, autenticação e autorização da entidade empregadora; as confirmações são locais e a marcação efetiva mantém o fluxo existente no mapa de turnos.

Meta 28 dias é projeção pessoal configurável, distinta de 22 dias contratuais configurados. Não se inferem feriados, escala, disponibilidade da parceira ou aprovação externa. A atualização «tempo real» significa recálculo local enquanto ativo e ao retomar, não sincronização imediata garantida entre dispositivos. Nenhuma alteração a Worker, dependências, schema, autenticação, sessões, cofre, segredos ou dados já guardados.

## QA / aceitação

Testes unitários de Gráfico/Tabela devem validar alternância, mês corrente exato, tabela e ausência de ações de gravação. Testes estruturais verificam SVG local, rotas, conteúdo completo dos 12 meses, responsividade e acessibilidade. Qualidade exige auditoria, TypeScript, lint, Vitest, build, Worker dry-run e smoke Chromium em branch e main, mais GitHub Pages. **Pendente:** capturas reais em iPhone (320–430px CSS, zoom, texto ampliado, orientação, modo escuro, VoiceOver), tablet/desktop, dados guardados e navegação/retorno após suspensão. CI genérico não prova correspondência fotográfica nem todos os estados. Não apagar dados do site em testes.

**Anomalia já observada no PDF de 20/09:** data de admissão 30/09/2026 futura face à data capturada e referência laboral 0 com campo anual 22. Pedir confirmação antes de modificar dados/cálculos; não tratar como problema visual.
