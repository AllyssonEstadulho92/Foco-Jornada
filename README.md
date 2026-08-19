# Foco & Jornada 4.2.0

PWA de produtividade pessoal/profissional, local-first e sem dependências de runtime.

## Módulos
- Jornada: entrada, saída, edição, cancelamento, reabertura e cálculo por timestamps.
- Horário semanal: segunda a sábado 08:00–17:00; domingo 09:00–18:00.
- Pausa principal sugerida após 4 horas: 12:00–13:00 de segunda a sábado e 13:00–14:00 ao domingo, com lembrete automático e início manual.
- Atividades: criar, editar, prioridade, categoria, estimativa, iniciar, pausar, concluir e cancelar.
- Foco/Pomodoro: ciclos, pausa/retoma e associação a atividade.
- Café: preço configurável em cêntimos, registo e desfazer.
- Vida pessoal / Tempo a dois: horário derivado do fim da jornada, lembrete discreto, concluir, adiar 30 minutos ou ignorar apenas o dia, sem pontuação de relação.
- Moovit: Casa/Trabalho, localização atual, viagens recentes e integração oficial por deep link.
- Supershift: integração segura por exportação de calendário/ICS e abertura oficial da aplicação/site, sem deep link privado inventado.
- Previsão de saída com base no objetivo de trabalho efetivo e pausa principal.
- Resumo/fecho do dia.
- Centro de notificações com atualizações PWA controladas.
- Histórico, estatísticas, backup/importação e diagnóstico.
- PWA/offline, atalhos e modo claro/escuro.

## Tempo a dois — regra correta
O módulo não usa uma agenda rígida independente do trabalho. O horário é calculado a partir da saída prevista ou, quando já terminaste a jornada, da saída efetivamente registada.

Configuração padrão:
- margem depois do trabalho: 1h30;
- segunda, terça, quinta e sexta: 30 min de conexão do casal;
- quarta: 1h30 para a noite do casal;
- sábado: 3h para o bloco principal do casal;
- domingo: 1h para tempo a dois e alinhamento da semana;
- lembrete: 15 min antes do início.

Com a escala atual, isto resulta normalmente em:
- segunda/terça/quinta/sexta: 18:30–19:00;
- quarta: 18:30–20:00;
- sábado: 18:30–21:30;
- domingo: 19:30–20:30.

Se a saída real for mais tarde, o bloco desse dia desloca-se automaticamente. A margem pode ser alterada de forma simples para 1h, 1h30 ou 2h. A aplicação apenas lembra; nunca marca o tempo como concluído sozinha.

## Hub “Mais”
O botão **Mais** abre um menu oculto em formato de bottom sheet no mobile e gaveta lateral no desktop. O hub mantém a barra inferior com cinco destinos e concentra:
- Moovit e Supershift como aplicações principais;
- Vida pessoal / Tempo a dois;
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
