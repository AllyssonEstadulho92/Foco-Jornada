# TODO

Atualizado em: 2026-09-21. Histórico completo anterior em `docs/history/TODO-pre-217.md`; não considerar pendências físicas resolvidas por omissão.

## P0 — Cálculo de fim de semana, PR #226 (em revisão)

- [x] Localizar as páginas, o motor de cálculo e a origem do mapa de turnos; preservar horas extra e dados anteriores.
- [x] Distinguir acréscimos de trabalho normal ao sábado/domingo de trabalho suplementar em folga e feriado.
- [x] Criar taxas independentes inicialmente por confirmar, apurar horas normais sem pausas e acrescentar suplementos a bruto, IRS e Segurança Social.
- [x] Acrescentar rubricas e configuração no resumo, testes de cálculo e integração com mapa e `docs/WEEKEND-PAY.md`.
- [ ] Validar CI final: dependências, tipos, lint, testes, build, Worker e smoke Chromium; primeira execução teve uma comparação de ponto flutuante excessivamente estrita num teste novo, corrigida em commit posterior.
- [ ] Confirmar percentagens com recibo, contrato ou CCT e classificação dos turnos; não atribuir taxa por suposição.
- [ ] Verificar turnos noturnos que atravessem datas civis, regras de feriados, alterações manuais de horas e equivalência da estimativa com recibo.
- [ ] Integrar PR, confirmar publicação e testar iPhone/Android/computador, zoom, teclado, leitor de ecrã, conservação de dados e atualização da PWA.

## P0 — Adaptação do protótipo de Férias e Planeamento, PR #223

- [x] Comparar duas imagens e PDF do iPhone com os cinco documentos e código real; distinguir conteúdo ilustrativo de dados reais.
- [x] Implementar paisagem SVG local/offline, separadores, cabeçalhos, cartões e percurso de planeamento responsivos sem alterar o AppShell.
- [x] Criar alternância Gráfico/Tabela alimentada pelo cronograma original do domínio e preservar 12 cartões completos e progresso intramensal em detalhe expansível.
- [x] Manter cálculo, cofre, deduplicação, ano, julho predefinido, restrições declaradas, calendário, confirmação temporária, ligações e simulação sem criar submissão falsa à ILUNION.
- [x] Acrescentar testes de alternância, valores e CSS, mais `VACATION-PROTOTYPE-2026.md`. CI #1250 (PR) e #1251 (`main`) aprovaram auditoria, tipos, lint, testes, build, Worker e smoke.
- [x] Integrar o [PR #223](https://github.com/AllyssonEstadulho92/Foco-Jornada/pull/223), merge `49cf48d1abc6bed68eabd7e8b5e1da4931a50c02`; Publicar #262 com sucesso, build `ae506c4a0e73a6a2a6aa5fecf5cb221ab70c8a41`, Pages #875 com sucesso. O PR permanecia em rascunho até esta verificação, motivo por que a versão pública não mudara.
- [ ] Testar visualmente em iPhone real e Android, tablet e computador: 320–430px CSS, zoom, texto ampliado, paisagem, modo escuro, VoiceOver/teclado, gráfico/tabela, 12 meses, seleção de período, calendário e regresso da PWA. Comparar com as referências sem exigir valores ou pessoas demonstrativos.
- [ ] Confirmar a data de admissão 30/09/2026 e referência laboral 0 mostradas no PDF de 20/09; corrigir apenas depois de validar dados reais e regras contratuais.

## P0 — Auditoria de espaços e ritmo de Férias, PR #222

- [x] Analisar PDF de 19/09 e comparar `vacation.css`, `vacation-accrual.css`, `vacation-insights.css`, `vacation-workspace.css`, páginas e documentação.
- [x] Identificar a causa de cabeçalhos com base flex de 240/260px em orientação vertical, eliminar `flex-basis:100%` na regra móvel da área, manter texto e valores de altura intrínseca.
- [x] Harmonizar indicadores, cartões mensais e disposição do planeamento em desktop, preservando a ordem móvel e os dados.
- [x] Reforçar `vacation-workspace.test.ts`, `vacation-insights.test.ts`, `vacation-planning-structure.test.ts`; registar evidências em `VACATION-MOBILE-SPACING-AUDIT-2026.md`.
- [x] Qualidade #1240 no head final, PR #222 integrado (`b5f34b9b8adf8e2ecacd210ecfbeb7f9d6c0614a`), Qualidade #1241 em `main`, Publicar #261, Pages #869 passaram.
- [ ] Comparar nova captura do iPhone com o PDF de 19/09: títulos/valores sem vazio de 200+ pt, cartão de setembro, indicadores, períodos de 2027, zoom, texto ampliado, orientação, VoiceOver e teclado. Prosseguir com Android, tablet e computador.
- [ ] Confirmar com o utilizador a «Data de admissão» 30/09/2026 exibida no PDF de 19/09 e a referência laboral de 0 dias; investigar dados/validação separadamente, sem modificar saldos por inferência.

## P0 — Percurso claro para planeamento a dois, PR #221

- [x] Analisar PDF anterior, cinco documentos, `VacationPlannerPanel`, `VacationJointPlanner`, checklist, CSS e testes.
- [x] No ano seguinte, propostas antes do saldo de 2026 opcional, sem atribuir transferência; no atual, resumo vivo antes das sugestões.
- [x] Criar percurso 01 escolher, 02 comparar, 03 simular, 04 confirmar; alternativas compactas, restrições de novembro/dezembro e confirmação efémera por cenário.
- [x] CSS escopado, testes e `VACATION-PLANNING-STRUCTURE-2026.md`.
- [x] Qualidade #1227/#1228, merge `9e9d267fd7a9ed7de3a9afdc68cbc8a8d2b708b9`, Publicar #260, Pages #866 com sucesso.
- [ ] Verificar no iPhone real seleção, calendário, ano, vistos, zoom, suspensão e retorno; depois outros dispositivos.

## P0 — Layout, navegação e rastreabilidade anteriores

- [x] PR #220: estilos até 74rem e salto global sem alterar hash; Qualidade #1219/#1220, Publicar #259, Pages #859.
- [x] PR #219: navegação móvel e cartões harmonizados; Qualidade #1209/#1210, Publicar #258, Pages #854.
- [x] PR #218: corrigir 404 no atalho dos dias com `focusSection`, fallback PT-PT; Qualidade #1201/#1202, Publicar #257, Pages #848.
- [x] PR #217: proveniência de férias por dia e fonte, Qualidade #1192/#1193, Publicar #256, Pages #842.
- [ ] Validar no iPhone real saltos sem 404, origem dos dias, atualização após registos e sync, todas as larguras 320–430px CSS, zoom, orientação, acessibilidade; confirmar 10 dias úteis e 4 fins de semana ignorados em 24/08–06/09/2026 na regra padrão.

## P1 — Precisão e melhorias controladas

- [ ] Confirmar feriados, CCT, escala, descanso alternativo e dias contratuais com fontes autorizadas antes de os tratar como saldo oficial.
- [ ] Comparar `VacationBalancePage` e `VacationYearRecords` com dados reais para eventual agregação comum; evitar manter vistas ocultas montadas sem necessidade.
- [ ] Consolidar camadas CSS apenas após medições reais; evitar refatorar domínio durante correções de apresentação.
- [ ] Confirmar que trocar o cenário limpa as confirmações temporárias e não grava férias automaticamente.
