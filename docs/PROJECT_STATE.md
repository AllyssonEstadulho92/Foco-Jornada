# Estado do Projeto

Atualizado em: 2026-09-15

## Estado atual

O **Foco Jornada** é uma única PWA React/TypeScript responsiva para telemóvel, tablet e computador, publicada por GitHub Pages. A persistência operacional continua local-first num cofre IndexedDB cifrado; a sincronização entre instalações usa Cloudflare Worker/Durable Objects e transporta apenas o cofre cifrado.

Em `main` estão integrados, entre outros, turnos noturnos (PR #189), sincronização cifrada e associação de browsers (PR #191–#194), correções do shell móvel (PR #195–#199), bootstrap animado (PR #200–#201) e automação de jornada/pausas (PR #202).

## PR #203 — ferramenta de saldo de férias

Branch: `feat/vacation-balance-tracker`.

Estado: **pronto para integração após o quality gate final do head atual**. Um quality gate completo já passou na branch depois da correção do ambiente npm; a última alteração funcional posterior foi apenas o reforço de contraste do botão principal e volta a ser validada pelo pipeline antes do merge.

### Objetivo

Acrescentar uma área pessoal de férias que mostre:

- direito estimado do ano;
- férias já gozadas/registadas;
- férias futuras planeadas;
- saldo calculado hoje;
- saldo projetado após as férias planeadas;
- próxima referência de vencimento anual.

A ferramenta não substitui o mapa oficial da entidade empregadora, RH, contrato ou instrumento de regulamentação coletiva.

### Comportamento implementado

- nova rota `#/ferias` e acesso na navegação desktop/mobile;
- cálculo isolado em `src/domain/vacation/VacationBalance.ts`;
- anos normais: mínimo geral de 22 dias úteis, permitindo valor superior apenas quando explicitamente confirmado/configurado;
- ano de admissão: política conservadora de 2 dias por mês completo de contrato, até 20 dias, com marco de seis meses completos para o gozo;
- não existe falsa acumulação mensal nos anos normais: a interface explica que o direito anual vence, em regra, em 1 de janeiro;
- férias já marcadas na Calculadora de horas (`reason = ferias`) e no Mapa de turnos/plano mensal (`kind = vacation`) são reutilizadas automaticamente;
- a mesma data encontrada em mais de uma fonte conta apenas uma vez;
- datas até ao dia atual são tratadas como gozadas/registadas; datas futuras do mesmo ano são separadas como planeadas;
- dias transitados, férias gozadas fora da aplicação e ajustes dependem de confirmação manual;
- o botão principal usa contraste reforçado em tema claro e escuro.

### Implementação técnica

Novos elementos:

- `src/domain/vacation/VacationBalance.ts`;
- `src/domain/vacation/VacationBalance.test.ts`;
- `src/presentation/pages/VacationBalancePage.tsx`;
- `src/styles/vacation.css`;
- `docs/VACATION-TRACKER.md`.

Alterados:

- `src/presentation/router.tsx`;
- `src/presentation/navigation/navigationItems.ts`;
- `src/main.tsx`;
- `.github/workflows/quality.yml` e `.github/workflows/deploy-pages.yml` por regressão externa do npm 10.9.8.

### Persistência e segurança

A configuração adicional é guardada em `secureStorage` na chave `foco-jornada-vacation-settings-v1`, ficando dentro do cofre cifrado existente. São guardados apenas: data de admissão, dias anuais confirmados, transitados, dias gozados fora da aplicação e ajuste confirmado.

Não foi criado novo endpoint, tabela IndexedDB, token, segredo, permissão, mecanismo de autenticação ou migração de schema. O protocolo de sincronização e a cifragem permanecem inalterados.

### Enquadramento laboral validado

Em 2026-09-15 foram revistos Código do Trabalho e gov.pt:

- artigo 237.º: o direito a férias vence, em regra, em 1 de janeiro;
- artigo 238.º: duração mínima anual de 22 dias úteis;
- artigo 239.º: no ano de admissão, 2 dias úteis por mês de duração do contrato, até 20 dias, com gozo após seis meses completos;
- artigo 240.º: transferência/cumulação depende das condições legalmente previstas.

Existe divergência interpretativa sobre frações de mês no ano de admissão. Para não apresentar uma hipótese como certeza, a versão inicial usa meses completos, documenta a opção e permite ajustes confirmados pelo utilizador.

## Qualidade e segurança

O primeiro e o segundo workflow do PR #203 falharam antes dos testes porque o `npm install` do npm 10.9.8 terminou com o crash interno `Cannot read properties of null (reading 'edgesOut')`. Não houve falha funcional da ferramenta. O problema coincide com regressões abertas no npm/CLI em 2026.

Foi fixado `npm@11.6.0` nos workflows de qualidade e publicação, preservando Node 22 e todos os gates. Com essa correção, o workflow **Qualidade #1095** concluiu com sucesso em:

- instalação;
- `npm audit --audit-level=high`;
- typecheck;
- lint;
- testes, incluindo os novos testes de férias;
- build;
- Worker dry-run;
- smoke test Chromium;
- artefacto.

O head atual volta a executar os mesmos gates depois do ajuste de contraste, antes da integração.

## Limitações conhecidas

### Férias

- é um controlo pessoal, não a fonte oficial de RH;
- CCT, contrato mais favorável, impedimento prolongado, cessação e outras situações especiais podem alterar o resultado;
- dias transitados devem ser confirmados;
- dias explicitamente marcados como férias na aplicação são tratados como um dia de férias; a ferramenta não tenta reinterpretar automaticamente feriados, escalas especiais ou descanso substitutivo;
- a política de meses completos no ano de admissão é deliberadamente conservadora.

### PWA/background

A PWA pode ter JavaScript suspenso quando fechada; a automação de jornada mantém a regra de reconciliação por timestamps planeados do PR #202.

## Riscos e validações ainda abertas

1. concluir o quality gate do head final do PR #203;
2. validar em dispositivo real a rota, edição, persistência e responsividade;
3. marcar a mesma data como férias em duas fontes e confirmar contagem única;
4. confirmar sincronização da configuração de férias entre telemóvel e computador com o mesmo cofre;
5. manter as validações físicas ainda pendentes do PR #202 e da sincronização cross-device.

## Última alteração

PR #203: ferramenta de férias implementada, enquadramento laboral documentado, regressão externa do npm 10.9.8 isolada e workflows ajustados para npm 11.6.0 sem enfraquecer os quality gates.

## Próximo passo

1. confirmar CI verde no head final;
2. integrar PR #203 em `main`;
3. confirmar o workflow de publicação e GitHub Pages;
4. atualizar este estado com os SHAs finais;
5. validar a ferramenta em telemóvel e computador com dados reais confirmados.
