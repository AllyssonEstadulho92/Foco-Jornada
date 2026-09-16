# Estado do Projeto

Atualizado em: 2026-09-16

## Estado atual

O **Foco Jornada** é uma única PWA React/TypeScript responsiva para telemóvel, tablet e computador, publicada em GitHub Pages. A persistência continua local-first num cofre IndexedDB cifrado; a sincronização opcional usa Cloudflare Worker/Durable Objects e transporta apenas o cofre cifrado.

Em `main` estão integrados, entre outros:

- turnos noturnos (PR #189);
- sincronização cifrada e associação de browsers (PR #191–#194);
- correções do shell móvel (PR #195–#199);
- bootstrap animado (PR #200–#201);
- automação de jornada/pausas (PR #202);
- ferramenta de saldo de férias (PR #203);
- acumulação mensal pessoal de férias com meta de 28 dias por defeito (PR #204);
- contagem automática de férias apenas em dias úteis padrão segunda–sexta (PR #205);
- evolução intramensal da projeção pessoal em tempo real (PR #206);
- contenção responsiva dos cartões mensais de férias (PR #207);
- hierarquia visual adaptativa da evolução mensal (PR #208).

## PR #208 — hierarquia visual da evolução mensal

Estado: **integrado, validado por CI e publicado**.

- PR #208 integrado em `main` no commit `a41a0c3b9fdef1b0e5d67bc29ce6b453dbcbc4cf`;
- **Qualidade #1138** passou integralmente no head final do PR;
- **Qualidade #1139** passou integralmente após o merge em `main`;
- **Publicar Foco & Jornada #247** concluiu com sucesso;
- build publicado na raiz de `main` no commit `a5a17750ffa43f506c9feb5af78a167f3b1f0f5c`;
- **pages build and deployment #801** concluiu com sucesso para o build publicado.

### Objetivo entregue

Depois de eliminar o overflow no PR #207, a secção **Evolução por mês** foi refinada para melhorar leitura, equilíbrio e adaptação entre desktop, tablet e smartphone sem alterar cálculo, dados ou semântica.

### Alteração entregue

- grelha mensal usa `repeat(auto-fit, minmax(...))`, ajustando automaticamente a quantidade de colunas à largura real disponível;
- o resumo vivo também usa `auto-fit`, evitando cartões excessivamente comprimidos;
- mês, estado, valor, barra e texto auxiliar recebem hierarquia tipográfica e espaçamento mais consistentes;
- cartões têm borda superior de estado e estrutura uniforme;
- mês atual recebe destaque específico, com superfície e valor reforçados;
- meses concluídos ficam visualmente distintos do mês atual e dos meses futuros;
- em ecrãs estreitos a grelha passa para uma coluna e o estado move-se para baixo do nome do mês;
- a altura mínima usada no desktop é libertada em mobile para evitar espaço vazio;
- contenção do PR #207 continua ativa com `min-width: 0`, `max-width: 100%`, `overflow-wrap` e `overflow: hidden`;
- `forced-colors` e `prefers-reduced-motion` permanecem suportados.

### Regressão

`src/styles/vacation-card-containment.test.ts` foi ampliado para validar:

- grelha `auto-fit/minmax`;
- contenção de valores/textos/progresso;
- distinção estrutural do mês atual e concluído;
- uma coluna no breakpoint móvel;
- ausência de truncamento por reticências.

### Segurança e compatibilidade

Não houve alteração em `VacationBalance`, cálculos, férias registadas, cofre, sincronização, autenticação, API, dependências, dados pessoais ou configuração persistida.

## PR #207 — contenção visual dos cartões mensais

Estado: **integrado, validado por CI e publicado**.

- merge: `3a564251eece4a4c2870982ed3127c1638a68482`;
- Qualidade #1131 no head final: sucesso;
- Qualidade #1132 em `main`: sucesso;
- Publicar Foco & Jornada #246: sucesso;
- build publicado: `ce2242b0f90fc4e884764df6d3c31c7dd43a60e9`;
- pages build and deployment #796: sucesso.

O PR #207 corrigiu o caso real em que `Em curso · xx%` ultrapassava a borda do cartão. Nome, estado, percentagem, valor, descrição e barra passaram a ficar contidos no próprio cartão.

## Férias — regras funcionais atuais

### Referência laboral

- anos normais: mínimo geral suportado de 22 dias úteis;
- valor superior apenas quando configurado como condição mais favorável confirmada;
- ano de admissão: política conservadora de 2 dias por mês completo, até 20;
- marco de seis meses preservado;
- transitados, férias externas e ajustes dependem de confirmação explícita.

### Projeção pessoal

- meta anual configurável, 28 dias por defeito;
- marcos exatos: março 7, junho 14, setembro 21, dezembro 28;
- mês atual progride em tempo real pela fração do calendário já decorrida;
- atualização enquanto a página está ativa: 60 segundos;
- `focus` e `visibilitychange` reconciliam imediatamente o relógio atual;
- não existe dependência de timers em background.

### Dias gozados/planeados

- férias são agregadas do mapa de turnos, plano mensal e calculadora de horas;
- datas são deduplicadas;
- segunda–sexta contam no regime padrão;
- sábado/domingo não reduzem saldo;
- 24/08/2026–06/09/2026 resulta em 10 dias contabilizados e 4 fins de semana ignorados.

Limite conhecido: feriados, descanso semanal diferente e escalas especiais ainda não são inferidos automaticamente.

## Qualidade, CI e dependências

Stack atual:

- React 19;
- TypeScript 5.9;
- Vite 7;
- Vitest 5;
- Node 22 no CI;
- npm 11.6.0 fixado nos workflows.

Gates obrigatórios:

1. `npm audit --audit-level=high`;
2. typecheck;
3. lint;
4. testes;
5. build;
6. Worker dry-run;
7. smoke test Chromium;
8. artefacto do build.

O head final do PR #208 e o merge em `main` passaram integralmente estes gates.

## Limitações e validações abertas

1. Validar no iPhone real a nova hierarquia visual, especialmente setembro, percentagens longas e aumento de texto.
2. Validar Android/Chrome, tablet e desktop, incluindo zoom.
3. Confirmar atualização viva e reconciliação ao regressar à PWA em dispositivo real.
4. Confirmar sincronização da configuração de férias entre telemóvel e computador.
5. Validar fisicamente a automação de jornada e a sincronização cross-device.

## Última alteração

PR #208 integrado e publicado: a secção **Evolução por mês** usa agora grelha fluida `auto-fit`, hierarquia visual consistente e destaque do mês atual, preservando a contenção e toda a lógica funcional existente.

## Próximo passo

Validar visualmente a versão publicada no iPhone e confirmar o mesmo comportamento em Android/tablet/desktop, incluindo zoom e aumento de texto.