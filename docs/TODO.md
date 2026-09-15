# TODO

Atualizado em: 2026-09-15

## P0 — Evolução mensal de férias em tempo real (PR #206)

- [x] Analisar o cálculo mensal existente antes de alterar a semântica.
- [x] Preservar `monthlyAccruedDays` como valor de meses fechados.
- [x] Adicionar interpolação do mês atual sem alterar a referência laboral.
- [x] Calcular progresso do mês pela fração de calendário já decorrida.
- [x] Incluir a fração do dia local no valor vivo.
- [x] Calcular `monthlyLiveAccruedDays` diretamente a partir da meta anual.
- [x] Calcular saldo vivo atual e saldo vivo após férias planeadas.
- [x] Expor ganho, restante, percentagem, ritmo diário e meta de fecho do mês atual.
- [x] Atualizar a página a cada minuto enquanto está ativa.
- [x] Recalcular ao recuperar foco e visibilidade, sem depender de execução em background.
- [x] Adicionar barras de progresso mensais responsivas.
- [x] Preservar `forced-colors` e `prefers-reduced-motion`.
- [x] Adicionar testes de interpolação intramensal e último dia do mês.
- [x] Confirmar que férias gozadas/planeadas continuam a afetar os saldos vivos corretamente.
- [x] Não criar persistência, endpoint, token, segredo, permissão ou dependência nova.
- [x] Atualizar `VACATION-TRACKER.md`, `PROJECT_STATE.md`, `ARCHITECTURE.md`, `DECISIONS.md`, `TODO.md` e `CHANGELOG.md`.
- [x] Obter `npm audit --audit-level=high` verde.
- [x] Obter typecheck verde.
- [x] Obter lint verde.
- [x] Obter testes verdes, incluindo regressões anteriores.
- [x] Obter build, Worker dry-run e smoke test Chromium verdes.
- [x] Marcar PR #206 como pronto apenas depois dos quality gates.
- [x] Integrar PR #206 em `main` no commit `15f4df15308a145f9d303cf56d699837f9516303`.
- [x] Confirmar **Qualidade #1123** verde em `main` após o merge.
- [x] Confirmar **Publicar Foco & Jornada #245** verde.
- [x] Confirmar publicação no commit `05e32a99bd0479fdb417876cb9a31f305a32866d`.
- [x] Confirmar **pages build and deployment #790** verde.
- [ ] Validar em iPhone real a atualização viva e a reconciliação ao regressar à PWA.
- [ ] Validar Android/Chrome e tablet.
- [ ] Confirmar que a configuração continua a sincronizar entre telemóvel e computador sem novo estado temporal persistido.

## P0 — Contagem de dias úteis nas férias (PR #205)

- [x] Confirmar 24/08/2026–06/09/2026 = 10 dias úteis.
- [x] Deduplicar datas antes da contagem.
- [x] Excluir sábado e domingo do desconto automático no regime semanal padrão.
- [x] Aplicar a regra a férias gozadas e planeadas, saldo laboral e saldo mensal pessoal.
- [x] Adicionar testes de regressão.
- [x] Integrar no commit `2e309975a38e0df975bf1958879fefb3c3b4b514`.
- [x] Confirmar **Qualidade #1114**, publicação e **pages build and deployment #785** verdes.
- [ ] Validar em dispositivo real o intervalo 24/08/2026–06/09/2026.

## P0 — Acumulação mensal de férias (PR #204)

- [x] Adicionar `monthlyAccrualTargetDays` com 28 por defeito.
- [x] Manter compatibilidade com configurações antigas.
- [x] Garantir marcos sem drift: março 7, junho 14, setembro 21, dezembro 28.
- [x] Criar cronograma de 12 meses e UI responsiva.
- [x] Manter projeção pessoal separada da referência laboral.
- [x] Integrar/publicar com quality gates verdes.
- [ ] Validar em dispositivo real a grelha mensal e o saldo acumulado.
- [ ] Confirmar sincronização de `monthlyAccrualTargetDays` entre telemóvel e computador.

## P0 — Ferramenta de saldo de férias (PR #203)

- [x] Separar referência laboral, ano de admissão, saldo atual e saldo projetado.
- [x] Reutilizar e deduplicar férias do mapa de turnos/plano mensal/calculadora de horas.
- [x] Guardar apenas configuração adicional no `secureStorage` cifrado.
- [x] Criar rota `#/ferias` e UI responsiva/acessível.
- [x] Integrar/publicar com quality gates verdes.
- [ ] Validar em dispositivo real rota, persistência, tema e responsividade.
- [ ] Confirmar sincronização da configuração de férias com o mesmo cofre.
- [ ] Confirmar com RH/contrato/CCT regras mais favoráveis ou dias transitados antes de os tratar como saldo oficial.

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

Implementação concluída nos PR #191–#194; falta encerrar validação operacional física.

- [ ] No telemóvel de referência, confirmar estado **Sincronizado** e revisão remota concluída.
- [ ] Usar **Associar outro navegador** e abrir a ligação no computador.
- [ ] Confirmar que o computador usa o mesmo perfil/PIN.
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
- [ ] Se aprovado, especificar migração compatível antes de alterar timestamps/histórico existente.
- [ ] Antes dessa decisão, manter validações cross-device no mesmo timezone do sistema.

## P2 — Melhorias futuras

- [ ] Avaliar calendário laboral para excluir automaticamente feriados e suportar descanso semanal diferente sem inferir regras não confirmadas.
- [ ] Avaliar regras adicionais de férias apenas após confirmar eventual CCT/contrato aplicável.
- [ ] Avaliar seleção de ano/histórico de férias depois de validar a versão atual em uso real.
- [ ] Criar fluxo explícito de resolução de conflitos apenas depois de validar o comportamento conservador atual.
- [ ] Avaliar eliminação autenticada da cópia remota quando um perfil é removido localmente.
- [ ] Avaliar revogação/listagem de browsers associados apenas se surgir necessidade operacional.
- [ ] Avaliar rate limiting/Turnstile se o endpoint remoto deixar de ser estritamente pessoal.
