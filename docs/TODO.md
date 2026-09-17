# TODO

Atualizado em: 2026-09-17. Tarefas históricas completas em `docs/history/TODO-pre-217.md`; não considerar pendências físicas antigas concluídas por omissão.

## P0 — Auditoria visual das férias, PR #219

- [x] Ler os cinco documentos de continuidade e comparar rotas, componentes e CSS do `main` com a arquitetura descrita.
- [x] Registar factos, impacto e alcance em `docs/VACATION-UI-AUDIT-2026.md`.
- [x] Harmonizar cartão/tipografia/espaçamento; navegação móvel em duas opções compactas; atalho secundário; sem mudar dados ou fórmulas.
- [x] Adicionar teste de regressão da importação, separação de vistas, hash e regras móveis/acessíveis.
- [x] Confirmar Qualidade #1209 no head final com documentação; integrar PR #219 em `main` no merge `f96ced5532178bb0746db0e50ef52874e72710dc`.
- [x] Confirmar Qualidade #1210 da `main`, Publicar Foco & Jornada #258, build `96c779f88ab2d0f941b7a54f690dd759fa909ec1` e GitHub Pages #854 concluídos com sucesso; atualizar estado/decisão/changelog.
- [ ] Validar no iPhone e Android a 320–430 px CSS, textos ampliados, rotação, cabeçalhos, cartões, filtros e calendário; depois tablet/desktop e zoom.

## P0 — Navegação e estabilidade

- [x] PR #218 corrigiu `href="#vacation-evidence-title"` com foco/scroll sem alterar hash; fallback PT-PT; Qualidade #1201/#1202, Publicar #257, Pages #848.
- [ ] Testar no iPhone real abertura do atalho, expansão, refresh da PWA e recuperação de URL inválido.
- [ ] Corrigir `AppShell.tsx` `href="#main-content"`, ainda sujeito ao mesmo 404 em `createHashRouter`; testar teclado/VoiceOver sem reescrever o shell.

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
- [x] PR #219: auditoria e refinamento visual; Qualidade #1209/#1210, Publicar #258, Pages #854; validação física permanece aberta.
