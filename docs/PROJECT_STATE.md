# Estado do Projeto

Atualizado em: 2026-09-05

## Estado atual

A área **Medicamentos > Tomas programadas** possui interação de deslize horizontal inspirada nos padrões iOS/Outlook. Cada toma pode revelar as ações **Definir** e **Eliminar**.

A melhoria atual transforma **Eliminar** numa remoção imediata da lista ativa e simplifica o histórico visível ao utilizador. O workflow **Qualidade** concluiu com sucesso auditoria de dependências, typecheck, lint, testes, build e smoke test.

## Comportamento implementado nesta alteração

- Deslizar a linha para a esquerda continua a revelar **Definir** e **Eliminar**.
- **Definir** mantém o comportamento anterior: a nova hora/quantidade entra em vigor no dia seguinte.
- **Eliminar** remove imediatamente o horário da lista de tomas e impede novas ocorrências desse horário.
- A eliminação é lógica: o registo técnico permanece guardado com `deletedAt` para manter as referências históricas de tomas e correções.
- Se já existir uma definição futura do mesmo horário, a eliminação remove também essa cadeia futura para impedir que o horário reapareça no dia seguinte.
- O texto **“Termina hoje”** deixa de ser consequência da ação **Eliminar** porque o horário eliminado já não é devolvido como ativo no próprio dia.
- O histórico abre por defeito em **Resumo**, ocultando pontos de proteção automáticos.
- **Detalhes técnicos** continua disponível para consultar checkpoints e auditoria técnica.
- O resumo apresenta eventos funcionais como **Horário adicionado**, **Horário alterado**, **Horário eliminado** e eventos de toma.
- O histórico é paginado com **Ver mais eventos / Mostrar menos** para evitar listas extensas.

## Segurança e integridade

A eliminação não executa `delete()` físico em `medicationSchedules`. Os eventos antigos continuam a referir um `scheduleId` existente, preservando integridade, backups, correções e auditoria. O estado eliminado é representado por um tombstone lógico (`deletedAt`) e por uma validade encerrada antes do dia da eliminação para reutilizar os filtros existentes de agenda e previsão.

## Validação concluída

- Auditoria de dependências: aprovada.
- TypeScript/typecheck: aprovado.
- Lint: aprovado.
- Testes automatizados: aprovados.
- Build: aprovado.
- Smoke test de arranque no browser: aprovado.
- Testes específicos cobrem remoção imediata, preservação do registo técnico, horário criado no próprio dia e eliminação de sucessores futuros do mesmo horário.

## Limitação de validação

A validação física do gesto e da apresentação do histórico continua pendente em iPhone/iPad e Android. O ambiente automatizado não substitui a avaliação tátil real.

## Última alteração

Eliminação imediata de horários com tombstone auditável e histórico visual dividido entre resumo funcional e detalhes técnicos.

## Próximo passo

1. Integrar o PR da alteração em `main`.
2. Confirmar publicação no GitHub Pages.
3. Validar o gesto e a nova apresentação do histórico num dispositivo real.
