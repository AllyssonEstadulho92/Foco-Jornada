# Foco & Jornada 4.2.0

PWA de produtividade pessoal/profissional, local-first e sem dependências de runtime.

## Módulos
- Jornada: entrada, saída, edição, cancelamento, reabertura e cálculo por timestamps.
- Horário semanal: segunda a sábado 08:00–17:00; domingo 09:00–18:00.
- Pausa principal sugerida após 4 horas: 12:00–13:00 de segunda a sábado e 13:00–14:00 ao domingo, com lembrete automático e início manual.
- Atividades: criar, editar, prioridade, categoria, estimativa, iniciar, pausar, concluir e cancelar.
- Foco/Pomodoro: ciclos, pausa/retoma e associação a atividade.
- Café: preço configurável em cêntimos, registo e desfazer.
- Tempo a dois: horário protegido diário para o casamento, lembrete no sino, concluir, adiar 30 minutos ou ignorar apenas o dia, sem pontuação de relação.
- Moovit: Casa/Trabalho, localização atual, viagens recentes e integração oficial por deep link.
- Supershift: integração segura por exportação de calendário/ICS e abertura oficial da aplicação/site, sem deep link privado inventado.
- Previsão de saída com base no objetivo de trabalho efetivo e pausa principal.
- Resumo/fecho do dia.
- Centro de notificações com atualizações PWA controladas.
- Histórico, estatísticas, backup/importação e diagnóstico.
- PWA/offline, atalhos e modo claro/escuro.

## Tempo a dois
Horário padrão protegido:
- segunda: 19:30–21:00 — jantar e tempo juntos;
- terça: 20:30–21:00 — conversa sem ecrãs;
- quarta: 19:30–22:00 — noite do casal;
- quinta: 19:30–21:00 — tempo tranquilo juntos;
- sexta: 19:30–22:30 — noite a dois;
- sábado: 18:30–22:30 — bloco principal do casal;
- domingo: 19:30–21:30 — jantar e planeamento da semana.

Os lembretes usam um único `setTimeout`, são reavaliados quando a PWA volta ao primeiro plano e ficam guardados em `features.couple`, entrando no mesmo backup das funcionalidades adicionais.

## Hub “Mais”
O botão **Mais** abre um menu oculto em formato de bottom sheet no mobile e gaveta lateral no desktop. O hub mantém a barra inferior com cinco destinos e concentra:
- Moovit e Supershift como aplicações principais;
- Tempo a dois;
- Horário e pausas;
- Estatísticas;
- Definições;
- Backup e diagnóstico;
- Notificações;
- Atualizações;
- Sobre.

O hub foi desenhado como ponto de extensão para novos módulos, sem aumentar a barra inferior e sem polling visual contínuo.

## Qualidade
`npm run check`
