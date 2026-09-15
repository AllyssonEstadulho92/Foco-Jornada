# Estado do Projeto

Atualizado em: 2026-09-15

## Estado atual

O **Foco Jornada** continua a ser uma única PWA React/TypeScript responsiva para telemóvel, tablet e computador, publicada por GitHub Pages. A persistência operacional é local-first num cofre IndexedDB cifrado; a sincronização entre instalações usa Cloudflare Worker/Durable Objects e transporta apenas o cofre cifrado.

O código publicado em `main` inclui, entre outras correções já integradas:

- turnos noturnos corrigidos no PR #189;
- sincronização cifrada e associação de outro navegador nos PR #191–#194;
- correções do menu móvel e top bar nos PR #195–#199;
- logótipo animado de bootstrap nos PR #200–#201;
- automação de jornada e pausas pelo horário configurado no PR #202.

## Alteração em curso — ferramenta de saldo de férias (PR #203)

Branch: `feat/vacation-balance-tracker`.

Objetivo: acrescentar uma área pessoal de férias que mostre o direito estimado do ano, férias já registadas, férias futuras planeadas, saldo disponível e saldo projetado, sem confundir o cálculo com o registo oficial da entidade empregadora.

### Comportamento implementado

- nova rota `#/ferias` e acesso na navegação desktop e no acesso rápido móvel;
- cálculo de domínio separado em `src/domain/vacation/VacationBalance.ts`;
- período anual normal nunca inferior a 22 dias úteis, permitindo valor superior apenas quando configurado pelo utilizador por existir condição mais favorável confirmada;
- no ano de admissão, política conservadora de 2 dias por mês completo de contrato, até 20 dias, com indicação do marco de seis meses completos para o gozo;
- férias já lançadas na Calculadora de horas (`reason = ferias`) e no Mapa de turnos/Plano de vencimento (`kind = vacation`) são reutilizadas automaticamente;
- a mesma data encontrada em mais de uma fonte conta apenas uma vez;
- datas até ao dia atual são tratadas como gozadas/registadas; datas futuras do mesmo ano são mostradas separadamente como planeadas;
- dias transitados, férias gozadas fora da aplicação e ajustes confirmados podem ser introduzidos manualmente;
- saldo atual e saldo após férias planeadas são apresentados separadamente;
- não é apresentada uma falsa acumulação mensal nos anos normais: a interface explica que o período anual vence, em regra, em 1 de janeiro;
- a ferramenta mostra de forma explícita que é um controlo pessoal e que o saldo oficial deve ser confirmado com RH/entidade empregadora quando existirem CCT, impedimentos, cessação ou outras regras especiais.

### Implementação técnica

Novos elementos:

- `src/domain/vacation/VacationBalance.ts` — cálculo puro e validação de datas;
- `src/domain/vacation/VacationBalance.test.ts` — testes do domínio;
- `src/presentation/pages/VacationBalancePage.tsx` — página funcional e integração dos registos existentes;
- `src/styles/vacation.css` — layout responsivo e estados de acessibilidade;
- `docs/VACATION-TRACKER.md` — especificação funcional, regras, riscos e critérios de aceitação.

Alterados:

- `src/presentation/router.tsx` — rota `/ferias`;
- `src/presentation/navigation/navigationItems.ts` — entrada desktop e acesso rápido móvel;
- `src/main.tsx` — carregamento dos estilos da ferramenta.

### Persistência e segurança

A configuração adicional é guardada em `secureStorage` na chave `foco-jornada-vacation-settings-v1`, ficando dentro do cofre cifrado já existente. Não foi criado novo endpoint, tabela IndexedDB, token, segredo, permissão ou mecanismo de autenticação.

A funcionalidade apenas lê os registos de férias já existentes e guarda cinco campos de configuração: data de admissão, dias anuais confirmados, dias transitados, dias gozados fora da aplicação e ajuste confirmado.

Não existe alteração do protocolo de sincronização, do schema do cofre, da cifragem ou da associação de browsers.

### Enquadramento laboral validado

A regra geral foi confrontada em 2026-09-15 com o Código do Trabalho e gov.pt:

