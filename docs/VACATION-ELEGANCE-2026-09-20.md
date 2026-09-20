# Férias — refinamento visual a partir do painel de quatro ecrãs

Data: 2026-09-20. Estado: branch de design em análise; não integrado nem publicado.

## Fonte e alcance

O painel gerado nesta conversa é uma referência de composição, não uma captura real da app. Apresenta quatro ecrãs conceptuais, datas, saldos, progressos, direitos e rótulos ilustrativos. A versão `main` auditada é `edfd97ad5695d011c3c6c4fc0e0da5e929231804`, já com PR #223 publicado. No código real há duas rotas, `#/ferias` e `#/ferias/planeamento`, gráfico/tabela mensal do domínio e um painel opcional de proveniência. Não existe rota autónoma de calendário nem histórico completo de aprovações. Não reproduzir números, feriados, fluxos de aprovação, direitos laborais ou estados de sincronização fictícios.

## Alterações concretas

- `src/presentation/pages/VacationWorkspacePage.tsx`: `vacationWorkspaceToolbar` reúne «Visão geral», «Planeamento» e o botão nativo «Registos» na vista geral. O botão reutiliza `focusSection('vacation-evidence-title')`: não cria terceira rota, não substitui o hash do React Router, não marca férias e mantém o painel com informação real disponível.
- `src/styles/vacation-elegance.css`: tabs pill com foco visível, cartão principal em verde escuro, variante de aviso em vermelho escuro, grelha de métricas de 4/2/1 colunas conforme o espaço e linha temporal estritamente decorativa para os elementos do `VacationEvidencePanel`. Mantém os textos e os valores calculados; sem imagem remota, script, ícones externos ou dependência nova. Breakpoints 960px, 540px e 355px, com high contrast e reduced motion.
- `src/styles/vacation-elegance.test.ts`: confirma dois links + salto seguro, ligação aos cálculos originais e regras de acessibilidade/responsividade. Teste estático não substitui inspeção visual.

## Dados, riscos e segurança

Sem mudanças em `VacationBalance.ts`, `VacationYearRecords.ts`, `secureStorage`, Zustand, Dexie, AES-GCM, Worker, sessão, permissões, CSP, APIs, segredos ou exportações. A meta pessoal configurável não se converte em direito laboral; o saldo do cartão é **saldo pessoal mensal**, tal como na base anterior. Os dias manuais sem data não aparecem como registos datados. A PR #224 corrige separadamente a visibilidade de erros de leitura na proveniência; até integrar e validar ambas, a consulta pode estar parcial. O cartão principal usa variante própria quando saldo é negativo. Os estilos adicionais aumentam a cascata CSS e podem conflituar com tema escuro, zoom ou outros overrides: medir antes de consolidar.

## Critérios de aceitação antes de publicar

1. GitHub Actions no head final: auditoria, TypeScript, ESLint, Vitest, build, Worker dry-run e smoke Chromium.
2. iPhone 320–430px e Android: tabulação e toque em «Registos» sem 404, foco no título, sem scroll horizontal, apresentação de saldos negativos e valores longos sem corte.
3. Tablet/desktop, 200% zoom, letras ampliadas, retrato/paisagem, tema escuro, cores forçadas, VoiceOver/teclado e preferência de movimento reduzido.
4. Verificação com dados reais da origem dos dias, ano corrente/seguinte, calendário e simulação sem alterações nos cálculos; verificar regressos da PWA e eventual cofre indisponível.
5. Comparar a branch com a PR #224 antes de integrar; nenhuma publicação ou merge automático enquanto as pendências críticas não forem validadas.
