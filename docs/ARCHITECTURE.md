# Arquitetura

Atualizado em: 2026-09-15

## Visão geral

O **Foco Jornada** é uma única PWA responsiva. Telemóvel, tablet e computador usam o mesmo bundle React/TypeScript, as mesmas rotas, regras de domínio e persistência. As diferenças entre breakpoints são de apresentação e navegação, não de regra de negócio.

```text
GitHub Pages
  └─ React 19 + TypeScript + Vite
       ├─ Router / AppShell responsivo
       ├─ Presentation
       │    ├─ Today / jornada
       │    ├─ Foco / atividades
       │    ├─ Turnos / horas
       │    ├─ Férias
       │    └─ Definições
       ├─ Application
       │    └─ casos de uso / reconciliações
       ├─ Domain
       │    └─ VacationBalance
       │         ├─ referência laboral
       │         ├─ filtro de dias úteis padrão
       │         ├─ marcos mensais pessoais
       │         └─ evolução intramensal em tempo real
       └─ Persistência cifrada
            ├─ IndexedDB/Dexie
            ├─ secureStorage no snapshot cifrado
            └─ sync opcional
                 └─ Cloudflare Worker + Durable Object
```

## Stack confirmada

- React 19;
- TypeScript 5.9;
- Vite 7;
- React Router;
- IndexedDB/Dexie;
- cofre cifrado AES-GCM;
- Zustand onde necessário;
- Vitest 5;
- GitHub Pages para distribuição do frontend;
- Cloudflare Worker + Durable Objects para sincronização cifrada;
- Node 22 e npm 11.6.0 nos workflows.

## Camadas

### Presentation

Responsável por páginas, componentes, navegação, estado efémero e interação do utilizador.

Componentes relevantes:

- `src/presentation/layouts/AppShell.tsx` — shell desktop/mobile;
- `src/presentation/pages/TodayReferencePage.tsx` — jornada do dia;
- `src/presentation/pages/FocusPage.tsx` — foco/Pomodoro;
- `src/presentation/pages/ActivitiesPage.tsx` — atividades;
- `src/presentation/pages/ShiftMapPage.tsx` — mapa de turnos;
- `src/presentation/pages/WorkHoursCalculatorPage.tsx` — horas/ocorrências;
- `src/presentation/pages/VacationBalancePage.tsx` — saldos de férias, projeção pessoal, evolução viva e configuração;
- `src/presentation/pages/SettingsReferencePage.tsx` — horário e pausas;
- `src/presentation/providers/AppServicesProvider.tsx` — injeção de repositories/serviços.

A página de férias usa `vacation.css` para a base e `vacation-accrual.css` para a grelha mensal, progresso e resumo vivo.

#### Contenção responsiva da grelha mensal

`vacation-accrual.css` é também a autoridade para impedir que conteúdo dos cartões mensais ultrapasse a respetiva secção.

Regras estruturais do PR #207:

- elementos flex/grid da secção mensal usam `min-width: 0` para poder encolher dentro da coluna;
- conteúdo textual relevante usa `max-width: 100%` e `overflow-wrap: anywhere` quando necessário;
- o cabeçalho de cada cartão permite `flex-wrap`;
- o badge de estado não usa `white-space: nowrap` nem `text-overflow: ellipsis`;
- a barra de progresso é limitada a `width/max-width: 100%`;
- a grelha passa de 4 → 3 → 2 → 1 coluna conforme a largura disponível, usando 520 px como breakpoint para uma coluna;
- abaixo de 520 px, mês e estado são organizados verticalmente no cabeçalho do cartão;
- `forced-colors` e `prefers-reduced-motion` continuam aplicados.

Esta contenção é exclusivamente visual. Não altera `VacationBalance`, dados persistidos, semântica de cálculo ou fontes de férias.

### Application

Coordena casos de uso e repositories, sem conter regras visuais.

Exemplos:

- início/fim de jornada;
- início/fim de pausa;
- foco e atividades;
- `reconcileScheduledWorkday` para reconciliar entrada, pausas e saída a partir do `WorkSchedule`.

