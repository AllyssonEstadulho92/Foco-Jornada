# TODO

Atualizado em: 2026-09-05

## P0 — Alteração atual

- [x] Alterar **Eliminar** para retirar o horário da lista ativa imediatamente.
- [x] Preservar o registo técnico com tombstone em vez de apagar referências usadas por tomas anteriores.
- [x] Eliminar também sucessores futuros da mesma cadeia de horário.
- [x] Criar testes para remoção imediata, horário criado no próprio dia e sucessor futuro.
- [x] Separar histórico em **Resumo** e **Detalhes técnicos**.
- [x] Ocultar pontos de proteção automáticos no resumo.
- [x] Limitar o número inicial de eventos e adicionar **Ver mais / Mostrar menos**.
- [x] Confirmar workflow **Qualidade**: auditoria, typecheck, lint, testes, build e smoke test.
- [x] Integrar em `main` através do PR #186.
- [x] Confirmar publicação no GitHub Pages.

## P1 — Validação de interface em dispositivo real

- [ ] Testar o deslize num iPhone real, incluindo scroll vertical da página.
- [ ] Confirmar que um horário eliminado desaparece imediatamente sem apresentar **Termina hoje**.
- [ ] Confirmar o seletor **Resumo / Detalhes técnicos** e a paginação do histórico em ecrã pequeno.
- [ ] Testar em Android/Chrome e tablet.
- [ ] Verificar VoiceOver/TalkBack e navegação por teclado através do menu `···`.
- [ ] Confirmar contraste no modo claro/escuro e em `forced-colors`.

## P2 — Melhoria futura

- [ ] Avaliar um indicador discreto de que a linha admite deslize sem aumentar ruído visual.
- [ ] Avaliar um filtro adicional por tipo de evento apenas se o volume de histórico funcional justificar.
