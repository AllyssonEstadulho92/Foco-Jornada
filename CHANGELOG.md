# Changelog

## 4.2.0
- Nova área Transportes Públicos com Casa, Trabalho, localização atual e viagens recentes.
- Integração oficial com Moovit por `moovit://directions` e `moovit://nearby`.
- Integração Supershift por calendário externo/ICS, sem deep link não documentado.
- Horário semanal: segunda a sábado 08:00–17:00; domingo 09:00–18:00.
- Pausa prevista: 12:00–13:00 de segunda a sábado e 13:00–14:00 ao domingo.
- Lembrete automático da pausa com início manual pelo utilizador.
- Previsão da hora de saída com objetivo diário configurável e pausa principal.
- Resumo e fecho do dia com trabalho efetivo, pausas, foco, atividades e café.
- Backup passa a incluir as preferências e histórico do módulo Transportes.
- Atalhos PWA para Transportes e Foco.
- Atualização PWA controlada pelo centro de notificações, em vez de ativação silenciosa.
- Nova camada `stability.js`; `enhancements.js` deixa de fazer parte do runtime público.
- Novo hub oculto no botão Mais: Moovit, Supershift, horário, estatísticas, definições, backup/diagnóstico, notificações, atualizações e sobre.
- Hub apresentado como bottom sheet no mobile e gaveta lateral no desktop, preparado para módulos futuros sem aumentar a barra inferior.

## 4.1.2
- UX mobile com viewport estática, centro de notificações e ícones SVG locais.
- Ícones animados apenas por interação e botão eliminar maior/centrado.

## 4.1.1
- Estabilização da interface e atualização dos temporizadores sem reconstrução visual completa por segundo.

## 4.0.0
- Reconstrução modular da base, migração v3, jornada avançada, atividades, Pomodoro, estatísticas e PWA.
