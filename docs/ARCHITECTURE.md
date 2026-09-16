# Arquitetura

Atualizado em: 2026-09-16

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
       │    │    ├─ resumo vivo
       │    │    ├─ painel de indicadores
       │    │    └─ evolução mensal
       │    └─ Definições
       ├─ Application
       │    └─ casos de uso / reconciliações
       ├─ Domain
       │    └─ VacationBalance
       │         ├─ referência laboral
       │         ├─ filtro de dias úteis padrão
       │         ├─ marcos mensais pessoais
       │         ├─ evolução intramensal em tempo real
       │         └─ indicadores derivados anuais
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
- GitHub Pages;
- Cloudflare Worker + Durable Objects;
- Node 22 e npm 11.6.0 nos workflows.

## Camadas

### Presentation

Componentes relevantes:

- `src/presentation/layouts/AppShell.tsx`;
- `src/presentation/pages/TodayReferencePage.tsx`;
- `src/presentation/pages/FocusPage.tsx`;
- `src/presentation/pages/ActivitiesPage.tsx`;
- `src/presentation/pages/ShiftMapPage.tsx`;
- `src/presentation/pages/WorkHoursCalculatorPage.tsx`;
- `src/presentation/pages/VacationBalancePage.tsx`;
- `src/presentation/pages/SettingsReferencePage.tsx`;
- `src/presentation/providers/AppServicesProvider.tsx`.

A página de férias usa:

- `src/styles/vacation.css` — estrutura/base;
- `src/styles/vacation-accrual.css` — grelha mensal, resumo vivo, estados e contenção;
- `src/styles/vacation-insights.css` — painel de leitura avançada;
- `src/styles/vacation-card-containment.test.ts` — regressão estrutural da grelha mensal;
- `src/styles/vacation-insights.test.ts` — regressão do painel avançado.

O painel de indicadores é puramente derivado. Não guarda snapshots de progresso, datas estimadas nem percentagens.

### Application

Coordena casos de uso e repositories, sem regras visuais.

Exemplos:

- início/fim de jornada;
- início/fim de pausa;
- foco e atividades;
- `reconcileScheduledWorkday` para reconciliar entrada, pausas e saída a partir do `WorkSchedule`.

A área de férias agrega fontes existentes na página e envia input normalizado para `calculateVacationBalance`.

### Domain

`VacationBalance` é a autoridade para cálculos da área de férias e não escreve nos registos de turnos/horas.

Responsabilidades:

1. validar datas civis `YYYY-MM-DD`;
2. deduplicar férias por data;
3. filtrar sábado/domingo no regime padrão;
4. separar férias gozadas e planeadas;
5. calcular referência laboral/contratual;
6. calcular marcos mensais da projeção pessoal;
7. calcular evolução do mês atual em tempo real;
8. calcular indicadores anuais derivados e o próximo marco da projeção.

## Rotas relevantes

- `#/` — hoje/jornada;
- `#/foco` — foco;
- `#/atividades` — atividades;
- `#/turnos` — mapa de turnos;
- `#/horas` — calculadora de horas;
- `#/ferias` — férias;
- `#/definicoes` — definições.

Desktop usa sidebar. Mobile/tablet usa top bar + bottom navigation + drawer.

## Persistência

Bases principais:

- `foco-jornada-security-v1` — perfil de segurança/KDF/chaves/metadados de sync;
- `foco-jornada-vault-v1` — `EncryptedVaultRecord` cifrado.

Configuração de férias no `secureStorage`:

`foco-jornada-vacation-settings-v1`

Campos persistidos:

- `employmentStartDate`;
- `annualEntitlementDays`;
- `monthlyAccrualTargetDays`;
- `carriedDays`;
- `manualTakenDays`;
- `adjustmentDays`.

Os valores introduzidos no PR #209 são derivados em runtime. Não existe novo campo persistido nem migração.

## Fontes de dados das férias

```text
WorkHours store
  └─ reason === "ferias"

Shift map mensal
  └─ kind === "vacation"

Payroll plan mensal
  └─ kind === "vacation"

        ↓ normalizar YYYY-MM-DD
        ↓ deduplicar Set<string>
        ↓ filtro semana padrão
          ├─ segunda–sexta → contar
          └─ sábado/domingo → ignorar

calculateVacationBalance()
        ├─ referência laboral
        └─ projeção pessoal
             ├─ meses fechados
             ├─ progresso atual
             ├─ acumulado vivo
             ├─ saldo vivo/projetado
             ├─ progresso anual
             ├─ dias ainda por acumular
             ├─ próximo marco/data
             └─ projeção 31 dezembro
```

A aplicação não infere férias a partir de baixa, folga, ausência ou jornada não iniciada.

## Referência laboral

### Ano normal

```text
direitoAno = max(22, annualEntitlementDays confirmado)
saldoHoje = direitoAno + transitados + ajustes - gozadas
saldoProjetado = saldoHoje - planeadas
```

### Ano de admissão

