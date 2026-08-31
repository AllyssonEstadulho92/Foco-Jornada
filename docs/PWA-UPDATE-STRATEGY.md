# Estratégia de atualização da PWA

A partir da versão 1.1.2, a navegação principal deixa de depender de uma cópia precacheada de `index.html` como fonte prioritária quando existe rede.

## Objetivo

Evitar que uma PWA instalada continue a abrir uma interface antiga depois de uma publicação válida no GitHub Pages.

## Regras

- documentos de navegação usam estratégia **NetworkFirst**;
- quando existe rede, o browser tenta obter o documento publicado antes de recorrer à cópia local;
- quando está offline, a última navegação válida continua disponível através da cache da PWA;
- JS e CSS continuam com nomes versionados/hash gerados pelo Vite;
- caches antigos continuam a ser removidos pelo Workbox;
- a aplicação força uma verificação do Service Worker ao arrancar, ao voltar ao primeiro plano e quando a ligação regressa;
- quando um novo Service Worker assume controlo, a aplicação recarrega uma única vez para aplicar o novo build.

Esta estratégia preserva funcionamento offline sem tornar `index.html` uma fonte stale-first durante utilização online.
