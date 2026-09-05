# Estado do Projeto

Atualizado em: 2026-09-05

## Estado atual

A área **Medicamentos > Tomas programadas** possui agora uma interação de deslize horizontal inspirada nos padrões iOS/Outlook. Cada toma pode revelar duas ações ocultas: **Definir** e **Eliminar**.

A implementação foi integrada em `main` através do PR #185 depois de o workflow **Qualidade** concluir com sucesso a auditoria de dependências, verificação de tipos, lint, testes, build e smoke test de arranque no browser.

## Comportamento implementado

- Deslizar a linha para a esquerda revela as ações ocultas.
- **Definir** abre um diálogo para alterar hora e quantidade.
- A nova definição entra em vigor no dia seguinte, preservando a ocorrência do dia atual.
- **Eliminar** não apaga o registo histórico: termina a validade do horário no dia atual.
- O menu `···` existente continua disponível como alternativa para teclado, rato e ações de correção/histórico.
- A operação continua a passar pelo fluxo `run(...)` da página, que recarrega os dados e atualiza os mecanismos de proteção existentes.

## Validação concluída

- Auditoria de dependências: aprovada, sem vulnerabilidades reportadas pelo workflow.
- TypeScript/typecheck: aprovado.
- Lint: aprovado.
- Testes automatizados: aprovados.
- Build: aprovado.
- Smoke test de arranque no browser: aprovado.
- Testes específicos confirmam que a definição cria um sucessor sem apagar o horário anterior e que a eliminação termina a validade sem remover o registo.

## Limitação de validação

O gesto ainda deve ser confirmado manualmente num dispositivo tátil real para avaliar sensação do deslize, coexistência com o scroll vertical e ergonomia em iPhone/iPad e Android. Esta validação física não pode ser substituída pelo ambiente automatizado do GitHub Actions.

## Última alteração

Integração em `main` das ações por deslize, diálogo de definição/eliminação, serviço de versionamento de horários e respetivos testes.

## Próximo passo

1. Confirmar o comportamento do gesto num iPhone/iPad real.
2. Confirmar Android/Chrome e tablet.
3. Validar VoiceOver/TalkBack e contraste em condições reais de utilização.
