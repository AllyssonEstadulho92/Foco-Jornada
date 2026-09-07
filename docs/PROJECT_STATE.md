# Estado do Projeto

Atualizado em: 2026-09-07

## Estado atual

A correção do cálculo de horas em turnos noturnos foi integrada em `main` através do PR #189 no commit `90d19791f7892e51c5baf2c27967d53e7b464b8c`.

O problema confirmado ocorria quando um turno planeado atravessava a meia-noite e o período real começava antes da hora planeada ou terminava depois dela. Num turno **22:00–06:00**, por exemplo, uma entrada real às **21:00** podia ser deslocada para o dia seguinte pela normalização anterior. A duração total podia parecer plausível, mas a interseção com o turno planeado ficava errada, podendo classificar trabalho normal como horas extra e criar horas não trabalhadas inexistentes.

A normalização passa a escolher, para turnos noturnos, a representação temporal de cada hora civil mais próxima do intervalo planeado. Assim:

- **21:00–06:00** representa uma hora de entrada antecipada no próprio dia;
- **22:00–07:00** representa uma hora adicional na manhã seguinte;
- pausas e ocorrências após a meia-noite continuam associadas ao dia seguinte;
- turnos diurnos mantêm o comportamento anterior.

Foram adicionados testes de regressão para entrada antecipada e saída tardia.

## Estado anterior preservado — medicação

A área **Medicamentos > Tomas programadas** mantém o gesto de deslize horizontal, as ações **Definir** e **Eliminar**, eliminação lógica com `deletedAt`, preservação do histórico e separação entre **Resumo** e **Detalhes técnicos**. A melhoria correspondente continua integrada desde o PR #186.

## Segurança e integridade

A correção de turnos noturnos altera apenas a normalização temporal usada no cálculo. Não altera schema, IndexedDB, registos já guardados, autenticação, medicação ou referências históricas.

Na medicação, a eliminação continua sem `delete()` físico em `medicationSchedules`; os eventos antigos mantêm referências válidas para auditoria e correções.

## Validação concluída

Para o PR #189 e respetivo `main`:

- auditoria de dependências: aprovada;
- TypeScript/typecheck: aprovado;
- lint: aprovado;
- testes automatizados: aprovados;
- build: aprovado;
- smoke test de arranque no browser: aprovado;
- workflow **Qualidade** de `main`: aprovado;
- workflow **Publicar Foco & Jornada** / GitHub Pages: aprovado.

A distribuição oficial documentada permanece GitHub Pages.

## Observação operacional — Cloudflare Workers

O check externo **Workers Builds: foco-jornada**, fornecido pela integração Cloudflare, terminou com falha no commit do PR e novamente no commit integrado em `main`. O GitHub não expõe neste repositório a causa detalhada desse build externo; por isso não é possível confirmar se existe configuração incorreta, projeto Cloudflare obsoleto ou outra causa fora do código.

Este erro não bloqueou nem invalidou a distribuição oficial por GitHub Pages, que terminou com sucesso. Deve ser revisto separadamente: se Cloudflare não fizer parte da arquitetura pretendida, a integração deve ser removida/desativada no serviço; se fizer parte, é necessário consultar os logs do Cloudflare e definir explicitamente o respetivo pipeline.

## Validação física ainda pendente

- confirmar pelo menos um turno noturno real com entrada antes da hora planeada;
- confirmar pelo menos um turno noturno real com saída depois da hora planeada;
- testar o deslize de medicação em iPhone/iPad e Android;
- confirmar scroll vertical, histórico e acessibilidade em dispositivo real.

## Última alteração

Correção do alinhamento temporal de turnos que atravessam a meia-noite, integrada e publicada, com testes de regressão e documentação sincronizada com o estado real de `main`.

## Próximo passo

1. validar em uso real os dois cenários noturnos corrigidos;
2. validar fisicamente a interação de medicação ainda pendente;
3. decidir se a integração Cloudflare Workers é necessária e, consoante essa decisão, corrigir a configuração no Cloudflare ou removê-la para eliminar checks externos falhados sem utilidade.