# TODO

Atualizado em: 2026-09-15

## P0 — Ferramenta de saldo de férias (PR #203)

- [x] Analisar a arquitetura atual antes de alterar código.
- [x] Confirmar que o Mapa de turnos já possui `kind = vacation` e a Calculadora de horas `reason = ferias`.
- [x] Validar o enquadramento geral nos artigos 237.º a 240.º do Código do Trabalho e em gov.pt.
- [x] Separar anos normais do ano de admissão.
- [x] Não representar o direito anual normal como acumulação mensal.
- [x] Aplicar mínimo geral de 22 dias úteis nos anos normais suportados.
- [x] Permitir valor superior a 22 apenas como condição mais favorável explicitamente configurada.
- [x] No ano de admissão, usar política conservadora de 2 dias por mês completo, máximo 20, documentando a incerteza sobre frações de mês.
- [x] Separar dias adquiridos do marco de seis meses para gozo no ano de admissão.
- [x] Reutilizar férias já registadas no mapa de turnos, plano mensal e calculadora de horas.
- [x] Deduplicar a mesma data entre fontes.
- [x] Separar férias já gozadas/registadas de férias futuras planeadas.
- [x] Criar `VacationBalance` como cálculo puro, sem dependência da UI.
- [x] Adicionar testes para regras normais, admissão, limites, datas futuras e deduplicação.
- [x] Guardar apenas a configuração adicional no `secureStorage` existente.
- [x] Não criar novo endpoint, schema IndexedDB, segredo, token ou mecanismo de autenticação.
- [x] Criar rota `#/ferias` e acesso na navegação desktop/mobile.
- [x] Criar UI responsiva com foco de teclado, `forced-colors` e mensagens de limitação.
- [x] Reforçar o contraste do botão principal em tema claro/escuro.
- [x] Criar `docs/VACATION-TRACKER.md` com especificação e critérios de aceitação.
- [x] Atualizar `PROJECT_STATE.md` e `ARCHITECTURE.md`.
- [x] Atualizar `DECISIONS.md` e `CHANGELOG.md`.
- [x] Obter `npm audit --audit-level=high` verde no PR #203.
- [x] Obter typecheck verde.
- [x] Obter lint verde.
- [x] Obter testes verdes, incluindo regressões existentes.
- [x] Obter build, Worker dry-run e smoke test verdes.
- [x] Corrigir o crash de instalação do npm 10.9.8 sem remover quality gates.
- [x] Fixar npm 11.6.0 nos workflows de qualidade e publicação.
- [x] Marcar PR #203 como pronto apenas depois dos quality gates.
- [x] Integrar PR #203 em `main` no commit `225e808a416ac6e18f23c1b7178e99886d7cecbf`.
- [x] Confirmar publicação GitHub Pages no commit `d5dee6cd9418eaf4483ca4422c17b8331d915445`.
- [x] Confirmar pipeline **Qualidade #1098** verde após integração em `main`.
- [x] Confirmar **pages build and deployment #767** verde para o commit publicado.
- [ ] Validar em dispositivo real a rota, persistência, tema e responsividade.
- [ ] Marcar a mesma data como férias em duas fontes e confirmar contagem única em uso real.
- [ ] Confirmar sincronização da configuração de férias entre telemóvel e computador com o mesmo cofre.
- [ ] Confirmar com RH/contrato/CCT quaisquer regras mais favoráveis ou dias transitados antes de os introduzir como ajuste.

## P0 — Automação de jornada e pausas (PR #202)

- [x] Confirmar a arquitetura atual de `WorkSchedule`, jornada, pausas, foco e relatórios antes de alterar.
- [x] Manter `WorkSchedule` como fonte única da entrada, saída e pausas planeadas.
- [x] Criar `reconcileScheduledWorkday` sem duplicar repositories nem regras de persistência.
- [x] Impedir início automático antes da entrada configurada.
- [x] Iniciar automaticamente durante o turno com `startedAt` igual à entrada configurada.
- [x] Terminar jornada ativa com `endedAt` igual à saída configurada.
- [x] Não reiniciar jornada terminada manualmente no mesmo dia.
- [x] Não fabricar jornada completa quando a primeira abertura do dia ocorre apenas depois da saída.
- [x] Reconciliar pausas ativadas usando apenas `startTime`/`endTime` configurados.
- [x] Suportar pausa de 60 minutos através de configuração explícita, sem hardcode.
- [x] Reconstruir pausa planeada após suspensão da PWA usando timestamps exatos.
- [x] Pausar foco em execução quando começa uma pausa laboral.
- [x] Manter Pomodoro e foco personalizado totalmente manuais.
- [x] Reutilizar `finishJourneyWithProductivityState` no fecho automático.
- [x] Atualizar controllers e relatório após mutações automáticas sem reload da página.
- [x] Adicionar testes de entrada, pausa, saída, abertura tardia e término manual.
- [x] Documentar a limitação de background da PWA e a regra de reconciliação.
- [x] Obter `npm audit --audit-level=high` verde no PR #202.
- [x] Obter typecheck verde.
- [x] Obter lint verde.
- [x] Obter testes verdes, incluindo regressões existentes.
- [x] Obter build, Worker dry-run e smoke test verdes.
- [x] Marcar PR #202 como pronto depois dos quality gates.
- [x] Integrar PR #202 em `main`.
- [x] Confirmar publicação GitHub Pages do merge.
- [ ] Validar em dispositivo real uma jornada 08:00–17:00.
- [ ] Definir manualmente uma pausa de 60 minutos em **Definições → Pausas** e validar início/fim automáticos.
- [ ] Confirmar no dispositivo real que Pomodoro não inicia automaticamente.
- [ ] Confirmar saída 17:00 sem toque manual.

