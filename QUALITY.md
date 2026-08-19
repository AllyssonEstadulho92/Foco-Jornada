# Qualidade — 4.2.0

Critérios: sintaxe JavaScript válida, manifesto JSON válido, testes de domínio, testes das integrações/horários, persistência local, timers por timestamp, migração v3→v4 e coerência da versão pública.

A suite ativa é executada por `npm run check` e inclui `tests/core.test.mjs`, `tests/features.test.mjs` e `tests/version.test.mjs`.

## Horários e pausa
- Segunda a sábado: 08:00–17:00, pausa prevista 12:00–13:00.
- Domingo: 09:00–18:00, pausa prevista 13:00–14:00.
- A pausa é lembrada automaticamente, mas o início permanece manual para não alterar falsamente o tempo efetivo.

## Integrações
- Moovit: deep links oficiais para direções e transportes próximos.
- Supershift: exportação `.ics` para calendário externo; não é usado nenhum esquema/deep link não documentado.
- A aplicação não faz tracking de localização em background.
- Casa e Trabalho ficam em `localStorage`.

## Estabilidade
- O runtime público usa `stability.js` e `ux.js`.
- Não existe polling visual para ícones ou versão.
- As funcionalidades adicionais redesenham apenas componentes necessários.
- O Service Worker mantém atualização controlada pelo utilizador.

O smoke test em dispositivo real continua necessário após cada publicação; testes automatizados não substituem validação no Safari/PWA do iPhone.
