# Checkpoint do Projeto

## Estado atual

**Versão:** V1 funcional auditada  
**Integração final:** PR #39 integrada em `main`  
**Fonte funcional principal:** `project/PROJECT_SPEC.md`  
**Registo de fecho:** `project/docs/V1_FINAL_AUDIT.md`

## Fases

- [x] Fase 0 — Especificação.
- [x] Fase 1 — Fundação.
- [x] Fase 2 — Jornada.
- [x] Fase 3 — Pausas.
- [x] Fase 4 — Atividades.
- [x] Fase 5 — Foco/Pomodoro.
- [x] Fase 6 — Café.
- [x] Fase 7 — Dashboard.
- [x] Fase 8 — Histórico, Estatísticas e Definições.
- [x] Fase 9 — Qualidade/PWA implementada e auditada.

## Funcionalidades da release

- Jornada persistente e recuperável.
- Pausas e cálculo de tempo efetivo.
- Atividades com exclusividade de atividade ativa.
- Pomodoro e foco personalizado persistentes.
- Café com preço configurável e totais diários.
- Dashboard/Hoje com jornada linear e próximo evento.
- Timeline diária, resumo e eliminação controlada de registos.
- Estatísticas de 1, 7 e 30 dias.
- Definições persistentes.
- Calculadora de horas e ausências, incluindo doença, consultas e horas extra.
- Vencimento e planificação mensal parametrizáveis.
- Guia de utilização integrado.
- Exportação JSON do relatório diário.
- PWA com manifest, service worker, atualização automática e cache offline.
- Interface neutra, clara e responsiva para mobile e computador.

## Auditoria final — PR #39

Corrigidos os dois bloqueadores identificados na auditoria:

1. PWA restaurada com configuração relativa compatível com GitHub Pages; deixou de existir limpeza automática de service workers/caches no arranque.
2. Zoom do browser voltou a ser permitido; `viewport-fit=cover` e safe areas mantêm-se.

Validação automática da PR #39:

- Typecheck: **PASS**
- Lint: **PASS** — permanece 1 warning não bloqueante em `TodayPage.tsx` relativo à dependência de `useMemo`.
- Testes: **PASS — 54/54**
- Build: **PASS**
- Build PWA: **PASS** — gera `manifest.webmanifest`, `registerSW.js`, `sw.js` e Workbox.
- Publicação: **atualizada** — a cópia compilada em `site/` contém manifest, registo de service worker, service worker e Workbox.

## Correção de consistência — Horas & Ausências (2026-09-04)

A revisão da calculadora identificou três causas concretas de divergência:

1. Um dia configurado como folga mantinha visualmente o horário-base 08:00–17:00 e podia ser apurado como 08:45 não trabalhadas, apesar de `resolveWorkScheduleForDate` indicar `isWorkingDay: false`.
2. Motivos de ausência de dia inteiro podiam conservar horas reais do formulário e produzir uma combinação contraditória entre motivo, presença e ausência.
3. A eliminação dependia de `window.confirm`; a ação foi substituída pelo diálogo interno da aplicação e a persistência passa a ser confirmada no cofre local com `secureStorage.flush()`.

Correções aplicadas na PR #183:

- o cálculo distingue explicitamente dia planeado de trabalho e folga;
- trabalho realizado numa folga é contabilizado como extra, sem inventar horas não trabalhadas;
- faltas justificadas/injustificadas, férias, feriado e folga podem representar corretamente ausência integral;
- pares entrada/saída e início/fim da ausência são validados antes de guardar;
- hora inicial igual à hora final deixa de ser interpretada como uma jornada de 24 horas;
- turnos que atravessam a meia-noite continuam suportados quando a saída é realmente anterior à entrada;
- registos legados apresentados na calculadora são reconciliados com a configuração atual quando o horário guardado coincide com o horário configurado;
- eliminar um registo e limpar o mês usam confirmação interna e aguardam persistência no cofre cifrado.

Validação automática da PR #183 no commit `a121f9494e3dca4a9f5077e9ac76967bc55be08f`:

- Auditoria de dependências: **PASS — 0 vulnerabilidades**
- Typecheck: **PASS**
- Lint: **PASS — 0 warnings introduzidos por esta alteração**
- Testes: **PASS — 220/220 em 54 ficheiros**
- Testes específicos `WorkHours`: **PASS — 14/14**
- Testes do store de horas: **PASS — 3/3**, incluindo eliminação por ID
- Build: **PASS**
- Build PWA: **PASS**
- Smoke test no Chromium: **PASS**

## Correção visual — marca completa no topo móvel (2026-09-04)

Na PR #184 foi corrigido o corte do nome **Foco Jornada** na barra superior móvel. A causa era a combinação de compressão do item flex com limites de largura demasiado pequenos aplicados pelas camadas finais de CSS, o que cortava o texto desenhado no bloco da marca.

A correção:

- reserva largura suficiente para a marca em mobile;
- aplica variantes compactas para ecrãs até 420 px e 380 px sem truncar o nome;
- ajusta apenas os espaçamentos necessários no topo em ecrãs estreitos;
- mantém intactos os comportamentos de navegação, segurança, dados e regras de negócio;
- acrescenta cobertura de regressão ao teste de estabilidade móvel.

Validação da PR #184:

- Auditoria de dependências: **PASS**
- Typecheck: **PASS**
- Lint: **PASS**
- Testes: **PASS**
- Build: **PASS**
- Smoke test desktop/mobile: **PASS**
- GitHub Pages: **deploy concluído com sucesso**

## Pontos não bloqueantes para evolução

- validar manualmente a apresentação final em Safari/iPhone, Android, tablet e monitores largos;
- eliminar avisos de testes já existentes, nomeadamente a atualização de estado durante renderização assinalada em `AppTopBar`;
- considerar code splitting/lazy loading para reduzir o bundle principal, atualmente acima do aviso de 500 kB do Vite;
- acompanhar a atualização das GitHub Actions que ainda originam avisos de runtime Node;
- manter as limitações do simulador de vencimento claramente identificadas quando existam regimes fiscais, contributivos ou convencionais específicos.

`main` representa a linha estável do projeto; alterações relevantes continuam sujeitas aos quality gates antes do merge.