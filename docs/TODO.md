# TODO

Atualizado em: 2026-09-18. Histórico completo anterior em `docs/history/TODO-pre-217.md`; não considerar pendências físicas resolvidas por omissão.

## P0 — Percurso claro para planeamento a dois, PR #221

- [x] Analisar PDF do utilizador, cinco documentos do projeto e código atual (`VacationPlannerPanel`, `VacationJointPlanner`, checklist, estilos e testes).
- [x] Distinguir ano atual de futuro: no ano seguinte, mostrar propostas antes de contexto expansível de 2026; no atual, preservar o resumo vivo completo.
- [x] Criar ordem semântica 01 escolher, 02 comparar, 03 simular, 04 confirmar e alternativas compactas responsivas sem reordenar apenas por CSS.
- [x] Preservar limites novembro/dezembro, confirmação efémera por cenário, calendário, fórmula, cofre e avisos; metodologia acessível por `details`.
- [x] Criar CSS de layout limitado a `.vacationWorkspace--planning`, testes estruturais e `docs/VACATION-PLANNING-STRUCTURE-2026.md`.
- [ ] Confirmar Qualidade no **head final** do PR #221; depois integrar na `main`.
- [ ] Confirmar Qualidade `main`, Publicar, commit do build e GitHub Pages; atualizar documentos com provas.
- [ ] Testar visualmente em iPhone real com screenshot: 2027/2026, cartões e datas sem cortes, opções, calendário, VoiceOver, teclado, zoom, rotação, textos grandes, suspender/reabrir. Depois Android, tablet e desktop.

## P0 — Refinamento anterior das férias e salto global, PR #220

- [x] Ler documentos, comparar rotas/CSS/AppShell/focusSection, refinar CSS a 74rem e os calendários compactos.
- [x] Corrigir `href="#main-content"` com botão nativo, testar foco/hash em férias e turnos, documentar cinco ficheiros.
- [x] Qualidade #1219 head final, merge `8a45758f68462e8631edbaf65f0b802a2c60ee19`, Qualidade #1220 `main`, Publicar #259, build `eec8da024db5b3f65624433c66726e7c56e04cb0`, Pages #859 com sucesso.
- [ ] **Teste físico:** ausência de overflow, salto global com VoiceOver/teclado e navegação sem 404; Android/tablet/desktop, zoom/texto/landscape.

## P0 — Auditoria visual anterior, PR #219

- [x] Rever documentos/componentes/estilos; harmonizar navegação móvel, tipografia, espaçamento e cartões sem fórmula nova.
- [x] Testes estruturais; Qualidade #1209/#1210, merge `f96ced5532178bb0746db0e50ef52874e72710dc`, Publicar #258, build `96c779f88ab2d0f941b7a54f690dd759fa909ec1`, Pages #854.
- [ ] Confirmar iPhone/Android 320–430px CSS, texto ampliado, rotação, cartões/filtros/calendário; tablet/desktop e zoom.

## P0 — Navegação e estabilidade

- [x] PR #218 corrigiu `href="#vacation-evidence-title"` via foco/scroll sem hash e fallback PT-PT; Qualidade #1201/#1202, Publicar #257, Pages #848.
- [x] PR #220 corrigiu e publicou skip link global do AppShell.
- [ ] Testar no iPhone real atalho e expansão, refresh da PWA, navegação e recuperação de URL inválido.

## P0 — Rastreabilidade do saldo, PR #217

- [x] Comparar domínio, página, fontes, cofre, rotas, estilos e testes.
- [x] Painel opcional por data/fonte, úteis gozados/futuros, fins de semana ignorados e dias manuais sem data.
- [x] Reutilizar coletor de proveniência para ano futuro, preservar datas válidas de outras folhas e rejeitar datas impossíveis.
- [x] Contenção, foco, `aria-expanded`, contraste/movimento reduzido, sem escrita; testes domínio/UI e `VACATION-EVIDENCE.md`.
- [x] Qualidade #1192/#1193, merge `61816f7ec3f1c43043d57b094f834bb116d19a27`, Publicar #256, Pages #842, build `322b8b37f745e17233360af07e473f50e9fc79d5`.
- [ ] Confirmar origens/contagens com dados reais após alterações, PWA em segundo plano e sync.

## P0 — Precisão e acessibilidade

- [ ] Testar iPhone/Android/tablet/computador com texto ampliado, zoom, orientação, teclado e VoiceOver/TalkBack.
- [ ] Confirmar dez dias úteis e quatro fins de semana ignorados em 24/08–06/09/2026 sob regra padrão.
- [ ] Confirmar que mudanças de cenário repõem vistos da checklist a dois.
- [ ] Validar feriados, CCT, escala e dias contratuais com fontes autorizadas antes de afirmar saldo laboral oficial.

## P1 — Evoluções futuras controladas

- [ ] Extrair agregação comum de `VacationBalancePage` e `VacationYearRecords` com regressões; não deixar vistas ocultas montadas sem necessidade.
- [ ] Avaliar saldo pessoal/contratual só com confirmação de origens, sem tornar meta 28 direito adquirido.
- [ ] Considerar feriados e descanso alternativo configuráveis só após regras confirmadas/testadas.
- [ ] Consolidar camadas CSS após medições visuais e QA; não juntar refatoração de domínio a correções de UI.

## Entregas recentes

- [x] PR #214: resumo local em tempo real.
- [x] PR #215: julho do próximo ano e restrições declaradas.
- [x] PR #216: checklist por cenário; Qualidade #1190, Publicar #255, Pages #840.
- [x] PR #217: proveniência por dia; Qualidade #1193, Publicar #256, Pages #842.
- [x] PR #218: salto sem hash, recuperação; Qualidade #1202, Pages #848.
- [x] PR #219: auditoria visual; Qualidade #1209/#1210, Publicar #258, Pages #854.
- [x] PR #220: CSS e skip link; Qualidade #1219/#1220, Publicar #259, Pages #859. Testes físicos continuam abertos.
