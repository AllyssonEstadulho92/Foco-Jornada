# TODO

Atualizado em: 2026-09-07

## P0 — Correção atual: turnos noturnos

- [x] Reproduzir logicamente o erro de entrada antecipada num turno **22:00–06:00**.
- [x] Corrigir a normalização temporal para não deslocar **21:00** para o dia seguinte.
- [x] Preservar a associação de horas após a meia-noite, como **02:00** e **07:00**, à manhã seguinte.
- [x] Criar teste de regressão para entrada **21:00** num turno planeado **22:00–06:00**.
- [x] Criar teste de regressão para saída **07:00** num turno planeado **22:00–06:00**.
- [ ] Confirmar workflow **Qualidade**: auditoria, typecheck, lint, testes, build e smoke test.
- [ ] Rever o diff final e integrar em `main` apenas com CI verde.
- [ ] Validar manualmente um registo real de turno noturno com entrada antecipada e saída tardia.

## P1 — Validação de interface em dispositivo real

- [ ] Testar o deslize de medicação num iPhone real, incluindo scroll vertical da página.
- [ ] Confirmar que um horário eliminado desaparece imediatamente sem apresentar **Termina hoje**.
- [ ] Confirmar o seletor **Resumo / Detalhes técnicos** e a paginação do histórico em ecrã pequeno.
- [ ] Testar em Android/Chrome e tablet.
- [ ] Verificar VoiceOver/TalkBack e navegação por teclado através do menu `···`.
- [ ] Confirmar contraste no modo claro/escuro e em `forced-colors`.

## P2 — Melhoria futura

- [ ] Avaliar um indicador discreto de que a linha de medicação admite deslize sem aumentar ruído visual.
- [ ] Avaliar um filtro adicional por tipo de evento apenas se o volume de histórico funcional justificar.
- [ ] Acrescentar casos de teste noturnos adicionais se surgirem horários reais próximos do ponto médio entre o fim e o início do turno.