- artigo 237.º: o direito a férias vence, em regra, em 1 de janeiro;
- artigo 238.º: duração mínima anual de 22 dias úteis;
- artigo 239.º: no ano de admissão, 2 dias úteis por mês de duração do contrato, até 20 dias, com gozo após seis meses completos;
- artigo 240.º: transferência/cumulação de férias depende das condições legalmente previstas.

Existe discussão interpretativa sobre meses incompletos no ano de admissão. A versão inicial usa meses completos, documenta essa opção e não a apresenta como regra universal incontestada.

## PR #202 — integrado e publicado

O PR #202 foi integrado em `main` no commit `62b0cb44db31fff957a4486b7ac24634c721e3ea` e publicado pelo GitHub Pages através do commit de deploy `08dc9fae23f683fc7cadf80ada7a54b2545da8b2`.

### Comportamento preservado

- `WorkSchedule` continua a ser a fonte única do horário planeado;
- antes da entrada configurada não é criada jornada;
- durante o turno, se ainda não existir jornada nesse dia, a aplicação cria-a com `startedAt` exatamente igual à entrada configurada;
- uma jornada ativa é encerrada com `endedAt` exatamente igual à saída configurada quando esse limite é atingido ou ultrapassado;
- se o utilizador terminar manualmente a jornada antes da saída, a automação não cria uma segunda jornada nesse dia;
- se a aplicação for aberta pela primeira vez apenas depois da saída e não existir jornada do dia, não é fabricada uma jornada completa retroativa;
- pausas ativadas em **Definições → Pausas** usam os respetivos `startTime`/`endTime` e passam a ser reconciliadas automaticamente;
- Pomodoro e foco personalizado permanecem totalmente manuais.

## Qualidade e segurança

No PR #202 e em `main`, a pipeline **Qualidade** concluiu com sucesso em instalação, `npm audit --audit-level=high`, typecheck, lint, testes, build, Worker dry-run, smoke test e artefacto.

Para o PR #203, os testes de domínio já foram adicionados, mas os quality gates do PR ainda têm de concluir antes de qualquer integração. O PR permanece em draft até essa validação.

## Limitações conhecidas

### PWA/background

Uma PWA pode ter JavaScript totalmente suspenso quando o sistema a coloca em segundo plano ou quando é encerrada. A automação de jornada continua a usar reconciliação e timestamps planeados, não timers falsificados.

### Férias

- a ferramenta é estimativa pessoal, não fonte oficial de RH;
- CCT, contrato mais favorável, impedimento prolongado, cessação do contrato e outras situações especiais podem alterar o resultado;
- dias transitados devem ser confirmados pelo utilizador;
- a política de meses completos no ano de admissão é conservadora e está documentada devido a divergência interpretativa sobre frações de mês.

## Riscos e validações ainda abertas

1. **PR #203:** concluir audit, typecheck, lint, testes, build, Worker dry-run e smoke test.
2. **Férias em dispositivo real:** validar a rota, edição dos campos, persistência e responsividade em telemóvel e computador.
3. **Deduplicação real:** marcar a mesma data como férias no mapa e na calculadora e confirmar contagem única.
4. **Cross-device:** confirmar que a configuração de férias converge com o mesmo perfil/cofre sincronizado.
5. **Jornada 08:00–17:00:** permanece pendente validação física da automação do PR #202.
6. **Pausa real de 60 minutos:** permanece pendente validação física.
7. **Timezone:** a área geral de jornada continua dependente do timezone local do browser; os dois dispositivos devem usar o mesmo timezone durante validações.

## Última alteração

PR #203 aberto em draft com a ferramenta de saldo de férias, domínio testável, reutilização dos registos existentes, persistência cifrada e documentação de enquadramento laboral.

## Próximo passo

1. concluir os quality gates do PR #203;
2. corrigir qualquer falha sem enfraquecer os testes ou as regras de segurança;
3. atualizar o estado documental com os resultados finais;
4. integrar em `main` apenas com CI verde;
5. confirmar publicação GitHub Pages;
6. validar a ferramenta em telemóvel e computador com dados reais confirmados.
