# TODO

Atualizado em: 2026-09-17. Tarefas históricas completas em `docs/history/TODO-pre-217.md`; não considerar pendências físicas antigas concluídas por omissão.

## P0 — 404 no atalho de férias (PR #218)

- [x] Confrontar screenshot do iPhone com código `VacationWorkspacePage`, `VacationEvidencePanel` e `createHashRouter`.
- [x] Confirmar a causa: `href="#vacation-evidence-title"` substitui a rota em vez de saltar na página.
- [x] Substituir por botão acessível de scroll/foco sem alterar o fragmento; preservar layout e dados.
- [x] Adicionar fallback localizado para rotas inexistentes, com retorno às férias e ao início.
- [x] Criar testes jsdom de foco/hash e regressão estrutural; documentar em `HASH-ROUTER-NAVIGATION.md`.
- [x] Confirmar Qualidade #1201 no head final e #1202 em `main`, incluindo auditoria, tipos, lint, testes, build, Worker e smoke Chromium.
- [x] Integrar PR #218: merge `89564f3ebbfe5d54e5d09dcf28db9e574b35cc50`.
- [x] Confirmar Publicar Foco & Jornada #257, build `42397a6c97d60044f5dbc1cf90723ee799b1d0ac` e GitHub Pages #848 com sucesso.
- [ ] Testar no iPhone real abertura do atalho, expansão da secção, refresh da PWA e recuperação de URL inválido; não confundir CI com validação física.
- [ ] Corrigir também `AppShell.tsx` `href="#main-content"`, sujeito ao mesmo problema no HashRouter; testar navegação por teclado, sem reescrever o shell sem necessidade.

## P0 — Rastreabilidade do saldo, PR #217

- [x] Comparar `VacationBalance`, `VacationBalancePage`, `VacationYearRecords`, cofre, rotas, estilos e testes com os documentos existentes.
- [x] Adicionar painel opcional de proveniência: datas únicas e fontes; úteis até hoje/futuros, fins de semana ignorados, dias manuais explicitamente não datados.
- [x] Reutilizar coletor de proveniência para planeamento anual; preservar datas válidas de outro mês e evitar dias inválidos.
- [x] Tornar painel responsivo, acesso por teclado, `aria-expanded`, contraste forçado e movimento reduzido; nenhuma gravação.
- [x] Acrescentar testes de domínio/UI e especificação `docs/VACATION-EVIDENCE.md`.
- [x] Qualidade #1192 verde no head de implementação e #1193 no head final com documentação, incluindo auditoria, tipos, lint, testes, build, Worker e smoke Chromium.
- [x] Integrar PR #217 em `main`: merge `61816f7ec3f1c43043d57b094f834bb116d19a27`.
- [x] Verificar Publicar Foco & Jornada #256 e GitHub Pages #842 com sucesso; build `322b8b37f745e17233360af07e473f50e9fc79d5`.
- [x] Atualizar documentos de continuidade, preservando histórico anterior em `docs/history`.
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
- [x] PR #217: proveniência por dia, Qualidade #1193, Publicar #256 e Pages #842, integrado/publicado.
- [x] PR #218: salto de férias sem alterar hash e recuperação para rota desconhecida, Qualidade #1202 e Pages #848, integrado/publicado.
