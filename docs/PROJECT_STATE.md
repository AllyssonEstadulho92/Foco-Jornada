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
- acumulação mensal pessoal com meta de 28 dias por defeito (PR #204);
- contagem padrão de férias em dias úteis segunda–sexta (PR #205);
- evolução intramensal em tempo real (PR #206);
- contenção responsiva dos cartões mensais (PR #207);
- hierarquia visual adaptativa da evolução mensal (PR #208).

## PR #209 — painel avançado de leitura de férias

Estado: **em validação** na branch `feat/vacation-insights-dashboard`.

### Objetivo

Dar mais informação útil sem obrigar o utilizador a interpretar manualmente números dispersos. A nova camada continua a usar a projeção pessoal existente e não altera a referência laboral.

### Funções implementadas

A rota `#/ferias` passa a mostrar, além do saldo e evolução mensal já existentes:

- progresso anual da meta pessoal em percentagem;
- valor que ainda falta acumular até à meta anual;
- próximo marco de acumulação em dias inteiros e data estimada pelo modelo mensal atual;
- férias já gozadas, com separação entre dias detetados na app e dias introduzidos manualmente;
- férias futuras planeadas;
- total comprometido `gozadas + planeadas` e percentagem da meta pessoal;
- previsão de saldo pessoal em 31 de dezembro;
- número de fins de semana registados como férias e ignorados no desconto padrão;
- próximo fecho mensal e respetivo marco acumulado;
- falta de acumulação no mês atual e ritmo diário aproximado.

### Regras de cálculo novas, apenas derivadas

Nenhum novo evento é criado. Os indicadores são derivados em `VacationBalance` a partir dos dados já existentes.

```text
progressoAnual% = acumuladoVivo / metaAnual × 100
faltaAnual = max(0, metaAnual - acumuladoVivo)
comprometido = gozadas + planeadas
previsaoFimAno = metaAnual + transitados + ajustes - comprometido
```

O próximo marco procura o próximo dia inteiro ainda não alcançado pela projeção e calcula a data em que o modelo `meta / 12` o cruza. Para uma meta de 28 dias, por exemplo, um acumulado entre 19 e 20 mostra **20 dias** como próximo marco.

### Segurança e compatibilidade

- não há novo campo persistido;
- não há migração IndexedDB;
- não há novo endpoint, token, segredo, permissão ou dependência;
- os novos indicadores seguem o mesmo cofre cifrado porque derivam da configuração e dos registos já existentes;
- o cálculo oficial/contratual permanece separado da projeção pessoal;
- `vacation-insights.css` isola o novo painel visual sem modificar os estilos globais.

### Testes adicionados

- progresso anual e falta até à meta;
- próximo marco e respetiva data;
- projeção para 31 de dezembro depois de férias gozadas/planeadas;
- caso real de 24/08/2026–06/09/2026 mantendo 10 dias úteis e projeção final de 18 dias com meta 28 sem outros ajustes;
- estado final quando a meta anual já foi atingida;
- regressão CSS para grelha fluida, contenção, mobile, `forced-colors` e `prefers-reduced-motion`.

## Estado publicado anterior — PR #208

PR #208 está **integrado, validado por CI e publicado**.

- merge: `a41a0c3b9fdef1b0e5d67bc29ce6b453dbcbc4cf`;
- Qualidade #1138 no head: sucesso;
- Qualidade #1139 em `main`: sucesso;
- Publicar Foco & Jornada #247: sucesso;
- build publicado: `a5a17750ffa43f506c9feb5af78a167f3b1f0f5c`;
- pages build and deployment #801: sucesso.

## Regras funcionais atuais de férias

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
- atualização normal enquanto a página está ativa: 60 segundos;
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

## Limitações e validações abertas

1. Concluir os gates do head final do PR #209 antes de integrar.
2. Validar no iPhone real o painel avançado e a legibilidade dos novos indicadores.
3. Validar Android/Chrome, tablet e desktop, incluindo zoom e aumento de texto.
4. Confirmar atualização viva e reconciliação ao regressar à PWA em dispositivo real.
5. Confirmar sincronização da configuração de férias entre telemóvel e computador.
6. Avaliar calendário laboral para feriados e regimes de descanso diferentes antes de alterar a contagem padrão.
7. Continuar validações físicas pendentes da automação de jornada e sincronização cross-device.

## Última alteração

PR #209 em validação: novo painel **O que tens, o que falta e o que vem a seguir**, com indicadores derivados para progresso anual, próximos marcos, férias usadas/planeadas e previsão de fim do ano.

## Próximo passo

Concluir CI do PR #209, integrar/publicar apenas com todos os gates verdes e validar o novo painel num dispositivo real.
