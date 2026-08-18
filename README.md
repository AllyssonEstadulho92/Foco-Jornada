# Foco & Jornada 4.1.2

Aplicação PWA de produtividade pessoal/profissional, sem dependências externas de runtime.

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

## UX mobile 4.1.2
- Layout móvel com escala fixa para comportamento semelhante a aplicação instalada.
- Inputs a 16 px no iPhone para evitar zoom automático ao editar.
- Centro de notificações com sino, ponto vermelho e histórico local das mensagens da aplicação.
- Mensagens inferiores antigas ocultadas e encaminhadas para o centro de notificações.
- Ícones SVG modernos integrados localmente, sem Flaticon/CDN nem dependência de Internet.
- Microanimações apenas na interação, respeitando `prefers-reduced-motion`.

## Qualidade
`npm run check`

A camada pública ativa é `ux.js`, que importa a camada de estabilidade anterior e acrescenta a UX 4.1.2 sem polling visual agressivo.

## Publicação
GitHub Pages via `.github/workflows/pages.yml`.
