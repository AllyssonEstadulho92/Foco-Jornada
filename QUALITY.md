# Qualidade — 4.1.1

Critérios: sintaxe JS válida, manifesto JSON válido, testes de domínio, IDs HTML únicos, persistência local, timers por timestamp, migração v3→v4 e coerência de versão entre pacote, interface, camada de estabilidade e Service Worker.

Resultado de referência: 15/15 testes de domínio em `tests/core.test.mjs`. O ficheiro `tests/app.test.cjs` pertence à arquitetura antiga com script inline e não faz parte da suite ativa da versão modular; não deve ser apresentado como validação atual.

O smoke test via Chromium headless ficou anteriormente bloqueado por limitação do ambiente de execução (DBus/processo), pelo que não é marcado como PASS sem nova execução verificável.

A numeração histórica da Especificação Mestre até 1121 não está integralmente disponível no repositório atual. Por isso, não devem ser acrescentados requisitos funcionais que dependam da redação literal dessa especificação sem uma fonte recuperável. A conformidade continua a ser registada por módulo e comportamento, sem alegar cobertura de requisitos cuja redação original não pôde ser confrontada.
