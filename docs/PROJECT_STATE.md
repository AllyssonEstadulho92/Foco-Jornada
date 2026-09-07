# Estado do Projeto

Atualizado em: 2026-09-07

## Estado atual

A arquitetura de sincronização cifrada móvel ↔ computador foi integrada em `main` através do PR #191. O Cloudflare Workers Builds do branch de produção concluiu com sucesso e o frontend voltou a ser publicado em GitHub Pages.

O problema original estava confirmado na arquitetura antiga: cada dispositivo mantinha um cofre local independente e não existia uma fonte remota comum. A versão integrada acrescentou `CloudSyncManager`, revisão remota, compare-and-set, deteção conservadora de conflitos, validação criptográfica do cofre recebido e Cloudflare Worker com Durable Object por `profileId`.

## Bloqueio operacional remanescente

O Worker de produção existe, mas o endpoint `workers.dev` não ficou disponível no código nem na informação acessível através da integração GitHub. A publicação GitHub Pages continua a aceitar `VITE_SYNC_API_URL`, mas não é seguro inventar o subdomínio Cloudflare nem gravar um endereço presumido.

Para remover essa dependência da configuração de build, foi criado o PR #192 na branch `fix/runtime-sync-endpoint`.

A alteração permite:

- guardar o endpoint público do Worker dentro dos metadados `cloudSync` do `SecurityProfile`;
- usar esse valor antes do fallback `VITE_SYNC_API_URL`;
- aceitar apenas HTTPS `workers.dev` (ou localhost em desenvolvimento), rejeitando credenciais, query string e fragmentos;
- chamar `/health` e exigir `service: foco-jornada-sync` antes de guardar;
- ativar a sincronização imediatamente depois de uma ligação válida;
- limpar a base de revisão/fingerprint se o endpoint mudar, impedindo que metadados de outro servidor sejam reutilizados;
- incluir o endpoint na cópia segura do perfil, para que o segundo dispositivo receba a mesma configuração durante o primeiro emparelhamento.

## Segurança e integridade

O backend remoto continua a receber apenas o `EncryptedVaultRecord` já cifrado. PIN, palavra-passe, código de recuperação e `dataKey` não são enviados.

Uma cópia remota é validada estruturalmente e autenticada/desencriptada em memória com a chave do perfil antes de substituir o cofre local. Alterações simultâneas dos dois lados continuam a gerar conflito sem política de “última escrita vence”.

O endpoint Cloudflare é configuração pública, não segredo. Mesmo assim, a aplicação valida esquema, hostname e identidade do serviço antes de o guardar.

## Primeiro emparelhamento

Móvel e computador precisam de representar o mesmo perfil criptográfico. O dispositivo de referência configura/valida o Worker e cria uma cópia segura. O segundo dispositivo importa essa cópia; assim recebe `profileId`, material de chave protegido, metadados de sincronização e endpoint, sem enviar a chave de dados ao servidor.

Dois perfis criados separadamente continuam a não ser fundidos automaticamente, para evitar perda de dados.

## Estado anterior preservado

A correção de turnos noturnos do PR #189 continua em `main`. A área de medicação mantém deslize, ações **Definir** e **Eliminar**, tombstone lógico e histórico funcional/técnico. O modo local-first continua funcional mesmo se o serviço remoto estiver indisponível.

## Validação concluída

Para o PR #191 e a integração em `main`:

- auditoria de dependências: aprovada;
- TypeScript/typecheck: aprovado;
- lint: aprovado;
- testes automatizados: aprovados;
- build do frontend: aprovado;
- `wrangler deploy --dry-run`: aprovado;
- smoke test de browser: aprovado;
- Workers Builds de produção: aprovado;
- GitHub Pages: publicado com sucesso.

A validação do PR #192 ainda está em curso.

## Última alteração

Foi removida a dependência exclusiva da variável de build para localizar o Worker. A aplicação passa a poder validar e guardar o endpoint público diretamente no perfil e a transportá-lo na cópia segura para o segundo dispositivo.

## Próximo passo

1. concluir os quality gates do PR #192;
2. integrar e publicar a nova interface em GitHub Pages;
3. introduzir uma vez o endpoint real `workers.dev` do Worker no dispositivo de referência, caso `VITE_SYNC_API_URL` continue ausente;
4. exportar/importar a cópia segura no segundo dispositivo;
5. validar móvel → computador, computador → móvel, reconexão offline e conflito controlado em dispositivos reais.
