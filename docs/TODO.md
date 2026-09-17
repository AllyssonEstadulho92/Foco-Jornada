# TODO

Atualizado em: 2026-09-17. Tarefas históricas completas em `docs/history/TODO-pre-217.md`; não considerar pendências físicas antigas concluídas por omissão.

## P0 — Rastreabilidade do saldo, PR #217

- [x] Comparar `VacationBalance`, `VacationBalancePage`, `VacationYearRecords`, cofre, rotas, estilos e testes com os documentos existentes.
- [x] Adicionar painel opcional de proveniência: datas únicas e fontes; úteis até hoje/futuros, fins de semana ignorados, dias manuais explicitamente não datados.
- [x] Reutilizar coletor de proveniência para planeamento anual; preservar datas válidas de outro mês e evitar dias inválidos.
- [x] Tornar painel responsivo, acesso por teclado, `aria-expanded`, contraste forçado e movimento reduzido; nenhuma gravação.
- [x] Acrescentar testes de domínio/UI e especificação `docs/VACATION-EVIDENCE.md`.
- [x] Qualidade #1192 verde no head de implementação pré-documentação.
- [ ] Confirmar qualidade no head final com docs e integrar PR #217.
- [ ] Verificar gates da `main`, publicação GitHub Pages e commit de build; atualizar PROJECT_STATE/TODO/DECISIONS/CHANGELOG com provas.
- [ ] Validar painel no iPhone real e comparar origens/contagens com dados efetivos e sincronização.

## P0 — Validação física e integridade

- [ ] Testar iPhone, Android, tablet e computador: textos ampliados, zoom, orientação horizontal, teclado, VoiceOver/TalkBack.
- [ ] Confirmar dez dias úteis e quatro fins de semana ignorados para 24/08–06/09/2026 sob a regra padrão.
- [ ] Verificar painel após alterar horas/turnos/plano, regressar à PWA ou sincronizar outro dispositivo; distinguir indisponibilidade do cofre de ausência de férias.
- [ ] Confirmar que mudanças de cenário limpam vistos da checklist do planeamento a dois.
- [ ] Validar as regras concretas de feriados, CCT, escala e dias contratuais com fontes autorizadas antes de calcular um saldo laboral oficial.

## P1 — Evoluções futuras controladas

- [ ] Extrair agregação comum de `VacationBalancePage` e `VacationYearRecords` após testes de regressão, sem alterar dados históricos ou montar rotas ocultas desnecessariamente.
- [ ] Avaliar modo de consulta detalhada de saldo pessoal/contratual com confirmação de valores de origem, sem transformar meta de 28 em direito adquirido.
- [ ] Considerar suporte configurável a feriados/descanso alternativo **somente** após regras confirmadas e testes de contagem.

## Entregas recentes

- [x] PR #214: ponto de situação local em tempo real, integrado.
- [x] PR #215: cenários de julho para o ano seguinte e exclusão declarada de novembro/dezembro, integrado.
- [x] PR #216: confirmação efémera por cenário, Quality #1190, Publicar #255, Pages #840, integrado/publicado.
