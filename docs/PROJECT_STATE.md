# Estado do Projeto

Atualizado em: 2026-09-17. Estado de integração/publicação verificado até ao PR #216.

## Estado atual

**Foco Jornada**: uma PWA React 19/TypeScript responsiva (iPhone, Android, tablet e computador), frontend GitHub Pages, IndexedDB/Dexie e cofre AES-GCM, sincronização opcional cifrada por Cloudflare Worker/Durable Object. As mesmas regras de domínio e o mesmo perfil aplicam-se a todos os tamanhos de ecrã; a replicação não é instantânea garantida.

Em `main` estão integrados os trabalhos anteriores de jornada, autenticação/sync e férias #203–#216. `#/ferias` mostra evolução mensal, saldo e indicadores; `#/ferias/planeamento` concentra sugestões, calendário e simulação. O planeamento a dois permite julho do ano seguinte, exclui novembro e dezembro como restrição indicada pelo utilizador sujeita a confirmação anual e **não** valida a disponibilidade da parceira ou a aprovação da ILUNION. PR #214 (resumo local vivo), #215 (planeamento a dois em dois anos) e #216 (confirmações por cenário) integrados; PR #216 merge `faa8c064c13246654152c5eb66e7e7be65bdeaee`, Publicar #255 e Pages #840 concluídos com sucesso, build `a41a76152277952d5f1ea30500e358d098a40c51`.

## Alteração atual — PR #217

**Estado:** branch `feat/vacation-saldo-traceability`, PR em validação; **não integrado nem publicado** nesta fase documental. Acrescenta na vista geral uma secção recolhida «De onde vêm os teus dias?», atalho de navegação, lista por data com fontes (horas/turnos/plano), contagens de úteis até hoje/futuros e fins de semana ignorados, explicação da fórmula e atualização manual. Os dias lançados manualmente sem data são descontados no saldo, mas não apresentados como datas inventadas. O planeamento não recebe este painel. `VacationYearRecords` passa a fornecer proveniência e as mesmas datas ao planeador anual; sem alteração de `calculateVacationBalance`, da meta pessoal de 28 dias nem do cofre. Especificação e testes: `docs/VACATION-EVIDENCE.md`.

**Validação:** Qualidade #1192 passou no head pré-documentação (auditoria, TypeScript, lint, Vitest, build, Worker dry-run, smoke Chromium). Confirmar novamente no head final com documentos e só então integrar e verificar `main`/Publicar/Pages. A validação física continua pendente.

## Precisão e limites

A meta pessoal anual de 28 dias é configurável e **não equivale automaticamente ao direito contratual**. A acumulação intramensal usa fração local do mês, atualiza por minuto enquanto ativa e em foco/visibilidade; iOS pode suspender JavaScript em segundo plano. Férias registadas são deduplicadas e contam seg.–sex. por defeito. Entre 24/08 e 06/09/2026 há 14 dias civis, dez úteis e quatro de fim de semana ignorados, sob a regra padrão. Feriados, descanso alternativo, contrato/CCT, escala e aprovação devem ser confirmados, nunca inferidos.

## Problemas e riscos abertos

- Vista inativa está escondida por CSS mas continua montada em React, incluindo cálculos ocultos; futura extração partilhada requer testes.
- `VacationBalancePage` mantém a recolha própria do ano corrente; a auditoria e o planeador anual usam `VacationYearRecords`. Confirmar consistência com dados reais e só depois unificar os consumidores com regressões.
- Indisponibilidade temporária de uma fonte cifrada pode gerar lista parcial, sem criar dados fictícios; painel permite atualizar manualmente.
- Teste físico ainda pendente: iPhone, Android, tablet/desktop, zoom/texto ampliado, teclado/VoiceOver/TalkBack, mudança de ano, retorno após suspensão e sincronização.

## Última alteração e próximo passo

PR #217: proveniência por data e painel de consulta opcional implementados, sem novas escritas nem cálculos de saldo. Revalidar CI do head final; integrar/publicar apenas com gates verdes. Validar a correspondência entre contagens do painel e saldo em dispositivo real. Para detalhes históricos não apagados, consultar `docs/history/PROJECT_STATE-pre-217.md` e os restantes ficheiros em `docs/history/`.