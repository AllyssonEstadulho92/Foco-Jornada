# Auditoria de botões — Foco & Jornada

Estado após a revisão de 19/08/2026.

## Corrigido e verificado no código

- [x] Navegação principal: Hoje, Atividades, Foco, Histórico, Estatísticas e Mais.
- [x] Jornada: iniciar, terminar, pausas, regressar da pausa e café.
- [x] Atividades: criar, editar, iniciar, pausar, concluir, cancelar, duplicar, mover para amanhã e subtarefas.
- [x] Pomodoro: iniciar, pausar, retomar, terminar fase e iniciar jornada + foco.
- [x] Centro de Comando: “Regressar da pausa” executa `endBreak`; “Retomar foco” executa `resumeFocus`; “Iniciar jornada” executa `startWork`.
- [x] “Verificar dados” executa verificação estrutural real de jornada, pausas, foco, atividades, IDs e referências da escala.
- [x] Moovit: menu, Planear, Perto de mim e atalhos rápidos passam pelo handler autoritativo de `app-links.js`, carregado antes do runtime.
- [x] Teste de notificações: `interaction-fixes.js` é o proprietário efetivo e bloqueia a segunda captura do runtime.
- [x] Supershift desktop: calendário, turnos, relatórios, exportação e impressão.
- [x] Supershift mobile: editar dia, atribuir/remover turno, alterar horas, copiar para amanhã e copiar semana seguinte.
- [x] Definições: guardar valores e preferência de notificações.
- [x] Backup: exportar, importar e reset com confirmação.
- [x] Instalação PWA: instalar quando suportado e instruções específicas para iPhone.
- [x] Pesquisa global e diagnóstico profissional.

## Ainda requer validação física

- [ ] Smoke test completo no iPhone instalado como PWA.
- [ ] Confirmar deep link do Moovit com a aplicação Moovit instalada no dispositivo.
- [ ] Confirmar partilha/impressão A4 do Supershift no iPhone.
- [ ] Testes DOM automatizados de clique/toque para todos os controlos críticos.

> Esta auditoria distingue “handler presente e encadeado corretamente no código” de “validado fisicamente no iPhone”. Os itens físicos permanecem abertos até serem testados no dispositivo.
