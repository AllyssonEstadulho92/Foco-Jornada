# TODO

Atualizado em: 2026-09-16

## P0 — Painel avançado de leitura de férias (PR #209)

- [x] Rever o estado publicado dos PR #203–#208 antes de alterar a área de férias.
- [x] Preservar separação entre referência laboral e projeção pessoal.
- [x] Adicionar progresso anual da meta pessoal.
- [x] Mostrar quanto falta acumular até à meta anual.
- [x] Calcular próximo marco inteiro da acumulação e data estimada pelo mesmo modelo mensal.
- [x] Mostrar férias gozadas com separação entre registos automáticos e manuais.
- [x] Mostrar férias futuras planeadas.
- [x] Mostrar `gozadas + planeadas` e percentagem da meta pessoal.
- [x] Calcular previsão pessoal para 31 de dezembro.
- [x] Mostrar fins de semana ignorados pelo filtro padrão.
- [x] Mostrar próximo fecho mensal, falta no mês e ritmo diário.
- [x] Criar painel responsivo `vacation-insights.css` sem alterar estilos globais.
- [x] Preservar `forced-colors` e `prefers-reduced-motion`.
- [x] Adicionar testes de domínio para os novos indicadores.
- [x] Adicionar regressão CSS para o painel.
- [x] Confirmar que não existe novo campo persistido, endpoint, token, segredo, permissão ou dependência.
- [x] Atualizar `PROJECT_STATE.md`, `ARCHITECTURE.md`, `DECISIONS.md`, `TODO.md` e `CHANGELOG.md` no head final.
- [ ] Obter `npm audit --audit-level=high` verde.
- [ ] Obter typecheck verde.
- [ ] Obter lint verde.
- [ ] Obter testes verdes, incluindo `VacationBalance.insights.test.ts` e `vacation-insights.test.ts`.
- [ ] Obter build, Worker dry-run e smoke test Chromium verdes.
- [ ] Marcar PR #209 como pronto apenas depois dos gates.
- [ ] Integrar PR #209 em `main`.
- [ ] Confirmar Qualidade em `main` após merge.
- [ ] Confirmar publicação e GitHub Pages.
- [ ] Validar no iPhone real os novos cartões, barra anual e próximo marco.
- [ ] Validar Android/Chrome, tablet e desktop, incluindo zoom e aumento de texto.

## P0 — Validação física da área de férias já publicada

- [ ] Confirmar no iPhone que a evolução em tempo real atualiza e reconcilia ao regressar à PWA.
- [ ] Confirmar que setembro e badges longos não extravasam após PR #207/#208.
- [ ] Confirmar em dispositivo real que 24/08/2026–06/09/2026 desconta 10 dias úteis e ignora 4 fins de semana.
- [ ] Confirmar sincronização de `monthlyAccrualTargetDays` e restantes configurações entre telemóvel e computador.
- [ ] Validar Android/Chrome e tablet.

## P0 — Funcionalidades de férias já integradas

- [x] PR #203 — ferramenta de saldo de férias, referência laboral e rota `#/ferias`.
- [x] PR #204 — meta pessoal mensal configurável, 28 dias por defeito.
- [x] PR #205 — exclusão padrão de sábado/domingo; caso 24/08–06/09 = 10 dias.
- [x] PR #206 — evolução intramensal em tempo real.
- [x] PR #207 — contenção de todos os cartões mensais.
- [x] PR #208 — grelha `auto-fit/minmax` e hierarquia visual adaptativa.
- [x] Qualidade #1139, Publicar #247 e Pages #801 verdes para o PR #208.

## P0 — Automação de jornada e pausas

- [x] Reconciliar entrada, pausas e saída a partir do `WorkSchedule`.
- [x] Manter Pomodoro/foco personalizado manuais.
- [x] Preservar timestamps exatos quando a PWA regressa do background.
- [x] Integrar/publicar com testes e quality gates verdes.
- [ ] Validar em dispositivo real uma jornada 08:00–17:00.
- [ ] Validar pausa configurada de 60 minutos.
- [ ] Confirmar no dispositivo real que Pomodoro não inicia automaticamente.
- [ ] Confirmar saída 17:00 sem toque manual.

## P0 — Segurança de dependências

- [x] Vitest `5.0.0`.
- [x] `sharp` `0.35.4` via `overrides`.
- [x] npm 11.6.0 fixado nos workflows.
- [x] `npm audit --audit-level=high` mantido como gate.

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

- [ ] Avaliar calendário laboral para excluir automaticamente feriados e suportar descanso semanal diferente.
- [ ] Avaliar regras adicionais de férias apenas após confirmar CCT/contrato aplicável.
- [ ] Avaliar seleção de ano/histórico de férias depois de validar a versão atual.
- [ ] Avaliar um calendário/linha temporal de próximos dias de férias planeados.
- [ ] Avaliar avisos opcionais quando `gozadas + planeadas` ultrapassarem a meta pessoal, sem confundir com direito laboral.
- [ ] Criar fluxo explícito de resolução de conflitos se necessário.
- [ ] Avaliar eliminação autenticada da cópia remota.
- [ ] Avaliar revogação/listagem de browsers associados.
- [ ] Avaliar rate limiting/Turnstile se o endpoint remoto deixar de ser estritamente pessoal.
