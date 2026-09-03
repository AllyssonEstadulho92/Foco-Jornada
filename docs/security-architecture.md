# Arquitetura de segurança — Foco Jornada

## Âmbito

O Foco Jornada é uma PWA estática publicada por GitHub Pages. O código da aplicação é público, mas os dados pessoais não fazem parte do repositório nem do build publicado.

A versão atual utiliza um modelo **local-first com cofre cifrado por perfil**. Não existe backend nem sincronização automática de contas entre dispositivos.

## Modelo de armazenamento

Existem dois armazenamentos técnicos locais:

1. **Perfil de segurança** — IndexedDB `foco-jornada-security-v1`.
   - identificador aleatório do perfil;
   - salt da derivação de chave;
   - parâmetros PBKDF2;
   - chave de dados cifrada;
   - chave de dados cifrada para recuperação;
   - dados públicos da credencial WebAuthn/passkey, quando configurada;
   - contador de tentativas e configuração de bloqueio.

2. **Cofre** — IndexedDB `foco-jornada-vault-v1`.
   - um único payload cifrado por perfil;
   - contém jornadas, pausas, atividades, foco, cafés, stock, medicação, configurações pessoais, notificações e restantes dados operacionais;
   - o payload persistente não contém estes dados em texto simples.

O `localStorage` fica limitado a preferências visuais não sensíveis e ao identificador do perfil selecionado. Dados legados sensíveis são migrados para o cofre.

## Criptografia

- Web Crypto API;
- AES-GCM com chave de dados aleatória de 256 bits;
- IV aleatório de 96 bits por gravação;
- Additional Authenticated Data vinculada ao identificador do perfil;
- PBKDF2-HMAC-SHA-256 para PIN/palavra-passe;
- 600 000 iterações PBKDF2;
- salt aleatório de 128 bits;
- código de recuperação aleatório de 256 bits;
- a chave de dados não é persistida em texto simples.

O PIN/palavra-passe protege a chave de dados. Alterar a credencial principal volta a cifrar a chave de dados, não os registos individualmente.

## PIN e palavra-passe

O PIN de seis dígitos existe por ergonomia, mas tem apenas um milhão de combinações possíveis. PBKDF2 aumenta o custo de tentativa, mas não transforma um PIN curto numa palavra-passe de alta entropia.

Para maior resistência a um ataque offline a uma cópia roubada do cofre, deve ser utilizada a opção de palavra-passe, com pelo menos 12 caracteres.

As esperas progressivas após tentativas incorretas protegem a interface normal da aplicação. Um atacante com controlo total do armazenamento local pode alterar o contador de tentativas; a proteção principal continua a ser a criptografia do cofre.

## Passkeys e biometria

A aplicação não simula biometria.

Quando WebAuthn e a extensão PRF são suportadas pelo navegador/autenticador, uma passkey pode produzir material criptográfico utilizado para desencriptar a chave de dados. A verificação biométrica, PIN do dispositivo ou outro gesto de utilizador é realizada pelo autenticador, não por JavaScript da aplicação.

O PIN/palavra-passe continua disponível como método principal/fallback.

## Recuperação

Ao criar um perfil é gerado um código de recuperação de 256 bits. O código é mostrado uma vez e não é guardado em texto simples.

O código permite recuperar a mesma chave de dados e definir uma nova credencial. Não existe um botão de recuperação que contorne a criptografia.

Sem:

- PIN/palavra-passe válido;
- passkey utilizável; ou
- código de recuperação,

a única reposição local possível é eliminar o perfil, o que elimina o respetivo cofre.

## Cópias de segurança

As cópias novas usam o formato `foco-jornada-secure-backup`.

O ficheiro contém:

- parâmetros necessários do perfil de segurança;
- chave de dados cifrada;
- código de recuperação apenas na forma de chave cifrada associada — nunca o código em claro;
- ciphertext do cofre.

Os dados pessoais não são exportados em texto simples.

Antes de substituir um cofre existente, o ciphertext da cópia é desencriptado e validado em memória. Uma cópia segura também pode ser importada no ecrã de acesso de uma instalação limpa e depois aberta com a credencial correspondente.

Backups legados em plaintext continuam a poder ser importados apenas depois de abrir um perfil protegido, para permitir migração sem destruir dados antigos.

## Migração de dados legados

Quando existe a antiga base Dexie `foco-jornada` ou armazenamento auxiliar legado:

1. os dados antigos são lidos;
2. são copiados para o cofre cifrado;
3. o cofre é persistido;
4. as contagens das tabelas são verificadas;
5. só depois a base e as chaves legadas em plaintext são removidas.

Se a migração falhar antes da validação, a origem antiga não é eliminada.

## Bloqueio

A chave de dados só existe na memória durante uma sessão desbloqueada.

A aplicação bloqueia:

- após o período configurado de inatividade;
- após permanência significativa em segundo plano;
- quando a página é recarregada ou reaberta;
- através de **Bloquear agora**.

Ao bloquear, os serviços são desmontados, o snapshot em memória é substituído por uma estrutura vazia e as referências locais à sessão/chave são libertadas para recolha pelo runtime.

## PWA e cache

O service worker guarda apenas recursos públicos da aplicação e navegação. Dados pessoais não são gravados no Cache Storage.

A configuração utiliza:

- atualização automática;
- `skipWaiting`;
- `clientsClaim`;
- limpeza de precaches desatualizados;
- rotação e remoção explícita do cache de navegação legado.

## Hardening do frontend

O documento principal aplica uma Content Security Policy restritiva:

- scripts apenas da própria origem;
- `object-src 'none'`;
- `base-uri 'none'`;
- `form-action 'self'`;
- recursos e workers limitados às origens necessárias.

Os redirects legados usam script externo e CSP própria.

O projeto não utiliza `eval`, `new Function` ou `dangerouslySetInnerHTML`. Existe uma utilização de `innerHTML` apenas para uma estrutura HTML estática do temporizador de medicação; dados variáveis são inseridos por `textContent`.

## GitHub

O `.gitignore` exclui:

- `.env` e variantes;
- chaves/certificados;
- bases de dados;
- backups pessoais;
- exports;
- logs;
- temporários;
- builds e artefactos de publicação antigos.

Os artefactos gerados que estavam versionados no root/`site` foram removidos. A publicação válida é gerada em `dist` pelo GitHub Actions.

Os workflows executam auditoria de dependências, typecheck, lint, testes, build e smoke test antes da publicação.

## Limitações do modelo estático

Esta arquitetura protege dados em repouso no armazenamento local, mas não pode garantir:

- sincronização de conta entre dispositivos;
- recuperação remota sem backup/código;
- proteção contra alguém que apague todo o armazenamento do navegador;
- proteção dos dados enquanto a aplicação está desbloqueada contra JavaScript malicioso que consiga executar na mesma origem;
- resistência de uma palavra-passe forte quando o utilizador escolhe apenas um PIN de seis dígitos;
- controlo servidor-side de autorização.

Contas persistentes e sincronizadas exigem backend, autenticação servidor-side e isolamento de dados por utilizador.

## Princípio central

**Código público não implica dados públicos.**

A segurança do Foco Jornada não depende de esconder JavaScript ou de um ecrã visual de PIN; depende de manter o conteúdo pessoal cifrado com uma chave que não é persistida em claro junto dos dados.
