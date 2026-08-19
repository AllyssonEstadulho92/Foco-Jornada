# Foco & Jornada — Roadmap oficial

Este documento é a referência de evolução do projeto a partir da base 4.2.x.

Estados:
- ✅ Implementado e utilizável
- 🟡 Parcial / precisa consolidação ou validação em dispositivo
- ⬜ Ainda não implementado
- 🚫 Fora de escopo por agora

> A especificação mestre numerada 1–1121 não está no repositório atual. Por isso este roadmap não afirma correspondência literal com esses números. Quando a especificação original for fornecida, deve ser criada uma matriz 1:1 separada.

## Base atual

### Experiência profissional
- ✅ Centro de Comando no ecrã Hoje com próxima ação, turno e atalhos
- ✅ Pesquisa global por módulos, atividades e modelos de turno
- ✅ Atalhos contextuais para Atividades, Foco, Supershift e Moovit
- ✅ Diagnóstico técnico com ligação, modo PWA, Service Worker, notificações, armazenamento e contagens
- ✅ Atalho de teclado `Ctrl/Cmd + K` para pesquisa global em desktop
- 🟡 Validação visual final em iPhone

### Jornada e tempo
- ✅ Entrada e saída da jornada
- ✅ Edição, cancelamento e reabertura
- ✅ Cálculo por timestamps
- ✅ Pausa de ecrã e pausa principal
- ✅ Horário semanal: segunda–sábado 08:00–17:00; domingo 09:00–18:00
- ✅ Sugestão de pausa principal com início manual
- ✅ Previsão de saída
- 🟡 Fecho/resumo diário — funcional, ainda a consolidar no núcleo principal

### Atividades
- ✅ Criar, editar, iniciar, pausar, concluir e cancelar
- ✅ Prioridade, categoria, estimativa, pesquisa e filtros
- ✅ Subtarefas com conclusão/reabertura
- ✅ Data planeada e data limite
- ✅ Recorrência diária, semanal e mensal
- ✅ Etiquetas pesquisáveis
- ✅ Duplicar atividade
- ✅ Mover para amanhã
- ✅ Filtros Hoje e Atrasadas
- ✅ Contagem de sessões de foco por atividade na lista
- 🟡 Associação ao Pomodoro — funcional, ainda precisa smoke test físico no iPhone
- ⬜ Ordenação manual

### Pomodoro
- ✅ Foco por timestamp
- ✅ Pausar e retomar
- ✅ Associação a atividade
- ✅ Duração e número de ciclos configuráveis
- ✅ Fluxo automático foco → pausa curta → foco → pausa longa
- ✅ Ativar/desativar continuação automática
- ✅ Objetivo diário configurável de sessões
- ✅ Progresso diário de sessões e minutos
- 🟡 Histórico por atividade — contagem/resumo implementados; falta vista histórica detalhada

### Café
- ✅ Registo e desfazer
- ✅ Preço configurável em cêntimos
- ✅ Métricas de quantidade e gasto
- ✅ Default local ajustado para vending Sogenave quando migrado
- 🟡 Consolidar o default de 0,40 € diretamente no núcleo base

### Histórico e estatísticas
- ✅ Timeline diária
- ✅ Gestão de jornadas no histórico
- ✅ Estatísticas 7 dias / 30 dias / ano
- ✅ Foco não é contado duas vezes como trabalho
- 🟡 Relatórios A4 — implementados no módulo de escala, precisam revisão final de impressão em iPhone

### Supershift / Escala
- ✅ Calendário mensal
- ✅ Seleção e edição de dias
- ✅ Modelos de turnos
- ✅ Trabalhos
- ✅ Rotações
- ✅ Relatórios de horas e ganhos
- ✅ Horas normais e salário/hora configuráveis
- ✅ Exportação ICS
- ✅ Impressão/PDF A4
- ✅ Copiar turno para o dia seguinte
- ✅ Copiar semana para a semana seguinte
- 🟡 Copiar mês inteiro — ainda não implementado
- ✅ Férias, Falta, Baixa médica, Folga e Feriado por intervalo de datas
- ✅ Modelo de Baixa médica
- ✅ Resumo mensal da escala
- ✅ Resumo anual da escala
- 🟡 Teste físico completo de toque/partilha no iPhone
- ⬜ Múltiplos trabalhos com cores no calendário
- ⬜ Notas por dia
- ⬜ Importação ICS

### Moovit / Transportes
- ✅ Casa e Trabalho
- ✅ Localização atual
- ✅ Planear rota
- ✅ Perto de mim
- ✅ Histórico recente
- ✅ Deep links oficiais do Moovit
- 🟡 Melhorar diagnóstico/fallback quando Moovit não está instalado
- ⬜ Favoritos adicionais
- ⬜ Botão contextual “Sair agora” associado ao turno/jornada
- ⬜ Tempo estimado de viagem no resumo diário

