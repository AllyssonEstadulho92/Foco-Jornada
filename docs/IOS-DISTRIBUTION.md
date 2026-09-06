# Distribuição iOS e TestFlight

Atualizado em: 2026-09-07

## Objetivo

Preparar uma instalação assinada do **Foco & Jornada** num iPhone real e, depois da validação física, disponibilizar uma build através do TestFlight sem colocar certificados, perfis ou chaves no repositório.

## Pré-requisitos Apple

1. Conta Apple Developer ativa.
2. Apple ID iniciado no Xcode.
3. App criada no App Store Connect com o Bundle ID `pt.allyssonestadulho92.focojornada`.
4. Bundle ID da extensão `pt.allyssonestadulho92.focojornada.widgets` disponível na mesma equipa.
5. Agreements pendentes aceites no App Store Connect.
6. Ícone de aplicação final adicionado antes do primeiro upload para distribuição.

## Assinatura local

O projeto usa `CODE_SIGN_STYLE = Automatic`. O Team ID não fica guardado no GitHub.

No Mac, a partir da raiz do repositório:

```bash
DEVELOPMENT_TEAM=SEU_TEAM_ID \
MARKETING_VERSION=1.0.0 \
CURRENT_PROJECT_VERSION=1 \
bash ios/scripts/archive.sh
```

O script:

- gera o projeto com XcodeGen;
- cria um `Release archive` para `generic/platform=iOS`;
- usa assinatura automática da conta Apple já configurada no Xcode;
- grava o `.xcarchive` em `ios/Archives/`, pasta ignorada pelo Git.

## Instalação num iPhone antes do TestFlight

1. Executar `xcodegen generate` em `ios/`.
2. Abrir `ios/FocoJornadaIOS.xcodeproj`.
3. Em **Signing & Capabilities**, selecionar a equipa Apple nos targets da aplicação e da extensão.
4. Ligar o iPhone e confirmar confiança/emparelhamento.
5. Selecionar o iPhone como destino.
6. Executar a aplicação.
7. Validar AlarmKit, Live Activities, Lock Screen, Dynamic Island e comportamento em background.

## Upload para TestFlight

Depois dos testes físicos:

1. Criar o archive Release com `ios/scripts/archive.sh` ou pelo menu **Product > Archive**.
2. Abrir o archive no **Organizer** do Xcode.
3. Executar **Validate App**.
4. Corrigir qualquer erro de assinatura, entitlement, metadata ou assets.
5. Escolher **Distribute App > App Store Connect > Upload**.
6. Aguardar o processamento da build no App Store Connect.
7. Preencher as informações de teste e disponibilizar primeiro a testers internos.
8. Só depois avançar para testers externos, se necessário.

## Regras de segurança

- Nunca guardar `.p12`, `.mobileprovision`, certificados, private keys ou App Store Connect API keys no Git.
- Não colocar `DEVELOPMENT_TEAM`, credenciais Apple ou tokens em ficheiros públicos sem necessidade.
- Para uma futura automação de upload no GitHub Actions, usar apenas GitHub Actions Secrets e uma App Store Connect API Key com privilégio mínimo.
- A primeira distribuição deve ser manual pelo Xcode Organizer para reduzir variáveis durante a validação inicial.

## Privacidade

A shell iOS usa `UserDefaults` apenas para estado interno do temporizador nativo. O target inclui `PrivacyInfo.xcprivacy` com o motivo Apple `CA92.1`, correspondente a dados acessíveis apenas pela própria aplicação.

O questionário de **App Privacy** no App Store Connect continua a ter de ser revisto com base no comportamento completo da aplicação Web/PWA carregada pela shell; o privacy manifest nativo não substitui esse questionário.

## Bloqueadores atuais para a primeira build TestFlight

- conta/equipa Apple não pode ser configurada a partir deste repositório sem acesso à conta do titular;
- o App Store Connect record deve existir antes do upload;
- falta confirmar o ícone final da aplicação para distribuição;
- falta teste físico e validação da migração dos dados existentes da PWA.

Até estes pontos estarem concluídos, o PR #187 deve permanecer em draft e separado de `main`.
