# Checkpoint do Projeto

## Estado atual

**Baseline publicada:** 1.1.5  
**Versão candidata:** 1.2.0  
**Hardening:** PR #150 em validação  
**Fonte funcional principal:** `project/PROJECT_SPEC.md`  
**Política temporal:** `docs/TIME-AUTOMATION.md`  
**Plano de hardening:** `project/docs/HARDENING_1_2.md`

## Núcleo preservado

- Jornada persistente e recuperável.
- Pausas e cálculo de tempo efetivo.
- Atividades com exclusividade de atividade ativa.
- Pomodoro e foco personalizado por timestamps.
- Café e histórico diário.
- Definições e horário de trabalho.
- Calculadora de horas e ausências.
- Vencimento e planificação mensal.
- Mapa de turnos.
- Stock pessoal, sticks e reconciliação.
- Medicamentos, horários, estados de toma e proteção.
- Centro de notificações e deadlines.
- Relatório diário A4/PDF.
- PWA offline e atualização automática.

## Hardening 1.2 — alterações em validação

1. GitHub Pages deixa de criar commits automáticos do build em `main`; a publicação usa apenas o artefacto `dist/`.
2. Cópias compiladas históricas da raiz/`site/` são removidas do repositório e bloqueadas no `.gitignore`.
3. O router passa a carregar páginas por lazy route, reduzindo o bundle inicial.
4. A cópia integral passa a incluir, por allowlist, horas, vencimento, mapa de turnos, preferências, notificações e sessão glo que ainda persistem fora de IndexedDB.
5. Diagnósticos de permissão deixam de fazer polling fixo desnecessário e reagem a eventos.
6. O CI passa a fazer smoke test em desktop e viewport móvel 390×844.
7. O relatório A4 distingue jornada planeada/registada e apresenta o cálculo foco/efetivo como índice de foco.

## Gate obrigatório da 1.2.0

- [ ] Typecheck.
- [ ] Lint.
- [ ] Testes.
- [ ] Build.
- [ ] Smoke desktop.
- [ ] Smoke mobile.
- [ ] Merge apenas após CI verde.

## Próximos trabalhos — não misturar com esta fase

- migração gradual de persistências operacionais de `localStorage` para IndexedDB;
- consolidação de CSS por ecrã, sem reativar `neutral-theme.css` globalmente;
- substituição gradual de DOM enhancements por componentes/hooks React;
- testes visuais reais em Safari/iPhone, Android, tablet e monitores largos;
- proteção/ruleset de `main` exigindo o workflow `Qualidade`;
- lockfile controlado para instalação reprodutível.

O objetivo da 1.2.0 é reduzir risco técnico sem reconstruir nem alterar o comportamento de negócio já validado.