A ferramenta de férias não introduz serviço application dedicado nesta versão. A página agrega fontes existentes e envia input normalizado para a função pura `calculateVacationBalance`.

### Domain

`VacationBalance` é a autoridade para os cálculos da área de férias e não escreve nos registos de turnos/horas.

Responsabilidades:

1. validar datas civis `YYYY-MM-DD`;
2. deduplicar férias por data;
3. filtrar sábado/domingo no regime padrão;
4. separar férias gozadas de férias futuras planeadas;
5. calcular referência laboral/contratual;
6. calcular marcos mensais da projeção pessoal;
7. calcular a evolução do mês atual em tempo real.

## Rotas relevantes

A aplicação usa a mesma árvore de rotas em todas as plataformas.

- `#/` — hoje/jornada;
- `#/foco` — foco;
- `#/atividades` — atividades;
- `#/turnos` — mapa de turnos;
- `#/horas` — calculadora de horas;
- `#/ferias` — férias;
- `#/definicoes` — definições.

Desktop usa sidebar. Mobile/tablet usa top bar + bottom navigation + drawer. `mobileMenuOpen` é estado local/efémero e não é persistido.

## Persistência

### Cofre local

A aplicação mantém o estado funcional num snapshot cifrado. Entre outros, o snapshot contém jornadas, pausas, atividades, foco, medicação/stock, configurações e `secureStorage`.

Bases locais principais:

- `foco-jornada-security-v1` — perfil de segurança/KDF/chaves/metadados de sync;
- `foco-jornada-vault-v1` — `EncryptedVaultRecord` cifrado.

`localStorage` fica limitado a boot/preferências/compatibilidade; não é a fonte principal dos registos de negócio.

### Configuração de férias

Chave existente no `secureStorage`:

`foco-jornada-vacation-settings-v1`

Campos persistidos:

- `employmentStartDate`;
- `annualEntitlementDays`;
- `monthlyAccrualTargetDays` — 28 por defeito;
- `carriedDays`;
- `manualTakenDays`;
- `adjustmentDays`.

A evolução em tempo real do PR #206 não acrescenta novos campos persistidos. Hora atual, progresso do dia, progresso do mês, ritmos e saldos vivos são derivados em runtime. O PR #207 é apenas visual e também não altera persistência.

## Fontes de dados das férias

```text
WorkHours store
  └─ reason === "ferias"

Shift map mensal
  └─ kind === "vacation"

Payroll plan mensal
  └─ kind === "vacation"

        ↓ normalizar por YYYY-MM-DD
        ↓ Set<string> / deduplicar
        ↓ filtro semana padrão
          ├─ segunda–sexta → contar
          └─ sábado/domingo → ignorar no desconto

calculateVacationBalance()
        ├─ referência laboral
        └─ projeção pessoal
             ├─ meses fechados
             ├─ marco mensal
             ├─ progresso do mês atual
             ├─ acumulado vivo
             └─ saldo vivo / projetado
```

A aplicação não infere férias a partir de baixa, ausência, folga ou jornada não iniciada. Apenas estados explicitamente marcados como férias entram na agregação automática.

## Referência laboral de férias

### Anos normais

```text
direitoAno = max(22, annualEntitlementDays confirmado)
saldoHoje = direitoAno + transitados + ajustes - gozadas
saldoProjetado = saldoHoje - planeadas
```

### Ano de admissão

Política conservadora atual:

```text
mesesCompletos = meses completos desde employmentStartDate
direitoAdmissao = min(20, mesesCompletos × 2)
```

O marco de seis meses permanece separado para disponibilidade de gozo. A ferramenta sinaliza que condições contratuais/coletivas ou interpretações específicas devem ser confirmadas externamente.

## Projeção mensal pessoal

A projeção pessoal é independente de `annualEntitlementDays`.

### Marcos fechados

```text
parcelaMensal = metaAnual / 12
marcoMes = metaAnual × numeroDoMes / 12
```

Para meta 28, os marcos exatos continuam 7 em março, 14 em junho, 21 em setembro e 28 em dezembro.

`monthlyAccruedDays` preserva o conceito de meses fechados para compatibilidade.

### Evolução em tempo real — PR #206

Input adicional não persistido:

