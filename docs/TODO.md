# TODO

Atualizado em: 2026-09-07

## P0 — Correção de turnos noturnos

- [x] Reproduzir logicamente o erro de entrada antecipada num turno **22:00–06:00**.
- [x] Corrigir a normalização temporal para não deslocar **21:00** para o dia seguinte.
- [x] Preservar a associação de horas após a meia-noite, como **02:00** e **07:00**, à manhã seguinte.
- [x] Criar teste de regressão para entrada **21:00** num turno planeado **22:00–06:00**.
- [x] Criar teste de regressão para saída **07:00** num turno planeado **22:00–06:00**.
- [x] Confirmar workflow **Qualidade**: auditoria, typecheck, lint, testes, build e smoke test.
- [x] Rever o diff final e integrar em `main` através do PR #189.
- [x] Confirmar workflow **Qualidade** de `main` após integração.
- [x] Confirmar publicação oficial em GitHub Pages após integração.
- [ ] Validar manualmente um registo real de turno noturno com entrada antecipada.
- [ ] Validar manualmente um registo real de turno noturno com saída tardia.

## P1 — Integrações e distribuição

- [ ] Rever o check externo **Workers Builds: foco-jornada**, que falhou no PR #189 e no commit integrado em `main`.
- [ ] Se Cloudflare Workers não fizer parte da arquitetura pretendida, remover/desativar a integração no serviço para evitar checks falhados sem utilidade.
- [ ] Se Cloudflare Workers for necessário, consultar os logs do Cloudflare e documentar build, output e estratégia de publicação antes de o considerar caminho suportado.

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