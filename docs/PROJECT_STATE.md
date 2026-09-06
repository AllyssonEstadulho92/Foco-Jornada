# Estado do Projeto

Atualizado em: 2026-09-06

## Estado atual

Está preparada na branch `feat/ios-native-timer-bridge` a integração nativa do **Foco & Jornada** com iPhone, em revisão no PR #187.

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
- Workflow dedicado `Qualidade iOS` que gera o projeto por XcodeGen e compila app + Widget Extension no simulador iOS sem assinatura.

## Segurança e integridade

- A integração não tenta controlar a aplicação Relógio da Apple.
- O domínio Web continua a ser a fonte de verdade; o lado nativo não altera cálculos de jornada, pausa ou foco.
- Mensagens nativas são aceites apenas do frame principal e da origem HTTPS autorizada.
- IDs, timestamps, estados e durações recebidos no bridge são validados.
- Não foram adicionados tokens, chaves, passwords ou segredos ao código.
- A PWA continua funcional quando `window.webkit` não existe.

## Validação concluída

Da integração iOS no PR #187:

- auditoria de dependências Web aprovada;
- TypeScript/typecheck aprovado;
- lint aprovado;
- testes automatizados aprovados, incluindo o contrato temporal Web -> iOS;
- build Web aprovado;
- smoke test de arranque no browser aprovado;
- projeto iOS gerado com XcodeGen em CI;
- app SwiftUI + Widget Extension compiladas com **Xcode 26.6 / Swift 6 / SDK iOS 26** no simulador;
- erros iniciais de isolamento Swift 6 e assinatura do delegate WebKit detetados pela CI e corrigidos;
- workflow `Qualidade iOS` concluído com sucesso no commit `87edd0e`.

## Limitações de validação

1. A compilação automatizada confirma compatibilidade do código com Xcode/SDK iOS 26, mas não substitui instalação e teste num iPhone físico.
2. Lock Screen, Dynamic Island, autorização AlarmKit e comportamento real com o aparelho bloqueado ainda exigem validação num iPhone.
3. `WKWebView` e Safari/PWA não partilham automaticamente o mesmo armazenamento local. A migração do cofre existente deve ser tratada explicitamente antes de substituir a PWA instalada pela aplicação nativa.
4. Nesta primeira fase, ações feitas diretamente no Lock Screen/Dynamic Island não escrevem no domínio Web, evitando divergência entre estado nativo e registo persistido.
5. A assinatura Apple e instalação física dependem de uma equipa/Apple ID configurados no Xcode.

## Última alteração

A integração iOS passou os quality gates Web e a compilação Xcode 26 em CI. A branch permanece em PR draft porque falta a validação física no iPhone e a estratégia de migração do cofre da PWA.

## Próximo passo

1. Configurar a assinatura Apple no Xcode e instalar o target `FocoJornadaIOS` num iPhone de teste.
2. Validar jornada, pausa, Pomodoro, Lock Screen, Dynamic Island e permissões AlarmKit no equipamento real.
3. Testar num equipamento sem Dynamic Island e, quando aplicável, em iOS anterior a 26 para o fallback.
4. Definir e testar uma migração segura dos dados da PWA para o armazenamento da `WKWebView` antes de usar a app nativa como substituição da PWA.
5. Só depois retirar o PR #187 de draft e integrar em `main`.
