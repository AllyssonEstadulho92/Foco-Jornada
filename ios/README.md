# Foco & Jornada para iPhone

Esta pasta contém a camada nativa iOS que liga a aplicação Web existente às experiências do sistema Apple.

## O que está implementado

- SwiftUI como shell nativo.
- `WKWebView` a abrir a aplicação oficial em `https://allyssonestadulho92.github.io/Foco-Jornada/`.
- Bridge JavaScript -> Swift restrito ao domínio oficial e ao frame principal.
- ActivityKit para jornada e estados sem countdown AlarmKit.
- AlarmKit em iOS 26+ para pausas planeadas e foco/Pomodoro com deadline.
- Widget Extension para Lock Screen e Dynamic Island.
- Fallback para ActivityKit e notificação local já autorizada em iOS 18–25.
- Versionamento de distribuição por `MARKETING_VERSION` e `CURRENT_PROJECT_VERSION`.
- Privacy manifest para a utilização interna de `UserDefaults`.
- Script de archive assinado em `ios/scripts/archive.sh`.

## Requisitos

- macOS com uma versão do Xcode que inclua o SDK iOS 26 para compilar o código AlarmKit;
- XcodeGen para gerar o `.xcodeproj` a partir de `project.yml`;
- Apple ID configurado no Xcode para instalar num iPhone;
- para TestFlight/App Store, conta Apple Developer e registo da app no App Store Connect.

## Gerar o projeto Xcode

Na pasta `ios/`:

```bash
xcodegen generate
open FocoJornadaIOS.xcodeproj
```

No Xcode:

1. selecionar o target `FocoJornadaIOS`;
2. abrir **Signing & Capabilities**;
3. selecionar a equipa Apple em **Team**;
4. repetir a verificação no target `FocoJornadaWidgets`;
5. confirmar que os Bundle Identifiers estão disponíveis para essa equipa;
6. ligar o iPhone por cabo ou emparelhamento wireless;
7. escolher o iPhone como destino e executar.

## Criar um archive para distribuição

O Team ID não é guardado no repositório. Num Mac com a conta Apple configurada no Xcode:

```bash
DEVELOPMENT_TEAM=SEU_TEAM_ID \
MARKETING_VERSION=1.0.0 \
CURRENT_PROJECT_VERSION=1 \
bash ios/scripts/archive.sh
```

O `.xcarchive` é criado em `ios/Archives/`, que está excluída do Git. Depois, usa o Xcode Organizer para **Validate App** e, após a validação física, para enviar a build para App Store Connect/TestFlight.

O procedimento completo está em `docs/IOS-DISTRIBUTION.md`.

## Permissões

O projeto inclui `NSAlarmKitUsageDescription`. No primeiro uso de um countdown AlarmKit, o iOS pode pedir autorização para alarmes/temporizadores da aplicação.

Live Activities também dependem de estarem permitidas pelo utilizador nas definições do iPhone.

A implementação não força nem contorna recusas de permissões.

## Privacidade

O target da aplicação inclui `PrivacyInfo.xcprivacy` porque a camada nativa usa `UserDefaults` para guardar identificadores e deadline do temporizador do sistema. A razão declarada é `CA92.1`, limitada a informação acessível à própria aplicação.

O privacy manifest não substitui o questionário App Privacy do App Store Connect, que deve considerar o comportamento completo da aplicação.

## Dados existentes na PWA

Importante: `WKWebView` e Safari/PWA não partilham automaticamente o mesmo armazenamento local. O cofre criado na PWA instalada anteriormente não deve ser assumido como existente dentro da aplicação nativa.

Por segurança, esta fase **não tenta copiar IndexedDB/cookies/storage de Safari para a app nativa**. Antes de usar a versão nativa como substituição da PWA, deve ser validado um fluxo explícito de exportação/importação do cofre ou outra migração suportada pelo projeto.

Isto não elimina nem altera os dados já existentes na PWA.

## Segurança do bridge e assinatura

O handler nativo chama-se `focoJornadaTimer`. Só aceita mensagens:

- do frame principal;
- com origem HTTPS `allyssonestadulho92.github.io`;
- no contrato versão 1;
- com IDs, estados, timestamps e durações validados.

Links externos são enviados para o sistema em vez de serem carregados dentro da WebView.

Certificados, perfis de provisioning, `.p12`, `.mobileprovision`, `.ipa` e `.xcarchive` não devem ser enviados para o repositório. O `.gitignore` bloqueia os artefactos locais de assinatura/distribuição mais sensíveis.

## Limitação desta primeira fase

Os botões de controlo no Lock Screen/Dynamic Island não escrevem diretamente no domínio Web. O objetivo é impedir que o temporizador nativo e o registo persistido possam divergir.

Ações nativas bidirecionais podem ser adicionadas numa fase posterior com App Intents e um canal de sincronização explicitamente desenhado e testado.

## Testes físicos necessários

Antes de considerar a integração pronta para produção:

- iniciar/terminar jornada com o telefone bloqueado;
- iniciar pausa de 15 minutos e validar Lock Screen/Dynamic Island;
- iniciar, pausar e retomar Pomodoro;
- bloquear o telefone durante um countdown;
- validar alerta no fim do countdown;
- testar autorização AlarmKit aceite e recusada;
- testar num iPhone sem Dynamic Island;
- testar iOS 18–25 para o fallback;
- confirmar que bloquear o cofre da aplicação remove a apresentação nativa sem alterar os registos persistidos;
- validar migração de dados antes de substituir a PWA atual pela app nativa.

## TestFlight

Antes do primeiro upload ainda é necessário:

- criar/confirmar o registo da app no App Store Connect;
- selecionar a equipa Apple real no Xcode;
- confirmar o ícone final da aplicação;
- executar os testes físicos acima;
- validar o archive no Organizer.

O PR da integração deve permanecer separado de `main` até estes pontos estarem validados.
