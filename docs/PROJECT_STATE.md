# Estado do Projeto

Atualizado em: 2026-09-05

## Estado atual

A área **Medicamentos > Tomas programadas** recebeu uma interação de deslize horizontal inspirada nos padrões iOS/Outlook. Cada toma pode revelar duas ações ocultas: **Definir** e **Eliminar**.

A implementação está isolada na branch `feature/medication-swipe-actions` enquanto decorre a validação automática antes da integração em `main`.

## Comportamento implementado

- Deslizar a linha para a esquerda revela as ações ocultas.
- **Definir** abre um diálogo para alterar hora e quantidade.
- A nova definição entra em vigor no dia seguinte, preservando a ocorrência do dia atual.
- **Eliminar** não apaga o registo histórico: termina a validade do horário no dia atual.
- O menu `···` existente continua disponível como alternativa para teclado, rato e ações de correção/histórico.
- A operação continua a passar pelo fluxo `run(...)` da página, que recarrega os dados e atualiza os mecanismos de proteção existentes.

## Problemas conhecidos

Nenhum problema funcional confirmado nesta alteração. Antes de considerar a tarefa concluída é obrigatório confirmar o workflow de qualidade e validar o gesto num dispositivo tátil real.

## Última alteração

Implementação das ações por deslize, diálogo de definição/eliminação e serviço de versionamento de horários.

## Próximo passo

1. Confirmar `typecheck`, lint, testes, build e smoke test no GitHub Actions.
2. Corrigir qualquer regressão encontrada.
3. Integrar em `main` apenas com a validação automática aprovada.
4. Confirmar o comportamento de deslize em iPhone/iPad e Android.
