# Arquitetura

Atualizado em: 2026-09-07

## Stack confirmada

### Web/PWA

- React 19 + TypeScript.
- Vite para desenvolvimento e build.
- Dexie/IndexedDB e cofre local cifrado para persistência.
- Vitest para testes automatizados.

### iOS nativo

- SwiftUI para a shell nativa.
- WebKit/`WKWebView` para executar a aplicação Web sem duplicar as regras de negócio.
- `WKScriptMessageHandler` para o bridge Web -> Swift.
- ActivityKit + WidgetKit para Live Activities.
- AlarmKit em iOS 26+ para countdowns de pausa e foco.
- UserNotifications apenas como fallback quando já existe autorização em iOS 18–25.
- XcodeGen para gerar de forma reproduzível o projeto Xcode a partir de `ios/project.yml`.
- `PrivacyInfo.xcprivacy` no target da aplicação para declarar a utilização de `UserDefaults` com razão `CA92.1`.

## Fonte de verdade temporal

Continua a aplicar-se a arquitetura existente: timers não acumulam segundos como fonte de verdade.

```text
Jornada: elapsed = now - startedAt
Pausa:   elapsed = now - startedAt
Foco:    elapsed = now - startedAt - pausas acumuladas
```

A camada nativa recebe timestamps absolutos e apresenta-os. Não substitui nem reinterpreta os cálculos do domínio Web.

## Fluxo — integração iPhone

```text
Domínio e repositórios Web
  ├─ JourneyRepository.getActive()
  ├─ BreakRepository.getActiveForJourney()
  └─ FocusRepository.getOpenForJourney()
          │
          ▼
createNativeTimerSnapshot()
          │
          ▼
installIOSNativeTimerCoordinator
          │
          ▼
window.webkit.messageHandlers.focoJornadaTimer
          │
          ▼
WKScriptMessageHandler
          │
          ▼
NativeTimerCoordinator (Swift)
  ├─ ActivityKit -> jornada / estados contínuos
  ├─ AlarmKit -> countdowns iOS 26+
  └─ UserNotifications -> fallback previamente autorizado
          │
          ▼
Lock Screen / Dynamic Island
```

### Contrato do bridge

O contrato é versionado (`version: 1`, `command: "sync"`) e contém apenas o estado necessário à apresentação nativa:

- jornada ativa: `id`, `startedAt`;
- fase ativa: `kind`, `id`, `title`, `startedAt`, estado e, quando existe, `deadlineAt` ou `remainingSeconds`.

Pausa tem prioridade visual sobre uma sessão de foco aberta porque a regra atual pode pausar o foco antes de iniciar a pausa da jornada.

### ActivityKit

É usado quando:

- existe jornada ativa sem countdown prioritário;
- a pausa não tem duração definida;
- o foco está pausado;
- AlarmKit não está disponível/autorizado.

A Live Activity é reconstruída por timestamps e pode apresentar tempo decorrido ou countdown, consoante o estado recebido.

### AlarmKit

Em iOS 26+, quando existe fase `running` com deadline futuro:

1. valida-se autorização AlarmKit;
2. cancela-se um countdown anterior se o ID/deadline mudou;
3. agenda-se um novo countdown com o tempo restante;
4. a Live Activity própria da jornada é encerrada temporariamente para evitar duas superfícies concorrentes;
5. o Widget Extension fornece a apresentação da contagem decrescente.

O fim do countdown não termina automaticamente a pausa nem a sessão no domínio Web. O registo persistido continua a depender das regras atuais da aplicação.

## Segurança da shell iOS

- A `WKWebView` carrega apenas a origem HTTPS oficial `allyssonestadulho92.github.io` como navegação interna.
- Links HTTP/HTTPS externos são abertos fora da WebView.
- O bridge aceita mensagens apenas do frame principal e da origem autorizada.
- Payloads são limitados por versão, IDs, estados, timestamps, texto e duração máxima.
- Não existem segredos no código iOS.
- Ao fechar/bloquear o runtime seguro, a apresentação nativa é limpa sem modificar os dados da jornada.

## Persistência e migração iOS

O armazenamento de uma `WKWebView` nativa pertence ao sandbox da aplicação e não deve ser confundido com o armazenamento Safari/PWA. Os dados existentes na PWA não são copiados automaticamente.

Por isso, a arquitetura atual **não executa migração implícita**. Um fluxo explícito de exportação/importação do cofre deve ser especificado, testado e auditado antes de a aplicação nativa substituir a PWA existente num dispositivo com dados reais.

## Distribuição, assinatura e versionamento

A distribuição iOS é preparada sem guardar identidade Apple no repositório:

```text
ios/project.yml
  ├─ CODE_SIGN_STYLE = Automatic
  ├─ MARKETING_VERSION
  └─ CURRENT_PROJECT_VERSION
          │
          ▼
ios/scripts/archive.sh
          │  recebe DEVELOPMENT_TEAM por ambiente
          ▼
xcodebuild archive (Release / generic iOS device)
          │
          ▼
Xcode Organizer
  ├─ Validate App
  └─ Upload -> App Store Connect / TestFlight
```

O `DEVELOPMENT_TEAM`, certificados, perfis de provisioning e artefactos assinados permanecem fora do Git. A primeira distribuição é manual para permitir inspeção dos entitlements, assinatura, assets e mensagens de validação da Apple antes de automatizar CI/CD.

## Fluxo relevante — medicação

```text
MedicationsStockPage
  ├─ MedicationDoseSwipeActions
  ├─ MedicationScheduleActionDialog
  └─ useAppServices()
       └─ OperationalPersonalStockService
            ├─ PersonalStockService
            └─ MedicationScheduleService
                 └─ AppDatabase.medicationSchedules

MedicationPrototypeWorkspace
  ├─ histórico funcional (Resumo)
  └─ auditoria técnica (Detalhes técnicos)
```

A eliminação de horários de medicação continua lógica (`deletedAt` + `effectiveUntil`), preservando referências históricas e auditoria. Esta integração iOS não altera esse fluxo.

## Acessibilidade e responsividade

A aplicação Web mantém as regras atuais de acessibilidade. Na camada Apple, a apresentação usa componentes nativos de Live Activities/AlarmKit e texto legível no Lock Screen/Dynamic Island; a validação física com Dynamic Type, VoiceOver, dispositivos sem Dynamic Island e diferentes tamanhos de ecrã permanece obrigatória.
