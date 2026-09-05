# TODO

Atualizado em: 2026-09-05

## P0 — Integração concluída

- [x] Confirmar workflow **Qualidade**: auditoria de dependências, typecheck, lint, testes, build e smoke test.
- [x] Corrigir a falha inicial dos testes da interação de deslize no ambiente JSDOM.
- [x] Confirmar por teste que `Definir` preserva o horário atual e cria apenas um sucessor.
- [x] Confirmar por teste que `Eliminar` termina o horário sem remover o registo da base de dados.
- [x] Integrar o PR #185 em `main`.

## P1 — Validação de interface em dispositivo real

- [ ] Testar o deslize num iPhone real, incluindo scroll vertical da página.
- [ ] Testar em Android/Chrome e tablet.
- [ ] Verificar VoiceOver/TalkBack e navegação por teclado através do menu `···`.
- [ ] Confirmar contraste no modo claro/escuro e em `forced-colors`.

## P2 — Melhoria futura

- [ ] Avaliar um indicador discreto de que a linha admite deslize sem aumentar ruído visual.
- [ ] Considerar um fluxo explícito para reativar um horário terminado, se existir necessidade funcional confirmada.
