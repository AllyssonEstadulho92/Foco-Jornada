# Matriz de implementação — estado atual

## Implementado e testado
- Jornada: entrada, saída, duração por timestamp, meia-noite, edição, reabertura, cancelamento e estado incompleto no domínio.
- Horário de trabalho: segunda a sábado 08:00–17:00; domingo 09:00–18:00.
- Pausas: ecrã/principal, duração configurável, extensão, desconto no efetivo, pausa automática da atividade e lembrete da pausa principal com início manual.
- Atividades: criação, edição, prioridade, categoria, estimativa, filtros, pesquisa, segmentos, iniciar/pausar/concluir/cancelar.
- Foco/Pomodoro: duração, ciclos, associação a atividade, pausa/retoma e conclusão por timestamp.
- Café: preço em cêntimos, múltiplos tipos no modelo, registo, gasto e desfazer.
- Histórico: timeline, resumo diário, eliminação visual de eventos e gestão das jornadas.
- Estatísticas: 7 dias, 30 dias e ano; foco não é somado ao trabalho.
- Contextos: Trabalho/Pessoal.
- Vida pessoal / Tempo a dois: módulo no Hoje e no hub Mais, derivado da saída da jornada, sem pontuação e sem conclusão automática.
- Tempo a dois: margem padrão 1h30 após a saída; 30 min nos dias normais, 1h30 à quarta, 3h ao sábado e 1h ao domingo; ajusta-se à saída real quando registada.
- Transportes: Casa/Trabalho, localização atual, viagens recentes e integração Moovit por deep link oficial.
- Supershift: exportação segura de escala por calendário/ICS, sem deep link privado inventado.
- Hub Mais: bottom sheet no mobile/gaveta no desktop com aplicações, trabalho, vida pessoal e ferramentas de sistema.
- Definições: tema, tempos, café e notificações.
- Dados: migração v3→v4, backup/importação, diagnóstico e reset.
- PWA: manifesto, Service Worker, .nojekyll, GitHub Pages e atualização controlada.
- UX: mobile/desktop, navegação, estados vazios, proteção anti-duplo clique, reduced motion, foco de teclado e centro de notificações.

## Regra temporal
Timers e agendas derivadas não são a fonte de verdade. Sempre que existe um timestamp real — por exemplo a saída efetivamente registada da jornada — ele tem prioridade sobre uma hora planeada. O módulo Tempo a dois segue esta mesma regra.

## Não verificável por numeração
A redação original dos requisitos numerados até 1121 não está integralmente disponível no contexto recuperável desta execução. Logo, esta matriz não afirma cobertura literal de cada número. Para auditoria 1:1, é necessário anexar/colar a Especificação Mestre numerada.
