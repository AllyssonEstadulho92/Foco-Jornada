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
- [x] Integrar PR #191 em `main` e publicar backend/frontend.
- [x] Criar fallback de configuração do endpoint no próprio perfil.
- [x] Validar endpoint runtime como HTTPS `workers.dev`, sem credenciais/query/hash.
- [x] Validar `/health` e a identidade `foco-jornada-sync` antes de guardar/ativar a ligação.
- [x] Integrar PR #192 em `main` e confirmar Workers Builds/GitHub Pages.
- [x] Confirmar em dispositivo real que um browser novo não conhece o `SecurityProfile` de outro browser.
- [x] Alterar browser vazio para **Já tens acesso noutro dispositivo?**.
- [x] Implementar ligação temporária de associação com segredo raiz de 256 bits.
- [x] Separar criptograficamente material de autenticação e cifragem da associação.
- [x] Enviar ao Worker apenas `SecurityProfile` cifrado, sem duplicar o cofre operacional.
- [x] Adicionar `PUT/GET/DELETE /v1/pair/:pairingId` sem nova classe Durable Object.
- [x] Aplicar expiração de 10 minutos e eliminação por redenção/alarme.
- [x] Importar perfil associado sem criar novo PIN/palavra-passe nem novo `profileId`.
- [x] Intercetar `#pair=...` antes do runtime, inclusive quando o browser já possui outro perfil local criado por engano.
- [x] Manter importação de cópia segura como fallback.
- [x] Adicionar testes de validação das ligações de associação.
- [x] Confirmar quality gates finais do PR #193.
- [x] Confirmar Workers Builds do PR #193.
- [x] Integrar PR #193 em `main`.
- [x] Confirmar Workers Builds de produção após PR #193.
- [x] Confirmar publicação GitHub Pages após PR #193.
- [x] Confirmar workflow **Qualidade** de produção após PR #193.
- [ ] No telemóvel com os dados, confirmar uma revisão remota concluída/estado sincronizado.
- [ ] Criar **Associar outro navegador** no telemóvel e abrir a ligação no computador.
- [ ] Confirmar que o computador pede o mesmo PIN/palavra-passe em vez de criar outro acesso.
- [ ] Confirmar que os dados aparecem no computador após desbloqueio e `pull` remoto.
- [ ] Validar móvel → computador e computador → móvel com dados reais.
- [ ] Validar funcionamento offline seguido de sincronização após recuperar ligação.
- [ ] Validar conflito simultâneo sem perda de nenhuma cópia.

## P0 — Correção de turnos noturnos

- [x] Reproduzir logicamente o erro de entrada antecipada num turno **22:00–06:00**.
- [x] Corrigir a normalização temporal para não deslocar **21:00** para o dia seguinte.
- [x] Preservar a associação de horas após a meia-noite, como **02:00** e **07:00**, à manhã seguinte.
- [x] Criar testes de regressão para entrada antecipada e saída tardia em **22:00–06:00**.
- [x] Confirmar workflow **Qualidade**, integração e publicação.
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
- [ ] Avaliar revogação/listagem de browsers associados apenas se surgir necessidade operacional; a associação temporária atual não cria sessão remota persistente separada.
- [ ] Avaliar proteção adicional contra abuso de armazenamento do endpoint público (rate limiting/Turnstile ou autenticação de criação) caso o serviço deixe de ser estritamente pessoal.
- [ ] Avaliar um indicador discreto de que a linha de medicação admite deslize sem aumentar ruído visual.
- [ ] Avaliar um filtro adicional por tipo de evento apenas se o volume de histórico funcional justificar.