```text
mesesCompletos = meses completos desde employmentStartDate
direitoAdmissao = min(20, mesesCompletos × 2)
```

O marco de seis meses permanece separado.

## Projeção pessoal mensal

```text
parcelaMensal = metaAnual / 12
marcoMes = metaAnual × numeroDoMes / 12
```

Para meta 28: março 7, junho 14, setembro 21 e dezembro 28.

### Evolução em tempo real

```text
progressoMes = (diaDoMes - 1 + progressoDoDia) / diasNoMes
acumuladoVivo = metaAnual × (mesAtual - 1 + progressoMes) / 12
saldoVivo = acumuladoVivo + transitados + ajustes - gozadas
saldoVivoProjetado = saldoVivo - planeadas
```

A página atualiza a referência temporal a cada 60 s e também em `focus`/`visibilitychange`.

## Indicadores derivados — PR #209

Campos adicionados ao output de `VacationBalance`:

- `annualAccrualProgressPercent`;
- `annualAccrualRemainingDays`;
- `usedAndPlannedDays`;
- `usedAndPlannedPercentOfTarget`;
- `yearEndProjectedBalanceDays`;
- `nextAccrualMilestoneDays`;
- `nextAccrualMilestoneDate`;
- `hasReachedAccrualTarget`.

Fórmulas principais:

```text
progressoAnual% = clamp(acumuladoVivo / metaAnual) × 100
faltaAnual = max(0, metaAnual - acumuladoVivo)
comprometido = gozadas + planeadas
percentagemComprometida = comprometido / metaAnual × 100
previsaoFimAno = metaAnual + transitados + ajustes - comprometido
```

### Próximo marco de acumulação

Se a meta ainda não foi atingida:

```text
proximoMarco = min(metaAnual, floor(acumuladoVivo) + 1)
```

A data estimada é calculada pelo mesmo modelo mensal, nunca por uma taxa média anual diferente:

1. localizar o mês em que o marco fica entre o acumulado anterior e o fecho desse mês;
2. converter a fração necessária da parcela mensal para uma fração dos dias civis desse mês;
3. devolver a data civil `YYYY-MM-DD` em que esse patamar é alcançado.

Esta data é uma estimativa da projeção pessoal, não uma data jurídica de aquisição de férias.

## Arquitetura visual

### Evolução mensal

A grelha usa:

```css
grid-template-columns: repeat(auto-fit, minmax(min(100%, 15rem), 1fr));
```

Mantém `min-width: 0`, `max-width: 100%`, `overflow-wrap`, contenção, diferenciação de estados, `forced-colors` e `prefers-reduced-motion`.

### Painel de indicadores

`vacation-insights.css` usa uma grelha independente:

```css
grid-template-columns: repeat(auto-fit, minmax(min(100%, 14rem), 1fr));
```

O painel contém:

- barra anual com `role="progressbar"`;
- cartões com largura contida e números tabulares;
- destaque estrutural do próximo marco;
- estado de risco para projeção final negativa;
- uma coluna abaixo de 560 px;
- suporte `forced-colors` e `prefers-reduced-motion`.

## Semana útil padrão

- segunda–sexta contam;
- sábado/domingo não reduzem o saldo;
- 24/08/2026–06/09/2026 = 10 dias contabilizados + 4 fins de semana ignorados.

Feriados e regimes semanais especiais continuam fora da inferência automática.

## Sincronização móvel ↔ computador

```text
EncryptedVaultRecord
  └─ CloudSyncManager
       ├─ fingerprint SHA-256
       ├─ token derivado da dataKey
       ├─ revisão remota esperada
       └─ Cloudflare Worker
            └─ Durable Object por profileId
```

Regras:

- apenas local mudou → push;
- apenas remoto mudou → pull + validação;
- igual → atualizar metadados;
- ambos mudaram → conflito explícito;
- sem `last-write-wins` silencioso.

## Segurança

- PIN, palavra-passe, código de recuperação e `dataKey` original não são enviados ao Worker;
- backend recebe apenas cofre cifrado e metadados técnicos;
- nenhum HTML não confiável é injetado na UI de férias;
- PR #209 não cria endpoint, token, segredo, permissão, dependência ou dado persistido;
- indicadores derivados não são enviados como nova telemetria;
- links externos mantêm `rel="noreferrer"`.

## Qualidade

Workflow `Qualidade`:

1. Node 22;
2. npm 11.6.0;
3. `npm install`;
4. `npm audit --audit-level=high`;
5. typecheck;
6. lint;
7. Vitest;
8. build;
9. Worker dry-run;
10. smoke test Chromium;
11. artefacto.

O PR #209 adicionou `VacationBalance.insights.test.ts` e `vacation-insights.test.ts`. O head final passou a **Qualidade #1140**, o merge em `main` passou a **Qualidade #1141**, a publicação **#248** foi concluída e o build `ac121c3f687f86149d90e1bd78c4788b8c86d0a6` passou o **pages build and deployment #807**.
