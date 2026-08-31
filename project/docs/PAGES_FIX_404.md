# Correção do GitHub Pages — 404

## Problema
O `index.html` fazia um redirecionamento automático para `./site/` sempre que a aplicação era aberta em `github.io`.

Quando o GitHub Pages publicava o `dist` através de GitHub Actions, a pasta `site/` não existia dentro do artefacto publicado. O navegador acabava em `/Foco-Jornada/site/`, resultando em **404 — File not found**.

## Correção
- remover o redirecionamento para `./site/` do `index.html`;
- deixar o `dist` publicado pelo workflow servir diretamente a aplicação;
- manter o `HashRouter`, que não depende de fallback de rotas no servidor;
- preservar os assets relativos gerados pelo Vite (`base: './'`).

## Resultado esperado
A aplicação deve abrir diretamente em:

`https://allyssonestadulho92.github.io/Foco-Jornada/`

sem redirecionamento adicional para `/site/`.


## Compatibilidade com endereços antigos

Para evitar que atalhos, favoritos ou caches antigos continuem a abrir `/Foco-Jornada/site/`, o build passa também a publicar:

- `/site/index.html`, que redireciona o endereço legado para `/Foco-Jornada/` preservando o hash da aplicação;
- `/404.html`, que recupera caminhos antigos dentro de `/Foco-Jornada/` e encaminha-os para a rota HashRouter equivalente quando possível.

Isto não altera a aplicação nem os dados; serve apenas como camada de compatibilidade para URLs antigas.
