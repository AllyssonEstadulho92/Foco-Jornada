# Foco & Jornada 4.1.1

Aplicação PWA de produtividade pessoal/profissional, sem dependências de runtime.

## Módulos
- Jornada: entrada, saída, edição, cancelamento, reabertura e estado incompleto.
- Pausas: ecrã, principal, extensão e retoma de atividade.
- Atividades: criar, editar, prioridade, categoria, estimativa, iniciar, pausar, concluir e cancelar.
- Foco/Pomodoro: ciclos, pausa/retoma e associação a atividade.
- Café: tipos/preços em cêntimos, registo e desfazer.
- Histórico e timeline por dia.
- Estatísticas 7 dias, 30 dias e ano sem score arbitrário.
- Definições, contextos Trabalho/Pessoal, backup/importação e diagnóstico.
- PWA/offline e modo claro/escuro.

## Qualidade
`npm run check`

A versão 4.1.1 inclui a camada de estabilização da interface e cache PWA revisto. A validação automática deve manter coerentes a versão do pacote, interface, camada de estabilidade e Service Worker.

## Publicação
GitHub Pages via `.github/workflows/pages.yml`.
