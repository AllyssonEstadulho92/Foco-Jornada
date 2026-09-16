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
- hierarquia visual adaptativa da evolução mensal (PR #208);
- painel avançado de leitura de férias (PR #209).

## PR #209 — painel avançado de leitura de férias

Estado: **integrado, validado por CI e publicado**.

- PR #209 integrado em `main` no commit `8b7b6fc68c3330714b081865992de9adb5243d4c`;
- **Qualidade #1140** passou integralmente no head final do PR;
- **Qualidade #1141** passou integralmente após o merge em `main`;
- **Publicar Foco & Jornada #248** concluiu com sucesso;
- build publicado na raiz de `main` no commit `ac121c3f687f86149d90e1bd78c4788b8c86d0a6`;
- **pages build and deployment #807** concluiu com sucesso para o build publicado.

### Objetivo entregue

Dar mais informação útil sem obrigar o utilizador a interpretar manualmente números dispersos. A nova camada usa a projeção pessoal já existente e não altera a referência laboral.

### Funções entregues

A rota `#/ferias` passa a mostrar, além do saldo e da evolução mensal já existentes:

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

### Regras de cálculo derivadas

Nenhum novo evento é criado. Os indicadores são derivados em `VacationBalance` a partir dos dados já existentes.

```text
progressoAnual% = acumuladoVivo / metaAnual × 100
faltaAnual = max(0, metaAnual - acumuladoVivo)
comprometido = gozadas + planeadas
previsaoFimAno = metaAnual + transitados + ajustes - comprometido
```

O próximo marco procura o próximo dia inteiro ainda não alcançado pela projeção e calcula a data em que o modelo `meta / 12` o cruza. Para uma meta de 28 dias, um acumulado entre 19 e 20 mostra **20 dias** como próximo marco.

### Caso de regressão importante

O intervalo 24/08/2026–06/09/2026 continua a produzir:

- 14 datas civis registadas;
- 10 dias úteis descontados;
- 4 fins de semana ignorados;
- projeção pessoal de **18 dias** em 31 de dezembro para meta 28, sem transitados, ajustes ou outras férias futuras.

### Segurança e compatibilidade

- não há novo campo persistido;
- não há migração IndexedDB;
- não há novo endpoint, token, segredo, permissão ou dependência;
- os indicadores derivam da configuração e dos registos já existentes no cofre cifrado;
- o cálculo oficial/contratual permanece separado da projeção pessoal;
- `vacation-insights.css` isola o novo painel visual sem modificar os estilos globais.

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

O head final do PR #209 e o merge em `main` passaram integralmente todos estes gates.

## Limitações e validações abertas

1. Validar no iPhone real o painel avançado, a barra anual e a legibilidade dos novos indicadores.
2. Validar Android/Chrome, tablet e desktop, incluindo zoom e aumento de texto.
3. Confirmar atualização viva e reconciliação ao regressar à PWA em dispositivo real.
4. Confirmar sincronização da configuração de férias entre telemóvel e computador.
5. Avaliar calendário laboral para feriados e regimes de descanso diferentes antes de alterar a contagem padrão.
6. Continuar validações físicas pendentes da automação de jornada e sincronização cross-device.

## Última alteração

PR #209 integrado e publicado: novo painel **O que tens, o que falta e o que vem a seguir**, com progresso anual, próximo marco, férias usadas/planeadas, fins de semana ignorados e previsão pessoal de fim do ano.

## Próximo passo

Validar a versão publicada no iPhone e depois confirmar Android/tablet/desktop. Qualquer nova função deverá reutilizar os mesmos cálculos e dados derivados, sem duplicar estado ou confundir projeção pessoal com direito laboral.
