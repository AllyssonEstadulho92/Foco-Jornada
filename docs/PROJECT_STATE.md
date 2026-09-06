# Estado do Projeto

Atualizado em: 2026-09-06

## Estado atual

Está em implementação na branch `feat/ios-native-timer-bridge` a integração nativa do **Foco & Jornada** com iPhone.

A aplicação Web/PWA continua a ser a fonte funcional e de dados. Foi adicionada uma ponte opcional para uma shell SwiftUI/WKWebView, permitindo que o estado real de jornada, pausa e foco seja apresentado pelo iOS através de ActivityKit e, em iOS 26 ou posterior, AlarmKit.

A melhoria anterior de **Medicamentos > Tomas programadas** — eliminação imediata com tombstone auditável e histórico simplificado — permanece integrada em `main` através do PR #186 e publicada no GitHub Pages.

## Integração iOS implementada na branch

- Contrato Web -> iOS versão 1 com snapshots baseados em timestamps persistidos.
- Bridge `window.webkit.messageHandlers.focoJornadaTimer.postMessage(...)` sem dependência obrigatória para a PWA.
- Coordenador Web que lê jornada, pausa e foco ativos a partir dos repositórios existentes.
- Shell SwiftUI com `WKWebView` restrita ao domínio oficial `allyssonestadulho92.github.io`.
- ActivityKit para jornada contínua e estados sem countdown AlarmKit.
- AlarmKit em iOS 26+ para foco/Pomodoro e pausas com duração definida.
- Widget Extension com apresentação para Lock Screen e Dynamic Island.
- Fallback para ActivityKit e notificação local previamente autorizada em iOS 18–25.
- Ao bloquear o cofre da aplicação, a apresentação nativa é limpa sem alterar os registos persistidos.
- Testes unitários adicionados para o contrato temporal Web -> iOS.

## Segurança e integridade

- A integração não tenta controlar a aplicação Relógio da Apple.
- O domínio Web continua a ser a fonte de verdade; o lado nativo não altera cálculos de jornada, pausa ou foco.
- Mensagens nativas são aceites apenas do frame principal e da origem HTTPS autorizada.
- IDs, timestamps, estados e durações recebidos no bridge são validados.
- Não foram adicionados tokens, chaves, passwords ou segredos ao código.
- A PWA continua funcional quando `window.webkit` não existe.

## Validação concluída

Da funcionalidade anterior em `main`:

- auditoria de dependências, typecheck, lint, testes, build e smoke test aprovados;
- workflow de qualidade e publicação aprovados.

Da integração iOS atual:

- revisão estrutural do código e das APIs oficiais Apple concluída;
- testes TypeScript do snapshot temporal adicionados;
- validação CI da branch ainda depende da abertura/execução do Pull Request;
- compilação Swift/Xcode e teste em iPhone físico ainda não foram concluídos neste ambiente.

## Limitações de validação

1. O código AlarmKit exige um Xcode com SDK iOS 26 para compilação final.
2. Lock Screen, Dynamic Island, permissões AlarmKit e comportamento em background exigem validação num iPhone real.
3. `WKWebView` e Safari/PWA não partilham automaticamente o mesmo armazenamento local. A migração do cofre existente deve ser tratada explicitamente antes de substituir a PWA instalada pela aplicação nativa.
4. Nesta primeira fase, ações feitas diretamente no Lock Screen/Dynamic Island não escrevem no domínio Web, evitando divergência entre estado nativo e registo persistido.

## Última alteração

Preparada a integração nativa iOS com bridge WebKit, ActivityKit, AlarmKit, widget de Live Activities e projeto reproduzível por XcodeGen, sem alterar as regras de negócio existentes.

## Próximo passo

1. Executar os quality gates Web no Pull Request.
2. Gerar o projeto iOS com XcodeGen e compilar com SDK iOS 26.
3. Instalar num iPhone de teste e validar jornada, pausa, Pomodoro, Lock Screen e Dynamic Island.
4. Definir e testar uma migração segura dos dados da PWA para o armazenamento da `WKWebView` antes de usar a app nativa como substituição da PWA.
