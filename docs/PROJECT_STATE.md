# Estado do Projeto

Atualizado em: 2026-09-07

## Estado atual

A implementação técnica da sincronização cifrada entre móvel e computador está concluída na branch `feat/cloudflare-sync` e aberta no PR #191, mantendo GitHub Pages como frontend oficial.

O problema confirmado era arquitetural: cada dispositivo mantinha o seu próprio cofre local e não existia uma fonte remota comum. A aplicação já possuía um `EncryptedVaultRecord` cifrado com AES-GCM, revisão local e cópias seguras, mas não existia protocolo de sincronização entre instalações.

A solução versionada acrescenta:

- `CloudSyncManager` no cliente, sem acesso ao snapshot desencriptado para transporte;
- token de sincronização derivado da `dataKey`, sem enviar a chave AES original;
- fingerprint SHA-256 do cofre cifrado para detetar alterações locais;
- revisão remota independente e compare-and-set;
- bloqueio de conflitos quando os dois dispositivos alteram a mesma base de forma independente;
- validação estrutural da resposta remota e autenticação/desencriptação do snapshot antes de substituir qualquer cofre local;
- sincronização no desbloqueio, após gravações locais, ao regressar ao primeiro plano, ao recuperar ligação e periodicamente;
- controlo de ativação em **Privacidade e acesso**;
- Cloudflare Worker com Durable Object por `profileId`;
- `wrangler.toml` versionado;
- variável `VITE_SYNC_API_URL` integrada no build GitHub Pages;
- CSP limitada a ligações `https://*.workers.dev` além da própria origem.

## Segurança e integridade

O backend remoto recebe apenas o `EncryptedVaultRecord` já cifrado. Não recebe PIN, palavra-passe, código de recuperação nem o conteúdo pessoal em texto simples.

O Worker guarda:

- ciphertext e IV do cofre;
- revisão remota;
- timestamp técnico;
- hash do token de sincronização.

A revisão local do cofre não é reutilizada como revisão remota. O cliente guarda a última revisão remota e a impressão digital da última base sincronizada. Se existirem alterações independentes dos dois lados, nenhuma cópia é escolhida automaticamente.

Uma cópia remota recebida não é gravada diretamente sobre o dispositivo: primeiro é validada, autenticada e desencriptada em memória com a chave do perfil, e o snapshot tem de apresentar a estrutura suportada. Só depois pode substituir o registo cifrado local.

Falhas de rede ou do serviço remoto não anulam gravações locais. O funcionamento local-first permanece disponível.

## Primeiro emparelhamento entre dispositivos

A sincronização só pode alinhar automaticamente dispositivos que representem o mesmo perfil criptográfico. Para o primeiro emparelhamento, a cópia segura existente deve ser exportada no dispositivo que será a referência e importada no segundo dispositivo. Isto preserva o mesmo `profileId` e a mesma chave de dados protegida.

Não existe fusão automática entre dois perfis independentes já criados, porque escolher uma das bases sem confirmação poderia destruir dados.

## Estado anterior preservado

A correção de turnos noturnos continua integrada em `main` desde o PR #189. A área **Medicamentos > Tomas programadas** mantém deslize, ações **Definir** e **Eliminar**, tombstone lógico e histórico funcional/técnico.

## Validação concluída — PR #191

O workflow GitHub **Qualidade** terminou com sucesso no commit `0ebafd13f3783f4eb08aae994d8a6987685c8250`:

- instalação de dependências: aprovada;
- auditoria de dependências: aprovada;
- TypeScript/typecheck: aprovado;
- lint: aprovado;
- testes automatizados: aprovados;
- build: aprovado;
- smoke test de arranque no browser: aprovado;
- artefacto de build: gerado com sucesso.

## Bloqueio operacional — Cloudflare Workers

O check externo **Workers Builds: foco-jornada** continua a falhar. No commit validado pelo GitHub, o build Cloudflare `21d899d0-3e66-4e45-9a42-3c0efef5127b` terminou com falha.

O GitHub expõe o identificador e o link para o build, mas não contém o erro detalhado dos logs privados do Cloudflare. Por isso não é possível confirmar a causa apenas a partir do repositório. A configuração versionada (`wrangler.toml`, entry point e nome `foco-jornada`) está presente, mas ainda é necessário verificar no Cloudflare **Settings > Builds** o root directory, build/deploy commands, token de build e o erro concreto do log.

Enquanto este check externo estiver vermelho e não existir um endpoint Worker publicado, a sincronização não deve ser considerada ativa em produção. O modo local continua operacional e não depende deste serviço.

## Validação física ainda pendente

- obter o URL real do Worker depois de uma publicação Cloudflare bem-sucedida;
- configurar a variável GitHub `VITE_SYNC_API_URL` com esse endpoint;
- emparelhar um segundo dispositivo por cópia segura;
- testar móvel → computador e computador → móvel;
- testar funcionamento offline seguido de recuperação de rede;
- testar conflito simultâneo sem perda de nenhuma cópia;
- confirmar pelo menos um turno noturno real com entrada antes da hora planeada;
- confirmar pelo menos um turno noturno real com saída depois da hora planeada;
- testar o deslize de medicação em iPhone/iPad e Android.

## Última alteração

Validação completa do código da sincronização no GitHub, reforço da validação do cofre remoto antes de qualquer substituição local e registo explícito de que o único bloqueio atual é o build externo Cloudflare, cuja causa detalhada está fora dos logs disponibilizados pelo GitHub.

## Próximo passo

1. abrir o build Cloudflare `21d899d0-3e66-4e45-9a42-3c0efef5127b` e identificar a primeira mensagem de erro;
2. corrigir, conforme o log, a configuração do Workers Builds ou o código versionado;
3. repetir o check até o Worker publicar com sucesso;
4. configurar `VITE_SYNC_API_URL` no GitHub com o endpoint publicado;
5. validar o fluxo completo em dois dispositivos reais;
6. integrar o PR #191 em `main` apenas depois destes bloqueios operacionais estarem resolvidos.
