# Estado do Projeto

Atualizado em: 2026-09-07

## Estado atual

A sincronização cifrada móvel ↔ computador está integrada em `main` e publicada. O PR #191 introduziu o backend Cloudflare Workers/Durable Objects e o PR #192 permitiu configurar/validar o endpoint `workers.dev` diretamente no perfil.

Durante a validação em dispositivo real foi confirmado um segundo problema de bootstrap: num navegador novo, o Foco Jornada não encontra nenhum `SecurityProfile` local e apresenta **Criar acesso**, mesmo quando o utilizador já tem PIN/palavra-passe e todos os dados noutro navegador/telemóvel.

Isto não é perda do cofre remoto. O perfil de segurança que contém `profileId`, KDF, chave de dados embrulhada e metadados de sincronização é guardado no IndexedDB de cada navegador. Sem esse perfil, um navegador vazio não consegue derivar a `dataKey`, autenticar-se perante o Worker nem desencriptar o cofre remoto.

## Correção em validação — PR #193

O PR #193 (`fix/browser-profile-pairing`) adiciona associação segura entre navegadores sem recriar PIN/palavra-passe.

Novo fluxo:

1. o navegador/dispositivo já autorizado tem de possuir sincronização remota ativa e pelo menos uma revisão remota confirmada;
2. em **Privacidade e acesso → Sincronização móvel ↔ computador**, o utilizador escolhe **Associar outro navegador**;
3. o cliente cria um segredo aleatório de 256 bits e uma ligação temporária válida por 10 minutos;
4. desse segredo são derivados, com contextos separados, uma chave AES de associação e um token HTTP;
5. apenas o `SecurityProfile` necessário ao bootstrap é cifrado e enviado temporariamente ao Worker; o segredo raiz e a chave AES de associação não são enviados;
6. o novo navegador abre a ligação, recebe/desencripta o perfil, guarda-o localmente e pede o **mesmo PIN/palavra-passe já existente**;
7. depois do desbloqueio, o fluxo normal `CloudSyncManager` descarrega e valida o cofre remoto cifrado antes de abrir os dados;
8. o payload temporário é eliminado após redenção e também possui expiração por alarme do Durable Object.

A importação de cópia segura continua disponível como fallback.

## Alteração de UX

Um navegador sem perfis deixa de entrar diretamente em **Criar acesso**. O ecrã inicial passa a privilegiar **Já tens acesso noutro dispositivo?**, com:

- associação pela ligação temporária;
- importação de cópia segura;
- criação de novo perfil apenas como opção explícita para quem realmente começa do zero.

Isto reduz a criação acidental de perfis independentes e elimina o loop de recriar credenciais ao mudar de browser.

## Segurança e integridade

O backend remoto do cofre continua a receber apenas o `EncryptedVaultRecord` já cifrado. PIN, palavra-passe, código de recuperação e `dataKey` não são enviados.

Na associação de browser:

- o segredo raiz permanece no fragmento `#pair=...` da ligação e não faz parte do pedido HTTP normal da página;
- autenticação do canal e cifragem do perfil usam material derivado com contextos distintos;
- o Worker guarda apenas ciphertext, hash do token e validade temporária;
- a ligação expira em 10 minutos e deve ser tratada como segredo temporário;
- o novo navegador só obtém os dados após introduzir a credencial já existente e autenticar/desencriptar o cofre remoto;
- perfis independentes continuam a não ser fundidos automaticamente.

## Estado anterior preservado

A correção de turnos noturnos do PR #189 continua em `main`. A área de medicação mantém deslize, ações **Definir** e **Eliminar**, tombstone lógico e histórico funcional/técnico. O modo local-first continua funcional se o serviço remoto estiver indisponível.

## Validação

PR #191 e PR #192 permanecem aprovados e publicados.

PR #193:

- TypeScript/typecheck: aprovado na primeira execução;
- lint: primeira execução falhou apenas por duas constantes não utilizadas no Worker; corrigido no commit seguinte;
- nova execução dos quality gates: em curso;
- Workers Builds do PR: em curso;
- validação física móvel → browser novo: pendente após integração/publicação.

## Última alteração

Foi implementado o bootstrap seguro de um navegador novo por ligação temporária, evitando que a ausência de IndexedDB local seja interpretada como necessidade de criar outro PIN/perfil.

## Próximo passo

1. concluir quality gates e Workers Builds do PR #193;
2. integrar PR #193 em `main` e confirmar GitHub Pages/Worker em produção;
3. no telemóvel com os dados, criar **Associar outro navegador**;
4. abrir a ligação temporária no computador;
5. introduzir o mesmo PIN/palavra-passe;
6. confirmar que o cofre remoto é recebido e que os dados aparecem no computador;
7. validar depois alterações computador → móvel, móvel → computador, offline/reconexão e conflito controlado.