## P0 — Segurança de dependências

- [x] Identificar a causa da primeira falha de CI do PR #202 como advisories novos, não erro funcional da automação.
- [x] Atualizar `vitest` para `5.0.0`.
- [x] Forçar `sharp` `0.35.4` através de `overrides`.
- [x] Restaurar dependências diretas do lint exigidas por `eslint.config.js`.
- [x] Confirmar `npm audit --audit-level=high` sem vulnerabilidades no head final.
- [x] Confirmar compatibilidade de Vitest 5 com todos os testes atuais.
- [x] Confirmar pipeline **Qualidade** verde também após integração em `main`.
- [x] Isolar o crash `edgesOut` do npm 10.9.8 no runner Node 22.
- [x] Fixar npm 11.6.0 nos workflows sem reduzir auditoria, testes ou build.

## P0 — Sincronização móvel ↔ computador em dispositivos reais

Implementação concluída nos PR #191–#194; falta encerrar validação operacional física.

- [ ] No telemóvel de referência, confirmar estado **Sincronizado** e revisão remota concluída.
- [ ] Usar **Associar outro navegador** e abrir a ligação no computador.
- [ ] Confirmar que o computador usa o mesmo perfil/PIN em vez de criar um acesso independente.
- [ ] Criar um registo real no mobile e confirmar na web.
- [ ] Criar um registo real na web e confirmar no mobile.
- [ ] Editar e eliminar, quando aplicável, e confirmar convergência nos dois sentidos.
- [ ] Fechar/reabrir ambas as plataformas e confirmar persistência.
- [ ] Validar offline → reconexão.
- [ ] Validar conflito simultâneo sem perda silenciosa de uma cópia.
- [ ] Confirmar que os dois dispositivos usam o mesmo timezone durante o teste.

## P1 — Interface móvel em dispositivo real

As correções dos PR #195–#199 estão integradas; continuam pendentes testes físicos alargados.

- [ ] Validar Android/Chrome entre 360 e 480 px.
- [ ] Validar tablet/viewport web entre 481 e 899 px.
- [ ] Validar orientação horizontal e safe-area.
- [ ] Validar toque repetido hambúrguer ↔ X sem estado visual residual.
- [ ] Validar `focus-visible`, `forced-colors` e `prefers-reduced-motion`.
- [ ] Confirmar top bar persistente, drawer abaixo e indicadores operacionais sempre visíveis.

## P1 — Medicação e stock

- [ ] Testar deslize de medicação num iPhone real, incluindo scroll vertical.
- [ ] Confirmar que horário eliminado desaparece imediatamente sem reaparecer por versão futura.
- [ ] Confirmar seletor **Resumo / Detalhes técnicos** e paginação do histórico em ecrã pequeno.
- [ ] Testar Android/Chrome e tablet.
- [ ] Verificar VoiceOver/TalkBack e caminho equivalente pelo menu `···`.

## P1 — Consistência temporal

- [ ] Decidir se jornada/relatórios devem usar timezone global explícito em `AppSettings`.
- [ ] Se aprovado, especificar migração compatível antes de alterar timestamps/histórico existente.
- [ ] Antes dessa decisão, manter validações cross-device no mesmo timezone do sistema.

## P2 — Melhorias futuras

- [ ] Avaliar regras adicionais de férias apenas após confirmar eventual CCT/contrato aplicável; não inferir benefícios específicos.
- [ ] Avaliar seleção de ano/histórico de férias depois de validar a versão atual em uso real.
- [ ] Criar fluxo explícito de resolução de conflitos apenas depois de validar o comportamento conservador atual em uso real.
- [ ] Avaliar eliminação autenticada da cópia remota quando um perfil é removido localmente.
- [ ] Avaliar revogação/listagem de browsers associados apenas se surgir necessidade operacional.
- [ ] Avaliar rate limiting/Turnstile ou controlo adicional se o endpoint remoto deixar de ser estritamente pessoal.
- [ ] Avaliar melhorias de descoberta do gesto de medicação sem aumentar ruído visual.
