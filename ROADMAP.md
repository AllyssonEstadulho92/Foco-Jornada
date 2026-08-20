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
- ✅ Atalhos contextuais para Atividades, Modo Foco, Supershift e Moovit
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
- ✅ Associação opcional ao Modo Foco
- ⬜ Ordenação manual

### Modo Foco
- ✅ Nova interface `focus-mode.js` sem ciclo automático Pomodoro
- ✅ Sessão única por timestamp
- ✅ Pausar e retomar
- ✅ Concluir manualmente ou ao terminar o temporizador
- ✅ Associação opcional a atividade
- ✅ Utilização sem atividade criada
- ✅ Botão para criar atividade a partir do próprio ecrã Foco
- ✅ Quando necessário, fluxo explícito “Iniciar jornada + sessão”
- ✅ Duração principal configurável em Definições
- ✅ Objetivo diário em minutos
- ✅ Progresso diário em minutos
- ✅ Lista de sessões recentes
- ✅ Estados Pomodoro antigos continuam legíveis para permitir encerramento seguro
- ✅ Ciclo automático foco → pausa → foco removido
- ✅ `focus-entry.js` removido do runtime e do deploy
- 🟡 Smoke test físico final no iPhone

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
- ✅ Proteção contra gravações parciais que removam silenciosamente `shiftPlanner`
- 🟡 Teste físico completo de toque/partilha/persistência no iPhone
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
- ✅ Espelho automático de recuperação para estado principal e Supershift
- ✅ Espelho de recuperação adicional em IndexedDB
- ✅ Pedido de armazenamento persistente quando suportado pelo browser
- ✅ Fluxo “Instalar aplicação” com prompt nativo e instruções específicas para iPhone
- ✅ Preferências do Modo Foco preservadas no ramo de funcionalidades protegido
- 🟡 Notificações de sistema no iPhone dependem das permissões e do modo PWA
- ⬜ Histórico de backups manuais
- ⬜ Backup parcial por módulo
- 🟡 IndexedDB para dados operacionais — atualmente usado como espelho de recuperação; ainda não é o armazenamento principal
- ⬜ Sincronização entre dispositivos
- ⬜ Backend/autenticação

## 4.3.0 — Consolidação e estabilidade — EM CURSO

Objetivo: reduzir remendos acumulados, tornar os fluxos críticos testáveis e estabilizar o runtime antes de acrescentar módulos grandes.

### Arquitetura
- 🟡 Incorporar progressivamente regras de `runtime-fixes.js`, `summary-guard.js`, `shift-reports.js` e `shift-mobile-interactions.js` nos módulos definitivos
- ✅ Atividades têm proprietário funcional em `app.js` + `productivity-core.js`; `runtime-fixes.js` não intercepta este fluxo
- ✅ Interface Foco reconstruída em `focus-mode.js` + `focus-mode-core.js`
- ✅ `focus-entry.js` eliminado
- ✅ `productivity-core.js` já não importa camadas de UI e deixou de criar fases automáticas Pomodoro
- 🟡 Operações base de pausar/retomar/concluir foco ainda reutilizam os handlers de estado do `app.js`; consolidar numa API pública única numa revisão futura
- ✅ Núcleo puro `shift-advanced-core.js` para cópia, intervalos e resumos da escala
- ✅ Núcleo puro `professional-core.js` para Centro de Comando, Pesquisa Global e Diagnóstico
- ✅ Núcleo `productivity-core.js` para recorrência, subtarefas e duplicação
- ✅ Camada `persistence.js` carregada antes do runtime para recuperação e proteção das gravações locais
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
- ✅ Testes de fluxo para recorrência, subtarefas e duplicação
- ✅ Testes específicos do Modo Foco sem ciclo automático
- ✅ Testes estáticos para recuperação de dados e instalação PWA
- ⬜ Testes DOM de clique/toque
- ⬜ Smoke test Safari/PWA documentado por release
- ⬜ Teste de instalação/atualização offline em dispositivo físico

### Fluxos a fechar na 4.3.0
- 🟡 Modo Foco e atividades: fluxo reconstruído; falta validação física no iPhone
- 🟡 Resumo diário consolidado
- 🟡 Importação/backup com versão de schema explícita
- 🟡 Atualização PWA com estado instalado/disponível/atualizado
- 🟡 Relatórios Supershift e impressão A4 validados em mobile
- 🟡 Moovit com feedback de erro visível
- 🟡 Persistência e instalação: implementadas; falta smoke test de fechar/reabrir e instalar no iPhone

### Critério de conclusão da 4.3.0
A 4.3.0 só deve ser marcada como concluída quando:
1. todos os botões críticos tiverem handler único e teste correspondente;
2. nenhum módulo ativo depender de ficheiros legado desnecessários;
3. versão, cache, pacote e documentação estiverem coerentes;
4. `npm run check` estiver verde;
5. houver smoke test manual no iPhone para Modo Foco, Atividades, Backup, Moovit, Supershift, Persistência, Instalação e Atualização.

## 4.4.0 — Planeamento
- ⬜ Calendário unificado da aplicação
- 🟡 Atividades avançadas — subtarefas, prazo, recorrência, etiquetas, duplicação e mover amanhã implementados; falta ordenação manual
- ✅ Pesquisa global
- 🟡 Copiar/duplicar turnos e semanas — semana implementada; mês ainda falta
- 🟡 Resumos semanais e mensais mais completos — resumo mensal/anual da escala implementado; resumo semanal geral ainda falta

## 4.5.0 — Dados e robustez
- 🟡 IndexedDB — espelho de recuperação implementado; migração dos dados operacionais ainda falta
- ⬜ Migração transacional
- ⬜ Histórico de backups manuais
- ✅ Recuperação automática quando o estado principal local fica ausente/corrompido e existe espelho válido
- ✅ Proteção de ramos importantes das features contra gravações parciais
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
