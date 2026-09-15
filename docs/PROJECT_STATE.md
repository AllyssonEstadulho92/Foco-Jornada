# Estado do Projeto

Atualizado em: 2026-09-15

## Estado atual

O **Foco Jornada** é uma única PWA React/TypeScript responsiva para telemóvel, tablet e computador, publicada por GitHub Pages. A persistência operacional continua local-first num cofre IndexedDB cifrado; a sincronização entre instalações usa Cloudflare Worker/Durable Objects e transporta apenas o cofre cifrado.

Em `main` estão integrados, entre outros, turnos noturnos (PR #189), sincronização cifrada e associação de browsers (PR #191–#194), correções do shell móvel (PR #195–#199), bootstrap animado (PR #200–#201), automação de jornada/pausas (PR #202) e a ferramenta de saldo de férias (PR #203).

## PR #203 — ferramenta de saldo de férias

Estado: **integrado e publicado**.

- PR integrado em `main` no commit `225e808a416ac6e18f23c1b7178e99886d7cecbf`.
- Build de publicação gerado no commit `d5dee6cd9418eaf4483ca4422c17b8331d915445`.
- Workflow **Qualidade #1097** passou integralmente no head final do PR.
- Workflow **Qualidade #1098** passou integralmente depois do merge em `main`.
- Workflow **Publicar Foco & Jornada #236** concluiu com sucesso.
- Workflow **pages build and deployment #767** concluiu build e deploy com sucesso para o commit publicado.

### Objetivo entregue

A rota `#/ferias` apresenta:

- direito estimado do ano;
- férias já gozadas/registadas;
- férias futuras planeadas;
- saldo calculado hoje;
- saldo projetado após as férias planeadas;
- próxima referência de vencimento anual;
- configuração manual apenas para dados que não podem ser inferidos com segurança.

A ferramenta é um controlo pessoal e não substitui o mapa oficial da entidade empregadora, RH, contrato ou instrumento de regulamentação coletiva.

### Regras implementadas

- anos normais: período anual configurado nunca inferior ao mínimo geral de 22 dias úteis;
- valores acima de 22 são aceites apenas como condição mais favorável confirmada pelo utilizador;
- ano de admissão: política conservadora de 2 dias por mês completo de contrato, até 20 dias;
- marco de seis meses completos separado do número de dias calculados no ano de admissão;
- não existe falsa acumulação mensal nos anos normais: o direito anual é tratado como vencendo, em regra, em 1 de janeiro;
- férias da Calculadora de horas (`reason = ferias`) e do Mapa de turnos/plano mensal (`kind = vacation`) são reutilizadas;
- a mesma data encontrada em mais de uma fonte conta apenas uma vez;
- datas até ao dia atual contam como gozadas/registadas e datas futuras do mesmo ano ficam separadas como planeadas;
- dias transitados, férias gozadas fora da aplicação e ajustes dependem de confirmação explícita.

### Implementação técnica

Novos elementos principais:

- `src/domain/vacation/VacationBalance.ts`;
- `src/domain/vacation/VacationBalance.test.ts`;
- `src/presentation/pages/VacationBalancePage.tsx`;
- `src/styles/vacation.css`;
- `docs/VACATION-TRACKER.md`.

Integrações:

- `src/presentation/router.tsx` — rota `/ferias`;
- `src/presentation/navigation/navigationItems.ts` — navegação desktop/mobile;
- `src/main.tsx` — estilos da ferramenta;
- `secureStorage` — configuração adicional cifrada;
- registos existentes de horas e mapa de turnos — fonte automática dos dias explicitamente marcados como férias.

### Persistência e segurança

A configuração adicional fica em `secureStorage`, chave `foco-jornada-vacation-settings-v1`, dentro do cofre cifrado existente. São guardados apenas: data de admissão, dias anuais confirmados, dias transitados, dias gozados fora da aplicação e ajuste confirmado.

Não foi criado novo endpoint, tabela IndexedDB, token, segredo, permissão, mecanismo de autenticação ou migração de schema. O protocolo de sincronização, autenticação e cifragem permanecem inalterados.

### Enquadramento laboral validado

Em 2026-09-15 foram revistos Código do Trabalho e gov.pt:

- artigo 237.º: o direito a férias vence, em regra, em 1 de janeiro;
- artigo 238.º: duração mínima anual de 22 dias úteis;
- artigo 239.º: no ano de admissão, 2 dias úteis por mês de duração do contrato, até 20 dias, com gozo após seis meses completos;
- artigo 240.º: transferência/cumulação depende das condições legalmente previstas.

Existe divergência interpretativa sobre frações de mês no ano de admissão. A aplicação não transforma essa divergência numa certeza: usa meses completos como política conservadora, documenta a opção e permite ajuste confirmado.

## Qualidade, CI e dependências

Os dois primeiros runs do PR #203 falharam antes dos testes porque o npm 10.9.8 terminou `npm install` com o crash interno `Cannot read properties of null (reading 'edgesOut')`. O incidente foi isolado como problema do gestor de pacotes, não da funcionalidade.

Os workflows de qualidade e publicação passam a fixar `npm@11.6.0` sobre Node 22, mantendo todos os gates. Tanto o head final do PR como `main` passaram:

- instalação;
- `npm audit --audit-level=high`;
- typecheck;
- lint;
- testes, incluindo os novos testes de férias;
- build;
- Worker dry-run;
- smoke test Chromium;
- artefacto.

## Limitações conhecidas

### Férias

- é um controlo pessoal, não a fonte oficial de RH;
- CCT, contrato mais favorável, impedimento prolongado, cessação e outras situações especiais podem alterar o resultado;
- dias transitados devem ser confirmados;
- dias explicitamente marcados como férias são tratados como dias de férias; a ferramenta não reinterpreta automaticamente feriados, escalas especiais ou descanso substitutivo;
- a política de meses completos no ano de admissão é deliberadamente conservadora.

### PWA/background

A PWA pode ter JavaScript suspenso quando fechada; a automação de jornada mantém a reconciliação por timestamps planeados implementada no PR #202.

## Riscos e validações ainda abertas

1. Validar `#/ferias` em dispositivo real, incluindo edição, persistência, tema claro/escuro e responsividade.
2. Marcar a mesma data como férias no mapa e na calculadora e confirmar contagem única em utilização real.
3. Confirmar sincronização da configuração de férias entre telemóvel e computador com o mesmo cofre.
4. Confirmar com RH/contrato/CCT quaisquer dias adicionais, dias transitados ou regras especiais antes de os introduzir como ajuste.
5. Manter as validações físicas ainda pendentes da automação de jornada e da sincronização cross-device.

## Última alteração

Ferramenta de saldo de férias integrada no PR #203, validada por CI, publicada por GitHub Pages e documentada. O ambiente de CI/publicação foi estabilizado com npm 11.6.0 sem reduzir os quality gates.

## Próximo passo

Validar a nova ferramenta em telemóvel e computador com dados reais confirmados, começando pela data de admissão, dias transitados e uma data de férias registada simultaneamente no Mapa de turnos e na Calculadora de horas para comprovar a deduplicação.
