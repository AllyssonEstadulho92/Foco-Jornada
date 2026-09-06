# TODO

Atualizado em: 2026-09-06

## P0 — Integração iPhone / timers nativos

- [x] Especificar o contrato Web -> iOS antes de implementar.
- [x] Manter timestamps persistidos como fonte de verdade.
- [x] Adicionar bridge WebKit opcional e seguro.
- [x] Sincronizar jornada, pausa e foco ativos a partir dos repositórios existentes.
- [x] Criar shell SwiftUI/WKWebView sem reescrever a aplicação.
- [x] Implementar ActivityKit para jornada/estados contínuos.
- [x] Implementar AlarmKit em iOS 26+ para countdowns com deadline real.
- [x] Adicionar Widget Extension para Lock Screen/Dynamic Island.
- [x] Adicionar fallback para iOS 18–25 sem forçar nova permissão de notificações.
- [x] Adicionar testes TypeScript para o contrato temporal.
- [x] Documentar segurança, arquitetura, limitações e instalação iOS.
- [ ] Confirmar quality gates Web no Pull Request.
- [ ] Compilar a camada Swift num Mac com Xcode/SDK iOS 26.

## P1 — Validação em iPhone real

- [ ] Gerar o projeto com XcodeGen e configurar assinatura Apple.
- [ ] Instalar num iPhone físico.
- [ ] Validar **Iniciar jornada** -> Live Activity.
- [ ] Validar pausa planeada -> countdown AlarmKit.
- [ ] Validar Pomodoro -> countdown AlarmKit.
- [ ] Validar pausa/retoma de foco sem divergência de tempo.
- [ ] Bloquear o iPhone e confirmar Lock Screen/Dynamic Island.
- [ ] Validar fim do countdown e alerta do sistema.
- [ ] Testar autorização AlarmKit aceite e recusada.
- [ ] Testar num equipamento sem Dynamic Island.
- [ ] Testar iOS 18–25 para fallback ActivityKit/notificação local.
- [ ] Testar VoiceOver, Dynamic Type e contraste.

## P1 — Migração de dados PWA -> app nativa

- [ ] Auditar os mecanismos de backup/exportação já existentes.
- [ ] Definir um formato de transferência cifrado/verificável do cofre.
- [ ] Implementar importação sem apagar a origem antes da validação.
- [ ] Testar migração, rollback e perfis múltiplos.
- [ ] Só depois considerar a app nativa substituta da PWA instalada.

## P1 — Validação anterior de interface

- [ ] Testar o deslize de medicação num iPhone real, incluindo scroll vertical.
- [ ] Confirmar o seletor **Resumo / Detalhes técnicos** e a paginação em ecrã pequeno.
- [ ] Testar em Android/Chrome e tablet.
- [ ] Verificar VoiceOver/TalkBack e navegação por teclado através do menu `···`.

## P2 — Evolução nativa futura

- [ ] Avaliar App Intents para ações bidirecionais no Lock Screen apenas depois de existir sincronização transacional segura.
- [ ] Avaliar distribuição TestFlight/App Store quando assinatura, dados e testes físicos estiverem estabilizados.
- [ ] Avaliar indicador discreto de deslize na área de medicação sem aumentar ruído visual.
