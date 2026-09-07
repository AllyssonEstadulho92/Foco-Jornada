# Estado do Projeto

Atualizado em: 2026-09-07

## Auditoria atual — horas de trabalho em turnos noturnos

Foi identificado um erro no motor `calculateWorkHours` quando um turno planeado atravessa a meia-noite e o período real começa antes da hora planeada ou termina depois da hora planeada.

Exemplo confirmado: num turno planeado **22:00–06:00**, uma entrada real às **21:00** era deslocada para o dia seguinte pela normalização anterior. O tempo total de presença continuava a poder parecer plausível, mas a interseção com o turno planeado ficava errada, podendo classificar trabalho normal como horas extra e criar horas não trabalhadas inexistentes.

A branch `fix/overnight-work-hours-audit` altera a normalização para escolher, em turnos noturnos, a representação temporal de cada hora mais próxima do intervalo planeado. Assim:

- **21:00–06:00** é interpretado como uma hora de entrada antecipada no próprio dia;
- **22:00–07:00** é interpretado como uma hora de saída adicional na manhã seguinte;
- pausas após a meia-noite continuam associadas ao dia seguinte;
- turnos diurnos mantêm a regra anterior.

Foram adicionados testes de regressão específicos para entrada antecipada e saída tardia em turno noturno.

## Estado anterior preservado

A área **Medicamentos > Tomas programadas** possui interação de deslize horizontal inspirada nos padrões iOS/Outlook. Cada toma pode revelar as ações **Definir** e **Eliminar**.

A melhoria de eliminação imediata e histórico simplificado foi integrada em `main` através do PR #186 e publicada no GitHub Pages.

## Comportamento implementado — medicação

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

A correção de turnos noturnos altera apenas a normalização temporal usada nos cálculos de horas; não altera o schema, a persistência nem os registos já guardados.

Na medicação, a eliminação não executa `delete()` físico em `medicationSchedules`. Os eventos antigos continuam a referir um `scheduleId` existente, preservando integridade, backups, correções e auditoria.

## Validação

### Concluída anteriormente

- Auditoria de dependências: aprovada.
- TypeScript/typecheck: aprovado.
- Lint: aprovado.
- Testes automatizados: aprovados.
- Build: aprovado.
- Smoke test de arranque no browser: aprovado.
- Workflow **Qualidade** do PR #186: aprovado.

### Pendente para esta correção

- Workflow **Qualidade** da branch `fix/overnight-work-hours-audit`.
- Confirmação de que os novos testes passam juntamente com toda a suite existente.
- Validação manual de um registo real de turno noturno com entrada antecipada e/ou saída após o fim planeado.

## Limitação de validação

A validação física do gesto de medicação continua pendente em iPhone/iPad e Android. Para horas de trabalho, os testes automatizados cobrem agora os dois casos de regressão identificados, mas não substituem a confirmação com dados reais do utilizador.

## Última alteração

Correção da associação de horas ao dia correto em turnos que atravessam a meia-noite, com testes de regressão para entrada antecipada e saída tardia.

## Próximo passo

1. Executar o workflow **Qualidade** da correção de turnos noturnos.
2. Rever o diff e integrar apenas se typecheck, lint, testes, build e smoke test ficarem verdes.
3. Validar no uso real pelo menos um turno noturno com entrada antes da hora e um com saída depois da hora.
4. Manter as validações físicas de medicação já pendentes.