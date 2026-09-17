# Estado do Projeto

Atualizado em: 2026-09-17. PR #218 em revisão: correção do 404 no atalho de férias. A publicação do PR #217 permanece confirmada, mas contém o erro descrito abaixo.

## Incidente atual — PR #218

**Facto:** captura real no iPhone apresenta «Unexpected Application Error! / 404 Not Found» após o atalho «Ver de onde vêm os dias registados». **Causa confirmada no código:** `VacationWorkspacePage` usava `href="#vacation-evidence-title"` numa aplicação com `createHashRouter`; o fragmento substituía `#/ferias` por uma rota inexistente. Não é uma falha demonstrada do saldo ou dos registos.

**Correção no branch `fix/hash-router-section-navigation`:** botão de salto com scroll/foco programático, sem alterar a rota; título de destino focável; CSS mantém aspeto e dimensões; fallback `*` em PT-PT para endereço inválido, com links de recuperação. Testes jsdom do hash e foco e teste estrutural do fallback. Ver `docs/HASH-ROUTER-NAVIGATION.md`. **Estado:** integração, CI do head final, publicação e inspeção no iPhone pendentes; não anunciar correção publicada antes dos gates.

**Risco adicional observado:** `AppShell` tem outro `href="#main-content"` incompatível com o mesmo Router quando utilizado. Registar correção dirigida do skip link global, sem reescrever o AppShell nesta correção urgente. Os cálculos, dados, permissões, cofre, sync e API não foram modificados.

## Estado atual

**Foco Jornada**: uma PWA React 19/TypeScript responsiva (iPhone, Android, tablet e computador), frontend GitHub Pages, IndexedDB/Dexie e cofre AES-GCM, sincronização opcional cifrada por Cloudflare Worker/Durable Object. As mesmas regras de domínio e o mesmo perfil aplicam-se a todos os tamanhos de ecrã; a replicação não é instantânea garantida.

Em `main` estão integrados os trabalhos anteriores de jornada, autenticação/sync e férias #203–#217. `#/ferias` mostra evolução mensal, saldo, indicadores e, agora, detalhe opcional de proveniência dos dias; `#/ferias/planeamento` concentra sugestões, calendário e simulação. O planeamento a dois permite julho do ano seguinte, exclui novembro e dezembro como restrição indicada pelo utilizador sujeita a confirmação anual e **não** valida a disponibilidade da parceira ou a aprovação da ILUNION. PR #214 (resumo local vivo), #215 (planeamento a dois em dois anos) e #216 (confirmações por cenário) integrados; PR #216 merge `faa8c064c13246654152c5eb66e7e7be65bdeaee`, Publicar #255 e Pages #840 concluídos com sucesso.

## Última entrega publicada — PR #217

**Estado: integrado e publicado; atalho com erro identificado no PR #218.** PR #217 `feat/vacation-saldo-traceability`, merge `61816f7ec3f1c43043d57b094f834bb116d19a27`, Qualidade #1192 (implementação) e #1193 (head final) com sucesso (auditoria, TypeScript, lint, Vitest, build, Worker dry-run, smoke Chromium). Publicar Foco & Jornada #256 e GitHub Pages #842 terminaram com sucesso; build publicado `322b8b37f745e17233360af07e473f50e9fc79d5`. A confirmação de uma execução de Qualidade especificamente em `main` não foi obtida nesta verificação; o head final e a publicação passaram os respetivos gates.

Na vista geral, foi acrescentada uma secção recolhida «De onde vêm os teus dias?», atalho de navegação, lista por data com fontes (horas/turnos/plano), contagens de úteis até hoje/futuros e fins de semana ignorados, explicação da fórmula e atualização manual. Os dias lançados manualmente sem data são descontados no saldo, mas não apresentados como datas inventadas. O planeamento não recebe este painel. `VacationYearRecords` passa a fornecer proveniência e as mesmas datas ao planeador anual; não foi alterada `calculateVacationBalance`, a meta pessoal de 28 dias nem o cofre. Especificação e testes em `docs/VACATION-EVIDENCE.md`.

## Precisão e limites

A meta pessoal anual de 28 dias é configurável e **não equivale automaticamente ao direito contratual**. A acumulação intramensal usa fração local do mês, atualiza por minuto enquanto ativa e em foco/visibilidade; iOS pode suspender JavaScript em segundo plano. Férias registadas são deduplicadas e contam seg.–sex. por defeito. Entre 24/08 e 06/09/2026 há 14 dias civis, dez úteis e quatro de fim de semana ignorados, sob a regra padrão. Feriados, descanso alternativo, contrato/CCT, escala e aprovação devem ser confirmados, nunca inferidos.

## Problemas e riscos abertos

- Vista inativa está escondida por CSS mas continua montada em React, incluindo cálculos ocultos; futura extração partilhada requer testes.
- `VacationBalancePage` mantém a recolha própria do ano corrente; a auditoria e o planeador anual usam `VacationYearRecords`. Confirmar consistência com dados reais e só depois unificar os consumidores com regressões.
- Indisponibilidade temporária de uma fonte cifrada pode gerar lista parcial, sem criar dados fictícios; painel permite atualizar manualmente.
- Teste físico ainda pendente: iPhone, Android, tablet/desktop, zoom/texto ampliado, teclado/VoiceOver/TalkBack, mudança de ano, retorno após suspensão e sincronização.

## Próximo passo

Concluir CI e publicação do PR #218 e confirmar no iPhone o salto sem 404 e o fallback de URL inválido. Depois corrigir o skip link global da mesma categoria. Validar as datas exibidas e a coincidência entre painel de origens e saldo em dados concretos, incluindo dias manuais, fins de semana e retorno após sincronização. Reconciliar depois a recolha anual comum sem alterar valores existentes. O histórico integral anterior mantém-se em `docs/history/PROJECT_STATE-pre-217.md` e nos restantes ficheiros de `docs/history/`. Não introduzir marcação automática ou direito de 28 dias presumido.
