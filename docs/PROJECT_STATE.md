# Estado do Projeto

Atualizado em: 2026-09-07

## Estado atual

Está em implementação, na branch `feat/cloudflare-sync`, a sincronização cifrada entre móvel e computador através de Cloudflare Workers, mantendo GitHub Pages como frontend oficial.

O problema confirmado era arquitetural: cada dispositivo mantinha o seu próprio cofre local e não existia uma fonte remota comum. A aplicação já possuía um `EncryptedVaultRecord` cifrado com AES-GCM, revisão local e cópias seguras, mas não existia protocolo de sincronização entre instalações.

A solução agora versionada acrescenta:

- `CloudSyncManager` no cliente, sem acesso ao snapshot desencriptado;
- token de sincronização derivado da `dataKey`, sem enviar a chave AES original;
- fingerprint SHA-256 do cofre cifrado para detetar alterações locais;
- revisão remota independente e compare-and-set;
- bloqueio de conflitos quando os dois dispositivos alteram a mesma base de forma independente;
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

Falhas de rede ou do serviço remoto não anulam gravações locais. O funcionamento local-first permanece disponível.

## Primeiro emparelhamento entre dispositivos

A sincronização só pode alinhar automaticamente dispositivos que representem o mesmo perfil criptográfico. Para o primeiro emparelhamento, a cópia segura existente deve ser exportada no dispositivo que será a referência e importada no segundo dispositivo. Isto preserva o mesmo `profileId` e a mesma chave de dados protegida.

Não existe fusão automática entre dois perfis independentes já criados, porque escolher uma das bases sem confirmação poderia destruir dados.

## Estado anterior preservado

A correção de turnos noturnos continua integrada em `main` desde o PR #189. A área **Medicamentos > Tomas programadas** mantém deslize, ações **Definir** e **Eliminar**, tombstone lógico e histórico funcional/técnico.

## Validação concluída anteriormente

Para o PR #189 e respetivo `main`:

- auditoria de dependências: aprovada;
- TypeScript/typecheck: aprovado;
- lint: aprovado;
- testes automatizados: aprovados;
- build: aprovado;
- smoke test de arranque no browser: aprovado;
- GitHub Pages: publicado com sucesso.

## Validação da sincronização — ainda pendente

Enquanto esta branch não passar pelos quality gates e pelo build externo, não se deve considerar a sincronização pronta para produção.

Falta confirmar:

- typecheck, lint, testes, build e smoke test da branch;
- build do Worker Cloudflare com a nova configuração versionada;
- URL real do Worker publicado;
- variável de repositório `VITE_SYNC_API_URL` apontada para esse endpoint;
- teste físico móvel → computador e computador → móvel;
- teste offline seguido de recuperação de rede;
- teste controlado de conflito simultâneo;
- primeiro emparelhamento por cópia segura num segundo dispositivo.

## Última alteração

Implementação da primeira arquitetura de sincronização cifrada entre dispositivos, com proteção contra sobrescrita concorrente e separação explícita entre GitHub Pages e backend Cloudflare.

## Próximo passo

1. executar os quality gates através de pull request;
2. corrigir qualquer erro de typecheck/lint/test/build encontrado;
3. confirmar o deploy do Worker e obter o endpoint `workers.dev`;
4. configurar `VITE_SYNC_API_URL` no GitHub;
5. validar o fluxo completo em dois dispositivos reais antes de integrar em `main`.