`asOfDayProgress?: number`

Representa a fração do dia local já decorrida no intervalo `[0, 1]`. Quando omitido em cálculos apenas por data, o domínio trata a data como referência de fim do dia, preservando compatibilidade dos testes/consumidores anteriores.

Fórmulas:

```text
progressoMes = (diaDoMes - 1 + progressoDoDia) / diasNoMes
acumuladoVivo = metaAnual × (mesAtual - 1 + progressoMes) / 12
saldoVivo = acumuladoVivo + transitados + ajustes - gozadas
saldoVivoProjetado = saldoVivo - planeadas
```

Campos derivados principais:

- `monthlyLiveAccruedDays`;
- `monthlyLiveAvailableBalanceDays`;
- `monthlyLiveProjectedBalanceDays`;
- `currentAccrualMonthProgress`;
- `currentAccrualMonthProgressPercent`;
- `currentAccrualMonthEarnedDays`;
- `currentAccrualMonthRemainingDays`;
- `currentAccrualMonthDailyRate`;
- `currentAccrualMonthTargetCumulativeDays`.

O cálculo vivo usa quatro casas decimais internamente na saída apresentada; os marcos fechados mantêm duas. Todos são recalculados diretamente a partir da meta, evitando drift.

## Relógio e ciclo de vida da PWA

`VacationBalancePage` mantém `now` apenas em estado React efémero.

Gatilhos:

- `setInterval` de 60 segundos enquanto a página está montada;
- evento `window.focus`;
- `document.visibilitychange` quando a página volta a ativa.

A página calcula `asOfDate` pelo calendário local e `asOfDayProgress` pelas horas/minutos/segundos/milisegundos locais.

A aplicação não depende de background execution. Se a PWA for suspensa, o próximo `focus`/`visibilitychange` reconstrói imediatamente o valor correto para o instante atual.

## Semana útil padrão

No modelo atual:

- segunda–sexta contam como férias gozadas/planeadas;
- sábado/domingo não reduzem o saldo;
- 24/08/2026–06/09/2026 resulta em 10 dias úteis contabilizados e 4 fins de semana ignorados.

Feriados nacionais/municipais, descansos semanais diferentes e escalas especiais continuam fora da inferência automática até existir um calendário/regra confirmada.

## Sincronização móvel ↔ computador

```text
AppDatabase snapshot cifrado
  └─ EncryptedVaultRecord
       └─ CloudSyncManager
            ├─ fingerprint SHA-256
            ├─ token derivado da dataKey
            ├─ revisão remota esperada
            └─ Cloudflare Worker
                 └─ Durable Object por profileId
```

Como `secureStorage` faz parte do snapshot cifrado, a configuração de férias acompanha o mesmo cofre. Os valores vivos não são sincronizados porque são derivados do relógio local e da configuração já sincronizada.

Regras de concorrência:

- apenas local mudou → push;
- apenas remoto mudou → pull + validação;
- conteúdo igual → atualizar metadados;
- ambos mudaram → conflito explícito;
- sem `last-write-wins` silencioso.

## Segurança

Princípios preservados:

- PIN, palavra-passe, código de recuperação e `dataKey` original não são enviados ao Worker;
- backend recebe apenas cofre cifrado e metadados técnicos;
- inputs persistidos de férias passam pela normalização já existente;
- nenhum HTML não confiável é injetado pela nova UI;
- nenhum endpoint, token, segredo, permissão ou dependência é criado pelos PR #206–#207;
- nenhum dado temporal vivo é persistido ou enviado como nova telemetria;
- links externos mantêm `rel="noreferrer"`.

## Qualidade

Workflow `Qualidade`:

1. Node 22;
2. npm 11.6.0;
3. `npm install`;
4. `npm audit --audit-level=high`;
5. typecheck;
6. lint;
7. testes Vitest;
8. build Vite/TypeScript;
9. Worker dry-run;
10. smoke test Chromium;
11. artefacto do build.

O PR #207 acrescenta `src/styles/vacation-card-containment.test.ts` para proteger estruturalmente as regras de contenção. Alterações só devem ser integradas em `main` depois de todos os gates do head final estarem verdes.