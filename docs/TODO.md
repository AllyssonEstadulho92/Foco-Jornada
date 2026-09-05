# TODO

Atualizado em: 2026-09-05

## P0 — Antes de integrar

- [ ] Confirmar workflow **Qualidade**: auditoria de dependências, typecheck, lint, testes, build e smoke test.
- [ ] Corrigir qualquer erro introduzido pela interação de deslize.
- [ ] Confirmar que `Definir` preserva o horário atual e cria apenas um sucessor.
- [ ] Confirmar que `Eliminar` termina o horário sem remover o registo da base de dados.

## P1 — Validação de interface

- [ ] Testar o deslize num iPhone real, incluindo scroll vertical da página.
- [ ] Testar em Android/Chrome e tablet.
- [ ] Verificar VoiceOver/TalkBack e navegação por teclado através do menu `···`.
- [ ] Confirmar contraste no modo claro/escuro e em `forced-colors`.

## P2 — Melhoria futura

- [ ] Avaliar um indicador discreto de que a linha admite deslize sem aumentar ruído visual.
- [ ] Considerar um fluxo explícito para reativar um horário terminado, se existir necessidade funcional confirmada.
