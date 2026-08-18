# Arquitetura

## Decisão de distribuição

A versão 3.0.0 utiliza um `index.html` autónomo para minimizar dependências e reduzir pontos de falha na publicação. Não existe build de produção.

## Camadas lógicas dentro da aplicação

1. **Estado e persistência** — estado local, migração, `localStorage` e backup.
2. **Domínio** — jornada, pausas, foco, atividades, café, métricas e validações.
3. **Apresentação** — Dashboard, navegação, formulários, timers e feedback visual.
4. **PWA** — manifesto e Service Worker.

## Regras temporais

Os timers visuais não são a fonte de verdade. Os cálculos são derivados de timestamps (`start`, `end`, `expected`, `pausedAt`, `pausedMs`). Assim, fechar o separador ou suspender o browser não reinicia a contagem.

## Dados financeiros

O preço do café é armazenado em cêntimos inteiros para evitar erros de ponto flutuante.

## Integridade

A aplicação impede várias jornadas, pausas, focos ou atividades temporizadas incompatíveis e disponibiliza diagnóstico manual no ecrã Mais.
