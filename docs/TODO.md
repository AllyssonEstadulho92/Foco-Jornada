# TODO

Atualizado em: 2026-09-16

## P0 — Hierarquia visual da evolução mensal de férias (PR #208)

- [x] Rever a captura real e o resultado do PR #207 antes de alterar estilos.
- [x] Preservar toda a lógica de `VacationBalance` e a atualização em tempo real.
- [x] Trocar a grelha mensal rígida por `auto-fit/minmax`.
- [x] Aplicar a mesma adaptação automática ao resumo vivo.
- [x] Melhorar hierarquia entre mês, estado, valor, progresso e texto auxiliar.
- [x] Distinguir visualmente mês atual, concluídos e futuros.
- [x] Manter contenção do PR #207 e impedir overflow estrutural.
- [x] Passar a 1 coluna em ecrãs estreitos e remover altura mínima fixa no mobile.
- [x] Preservar `forced-colors` e `prefers-reduced-motion`.
- [x] Expandir `vacation-card-containment.test.ts` para proteger auto-fit, contenção e estado atual.
- [x] Confirmar que não existe alteração de dados, cálculo, persistência, sync, API, autenticação ou dependências.
- [x] Atualizar `PROJECT_STATE.md`, `ARCHITECTURE.md` e `DECISIONS.md`.
- [ ] Atualizar `CHANGELOG.md` com o estado final do PR #208.
- [ ] Obter `npm audit --audit-level=high` verde no head final.
- [ ] Obter typecheck verde.
- [ ] Obter lint verde.
- [ ] Obter testes verdes.
- [ ] Obter build, Worker dry-run e smoke test Chromium verdes.
- [ ] Marcar PR #208 como pronto apenas depois dos gates.
- [ ] Integrar PR #208 em `main`.
- [ ] Confirmar qualidade em `main` após merge.
- [ ] Confirmar publicação e GitHub Pages.
- [ ] Validar iPhone real, sobretudo setembro/percentagens longas e zoom.
- [ ] Validar Android/Chrome, tablet e desktop.

## P0 — Conter conteúdo dos cartões mensais de férias (PR #207)

- [x] Reproduzir o problema visual a partir da captura: badge `Em curso · xx%` ultrapassa o cartão de setembro.
- [x] Rever `VacationBalancePage.tsx`, `vacation.css` e `vacation-accrual.css` antes de alterar estilos.
- [x] Aplicar `min-width: 0`/`max-width: 100%` aos elementos relevantes.
- [x] Permitir quebra segura no cabeçalho dos cartões.
- [x] Remover `white-space: nowrap` e truncamento por reticências do estado mensal.
- [x] Limitar valor, descrições, resumo e barra de progresso à largura disponível.
- [x] Preservar `forced-colors` e `prefers-reduced-motion`.
- [x] Adicionar teste de regressão `vacation-card-containment.test.ts`.
- [x] Confirmar ausência de alterações em cálculo/persistência/API/autenticação/sync/dependências.
- [x] Integrar PR #207 em `main` no commit `3a564251eece4a4c2870982ed3127c1638a68482`.
- [x] Confirmar **Qualidade #1132** verde em `main`.
- [x] Confirmar **Publicar Foco & Jornada #246** verde.
- [x] Confirmar publicação no commit `ce2242b0f90fc4e884764df6d3c31c7dd43a60e9`.
- [x] Confirmar **pages build and deployment #796** verde.
- [ ] Validar visualmente em iPhone que nenhum conteúdo ultrapassa o cartão.
- [ ] Validar Android/Chrome, tablet e desktop, incluindo aumento de texto/zoom.

## P0 — Evolução mensal de férias em tempo real (PR #206)

- [x] Preservar `monthlyAccruedDays` como meses fechados.
- [x] Adicionar interpolação do mês atual sem alterar a referência laboral.
- [x] Calcular progresso pela fração de calendário já decorrida, incluindo fração do dia local.
- [x] Calcular acumulado, saldo vivo e saldo vivo após planeadas.
- [x] Expor ganho, restante, percentagem, ritmo diário e meta do mês.
- [x] Atualizar a cada minuto e reconciliar em foco/visibilidade.
- [x] Preservar `forced-colors` e `prefers-reduced-motion`.
- [x] Adicionar testes de interpolação e limites do mês.
- [x] Confirmar férias gozadas/planeadas nos saldos vivos.
- [x] Integrar PR #206 em `main` no commit `15f4df15308a145f9d303cf56d699837f9516303`.
- [x] Confirmar **Qualidade #1123**, **Publicar #245** e **Pages #790** verdes.
- [ ] Validar atualização viva e retoma da PWA em iPhone real.
- [ ] Validar Android/Chrome e tablet.
- [ ] Confirmar sincronização da configuração entre telemóvel e computador.

## P0 — Contagem de dias úteis nas férias (PR #205)

- [x] Confirmar 24/08/2026–06/09/2026 = 10 dias úteis.
- [x] Deduplicar datas antes da contagem.
- [x] Excluir sábado e domingo do desconto automático no regime padrão.
- [x] Aplicar a regra a gozadas/planeadas, saldo laboral e saldo pessoal.
- [x] Adicionar testes de regressão.
- [x] Integrar no commit `2e309975a38e0df975bf1958879fefb3c3b4b514`.
- [x] Confirmar **Qualidade #1114**, publicação e **Pages #785** verdes.
- [ ] Validar em dispositivo real o intervalo 24/08/2026–06/09/2026.

