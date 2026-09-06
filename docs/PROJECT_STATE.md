# Estado do Projeto

Atualizado em: 2026-09-07

## Estado atual

A integração nativa do **Foco & Jornada** com iPhone continua isolada na branch `feat/ios-native-timer-bridge` e no PR #187, ainda em draft.

A aplicação Web/PWA permanece a fonte funcional e de dados. A camada iOS usa SwiftUI/WKWebView, ActivityKit, WidgetKit e AlarmKit para apresentar jornada, pausas e foco no sistema Apple sem duplicar as regras de negócio.

## Integração iOS implementada

- Contrato Web -> iOS versão 1 baseado em timestamps persistidos.
- Bridge `window.webkit.messageHandlers.focoJornadaTimer.postMessage(...)` limitado à origem oficial.
- Shell SwiftUI/WKWebView.
- ActivityKit para jornada e estados contínuos.
- AlarmKit em iOS 26+ para foco/Pomodoro e pausas com duração definida.
- Widget Extension para Lock Screen e Dynamic Island.
- Fallback para iOS 18–25.
- Testes unitários do contrato temporal.
- Privacy manifest para a utilização nativa de `UserDefaults` com razão Apple `CA92.1`.

## Preparação de assinatura/TestFlight

- `MARKETING_VERSION` e `CURRENT_PROJECT_VERSION` passam a controlar a versão da app e da extensão.
- Foi criado `ios/scripts/archive.sh` para gerar um archive Release assinado, recebendo `DEVELOPMENT_TEAM` apenas por ambiente local.
- Certificados, perfis de provisioning, `.ipa`, `.xcarchive` e materiais de assinatura estão excluídos do Git.
- Foi criada a documentação `docs/IOS-DISTRIBUTION.md` com o procedimento de instalação física, archive, validação e TestFlight.
- A primeira distribuição será manual pelo Xcode Organizer; automação de upload fica para uma fase posterior.

## Segurança e integridade

- A integração não controla a aplicação Relógio da Apple.
- O domínio Web continua a ser a fonte de verdade.
- Mensagens nativas são aceites apenas do frame principal e da origem HTTPS autorizada.
- IDs, timestamps, estados e durações são validados.
- Não foram adicionados tokens, passwords, certificados ou chaves ao repositório.
- A PWA continua funcional sem bridge nativo.

## Validação concluída

Antes desta preparação de distribuição, os workflows **Qualidade** e **Qualidade iOS** do PR #187 terminaram com sucesso, incluindo compilação Swift/Xcode com Xcode 26.6 e SDK iOS 26.

As novas alterações de distribuição ainda devem passar novamente pelos workflows do PR antes de serem consideradas validadas.

## Limitações e bloqueadores

1. Assinatura final exige uma equipa Apple Developer real configurada no Xcode.
2. O registo da app deve existir no App Store Connect antes do upload.
3. Falta confirmar/adicionar o ícone final da aplicação para distribuição.
4. Lock Screen, Dynamic Island, AlarmKit e permissões exigem teste num iPhone físico.
5. `WKWebView` e Safari/PWA não partilham automaticamente o mesmo armazenamento local; a migração do cofre continua pendente.

## Última alteração

Preparada a fase de instalação assinada e TestFlight sem incorporar identidade Apple ou segredos no código: versionamento de build, privacy manifest, archive script, regras de `.gitignore` e documentação de distribuição.

## Próximo passo

1. Confirmar os workflows da branch após estas alterações.
2. Num Mac, configurar a equipa Apple no Xcode e gerar o primeiro archive assinado.
3. Instalar num iPhone real e executar a matriz de testes físicos.
4. Criar/confirmar o registo no App Store Connect e validar o archive no Organizer.
5. Só depois disponibilizar a build a testers internos via TestFlight e retirar o PR #187 de draft.
