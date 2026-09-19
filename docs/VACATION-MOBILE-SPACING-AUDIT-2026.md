# Auditoria de espaços na área de férias — 19/09/2026

## Evidência recebida

PDF exportado do Safari num iPhone em 19/09/2026, uma página vertical de 440 × 9732 pt, rota «Acumulação e saldo». O título «Evolução por mês» surge aproximadamente em y=1173 pt e a métrica do respetivo cabeçalho só em y=1395 pt; «O que tens, o que falta e o que vem a seguir» surge em y=4447 pt e a percentagem do cabeçalho em y=4689 pt. Existem espaços visualmente desproporcionados entre título e valor, além de doze cartões mensais, oito indicadores e explicações longas numa única sequência. As coordenadas são do PDF, não medidas CSS de um browser. O PDF não prova a apresentação após as correções, nem todos os estados em iOS.

## Causa identificada no código

Em `vacation.css`, a media query `max-width:640px` transforma `.vacationPanelHeader` em coluna. Contudo, `vacation-accrual.css` atribui `flex:1 1 240px` ao bloco do título mensal e `vacation-insights.css` atribui `flex:1 1 260px` ao bloco do título dos indicadores. Como o eixo principal passa a vertical, a base flex de 240/260 px transforma-se em **altura**, explicando o vazio observado. Em `vacation-workspace.css` havia ainda `flex-basis:100%` no cabeçalho móvel, com o mesmo risco. A hipótese técnica é suportada pelo CSS e pelo alinhamento da captura; a medida efetiva da correção continua a exigir reexportação e teste físico.

## Correção no PR #222

Ajustar os cabeçalhos da vista geral em larguras <=640px para `flex:0 0 auto`, largura intrínseca de 100% e espaçamento pequeno entre título e valor, em vez de usar uma base flex de altura fixa; substituir a regra genérica de `flex-basis:100%` <=560px. Compactar o espaçamento dos cartões mensais no telemóvel e permitir que nome e estado partilhem a linha quando houver largura, com quebra de linha quando necessário. Sem esconder meses, indicadores, valores, fontes ou explicações, sem alturas fixas, `overflow-x:hidden` ou nova folha de estilos. A melhoria anterior do PR #222 em indicadores e comparação desktop mantém-se.

Teste estrutural em `src/styles/vacation-workspace.test.ts` protege a correção. Confirmar auditoria de dependências, TypeScript, lint, Vitest, build, Worker dry-run e smoke Chromium; depois validar a versão publicada no iPhone real, com zoom, texto ampliado, mudança de orientação e exportação PDF comparável. Não declarar que todos os espaços foram eliminados apenas pelo teste estrutural.

## Observação de dados, fora deste âmbito visual

No PDF de 19/09, o campo «Data de admissão» exibe 30/09/2026 (data futura relativamente à captura) e a referência laboral exibe 0 dias apesar do campo «Dias anuais confirmados» mostrar 22. Não alterar esses registos ou fórmulas a partir da imagem; pedir confirmação ao utilizador e investigar separadamente a validação de datas se persistir. A meta pessoal de 28 dias não é automaticamente um direito contratual.
