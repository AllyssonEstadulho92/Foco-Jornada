# Estado do Projeto

Atualizado em: 2026-09-17. PR #218 integrado e publicado; teste físico do atalho corrigido ainda pendente.

## Última alteração — PR #218

**Facto:** captura real no iPhone apresenta «Unexpected Application Error! / 404 Not Found» após o atalho «Ver de onde vêm os dias registados». **Causa confirmada no código:** `VacationWorkspacePage` usava `href="#vacation-evidence-title"` numa aplicação com `createHashRouter`; o fragmento substituía `#/ferias` por uma rota inexistente. Não é uma falha demonstrada do saldo ou dos registos.

**Correção integrada e publicada:** PR #218, merge `89564f3ebbfe5d54e5d09dcf28db9e574b35cc50`: botão de salto com scroll/foco programático sem alterar a rota; título de destino focável; CSS mantém aspeto; fallback `*` em PT-PT para endereço inválido com links de recuperação. Testes jsdom do hash e foco, além de teste estrutural do fallback. Qualidade #1201 (head final) e #1202 (`main`) passaram auditoria, TypeScript, lint, Vitest, build, Worker dry-run e smoke Chromium. Publicar Foco & Jornada #257 e GitHub Pages #848 concluídos com sucesso, build `42397a6c97d60044f5dbc1cf90723ee799b1d0ac`. Ver `docs/HASH-ROUTER-NAVIGATION.md`.

**Risco residual:** `AppShell` tem outro `href="#main-content"` incompatível com o Router quando utilizado. A correção desse skip link está no TODO, não foi incluída no PR #218. A confirmação visual e funcional no iPhone real do novo atalho ainda está pendente. Os cálculos, dados, permissões, cofre, sync e API não foram modificados.

## Estado atual

**Foco Jornada**: uma PWA React 19/TypeScript responsiva (iPhone, Android, tablet e computador), frontend GitHub Pages, IndexedDB/Dexie e cofre AES-GCM, sincronização opcional cifrada por Cloudflare Worker/Durable Object. As mesmas regras de domínio e o mesmo perfil aplicam-se a todos os tamanhos de ecrã; a replicação não é instantânea garantida.

Em `main` estão integrados os trabalhos anteriores de jornada, autenticação/sync e férias #203–#218. `#/ferias` mostra evolução mensal, saldo, indicadores e detalhe opcional de proveniência dos dias; `#/ferias/planeamento` concentra sugestões, calendário e simulação. O planeamento a dois permite julho do ano seguinte, exclui novembro e dezembro como restrição indicada pelo utilizador sujeita a confirmação anual e **não** valida a disponibilidade da parceira ou a aprovação da ILUNION. PR #214 (resumo local vivo), #215 (planeamento a dois em dois anos) e #216 (confirmações por cenário) integrados; PR #216 merge `faa8c064c13246654152c5eb66e7e7be65bdeaee`, Publicar #255 e Pages #840 concluídos com sucesso.

## Entrega anterior — PR #217

**Estado: integrado e publicado; erro do atalho corrigido no PR #218.** PR #217 `feat/vacation-saldo-traceability`, merge `61816f7ec3f1c43043d57b094f834bb116d19a27`, Qualidade #1192 (implementação) e #1193 (head final) com sucesso (auditoria, TypeScript, lint, Vitest, build, Worker dry-run, smoke Chromium). Publicar Foco & Jornada #256 e GitHub Pages #842 terminaram com sucesso; build `322b8b37f745e17233360af07e473f50e9fc79d5`. A confirmação de uma execução de Qualidade especificamente em `main` não foi obtida nessa verificação; o head final e a publicação passaram os respetivos gates.

Na vista geral, foi acrescentada uma secção recolhida «De onde vêm os teus dias?», atalho de navegação, lista por data com fontes (horas/turnos/plano), contagens de úteis até hoje/futuros e fins de semana ignorados, explicação da fórmula e atualização manual. Os dias lançados manualmente sem data são descontados no saldo, mas não apresentados como datas inventadas. O planeamento não recebe este painel. `VacationYearRecords` fornece proveniência e as mesmas datas ao planeador anual; não foi alterada `calculateVacationBalance`, a meta pessoal de 28 dias nem o cofre. Especificação e testes em `docs/VACATION-EVIDENCE.md`.

## Precisão e limites

A meta pessoal anual de 28 dias é configurável e **não equivale automaticamente ao direito contratual**. A acumulação intramensal usa fração local do mês, atualiza por minuto enquanto ativa e em foco/visibilidade; iOS pode suspender JavaScript em segundo plano. Férias registadas são deduplicadas e contam seg.–sex. por defeito. Entre 24/08 e 06/09/2026 há 14 dias civis, dez úteis e quatro de fim de semana ignorados, sob a regra padrão. Feriados, descanso alternativo, contrato/CCT, escala e aprovação devem ser confirmados, nunca inferidos.

## Problemas e riscos abertos

- O skip link global `AppShell` usa ancora hash simples; corrigir e testar com teclado no Router.
- Vista inativa está escondida por CSS mas continua montada em React, incluindo cálculos ocultos; futura extração partilhada requer testes.
- `VacationBalancePage` mantém a recolha própria do ano corrente; a auditoria e o planeador anual usam `VacationYearRecords`. Confirmar consistência com dados reais e só depois unificar os consumidores com regressões.
- Indisponibilidade temporária de uma fonte cifrada pode gerar lista parcial, sem criar dados fictícios; painel permite atualizar manualmente.
- Teste físico ainda pendente: iPhone, Android, tablet/desktop, zoom/texto ampliado, teclado/VoiceOver/TalkBack, mudança de ano, retorno após suspensão e sincronização.

## Próximo passo

Abrir a versão publicada em `#/ferias` no iPhone e confirmar o salto sem 404, expansão da lista e recuperação de URL inválido; atualizar/reabrir a PWA se conservar um bundle anterior. Depois corrigir o skip link global e comparar dados concretos com o saldo. O histórico integral anterior mantém-se em `docs/history/PROJECT_STATE-pre-217.md` e nos restantes ficheiros de `docs/history/`. Não introduzir marcação automática ou direito de 28 dias presumido.
