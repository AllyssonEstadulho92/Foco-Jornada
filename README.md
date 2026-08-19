# Foco & Jornada 4.2.0

PWA de produtividade pessoal/profissional, local-first e sem dependências de runtime.

## Horário de trabalho
- Segunda a sábado: 08:00–17:00.
- Pausa principal prevista: 12:00–13:00.
- Domingo: 09:00–18:00.
- Pausa principal prevista ao domingo: 13:00–14:00.
- A aplicação avisa automaticamente à hora prevista, mas a pausa só começa quando o utilizador confirma manualmente.

## Integrações
### Moovit
A Foco & Jornada prepara origem/destino e abre o Moovit através dos deep links oficiais `moovit://directions` e `moovit://nearby`, com `partner_id=FocoJornada`. Casa e Trabalho permanecem guardados localmente.

### Supershift
O Supershift documenta calendários externos configurados no sistema operativo, mas não publica um deep link para inserir turnos diretamente. A Foco & Jornada gera uma escala de 8 semanas em `.ics`; o ficheiro pode ser adicionado ao Calendário do dispositivo e esse calendário pode depois ser selecionado no Supershift.

## Módulos
- Jornada: entrada, saída, edição, cancelamento, reabertura e cálculo por timestamps.
- Pausas: ecrã, principal, extensão e retoma de atividade.
- Atividades: criar, editar, prioridade, categoria, estimativa, iniciar, pausar, concluir e cancelar.
- Foco/Pomodoro: ciclos, pausa/retoma e associação a atividade.
- Café: preço configurável em cêntimos, registo e desfazer.
- Integrações: horário semanal, Moovit, Supershift e exportação de escala.
- Previsão de saída e resumo/fecho do dia.
- Centro de notificações, histórico, estatísticas, backup/importação e diagnóstico.
- PWA/offline, atalhos e modo claro/escuro.

## Qualidade
`npm run check`

## Publicação
GitHub Pages via `.github/workflows/pages.yml`.
