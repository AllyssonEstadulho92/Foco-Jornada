# Registo de Decisões Técnicas

## ADR-001 — V1 local-first
**Estado:** aceite  
**Decisão:** a V1 não tem backend nem autenticação; IndexedDB é a fonte de verdade local.

## ADR-002 — Timers derivados de timestamps
**Estado:** aceite  
**Decisão:** jornada, pausas, atividades e foco não usam contadores acumulativos como fonte de verdade.

## ADR-003 — Desenvolvimento com quality gates
**Estado:** aceite  
**Decisão:** alterações relevantes só entram em `main` depois de typecheck, lint, testes e build verdes.

## ADR-004 — Governação em `project/`
**Estado:** aceite  
**Decisão:** especificação, roadmap, checkpoints, decisões e prompts ficam em `project/`; código de produção fica em `src/`.

## ADR-005 — Zustand para estado efémero de interface
**Estado:** aceite  
**Decisão:** regras e dados persistentes vivem em domínio/casos de uso/repositórios, não no store de UI.

## ADR-006 — Migrações Dexie por módulo
**Estado:** aceite  
**Decisão:** tabelas são adicionadas quando o módulo correspondente é implementado.

## ADR-007 — Pausas descontam tempo efetivo
**Estado:** aceite  
**Decisão:** tempo efetivo = jornada - pausas não canceladas; pausa ativa é encerrada com a jornada.

## ADR-008 — Duração real da pausa consolidada
**Estado:** aceite  
**Decisão:** timestamps continuam primários, com duração real consolidada no encerramento.

## ADR-009 — Apenas uma atividade ativa
**Estado:** aceite  
**Decisão:** não existem duas atividades ativas simultaneamente na mesma jornada.

## ADR-010 — Encerramento consistente de estado aberto
**Estado:** aceite  
**Decisão:** ao terminar jornada, atividade e pausa são encerradas e sessão de foco aberta é cancelada no mesmo instante lógico.

## ADR-011 — Pomodoro persistente
**Estado:** aceite  
**Decisão:** pausa/retoma e tempo restante do foco são derivados de `startedAt`, `pausedAt`, `totalPausedSeconds` e `endedAt`.

## ADR-012 — Relatórios reconstruídos dos registos
**Estado:** aceite  
**Decisão:** histórico e estatísticas são agregações derivadas das tabelas de domínio; não existe um segundo estado de relatório a sincronizar.

## ADR-013 — Finalização V1 consolidada numa branch de release
**Estado:** aceite  
**Decisão:** após validar as Fases 1–5 individualmente, as Fases 6–9 foram consolidadas em `release/v1-finalizacao` para reduzir tempo de entrega, mantendo a separação por módulos e o gate integral de CI antes do merge.

## ADR-014 — GitHub Pages publicado apenas por artefacto
**Estado:** aceite  
**Contexto:** o workflow copiava `dist/` para a raiz e para `site/`, criava commits automáticos em `main` e, em paralelo, também publicava um artefacto Pages.
**Decisão:** o código fonte é compilado no CI e apenas `dist/` é entregue a GitHub Pages. Builds compilados deixam de ser fonte versionada.
**Consequências:** elimina commits automáticos de deploy, reduz duplicação e separa claramente fonte de artefacto.

## ADR-015 — Backup local integral com allowlist
**Estado:** aceite  
**Contexto:** IndexedDB contém o domínio principal, mas horas, vencimento, mapa de turnos e alguns estados operacionais ainda persistem em `localStorage`.
**Decisão:** enquanto a migração para IndexedDB não estiver concluída, a release inclui no backup apenas chaves locais explicitamente autorizadas.
**Consequências:** o backup cobre o estado operacional atual sem exportar chaves estranhas ao Foco Jornada; backups antigos sem esta extensão continuam suportados.

## ADR-016 — Carregamento lazy por rota
**Estado:** aceite  
**Contexto:** todas as páginas eram importadas no arranque e o bundle principal ultrapassava o aviso de 500 kB do Vite.
**Decisão:** páginas são carregadas através de lazy routes do React Router.
**Consequências:** reduz o JavaScript inicial e mantém a mesma estrutura de navegação e regras de negócio.

## ADR-017 — CSS global apenas por evolução incremental
**Estado:** aceite  
**Contexto:** a aplicação acumulou várias folhas de protótipo, referência e correção; uma ativação global anterior do tema neutro provocou página em branco.
**Decisão:** não reativar nem substituir globalmente temas históricos de uma só vez. A consolidação visual é feita por ecrã, com validação técnica e mobile antes de remover estilos antigos.
**Consequências:** privilegia estabilidade e permite reduzir dívida de CSS sem regressões funcionais.

---

## Modelo

```text
## ADR-XXX — Título
Estado: proposta | aceite | rejeitada | substituída
Contexto:
Decisão:
Consequências:
```
