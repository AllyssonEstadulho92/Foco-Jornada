# TODO

Atualizado em: 2026-09-19. Histórico completo anterior em `docs/history/TODO-pre-217.md`; não considerar pendências físicas resolvidas por omissão.

## P0 — Auditoria de espaços e ritmo de Férias, PR #222

- [x] Analisar PDF de 19/09 e comparar `vacation.css`, `vacation-accrual.css`, `vacation-insights.css`, `vacation-workspace.css`, páginas e documentação.
- [x] Identificar a causa de cabeçalhos com base flex de 240/260px em orientação vertical, eliminar `flex-basis:100%` na regra móvel da área, manter texto e valores de altura intrínseca.
- [x] Harmonizar indicadores, cartões mensais e disposição do planeamento em desktop, preservando a ordem móvel e os dados.
- [x] Reforçar `vacation-workspace.test.ts`, `vacation-insights.test.ts`, `vacation-planning-structure.test.ts`; registar evidências em `VACATION-MOBILE-SPACING-AUDIT-2026.md`.
- [ ] Verificar CI do head final do PR #222, integrar e confirmar CI `main`, build e GitHub Pages; documentar provas.
- [ ] Comparar nova captura do iPhone com o PDF de 19/09: títulos/valores sem vazio de 200+ pt, cartão de setembro, indicadores, períodos de 2027, zoom, texto ampliado, orientação, VoiceOver e teclado. Prosseguir com Android, tablet e computador.
- [ ] Confirmar com o utilizador a «Data de admissão» 30/09/2026 exibida no PDF de 19/09 e a referência laboral de 0 dias; investigar dados/validação separadamente, sem modificar saldos por inferência.

## P0 — Percurso claro para planeamento a dois, PR #221

- [x] Analisar PDF anterior, cinco documentos, `VacationPlannerPanel`, `VacationJointPlanner`, checklist, CSS e testes.
- [x] No ano seguinte, propostas antes do saldo de 2026 opcional, sem atribuir transferência; no atual, resumo vivo antes das sugestões.
- [x] Criar percurso 01 escolher, 02 comparar, 03 simular, 04 confirmar; alternativas compactas, restrições de novembro/dezembro e confirmação efémera por cenário.
- [x] CSS escopado, testes e `VACATION-PLANNING-STRUCTURE-2026.md`.
- [x] Qualidade #1227/#1228, merge `9e9d267fd7a9ed7de3a9afdc68cbc8a8d2b708b9`, Publicar #260, build `4074f203c6788d30a4f542c951a6b94b62f86fad`, Pages #866 com sucesso.
- [ ] Verificar no iPhone real seleção, calendário, ano, vistos, zoom, suspensão e retorno; depois outros dispositivos.

## P0 — Layout, navegação e rastreabilidade anteriores

- [x] PR #220: estilos até 74rem e salto global sem alterar hash; Qualidade #1219/#1220, Publicar #259, Pages #859.
- [x] PR #219: navegação móvel e cartões harmonizados; Qualidade #1209/#1210, Publicar #258, Pages #854.
- [x] PR #218: corrigir 404 no atalho dos dias com `focusSection`, fallback PT-PT; Qualidade #1201/#1202, Publicar #257, Pages #848.
- [x] PR #217: painel de proveniência por data, dias úteis/fins de semana ignorados e dias manuais sem data; Qualidade #1192/#1193, Publicar #256, Pages #842.
- [ ] Validar no iPhone real saltos sem 404, origem dos dias, atualização após registos e sync, todas as larguras 320–430px CSS, zoom, orientação, acessibilidade; confirmar 10 dias úteis e 4 fins de semana ignorados em 24/08–06/09/2026 na regra padrão.

## P1 — Precisão e melhorias controladas

- [ ] Confirmar feriados, CCT, escala, descanso alternativo e dias contratuais com fontes autorizadas antes de os tratar como saldo oficial.
- [ ] Comparar `VacationBalancePage` e `VacationYearRecords` com dados reais para eventual agregação comum; evitar manter vistas ocultas montadas sem necessidade.
- [ ] Consolidar camadas CSS apenas após medições reais; evitar refatorar domínio durante correções de apresentação.
- [ ] Confirmar que trocar o cenário limpa as confirmações temporárias e não grava férias automaticamente.
