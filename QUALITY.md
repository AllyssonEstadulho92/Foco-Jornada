# Qualidade — base 4.2.x / consolidação 4.3.0

## Critérios atuais
- sintaxe JavaScript válida;
- testes de domínio e migração;
- testes de horário, transportes e Moovit;
- testes de hub e controlos;
- testes de escala, rotações, ICS e relatórios;
- auditoria estática de botões críticos;
- coerência da versão pública;
- timers derivados de timestamps;
- persistência local e diagnóstico.

A suite ativa é executada por `npm run check`.

## O que os testes ainda não provam
A suite atual não substitui um teste real de interface no Safari/PWA do iPhone. Continuam a exigir validação física:
- toque e edição do calendário da escala;
- permissões e apresentação de notificações;
- importação/exportação de ficheiros;
- folha de partilha e impressão/PDF A4;
- abertura do Moovit;
- atualização do Service Worker e recarregamento da PWA.

## Segurança e estabilidade
- O runtime usa `stability.js`; a antiga camada `enhancements.js` não faz parte da publicação e deve ser removida do repositório durante a consolidação.
- O módulo Vida pessoal / Tempo a dois está retirado.
- A pausa principal é sugerida, não iniciada automaticamente.
- Casa/Trabalho permanecem em armazenamento local.
- Não são inventados deep links privados para aplicações externas.
- O Service Worker aguarda ação do utilizador para assumir uma atualização quando existe uma nova versão em espera.

## Objetivos 4.3.0
- reduzir módulos corretivos e handlers duplicados;
- consolidar defaults e versão;
- adicionar testes DOM/E2E aos botões críticos;
- documentar um smoke test por release;
- garantir que `npm run check` e o smoke test mobile estão verdes antes de marcar a 4.3.0 como concluída.

Consultar `ROADMAP.md` e `docs/CONSOLIDATION-4.3.md`.
