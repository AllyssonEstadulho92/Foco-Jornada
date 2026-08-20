# Foco & Jornada — Roadmap oficial

Referência de evolução do projeto a partir da base 4.2.x.

Estados: ✅ implementado · 🟡 parcial/validação · ⬜ por implementar · 🚫 fora de escopo.

## Base atual

### Experiência profissional
- ✅ Centro de Comando no ecrã Hoje com próxima ação, turno e atalhos.
- ✅ Pesquisa global por módulos, atividades e modelos de turno.
- ✅ Atalhos para Atividades, Planeamento, Supershift e Moovit.
- ✅ Diagnóstico técnico com ligação, modo PWA, Service Worker, notificações, armazenamento e contagens.
- ✅ Atalho `Ctrl/Cmd + K` em desktop.
- 🟡 Validação visual final em iPhone.

### Jornada e tempo
- ✅ Entrada e saída da jornada.
- ✅ Edição, cancelamento e reabertura.
- ✅ Cálculo por timestamps.
- ✅ Pausa de ecrã e pausa principal.
- ✅ Horário semanal e previsão de saída.
- 🟡 Fecho/resumo diário a consolidar no núcleo principal.

### Atividades
- ✅ Criar, editar, iniciar, pausar, concluir e cancelar.
- ✅ Prioridade, categoria, estimativa, pesquisa e filtros.
- ✅ Subtarefas, data planeada, data limite, recorrência e etiquetas.
- ✅ Duplicar e mover para amanhã.
- ✅ Filtros Hoje e Atrasadas.
- ⬜ Ordenação manual.

### Planeamento
- ✅ Vista pública autónoma `planning`.
- ✅ Estado da jornada.
- ✅ Contagem de atividades abertas, para hoje e atrasadas.
- ✅ Lista de prioridades.
- ✅ Atalhos para Atividades, Supershift, Histórico e Hoje.
- ✅ Um único ícone de Planeamento em navegação, ações rápidas, hub e pesquisa.
- ✅ Substituição do antigo módulo de sessões na interface, ajuda, pesquisa, diagnóstico e publicação.
- 🟡 Smoke test físico final no iPhone.

### Café
- ✅ Registo e desfazer.
- ✅ Preço configurável em cêntimos.
- ✅ Métricas de quantidade e gasto.
- 🟡 Consolidar o default de 0,40 € diretamente no núcleo base.

### Histórico e estatísticas
- ✅ Timeline diária.
- ✅ Gestão de jornadas no histórico.
- ✅ Estatísticas 7 dias / 30 dias / ano.
- ✅ Métricas atuais centradas em trabalho, jornadas, atividades e café.
- 🟡 Rever impressão A4 em iPhone.

### Supershift / Escala
- ✅ Calendário mensal, edição de dias e modelos de turnos.
- ✅ Trabalhos, rotações, relatórios de horas e ganhos.
- ✅ Exportação ICS e impressão/PDF A4.
- ✅ Copiar turno para o dia seguinte e copiar semana.
- ✅ Férias, Falta, Baixa médica, Folga e Feriado por intervalo.
- ✅ Resumo mensal e anual.
- 🟡 Copiar mês inteiro.
- 🟡 Teste físico completo de toque/partilha/persistência no iPhone.
- ⬜ Múltiplos trabalhos com cores no calendário.
- ⬜ Notas por dia.
- ⬜ Importação ICS.

### Moovit / Transportes
- ✅ Casa, Trabalho e localização atual.
- ✅ Planear rota e Perto de mim.
- ✅ Histórico recente e deep links oficiais.
- 🟡 Melhorar diagnóstico/fallback quando Moovit não está instalado.
- ⬜ Favoritos adicionais.
- ⬜ Botão contextual “Sair agora”.
- ⬜ Tempo estimado de viagem no resumo diário.

### Dados e PWA
- ✅ Backup JSON e importação com validação.
- ✅ Diagnóstico, reset e atualização controlada do Service Worker.
- ✅ Centro de notificações.
- ✅ Recuperação local e espelho IndexedDB.
- ✅ Pedido de armazenamento persistente quando suportado.
- ✅ Fluxo de instalação PWA com instruções para iPhone.
- ✅ Estruturas antigas preservadas apenas para migração/importação segura, sem exposição como módulos públicos.
- 🟡 Notificações de sistema no iPhone dependem das permissões e do modo PWA.
- ⬜ Histórico de backups manuais.
- ⬜ Backup parcial por módulo.
- ⬜ Sincronização entre dispositivos.
- ⬜ Backend/autenticação.

## 4.3.0 — Consolidação e estabilidade — EM CURSO

Objetivo: reduzir remendos acumulados, tornar fluxos críticos testáveis e estabilizar o runtime.

### Arquitetura
- 🟡 Incorporar progressivamente regras de `runtime-fixes.js`, `summary-guard.js`, `shift-reports.js` e `shift-mobile-interactions.js` nos módulos definitivos.
- ✅ Atividades têm proprietário funcional em `app.js` + `productivity-core.js`.
- ✅ Planeamento público em `planning-mode.js`.
- ✅ Módulos públicos antigos de sessões retirados do HTML, cache e deploy.
- ✅ Núcleo puro `shift-advanced-core.js` para cópia, intervalos e resumos da escala.
- ✅ Núcleo puro `professional-core.js` para Centro de Comando, Pesquisa Global e Diagnóstico.
- ✅ Camada `persistence.js` carregada antes do runtime.
- ✅ `enhancements.js` removido do runtime ativo.
- 🟡 Remover gradualmente compatibilidades internas antigas quando os backups existentes deixarem de as exigir.
- 🟡 Unificar versão pública e metadados numa única release.

### QA
- ✅ Testes de domínio.
- ✅ Auditoria estática de botões críticos.
- ✅ Testes de Planeamento, escala, relatórios, pesquisa, diagnóstico, persistência e instalação.
- ⬜ Testes DOM de clique/toque.
- ⬜ Smoke test Safari/PWA documentado por release.
- ⬜ Teste de instalação/atualização offline em dispositivo físico.

### Critério de conclusão da 4.3.0
1. todos os botões críticos com handler único e teste correspondente;
2. nenhum módulo público depender de ficheiros legados desnecessários;
3. versão, cache, pacote e documentação coerentes;
4. `npm run check` verde;
5. smoke test manual no iPhone para Hoje, Atividades, Planeamento, Backup, Moovit, Supershift, Persistência, Instalação e Atualização.

## 4.4.0 — Planeamento avançado
- ⬜ Calendário unificado da aplicação.
- 🟡 Atividades avançadas: falta ordenação manual.
- ✅ Pesquisa global.
- 🟡 Copiar/duplicar turnos: semana implementada; mês em falta.
- 🟡 Resumos semanais e mensais mais completos.

## 4.5.0 — Dados e robustez
- 🟡 IndexedDB como espelho de recuperação; migração operacional ainda em falta.
- ⬜ Migração transacional.
- ⬜ Histórico de backups manuais.
- ✅ Recuperação automática quando existe espelho válido.
- ✅ Proteção de ramos importantes das features contra gravações parciais.

## 5.0 — Sincronização opcional
- ⬜ Conta/autenticação.
- ⬜ Sincronização entre dispositivos.
- ⬜ Backend de notificações Web Push.
- ⬜ Estratégia de privacidade e eliminação de conta/dados.

## Fora de escopo imediato
- 🚫 Copiar funcionalidades proprietárias do Supershift que exijam API/backend privado.
- 🚫 Inventar URL schemes não documentados para aplicações externas.
- 🚫 Automatizar pausas ou jornadas sem confirmação quando isso puder falsificar o registo real.
