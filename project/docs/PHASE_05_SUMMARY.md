# Fase 5 — Foco/Pomodoro

Estado de implementação preparado para validação por CI.

## Implementado

- Pomodoro 25/5/15 com 4 ciclos.
- Sessão personalizada.
- Iniciar, pausar, retomar, concluir e cancelar.
- Associação opcional à atividade ativa.
- Timer reconstruído por timestamps após refresh/reabertura.
- Persistência IndexedDB/Dexie schema v5.
- Apenas uma sessão aberta por jornada.
- Bloqueio de foco durante uma pausa da jornada.
- Encerramento consistente de sessão aberta ao terminar a jornada.
- Interface funcional no ecrã Foco.
- Testes de domínio, casos de uso e persistência.

## Gate

A fase só será marcada como concluída depois de typecheck, lint, testes e build passarem no GitHub Actions.
