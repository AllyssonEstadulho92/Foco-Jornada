# Qualidade — 4.1.2

Critérios: sintaxe JS válida, manifesto JSON válido, testes de domínio, coerência da versão pública, IDs HTML únicos, persistência local, timers por timestamp, migração v3→v4 e publicação PWA.

## UX mobile
- `ux.js` é o entrypoint público e não depende de CDN.
- Zoom automático dos inputs no iPhone é prevenido e a viewport está configurada em modo de aplicação.
- Toasts inferiores são ocultados e convertidos em notificações internas.
- O sino apresenta ponto vermelho enquanto existirem notificações não lidas.
- Ícones são SVG locais; não existe dependência do Flaticon ou de outro serviço externo.
- As animações são curtas, acionadas por interação e desativadas com `prefers-reduced-motion`.

## Validação
A suite ativa é executada com `npm run check` e inclui testes de domínio e testes de coerência da versão/entrypoint UX.

O smoke test via Chromium headless ficou anteriormente bloqueado por limitação do ambiente de execução (DBus/processo), pelo que não é marcado como PASS sem nova execução verificável.

A numeração histórica da Especificação Mestre até 1121 não está integralmente disponível no repositório atual. Não devem ser alegados requisitos literais não confrontados com uma fonte recuperável.
