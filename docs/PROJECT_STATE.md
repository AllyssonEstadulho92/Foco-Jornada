# Estado do Projeto

Atualizado em: 2026-09-07

## Estado atual

A sincronização cifrada móvel ↔ computador está integrada em `main` e publicada. O PR #191 introduziu o backend Cloudflare Workers/Durable Objects e o PR #192 removeu a dependência exclusiva de `VITE_SYNC_API_URL`, permitindo configurar e validar o endpoint `workers.dev` diretamente no perfil.

O problema original estava confirmado na arquitetura antiga: cada dispositivo mantinha um cofre local independente e não existia uma fonte remota comum. A arquitetura atual acrescenta `CloudSyncManager`, revisão remota, compare-and-set, deteção conservadora de conflitos, validação criptográfica do cofre recebido e Cloudflare Worker com Durable Object por `profileId`.

## Configuração operacional

O Worker de produção está publicado e os checks Cloudflare concluíram com sucesso. O subdomínio `workers.dev` real não é exposto pelos dados acessíveis através da integração GitHub; por segurança, a aplicação não inventa nem presume esse endereço.

A interface **Privacidade e acesso** permite agora introduzir o endpoint público uma única vez no dispositivo de referência. A aplicação:

- aceita apenas HTTPS `workers.dev` (ou localhost em desenvolvimento);
- rejeita credenciais, query string e fragmentos;
- chama `/health` e exige `service: foco-jornada-sync` antes de guardar;
- ativa a sincronização após uma validação positiva;
- limpa revisão/fingerprint remotas se o endpoint mudar;
- guarda o endpoint em `SecurityProfile.cloudSync.endpoint`;
- transporta essa configuração na cópia segura para o segundo dispositivo.

`VITE_SYNC_API_URL` continua suportado como configuração automática de build.

## Segurança e integridade

O backend remoto recebe apenas o `EncryptedVaultRecord` já cifrado. PIN, palavra-passe, código de recuperação e `dataKey` não são enviados.

Uma cópia remota é validada estruturalmente e autenticada/desencriptada em memória com a chave do perfil antes de substituir o cofre local. Alterações simultâneas dos dois lados continuam a gerar conflito sem política de “última escrita vence”.

O endpoint Cloudflare é configuração pública, não segredo, mas a sua identidade é validada antes de persistir.

## Primeiro emparelhamento

Móvel e computador precisam de representar o mesmo perfil criptográfico. O dispositivo de referência configura/valida o Worker e cria uma cópia segura. O segundo dispositivo importa essa cópia; assim recebe `profileId`, material de chave protegido, cofre, metadados de sincronização e endpoint, sem enviar a chave de dados ao servidor.

Dois perfis criados separadamente não são fundidos automaticamente.

## Estado anterior preservado

A correção de turnos noturnos do PR #189 continua em `main`. A área de medicação mantém deslize, ações **Definir** e **Eliminar**, tombstone lógico e histórico funcional/técnico. O modo local-first continua funcional se o serviço remoto estiver indisponível.

## Validação concluída

PR #191 e PR #192:

- auditoria de dependências: aprovada;
- TypeScript/typecheck: aprovado;
- lint: aprovado;
- testes automatizados: aprovados;
- build do frontend: aprovado;
- `wrangler deploy --dry-run`: aprovado;
- smoke test de browser: aprovado;
- Workers Builds/Cloudflare: aprovado;
- integração em `main`: concluída;
- GitHub Pages: publicado com sucesso.

## Validação física ainda pendente

Não é possível confirmar a sincronização real entre os dispositivos do utilizador sem acesso a esses dispositivos e ao endpoint exato da conta Cloudflare. Falta:

1. copiar o endpoint real `workers.dev` do Worker `foco-jornada` e validá-lo na aplicação;
2. exportar a cópia segura do dispositivo de referência e importá-la no segundo dispositivo;
3. validar uma alteração móvel → computador;
4. validar uma alteração computador → móvel;
5. validar offline/reconexão e um conflito controlado.

## Última alteração

PR #192 integrado e publicado: o frontend consegue configurar o endpoint Cloudflare em runtime, validá-lo antes de ativar a sincronização e levá-lo na cópia segura para o segundo dispositivo.

## Próximo passo

Executar o primeiro emparelhamento real em dois dispositivos e confirmar o critério de aceitação: uma alteração confirmada num dispositivo aparece no outro sem reintrodução manual, sem duplicação e sem perda de dados.
