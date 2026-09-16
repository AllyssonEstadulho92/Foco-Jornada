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
- GitHub Pages para distribuição;
- Cloudflare Worker + Durable Objects para sincronização cifrada;
- Node 22 e npm 11.6.0 nos workflows.

## Camadas

### Presentation

Responsável por páginas, componentes, navegação, estado efémero e interação.

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

- `src/styles/vacation.css` — estrutura/base da página;
- `src/styles/vacation-accrual.css` — grelha mensal, resumo vivo, estados e contenção;
- `src/styles/vacation-card-containment.test.ts` — regressão estrutural da grelha mensal.

### Arquitetura visual da grelha mensal

A grelha do PR #208 deixa de depender apenas de uma sequência rígida de breakpoints e passa a adaptar a quantidade de colunas à largura real disponível:

```css
grid-template-columns: repeat(auto-fit, minmax(min(100%, 15rem), 1fr));
```

O resumo vivo usa a mesma estratégia com base mínima de `13rem`.

Objetivos:

- evitar cartões excessivamente comprimidos;
- preservar toda a informação dentro da secção;
- manter proporções consistentes entre desktop, tablet e smartphone;
- permitir que a grelha escolha naturalmente 4, 3, 2 ou 1 coluna conforme o espaço efetivo.

Cada cartão mensal usa:

- `position: relative` + `overflow: hidden` para contenção final;
- cabeçalho em grid `minmax(0, 1fr) auto`;
- `min-width: 0` e `max-width: 100%` nos elementos internos;
- `overflow-wrap: anywhere` em conteúdo textual variável;
- valor principal com `font-variant-numeric: tabular-nums`;
- barra de progresso limitada a `100%`;
- linha superior de estado via `::before`;
- diferenciação visual para mês concluído, mês atual e mês futuro;
- `forced-colors` e `prefers-reduced-motion` preservados.

Em ecrãs até 560 px:

- grelha mensal = 1 coluna;
- resumo vivo = 1 coluna;
- cabeçalho do cartão = 1 coluna;
- badge passa para baixo do nome do mês;
- `min-height` fixa do desktop é removida.

Estas regras são exclusivamente de apresentação. Não alteram `VacationBalance`, dados, persistência, fontes de férias ou sincronização.

### Application

Coordena casos de uso e repositories, sem regras visuais.

Exemplos:

- início/fim de jornada;
- início/fim de pausa;
- foco e atividades;
- `reconcileScheduledWorkday` para reconciliar entrada, pausas e saída a partir do `WorkSchedule`.

A área de férias agrega fontes existentes na página e envia input normalizado para `calculateVacationBalance`.

### Domain

`VacationBalance` é a autoridade para cálculos de férias e não escreve nos registos de turnos/horas.

Responsabilidades:

1. validar datas civis `YYYY-MM-DD`;
2. deduplicar férias por data;
3. filtrar sábado/domingo no regime padrão;
4. separar férias gozadas e planeadas;
5. calcular referência laboral/contratual;
6. calcular marcos mensais da projeção pessoal;
7. calcular evolução do mês atual em tempo real.

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

A aplicação mantém o estado funcional num snapshot cifrado.

Bases principais:

- `foco-jornada-security-v1` — perfil de segurança/KDF/chaves/metadados de sync;
- `foco-jornada-vault-v1` — `EncryptedVaultRecord` cifrado.

Configuração de férias no `secureStorage`:

`foco-jornada-vacation-settings-v1`

Campos:

- `employmentStartDate`;
- `annualEntitlementDays`;
- `monthlyAccrualTargetDays`;
- `carriedDays`;
- `manualTakenDays`;
- `adjustmentDays`.

Os PR #206–#208 não acrescentam novos campos persistidos.

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
             ├─ marco mensal
             ├─ progresso atual
             ├─ acumulado vivo
             └─ saldo vivo/projetado
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

O relógio é efémero. `VacationBalancePage` atualiza a cada 60 s e também em `focus`/`visibilitychange`.

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
- PR #208 não cria endpoint, token, segredo, permissão, dependência ou dado persistido;
- valores temporais vivos não são persistidos nem enviados como telemetria;
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

O head final de qualquer alteração só deve ser integrado depois de todos os gates estarem verdes.