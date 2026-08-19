# Qualidade — 4.2.0

Critérios: sintaxe JavaScript válida, manifesto JSON válido, testes de domínio, testes das funções de Transportes/previsão/horário, testes do hub e notificações, IDs HTML únicos, persistência local, timers por timestamp, migração v3→v4 e coerência da versão pública.

A suite ativa é executada por `npm run check` e inclui `tests/core.test.mjs`, `tests/features.test.mjs`, `tests/hub.test.mjs`, `tests/controls.test.mjs` e `tests/version.test.mjs`.

## Segurança e estabilidade
- O runtime público carrega `stability.js` em vez da antiga camada `enhancements.js`.
- O hub `hub.js` não cria `setInterval` nem polling contínuo.
- O botão Mais abre uma camada única e mantém acesso programático à página original de Definições/Backup.
- O módulo Vida pessoal / Tempo a dois foi retirado do runtime e da suite ativa; o ficheiro `couple.js` é apenas um shim temporário sem side effects para compatibilidade com caches antigos.
- O módulo Transportes não faz tracking em background.
- Casa e Trabalho ficam guardados apenas em `localStorage`.
- O Moovit é aberto através do deep link oficial `moovit://nearby`, com fallback oficial.
- O Supershift no Android tenta abrir o package público `app.supershift`; no iOS não é inventado qualquer URL scheme não documentado.
- A pausa principal é apenas sugerida: a aplicação notifica à hora prevista, mas o registo começa apenas após ação explícita do utilizador.
- O Service Worker 4.2.0 aguarda confirmação do utilizador antes de assumir uma atualização, através do sino de notificações.

## Arquitetura do hub
- Mobile: bottom sheet acima da barra inferior.
- Desktop: gaveta lateral.
- Aplicações principais: Moovit e Supershift.
- Ferramentas: horário/pausas, estatísticas, definições, backup/diagnóstico, notificações, atualizações e sobre.
- Estrutura preparada para novos módulos sem adicionar mais itens fixos à navegação inferior.

O smoke test visual em dispositivo real continua a ser necessário após cada publicação; testes automatizados não substituem validação no Safari/PWA do iPhone.