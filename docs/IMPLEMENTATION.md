# Matriz de implementação — estado atual

A referência de evolução passa a ser `ROADMAP.md`. Esta matriz resume apenas o que existe hoje no runtime público.

## Implementado
- Jornada: entrada, saída, edição, reabertura, cancelamento e cálculo por timestamps.
- Horário semanal: segunda a sábado 08:00–17:00; domingo 09:00–18:00.
- Pausas: ecrã/principal, duração configurável, desconto no efetivo e lembrete com início manual.
- Atividades: criação, edição, prioridade, categoria, estimativa, pesquisa, filtros, iniciar, pausar, concluir e cancelar.
- Planeamento: estado da jornada, atividades abertas, tarefas para hoje, atrasos, prioridades e atalhos para módulos operacionais.
- Café: registo, gasto, desfazer e preço configurável.
- Histórico e estatísticas.
- Transportes: Casa/Trabalho, localização atual, recentes e Moovit por deep link oficial.
- Escala interna: calendário, turnos, trabalhos, rotações, relatórios, ICS e impressão/PDF A4.
- Hub Mais: aplicações, horário, Planeamento, estatísticas, definições, dados, notificações, atualizações e Sobre.
- Backup/importação, diagnóstico e reset.
- PWA, cache offline, atualização controlada e GitHub Pages.

## Parcial / em consolidação
- Fecho/resumo diário ainda tem proteção temporária contra renderizações concorrentes.
- Interação tátil da escala usa um módulo mobile dedicado que deve ser incorporado no planeador.
- Relatórios da escala usam uma camada de migração/configuração para remover defaults históricos de horas/salário.
- Testes automatizados cobrem domínio e presença de handlers, mas ainda faltam testes DOM/E2E completos.
- Notificações de sistema e partilha/ficheiros precisam validação física no iPhone/PWA.
- Estruturas antigas continuam legíveis apenas para compatibilidade de migração e backups; não são apresentadas como módulos públicos.

## Retirado
- O antigo módulo de sessões de concentração deixou de fazer parte do runtime público e foi substituído por **Planeamento**.
- O módulo **Vida pessoal / Tempo a dois** foi retirado do runtime por decisão do utilizador. Não deve ser contado como funcionalidade ativa nem voltar automaticamente em atualizações.

## Regra temporal
Timestamps reais têm prioridade sobre previsões e timers visuais. Uma hora planeada nunca deve substituir silenciosamente um registo real.

## Limitação da especificação numerada
A redação original dos requisitos 1–1121 não está integralmente disponível no repositório. Não é possível afirmar cobertura literal desses números sem a Especificação Mestre original. Quando esse documento for fornecido, deve ser criada uma auditoria 1:1 separada.
