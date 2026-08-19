# Qualidade — 4.2.0

Critérios: sintaxe JavaScript válida, manifesto JSON válido, testes de domínio, testes das funções de Transportes/previsão, IDs HTML únicos, persistência local, timers por timestamp, migração v3→v4 e coerência da versão pública.

A suite ativa é executada por `npm run check` e inclui `tests/core.test.mjs`, `tests/features.test.mjs` e `tests/version.test.mjs`.

## Segurança e estabilidade
- O runtime público carrega `stability.js` em vez da antiga camada `enhancements.js`.
- Não existe polling de DOM para ícones ou versão.
- O módulo Transportes não faz tracking em background.
- Casa e Trabalho ficam guardados apenas em `localStorage`.
- O Moovit é aberto através dos deep links oficiais; horários e rotas não são inventados pela Foco & Jornada.
- O Service Worker 4.2.0 aguarda confirmação do utilizador antes de assumir uma atualização, através do sino de notificações.

O smoke test visual em dispositivo real continua a ser necessário após cada publicação; testes automatizados não substituem validação no Safari/PWA do iPhone.