### Dados e PWA
- ✅ Backup JSON
- ✅ Importação com validação e confirmação
- ✅ Diagnóstico
- ✅ Diagnóstico técnico expandido no modo profissional
- ✅ Reset local
- ✅ Service Worker e modo offline após cache inicial
- ✅ Atualização controlada do Service Worker
- ✅ Centro de notificações
- 🟡 Notificações de sistema no iPhone dependem das permissões e do modo PWA
- ⬜ Histórico de backups
- ⬜ Backup parcial por módulo
- ⬜ IndexedDB para dados operacionais
- ⬜ Sincronização entre dispositivos
- ⬜ Backend/autenticação

## 4.3.0 — Consolidação e estabilidade — EM CURSO

Objetivo: reduzir remendos acumulados, tornar os fluxos críticos testáveis e estabilizar o runtime antes de acrescentar módulos grandes.

### Arquitetura
- 🟡 Incorporar progressivamente regras de `runtime-fixes.js`, `summary-guard.js`, `shift-reports.js` e `shift-mobile-interactions.js` nos módulos definitivos
- ✅ Núcleo puro `shift-advanced-core.js` para cópia, intervalos e resumos da escala
- ✅ Núcleo puro `professional-core.js` para Centro de Comando, Pesquisa Global e Diagnóstico
- ✅ Núcleo `productivity-core.js` para recorrência, subtarefas, duplicação e ciclo Pomodoro
- ✅ Remover `enhancements.js` do runtime ativo
- 🟡 Remover ficheiros legado restantes quando deixarem de ser necessários para caches antigos
- 🟡 Unificar versão pública e metadados numa única release
- 🟡 Consolidar default do café em 0,40 € no núcleo
- 🟡 Consolidar defaults de Relatórios sem 217h/5,23 € automáticos

### QA
- ✅ Testes de domínio
- ✅ Auditoria estática dos botões críticos
- ✅ Testes do módulo de escala
- ✅ Testes dos relatórios configuráveis
- ✅ Testes puros para copiar dia/semana, intervalos e resumos da escala
- ✅ Testes puros para Centro de Comando, Pesquisa Global e Diagnóstico
- ✅ Testes de fluxo para recorrência, subtarefas, duplicação e transições Pomodoro
- ⬜ Testes DOM de clique/toque
- ⬜ Smoke test Safari/PWA documentado por release
- ⬜ Teste de instalação/atualização offline

### Fluxos a fechar na 4.3.0
- 🟡 Pomodoro e atividades: lógica principal consolidada; falta validação física e remoção dos handlers corretivos antigos
- 🟡 Resumo diário consolidado
- 🟡 Importação/backup com versão de schema explícita
- 🟡 Atualização PWA com estado instalado/disponível/atualizado
- 🟡 Relatórios Supershift e impressão A4 validados em mobile
- 🟡 Moovit com feedback de erro visível

### Critério de conclusão da 4.3.0
A 4.3.0 só deve ser marcada como concluída quando:
1. todos os botões críticos tiverem handler único e teste correspondente;
2. nenhum módulo ativo depender de ficheiros legado desnecessários;
3. versão, cache, pacote e documentação estiverem coerentes;
4. `npm run check` estiver verde;
5. houver smoke test manual no iPhone para Foco, Atividades, Backup, Moovit, Supershift e Atualização.

## 4.4.0 — Planeamento
- ⬜ Calendário unificado da aplicação
- 🟡 Atividades avançadas — subtarefas, prazo, recorrência, etiquetas, duplicação e mover amanhã implementados; falta ordenação manual
- ✅ Pesquisa global
- 🟡 Copiar/duplicar turnos e semanas — semana implementada; mês ainda falta
- 🟡 Resumos semanais e mensais mais completos — resumo mensal/anual da escala implementado; resumo semanal geral ainda falta

## 4.5.0 — Dados e robustez
- ⬜ IndexedDB
- ⬜ Migração transacional
- ⬜ Histórico de backups
- ⬜ Recuperação após estado parcialmente gravado
- 🟡 Diagnóstico técnico avançado — base implementada; ainda falta análise de integridade mais profunda

## 5.0 — Sincronização opcional
- ⬜ Conta/autenticação
- ⬜ Sincronização entre dispositivos
- ⬜ Backend de notificações Web Push
- ⬜ Estratégia de privacidade e eliminação de conta/dados

## Fora de escopo imediato
- 🚫 Copiar funcionalidades proprietárias do Supershift que exigem API/backend privado
- 🚫 Inventar URL schemes não documentados para aplicações externas
- 🚫 Automatizar pausas ou jornadas sem confirmação quando isso puder falsificar o registo real
