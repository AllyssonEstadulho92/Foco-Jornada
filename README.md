# Foco & Jornada 4.2.0

PWA de produtividade pessoal/profissional, local-first e sem dependências de runtime.

## Módulos
- Jornada: entrada, saída, edição, cancelamento, reabertura e cálculo por timestamps.
- Pausas: ecrã, principal, extensão e retoma de atividade.
- Atividades: criar, editar, prioridade, categoria, estimativa, iniciar, pausar, concluir e cancelar.
- Foco/Pomodoro: ciclos, pausa/retoma e associação a atividade.
- Café: preço configurável em cêntimos, registo e desfazer.
- Transportes: Casa/Trabalho, localização atual, viagens recentes e integração oficial por deep link com Moovit.
- Previsão de saída com base no objetivo de trabalho efetivo e pausa principal.
- Resumo/fecho do dia.
- Centro de notificações com atualizações PWA controladas.
- Histórico, estatísticas, backup/importação e diagnóstico.
- PWA/offline, atalhos e modo claro/escuro.

## Qualidade
`npm run check`

A versão 4.2.0 mantém a atualização dos temporizadores sem reconstrução integral do DOM e separa funcionalidades adicionais em `features-core.js`/`features.js`.

## Publicação
GitHub Pages via `.github/workflows/pages.yml`.
