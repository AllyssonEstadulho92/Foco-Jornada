# Estado do Projeto

Atualizado em: 2026-09-05

## Estado atual

A área **Medicamentos > Tomas programadas** possui interação de deslize horizontal inspirada nos padrões iOS/Outlook. Cada toma pode revelar as ações **Definir** e **Eliminar**.

A melhoria de eliminação imediata e histórico simplificado foi integrada em `main` através do PR #186 e publicada no GitHub Pages.

## Comportamento implementado

- Deslizar a linha para a esquerda continua a revelar **Definir** e **Eliminar**.
- **Definir** mantém o comportamento anterior: a nova hora/quantidade entra em vigor no dia seguinte.
- **Eliminar** remove imediatamente o horário da lista de tomas e impede novas ocorrências desse horário.
- A eliminação é lógica: o registo técnico permanece guardado com `deletedAt` para manter as referências históricas de tomas e correções.
- Se já existir uma definição futura do mesmo horário, a eliminação remove também essa cadeia futura para impedir que o horário reapareça no dia seguinte.
- O texto **“Termina hoje”** deixa de ser consequência da ação **Eliminar** porque o horário eliminado já não é devolvido como ativo no próprio dia.
- O histórico abre por defeito em **Resumo**, ocultando pontos de proteção automáticos.
- **Detalhes técnicos** continua disponível para consultar checkpoints e auditoria técnica.
- O resumo apresenta eventos funcionais como **Horário adicionado**, **Horário alterado**, **Horário eliminado** e eventos de toma.
- O histórico mostra inicialmente cinco eventos e permite **Ver mais eventos / Mostrar menos** para evitar listas extensas.

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
- Workflow **Qualidade** após integração em `main`: aprovado.
- Workflow de publicação: aprovado.
- GitHub Pages para o build publicado: aprovado.

## Limitação de validação

A validação física do gesto e da apresentação do histórico continua pendente em iPhone/iPad e Android. O ambiente automatizado não substitui a avaliação tátil real.

## Última alteração

Eliminação imediata de horários com tombstone auditável e histórico visual dividido entre resumo funcional e detalhes técnicos, integrada e publicada.

## Próximo passo

Validar num dispositivo real que:

1. o deslize horizontal não interfere com o scroll vertical;
2. um horário eliminado desaparece imediatamente sem apresentar **Termina hoje**;
3. o seletor **Resumo / Detalhes técnicos** e **Ver mais eventos** permanecem confortáveis em ecrã pequeno.
