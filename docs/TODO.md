# TODO

Atualizado em: 2026-09-18. Tarefas históricas completas em `docs/history/TODO-pre-217.md`; não considerar pendências físicas antigas concluídas por omissão.

## P0 — Refinamento das férias e salto global, PR #220

- [x] Ler os cinco documentos, comparar componentes, rotas, CSS, AppShell e `focusSection` com o código de `main`.
- [x] Refinar apenas `vacation-visual-audit.css` existente: leitura a 74rem, superfícies, títulos, destaques e contenção do calendário em 320–360 px CSS.
- [x] Substituir `AppShell` `href="#main-content"` por botão nativo que foca `<main>` sem alterar o hash; preservar o atalho de proveniência e menu.
- [x] Acrescentar regressões jsdom de foco/hash para duas rotas de férias e turnos, e testes estruturais de responsividade, alto contraste e movimento reduzido.
- [x] Atualizar relatório `VACATION-UI-AUDIT-2026.md` e os cinco documentos obrigatórios.
- [ ] Confirmar Qualidade do **head final**; só depois integrar o PR #220.
- [ ] Confirmar Qualidade em `main`, Publicar, commit do build e GitHub Pages; atualizar provas nos documentos.
- [ ] **Teste físico:** abrir no iPhone do utilizador `#/ferias` e `#/ferias/planeamento` e confirmar a ausência de overflow, o salto global com VoiceOver/teclado e navegação sem 404. Depois testar Android, tablet/desktop, zoom/textos ampliados e orientação horizontal.

## P0 — Auditoria visual anterior, PR #219

- [x] Ler documentos, analisar componentes, relatório e estilos; harmonizar navegação móvel, tipografia, espaçamento e cartões sem alterar fórmulas.
- [x] Proteger importação, separação de vistas, hash e regras CSS por testes estruturais.
- [x] Qualidade #1209 (head) e #1210 (`main`), merge `f96ced5532178bb0746db0e50ef52874e72710dc`, Publicar #258, build `96c779f88ab2d0f941b7a54f690dd759fa909ec1`, Pages #854.
- [ ] Confirmar a aparência no iPhone/Android 320–430 px CSS, textos ampliados, rotação, cartões, filtros e calendário; também tablet/desktop e zoom.

## P0 — Navegação e estabilidade

- [x] PR #218 corrigiu `href="#vacation-evidence-title"` com foco/scroll sem alterar hash; fallback PT-PT; Qualidade #1201/#1202, Publicar #257, Pages #848.
- [ ] Testar no iPhone real abertura do atalho, expansão, refresh da PWA e recuperação de URL inválido.
- [x] Implementada no PR #220 a correção do `AppShell.tsx` `href="#main-content"` sujeito a 404 em HashRouter; publicação e validação física dependem dos itens acima.

## P0 — Rastreabilidade do saldo, PR #217

- [x] Comparar `VacationBalance`, `VacationBalancePage`, `VacationYearRecords`, cofre, rotas, estilos e testes com documentos existentes.
- [x] Painel opcional de proveniência: datas e fontes, úteis gozados/futuros, fins de semana ignorados e dias manuais sem data explicitados.
- [x] Reutilizar coletor de proveniência para ano futuro, preservar datas válidas de outro mês e evitar dias impossíveis.
- [x] Contenção, teclado, `aria-expanded`, contraste forçado, movimento reduzido, sem escrita; testes domínio/UI e `VACATION-EVIDENCE.md`.
- [x] Qualidade #1192/#1193, merge `61816f7ec3f1c43043d57b094f834bb116d19a27`, Publicar #256, Pages #842, build `322b8b37f745e17233360af07e473f50e9fc79d5`.
- [ ] Confirmar origens e contagens do painel em dados reais após alterações, PWA em segundo plano e sincronização.

## P0 — Precisão e acessibilidade

- [ ] Testar iPhone, Android, tablet e computador: textos ampliados, zoom, orientação horizontal, teclado e VoiceOver/TalkBack.
- [ ] Confirmar dez dias úteis e quatro fins de semana ignorados em 24/08–06/09/2026 sob a regra padrão.
- [ ] Confirmar que mudanças de cenário limpam vistos da checklist de férias a dois.
- [ ] Validar feriados, CCT, escala e dias contratuais com fontes autorizadas antes de afirmar saldo laboral oficial.

## P1 — Evoluções futuras controladas

- [ ] Extrair agregação comum de `VacationBalancePage` e `VacationYearRecords` com regressões, sem alterar históricos ou manter rotas ocultas montadas sem necessidade.
- [ ] Avaliar modo de consulta de saldo pessoal/contratual com confirmação de origens, sem tratar meta de 28 como direito adquirido.
- [ ] Considerar feriados/descanso alternativo configuráveis somente após regras confirmadas e testes de contagem.
- [ ] Consolidar gradualmente as camadas CSS das férias **depois** de medições visuais e QA; não juntar refatoração estrutural a correção cosmética.

## Entregas recentes

- [x] PR #214: ponto de situação local em tempo real.
- [x] PR #215: julho do ano seguinte e restrições declaradas.
- [x] PR #216: checklist temporária por cenário; Qualidade #1190, Publicar #255, Pages #840.
- [x] PR #217: proveniência por dia; Qualidade #1193, Publicar #256, Pages #842.
- [x] PR #218: salto sem mudar hash, recuperação de rota; Qualidade #1202, Pages #848.
- [x] PR #219: auditoria visual; Qualidade #1209/#1210, Publicar #258, Pages #854; validação física aberta.
