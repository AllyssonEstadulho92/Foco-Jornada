# TODO

Atualizado em: 2026-09-07

## P0 — Sincronização móvel e computador

- [x] Confirmar que o desalinhamento resultava de cofres locais independentes por dispositivo.
- [x] Definir Cloudflare Workers como backend de sincronização, mantendo GitHub Pages como frontend oficial.
- [x] Versionar `wrangler.toml` e Worker com Durable Object por perfil.
- [x] Manter o payload remoto cifrado; não enviar PIN, palavra-passe, código de recuperação ou `dataKey` original.
- [x] Derivar token de sincronização com contexto próprio e guardar apenas hash no backend.
- [x] Separar revisão remota da revisão local do cofre.
- [x] Implementar fingerprint da última base sincronizada e deteção de conflito bilateral.
- [x] Interromper sincronização sem sobrescrita quando local e remoto divergem em simultâneo.
- [x] Validar a estrutura e autenticação criptográfica do cofre remoto antes de o aceitar.
- [x] Reabrir o runtime após receber uma cópia remota para refletir os dados na interface.
- [x] Disparar sincronização após gravações locais, regresso ao primeiro plano, recuperação de rede e por intervalo.
- [x] Integrar PR #191 em `main`.
- [x] Confirmar **Workers Builds: foco-jornada** com sucesso no branch de produção.
- [x] Confirmar publicação GitHub Pages após a integração.
- [x] Criar fallback de configuração do endpoint no próprio perfil para não depender exclusivamente de `VITE_SYNC_API_URL`.
- [x] Validar endpoint runtime como HTTPS `workers.dev`, sem credenciais/query/hash.
- [x] Validar `/health` e a identidade `foco-jornada-sync` antes de guardar/ativar a ligação.
- [x] Fazer o endpoint acompanhar a cópia segura do perfil para o segundo dispositivo.
- [x] Confirmar quality gates do PR #192.
- [x] Integrar PR #192 em `main`.
- [x] Confirmar Workers Builds e publicação GitHub Pages após PR #192.
- [ ] Introduzir uma vez o endpoint `workers.dev` real do Worker no dispositivo de referência, caso `VITE_SYNC_API_URL` continue vazio.
- [ ] Emparelhar o segundo dispositivo através de cópia segura do perfil de referência.
- [ ] Validar móvel → computador e computador → móvel com dados reais.
- [ ] Validar funcionamento offline seguido de sincronização após recuperar ligação.
- [ ] Validar conflito simultâneo sem perda de nenhuma cópia.

## P0 — Correção de turnos noturnos

- [x] Reproduzir logicamente o erro de entrada antecipada num turno **22:00–06:00**.
- [x] Corrigir a normalização temporal para não deslocar **21:00** para o dia seguinte.
- [x] Preservar a associação de horas após a meia-noite, como **02:00** e **07:00**, à manhã seguinte.
- [x] Criar teste de regressão para entrada **21:00** num turno planeado **22:00–06:00**.
- [x] Criar teste de regressão para saída **07:00** num turno planeado **22:00–06:00**.
- [x] Confirmar workflow **Qualidade**: auditoria, typecheck, lint, testes, build e smoke test.
- [x] Rever o diff final e integrar em `main` através do PR #189.
- [x] Confirmar workflow **Qualidade** de `main` após integração.
- [x] Confirmar publicação oficial em GitHub Pages após integração.
- [ ] Validar manualmente um registo real de turno noturno com entrada antecipada.
- [ ] Validar manualmente um registo real de turno noturno com saída tardia.

## P1 — Validação de interface em dispositivo real

- [ ] Testar o deslize de medicação num iPhone real, incluindo scroll vertical da página.
- [ ] Confirmar que um horário eliminado desaparece imediatamente sem apresentar **Termina hoje**.
- [ ] Confirmar o seletor **Resumo / Detalhes técnicos** e a paginação do histórico em ecrã pequeno.
- [ ] Testar em Android/Chrome e tablet.
- [ ] Verificar VoiceOver/TalkBack e navegação por teclado através do menu `···`.
- [ ] Confirmar contraste no modo claro/escuro e em `forced-colors`.

## P2 — Melhoria futura

- [ ] Criar um fluxo explícito de resolução de conflitos apenas depois de validar o comportamento conservador atual em uso real.
- [ ] Avaliar eliminação autenticada da cópia remota quando um perfil é removido localmente.
- [ ] Avaliar um indicador discreto de que a linha de medicação admite deslize sem aumentar ruído visual.
- [ ] Avaliar um filtro adicional por tipo de evento apenas se o volume de histórico funcional justificar.
- [ ] Acrescentar casos de teste noturnos adicionais se surgirem horários reais próximos do ponto médio entre o fim e o início do turno.
