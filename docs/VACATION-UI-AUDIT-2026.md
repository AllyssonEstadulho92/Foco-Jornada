# Auditoria visual da área de Férias — 2026-09-17

## Âmbito e base verificada

Auditoria estática do código em `main` após PR #218: `VacationWorkspacePage`, `VacationBalancePage`, `VacationPlannerPanel`, `VacationEvidencePanel` e os estilos `vacation-workspace.css`, `vacation.css`, `vacation-accrual.css`, `vacation-insights.css`, `vacation-planner.css`, `vacation-planner-live.css`, `vacation-suggestions.css`, `vacation-joint-planner.css` e `vacation-evidence.css`. Estas observações provêm dos componentes e CSS, **não** de uma medição de layout no iPhone/Android reais.

## Diagnóstico — factos, impacto e correção

| Prioridade | Facto no código | Impacto na interface | Alteração delimitada |
| --- | --- | --- | --- |
| P1 | A navegação de duas áreas mudava para uma coluna a 560 px, mantendo descrições e ícones grandes. | Ocupa muita altura antes do conteúdo no smartphone. | Duas opções compactas lado a lado até 560 px, apenas com os títulos visíveis e alvos de toque adequados. |
| P1 | Os cartões existentes usavam tamanhos de título, sombras e raios distintos entre resumo, meses, indicadores e planeamento. | Hierarquia pouco consistente e sensação de vários produtos numa página. | Camada CSS escopada às férias com ritmo de espaços, raios, texto e sombras harmonizados; destaque reservado ao saldo principal e ao estado selecionado. |
| P1 | O atalho para a proveniência era visualmente mais forte do que a sua função secundária. | Compete com o cabeçalho e os indicadores. | Apresentação compacta como botão secundário de consulta, sem alterar `focusSection` nem a rota hash. |
| P2 | Cartões de meses e indicadores tinham alturas mínimas fixas apesar de largura e texto variáveis. | Espaço vazio desnecessário, sobretudo com uma coluna. | Altura intrínseca e espaçamento menor, sem ocultar os valores ou os estados. |
| P2 | O planeamento combina cabeçalho, seletor de ano, resumo atual, sugestões e simulação com superfícies de estilos diferentes. | Percurso visual menos previsível. | Superfícies, formulários e resultados com bordas e espaços coerentes; ano continua selecionável e planeamento permanece numa rota autónoma. |

## Preservação e segurança

A mudança de UI em `src/styles/vacation-visual-audit.css` é importada pela vista partilhada apenas nas rotas de férias. Não modifica domínio, fórmulas, dias úteis, persistência, cofre, login, sincronização, backend nem pedidos de férias. Férias acumuladas, indicadores e planeamento permanecem separados. Conservam-se `:focus-visible` e `aria` existentes; a variante de alto contraste e a opção de movimento reduzido têm regras explícitas.

## Validação e limitações

`src/styles/vacation-visual-audit.test.ts` protege a importação da camada visual, a separação das rotas, o salto sem `href="#..."`, os limites móveis e a inexistência de novos `display: none` na camada. A suite completa CI deve confirmar lint, TypeScript, testes, build, Worker e smoke do browser. A validação visual efetiva **continua pendente**: iPhone real (320–430 px CSS, texto ampliado e orientação), Android, tablet e desktop; avaliar quebras de título, alturas e comportamento do calendário. Testes estáticos e smoke de arranque não demonstram ausência de overflow em todos os aparelhos.

## Riscos que esta auditoria não altera

O `AppShell` ainda possui `href="#main-content"`, incompatível com `createHashRouter` ao ativar o salto global: correção funcional separada e prioritária. A vista não ativa continua montada e o coletor das férias do ano corrente ainda é distinto do coletor de proveniência; não misturar essas refatorizações numa intervenção visual. O valor 28 permanece uma meta pessoal, não um direito laboral confirmado; feriados, escala e aprovação são externos à apresentação.
