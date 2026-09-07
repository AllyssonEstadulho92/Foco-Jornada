# Sincronização Cloudflare — runbook

Atualizado em: 2026-09-07

## Objetivo

Alinhar o mesmo perfil do Foco Jornada entre móvel e computador sem enviar os dados pessoais desencriptados para o backend.

O frontend continua em GitHub Pages. O Cloudflare Worker serve apenas a API de sincronização do cofre cifrado.

## Componentes

- `src/security/cloudSync.ts` — cliente, autenticação derivada, fingerprint, revisão e conflito.
- `src/security/vaultStore.ts` — sinaliza gravações locais concluídas.
- `src/security/SecureAppBootstrap.tsx` — reconcilia antes de abrir o `AppDatabase` e agenda sincronizações em runtime.
- `cloudflare/sync-worker.js` — API remota.
- `wrangler.toml` — Durable Object e origem permitida.
- `VITE_SYNC_API_URL` — endereço do Worker injetado no build GitHub Pages.

## Publicação do Worker

A integração Cloudflare ligada ao repositório deve usar o `wrangler.toml` da raiz. O serviço esperado chama-se `foco-jornada` e publica `cloudflare/sync-worker.js`.

Depois de uma publicação bem-sucedida:

1. confirmar que `GET /health` responde com `{"ok":true,"service":"foco-jornada-sync"}`;
2. copiar o endpoint HTTPS `workers.dev` efetivamente atribuído ao Worker;
3. criar/atualizar no GitHub a variável de repositório `VITE_SYNC_API_URL` com esse endpoint, sem barra final;
4. voltar a executar a publicação GitHub Pages para que o endpoint seja incluído no bundle.

Não devem ser colocados API tokens, passwords ou chaves Cloudflare no repositório.

## CORS e CSP

O Worker aceita por defeito a origem:

`https://allyssonestadulho92.github.io`

A CSP do frontend aceita ligações apenas à própria origem e a `https://*.workers.dev`.

Se o endpoint for migrado para um domínio personalizado, a CSP e `ALLOWED_ORIGINS` têm de ser revistos em conjunto antes da publicação.

## Primeiro emparelhamento

A sincronização não tenta fundir dois perfis criptográficos independentes.

Procedimento recomendado:

1. escolher o dispositivo que contém os dados de referência;
2. nesse dispositivo, confirmar que a sincronização está configurada e ativá-la em **Privacidade e acesso**;
3. aguardar a indicação de sincronização concluída;
4. criar uma **cópia segura** do perfil;
5. no segundo dispositivo, importar essa cópia segura a partir do ecrã de acesso;
6. abrir o perfil importado; como `profileId`, chave de dados e metadados de sincronização são os mesmos, o segundo dispositivo pode autenticar-se no mesmo cofre remoto;
7. validar uma alteração simples em cada direção antes de usar o fluxo com dados importantes.

## Protocolo

### GET `/v1/vault/:profileId`

Cabeçalho obrigatório:

`Authorization: Bearer <token-derivado>`

Respostas principais:

- `200` — devolve revisão remota e `EncryptedVaultRecord`;
- `404` — ainda não existe cópia remota;
- `401` — token inválido;
- `403` — origem não permitida.

### PUT `/v1/vault/:profileId`

Corpo:

```json
{
  "expectedRevision": 3,
  "vault": {
    "profileId": "...",
    "revision": 27,
    "schemaVersion": 1,
    "updatedAt": "...",
    "iv": "...",
    "ciphertext": "..."
  }
}
```

`expectedRevision` refere-se à revisão remota, não à revisão local dentro de `vault`.

Se outro dispositivo já tiver alterado a revisão remota, o Worker devolve `409` e não grava o pedido.

## Regras de resolução

- só local mudou → enviar;
- só remoto mudou → substituir o cofre local cifrado antes de reabrir a base em memória;
- ambos são iguais → atualizar metadados;
- ambos mudaram desde a última base comum → marcar conflito e não sobrescrever nenhum lado;
- revisão remota recuou → bloquear sincronização e exigir investigação;
- serviço remoto desapareceu depois de já ter sido usado → não recriar silenciosamente.

Não existe atualmente uma fusão automática de snapshots nem um botão de resolução de conflito. Esta limitação é intencional para evitar perda de dados.

## Segurança

O token de sincronização é SHA-256 de material derivado da `dataKey` e de um contexto fixo do perfil. O Worker guarda SHA-256 desse token. A `dataKey` original não sai do cliente.

O backend não consegue desencriptar `ciphertext` apenas com:

- `profileId`;
- revisão remota;
- `authHash`;
- IV;
- ciphertext.

A proteção em trânsito continua a depender de HTTPS/TLS do endpoint Cloudflare.

## Limitações atuais

- o primeiro emparelhamento exige uma cópia segura;
- a remoção de um perfil local ainda não elimina automaticamente a respetiva cópia remota;
- não existe fusão de conflitos;
- a disponibilidade de sincronização depende do Worker e da configuração `VITE_SYNC_API_URL`;
- dois perfis criados separadamente não são considerados o mesmo utilizador, mesmo que tenham PIN igual.

## Teste mínimo antes de produção

1. ativar sincronização no dispositivo A e criar o remoto;
2. importar cópia segura no dispositivo B;
3. alterar um registo em A e confirmar em B;
4. alterar outro registo em B e confirmar em A;
5. desligar a rede, alterar em A, voltar a ligar e confirmar envio;
6. criar alterações concorrentes em A e B sem sincronizar entre elas e confirmar estado de conflito sem perda local;
7. bloquear/reabrir ambos os dispositivos e repetir uma alteração em cada direção.
