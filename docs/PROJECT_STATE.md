# Estado do Projeto

Atualizado em: 2026-09-07

## Estado atual

A sincronização cifrada móvel ↔ computador está integrada e publicada. O PR #191 introduziu o backend Cloudflare Workers/Durable Objects, o PR #192 permitiu configurar o endpoint `workers.dev` diretamente no perfil e o PR #193 corrigiu o bootstrap de browsers novos sem recriar PIN/palavra-passe.

O problema confirmado era duplo:

1. cada instalação mantinha um cofre local independente antes da sincronização remota;
2. mesmo com o cofre remoto disponível, um browser novo não possuía o `SecurityProfile` local necessário para derivar a `dataKey`, autenticar-se perante o Worker e desencriptar o cofre.

O PR #193 foi integrado em `main` no commit `4e879e6d0abf578981ae09d212f25f43d17232cb`.

## Fluxo publicado — associar outro navegador

1. O dispositivo/navegador de referência tem de possuir sincronização ativa e pelo menos uma revisão remota confirmada.
2. Em **Privacidade e acesso → Sincronização móvel ↔ computador**, escolhe-se **Associar outro navegador**.
3. O cliente cria um segredo aleatório de 256 bits e uma ligação temporária válida por 10 minutos.
4. O `SecurityProfile` necessário ao bootstrap é cifrado no cliente e guardado temporariamente no Worker.
5. O novo navegador abre a ligação. A aplicação interceta `#pair=...` antes de iniciar o runtime, inclusive se esse browser já tiver criado por engano outro perfil local.
6. O perfil associado é importado/selecionado localmente.
7. O utilizador introduz o **mesmo PIN/palavra-passe já existente**.
8. Depois do desbloqueio, `CloudSyncManager` obtém, autentica e valida o cofre remoto cifrado e a aplicação abre os mesmos dados.
9. O payload de associação é eliminado depois da redenção e também expira por alarme do Durable Object.

A importação de cópia segura continua disponível como fallback.

## Segurança e integridade

- PIN, palavra-passe, código de recuperação e `dataKey` não são enviados ao Worker.
- O segredo raiz da associação permanece no fragmento da ligação e não é enviado como parte do pedido HTTP normal da página.
- Chave AES de associação e token HTTP são derivados com contextos distintos.
- O Worker guarda apenas ciphertext, hash do token e validade temporária.
- A ligação expira em 10 minutos e deve ser tratada como segredo temporário.
- O cofre operacional não é duplicado no canal de associação; continua a usar o protocolo normal de sincronização cifrada.
- Alterações concorrentes continuam a gerar conflito sem sobrescrita automática.
- Perfis independentes não são fundidos automaticamente.

## Validação concluída

PR #193 e integração em `main`:

- auditoria de dependências: aprovada;
- TypeScript/typecheck: aprovado;
- lint: aprovado;
- testes automatizados: aprovados;
- build do frontend: aprovado;
- `wrangler deploy --dry-run`: aprovado;
- smoke test de browser: aprovado;
- Workers Builds do PR: aprovado;
- PR #193 integrado em `main`;
- Workers Builds de produção: aprovado;
- GitHub Pages: publicado com sucesso;
- workflow **Qualidade** de produção: aprovado.

## Validação física ainda pendente

Não é possível confirmar a sincronização real nos dispositivos do utilizador apenas pelos testes automáticos. Falta validar em hardware/browser real:

1. no telemóvel com os dados, confirmar que a sincronização mostra uma última sincronização concluída;
2. criar **Associar outro navegador**;
3. abrir a ligação temporária no computador;
4. introduzir o mesmo PIN/palavra-passe;
5. confirmar que os dados do telemóvel aparecem no computador;
6. confirmar alterações computador → telemóvel e telemóvel → computador;
7. validar offline/reconexão e conflito controlado.

## Estado anterior preservado

A correção de turnos noturnos do PR #189 permanece integrada. A área de medicação mantém deslize, ações **Definir** e **Eliminar**, tombstone lógico e histórico funcional/técnico. O modo local-first continua funcional quando o serviço remoto estiver indisponível.

## Última alteração

Foi publicado o fluxo de associação temporária de browsers e adicionada uma interceção de ligações de associação antes do runtime, permitindo recuperar o perfil correto mesmo quando o computador já possui um perfil local vazio criado por engano.

## Próximo passo

Executar a associação real do telemóvel para o computador e validar o critério de aceitação: depois de introduzir a mesma credencial, os registos existentes aparecem no segundo browser sem criar novo perfil, sem duplicação e sem perda de dados.
