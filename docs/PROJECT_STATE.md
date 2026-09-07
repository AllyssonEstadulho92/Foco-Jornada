# Estado do Projeto

Atualizado em: 2026-09-07

## Estado atual

A implementação técnica da sincronização cifrada entre móvel e computador está concluída na branch `feat/cloudflare-sync` e aberta no PR #191, mantendo GitHub Pages como frontend oficial.

O problema confirmado era arquitetural: cada dispositivo mantinha o seu próprio cofre local e não existia uma fonte remota comum. A aplicação já possuía um `EncryptedVaultRecord` cifrado com AES-GCM, revisão local e cópias seguras, mas não existia protocolo de sincronização entre instalações.

A solução versionada acrescenta:

- `CloudSyncManager` no cliente, sem acesso do backend ao snapshot desencriptado;
- token de sincronização derivado da `dataKey`, sem enviar a chave AES original;
- fingerprint SHA-256 do cofre cifrado para detetar alterações locais;
- revisão remota independente e compare-and-set;
- bloqueio de conflitos quando os dois dispositivos alteram a mesma base de forma independente;
- validação estrutural e criptográfica antes de aceitar uma cópia remota;
- sincronização no desbloqueio, após gravações locais, ao regressar ao primeiro plano, ao recuperar ligação e periodicamente;
- reabertura controlada do runtime quando é recebida uma cópia remota, para que a interface passe a usar o cofre recebido;
- controlo de ativação em **Privacidade e acesso**;
- Cloudflare Worker com Durable Object por `profileId`;
- `wrangler.toml` versionado;
- variável `VITE_SYNC_API_URL` integrada no build GitHub Pages;
- CSP limitada a ligações `https://*.workers.dev` além da própria origem.

## Segurança e integridade

O backend remoto recebe apenas o `EncryptedVaultRecord` já cifrado. Não recebe PIN, palavra-passe, código de recuperação nem o conteúdo pessoal em texto simples.

O Worker guarda ciphertext/IV, revisão remota, timestamp técnico e hash do token de sincronização. A revisão local do cofre não é reutilizada como revisão remota. Se existirem alterações independentes dos dois lados, nenhuma cópia é escolhida automaticamente.

Uma cópia remota recebida é autenticada e desencriptada em memória com a chave do perfil antes de substituir o registo cifrado local. Falhas de rede ou do serviço remoto não anulam gravações locais; o funcionamento local-first permanece disponível.

## Primeiro emparelhamento entre dispositivos

A sincronização só alinha automaticamente dispositivos que representem o mesmo perfil criptográfico. Para o primeiro emparelhamento, a cópia segura existente deve ser exportada no dispositivo de referência e importada no segundo dispositivo. Isto preserva o mesmo `profileId` e a mesma chave de dados protegida.

Não existe fusão automática entre dois perfis independentes já criados, porque escolher uma das bases sem confirmação poderia destruir dados.

## Validação concluída — PR #191

O workflow GitHub **Qualidade** mais recente terminou com sucesso e passou a incluir também a validação específica do Worker:

- instalação de dependências: aprovada;
- auditoria de dependências: aprovada;
- TypeScript/typecheck: aprovado;
- lint: aprovado;
- testes automatizados: aprovados;
- build do frontend: aprovado;
- `wrangler deploy --dry-run` (`npm run worker:check`): aprovado;
- smoke test de arranque no browser: aprovado;
- artefacto de build: gerado com sucesso.

## Cloudflare Workers — bootstrap de produção

O check externo **Workers Builds: foco-jornada** continua vermelho nas branches não produtivas. A causa agora está tecnicamente delimitada: o PR introduz pela primeira vez a classe Durable Object `SyncVault`, o que é uma alteração ao ciclo de vida de Durable Objects.

O Workers Builds usa por omissão `wrangler versions upload` para branches não produtivas. Esse comando não aplica alterações de ciclo de vida de Durable Objects. A criação inicial da classe deve ser feita no branch de produção com `wrangler deploy`.

A configuração e o bundle foram validados por `wrangler deploy --dry-run`. Assim, a falha de preview não demonstra um erro de TypeScript, bundle ou configuração sintática; o próximo teste válido é a publicação de produção após integração em `main`.

## Estado anterior preservado

A correção de turnos noturnos continua integrada em `main` desde o PR #189. A área **Medicamentos > Tomas programadas** mantém deslize, ações **Definir** e **Eliminar**, tombstone lógico e histórico funcional/técnico.

## Validação física ainda pendente

Depois da publicação de produção do Worker falta confirmar:

- endpoint `workers.dev` real;
- ligação do frontend a esse endpoint;
- primeiro emparelhamento por cópia segura num segundo dispositivo;
- móvel → computador e computador → móvel com dados reais;
- offline seguido de recuperação de rede;
- conflito simultâneo sem perda de nenhuma cópia;
- validações físicas já pendentes de turnos noturnos e medicação.

## Última alteração

A pipeline de qualidade passou a validar também o Worker Cloudflare com Wrangler. O PR #191 está tecnicamente validado para o bootstrap de produção; a falha Cloudflare no PR foi classificada como limitação do mecanismo de preview para a primeira alteração de ciclo de vida de Durable Objects.

## Próximo passo

1. integrar o PR #191 em `main`;
2. confirmar a publicação de produção do Worker com `wrangler deploy` e a criação de `SyncVault`;
3. obter o endpoint `workers.dev` publicado e ligar o frontend a esse endpoint;
4. confirmar publicação GitHub Pages;
5. emparelhar e validar dois dispositivos reais antes de considerar a sincronização operacionalmente concluída.