## P0 — Acumulação mensal de férias (PR #204)

- [x] Adicionar `monthlyAccrualTargetDays` com 28 por defeito.
- [x] Manter compatibilidade com configurações antigas.
- [x] Garantir marcos sem drift: março 7, junho 14, setembro 21, dezembro 28.
- [x] Criar cronograma de 12 meses responsivo.
- [x] Manter projeção pessoal separada da referência laboral.
- [x] Integrar/publicar com quality gates verdes.
- [ ] Validar em dispositivo real a grelha mensal e o saldo acumulado.
- [ ] Confirmar sincronização de `monthlyAccrualTargetDays`.

## P0 — Ferramenta de saldo de férias (PR #203)

- [x] Separar referência laboral, ano de admissão, saldo atual e saldo projetado.
- [x] Reutilizar e deduplicar férias do mapa de turnos/plano mensal/calculadora de horas.
- [x] Guardar apenas configuração adicional no `secureStorage` cifrado.
- [x] Criar rota `#/ferias` e UI responsiva/acessível.
- [x] Integrar/publicar com quality gates verdes.
- [ ] Validar em dispositivo real rota, persistência, tema e responsividade.
- [ ] Confirmar sincronização da configuração de férias com o mesmo cofre.
- [ ] Confirmar com RH/contrato/CCT regras mais favoráveis antes de as tratar como saldo oficial.

## P0 — Automação de jornada e pausas (PR #202)

- [x] Reconciliar entrada, pausas e saída a partir de `WorkSchedule`.
- [x] Manter Pomodoro/foco personalizado manuais.
- [x] Preservar timestamps exatos quando a PWA regressa do background.
- [x] Integrar/publicar com testes e quality gates verdes.
- [ ] Validar em dispositivo real uma jornada 08:00–17:00.
- [ ] Validar pausa configurada de 60 minutos.
- [ ] Confirmar no dispositivo real que Pomodoro não inicia automaticamente.
- [ ] Confirmar saída 17:00 sem toque manual.

## P0 — Segurança de dependências

- [x] Atualizar Vitest para `5.0.0`.
- [x] Forçar `sharp` `0.35.4` via `overrides`.
- [x] Fixar npm 11.6.0 nos workflows sem reduzir auditoria/testes/build.
- [x] Manter `npm audit --audit-level=high` como gate.

## P0 — Sincronização móvel ↔ computador em dispositivos reais

Implementação concluída nos PR #191–#194; falta validação física.

- [ ] Confirmar estado **Sincronizado** e revisão remota no telemóvel.
- [ ] Usar **Associar outro navegador** e abrir a ligação no computador.
- [ ] Confirmar mesmo perfil/PIN.
- [ ] Criar/editar/eliminar registos nos dois sentidos e confirmar convergência.
- [ ] Fechar/reabrir ambas as plataformas e confirmar persistência.
- [ ] Validar offline → reconexão.
- [ ] Validar conflito simultâneo sem perda silenciosa.
- [ ] Confirmar o mesmo timezone durante o teste.

## P1 — Interface móvel em dispositivo real

- [ ] Validar Android/Chrome entre 360 e 480 px.
- [ ] Validar tablet/viewport web entre 481 e 899 px.
- [ ] Validar orientação horizontal e safe-area.
- [ ] Validar toque repetido hambúrguer ↔ X sem estado residual.
- [ ] Validar `focus-visible`, `forced-colors` e `prefers-reduced-motion`.
- [ ] Confirmar top bar persistente, drawer abaixo e indicadores operacionais visíveis.

## P1 — Medicação e stock

- [ ] Testar deslize de medicação num iPhone real, incluindo scroll vertical.
- [ ] Confirmar que horário eliminado desaparece imediatamente sem reaparecer.
- [ ] Confirmar seletor **Resumo / Detalhes técnicos** e paginação em ecrã pequeno.
- [ ] Testar Android/Chrome e tablet.
- [ ] Verificar VoiceOver/TalkBack e caminho equivalente pelo menu `···`.

## P1 — Consistência temporal

- [ ] Decidir se jornada/relatórios devem usar timezone global explícito em `AppSettings`.
- [ ] Se aprovado, especificar migração compatível antes de alterar timestamps/histórico.
- [ ] Até lá, manter validações cross-device no mesmo timezone do sistema.

## P2 — Melhorias futuras

- [ ] Avaliar calendário laboral para excluir feriados e suportar descanso semanal diferente.
- [ ] Avaliar regras adicionais de férias apenas após confirmar CCT/contrato aplicável.
- [ ] Avaliar seleção de ano/histórico de férias após validar a versão atual.
- [ ] Criar fluxo explícito de resolução de conflitos se necessário.
- [ ] Avaliar eliminação autenticada da cópia remota.
- [ ] Avaliar revogação/listagem de browsers associados.
- [ ] Avaliar rate limiting/Turnstile se o endpoint remoto deixar de ser estritamente pessoal.