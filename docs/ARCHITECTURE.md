# Arquitetura

Atualizado em: 2026-09-15

## Visão geral

O **Foco Jornada** é uma única PWA responsiva. Telemóvel, tablet e computador executam o mesmo bundle, as mesmas rotas, os mesmos componentes funcionais, repositories e regras de domínio. As diferenças entre breakpoints são apenas de apresentação, navegação, densidade e capacidades locais do dispositivo.

```text
GitHub Pages
  └─ React 19 + TypeScript + Vite
       ├─ Router / páginas responsivas
       ├─ AppServicesProvider
       │    ├─ JourneyRepository
       │    ├─ BreakRepository
       │    ├─ ActivityRepository
       │    ├─ FocusRepository
       │    ├─ CoffeeRepository
       │    └─ SettingsRepository
       ├─ domínio / casos de uso
       │    └─ VacationBalance (cálculo puro de férias)
       └─ cofre local cifrado
            └─ sincronização opcional
                 └─ Cloudflare Worker + Durable Object
```

## Stack confirmada

- React 19 + TypeScript;
- Vite para desenvolvimento e build;
- React Router para navegação;
- IndexedDB/Dexie para persistência operacional;
- cofre cifrado AES-GCM para dados funcionais;
- Zustand apenas onde necessário; estado funcional persistente usa `secureStorage` dentro do mesmo cofre;
- Vitest para testes automatizados;
- GitHub Pages como distribuição oficial do frontend;
- Cloudflare Worker + Durable Objects para sincronização cifrada e associação temporária de browsers.

## Organização funcional

### Presentation

Responsável por páginas, navegação, estado efémero e controllers/hooks.

Componentes relevantes:

- `src/presentation/App.tsx` — composição global;
- `src/presentation/layouts/AppShell.tsx` — shell responsivo;
- `src/presentation/pages/TodayReferencePage.tsx` — dashboard/jornada do dia;
- `src/presentation/pages/FocusPage.tsx` — Pomodoro e foco personalizado;
- `src/presentation/pages/ActivitiesPage.tsx` — atividades;
- `src/presentation/pages/SettingsReferencePage.tsx` — horário base, fins de semana e pausas;
- `src/presentation/pages/ShiftMapPage.tsx` — planeamento mensal, incluindo dias de férias;
- `src/presentation/pages/WorkHoursCalculatorPage.tsx` — ocorrências laborais, incluindo férias;
- `src/presentation/pages/VacationBalancePage.tsx` — saldo pessoal de férias, configuração e explicação do cálculo;
- `src/presentation/providers/AppServicesProvider.tsx` — injeção única de repositories/serviços.

### Application

Casos de uso coordenam regras e repositories, sem depender da UI.

Exemplos:

- `startJourney` / `finishJourneyWithProductivityState`;
- `startBreak` / `finishBreak`;
- casos de uso de foco e atividades;
- `reconcileScheduledWorkday` — reconciliação automática do horário configurado.

A ferramenta de férias não introduz um serviço application separado nesta versão: a página apenas agrega fontes existentes e entrega um input normalizado à função pura de domínio `calculateVacationBalance`.

### Domain

Entidades, regras puras e cálculos.

Áreas principais:

- jornada;
- pausas;
- atividades;
- foco/Pomodoro;
- horários de trabalho;
- horas/ocorrências;
- férias;
- stock/medicação;
- configurações.

`WorkSchedule` é a autoridade para entrada, saída e pausas planeadas.

`VacationBalance` é a autoridade para o cálculo apresentado na área de férias. O módulo não altera jornadas, turnos ou horas; recebe datas de férias já identificadas e configuração explícita e devolve apenas um resultado calculado.

## Navegação responsiva

`AppShell` usa uma única árvore funcional:

- desktop: sidebar;
- mobile/tablet: top bar + bottom navigation + drawer.

A ferramenta de férias usa a rota `#/ferias`. Em desktop surge na navegação secundária; em mobile surge no bloco de acesso rápido. Não é criada uma rota ou implementação diferente por plataforma.

`mobileMenuOpen` é estado local e efémero. O mesmo botão alterna hambúrguer ↔ X, atualiza `aria-expanded`/`aria-label` e mantém alvo de toque de `44 × 44 px`.

A hierarquia móvel atual mantém o top bar visível quando o drawer abre. Drawer e backdrop começam abaixo da barra superior, preservando identidade, relógio, sincronização, bloqueio e notificações.

## Persistência

### Snapshot operacional

`AppDatabaseSnapshot` inclui, entre outros:

- metadata/settings;
- journeys;
- breaks;
- activities;
- focusSessions;
- coffeeRecords;
- stockEntities;
- stockMovements;
- medicationSchedules;
- medicationDoseEvents;
- `secureStorage`.

### Bases locais por instalação

- `foco-jornada-security-v1`: perfil de segurança, KDF, chaves embrulhadas, passkey e metadados de sync;
- `foco-jornada-vault-v1`: `EncryptedVaultRecord` cifrado.

`localStorage` é reservado a preferências/boot e compatibilidade de migração; não é a fonte principal dos registos de negócio. Não existe `sessionStorage` operacional.

### Configuração de férias

A ferramenta usa uma única chave no `secureStorage` existente:

`foco-jornada-vacation-settings-v1`

Campos:

- `employmentStartDate` — data de admissão indicada pelo utilizador;
- `annualEntitlementDays` — período anual confirmado, com mínimo lógico de 22 no regime geral suportado;
- `carriedDays` — dias transitados confirmados;
- `manualTakenDays` — férias já gozadas que não constam nos registos da aplicação;
- `adjustmentDays` — ajuste documentado positivo ou negativo.

Esta decisão evita uma migração de schema para cinco valores de configuração e mantém os dados dentro do cofre cifrado e do fluxo de sincronização existente.

## Fontes de dados da ferramenta de férias

```text
WorkHours store
  └─ reason === "ferias"

Shift map por mês
  └─ kind === "vacation"

Payroll plan por mês
  └─ kind === "vacation"

        ↓ normalizar por YYYY-MM-DD
        ↓ Set<string> / deduplicação

calculateVacationBalance()
        ↓
  ├─ férias gozadas até hoje
  ├─ férias futuras planeadas
  ├─ saldo disponível
  └─ saldo projetado
```

A mesma data pode estar representada no mapa e na calculadora porque essas áreas servem finalidades diferentes. A agregação considera a **data** como unidade lógica de um dia de férias e deduplica antes de calcular.

A versão inicial não tenta inferir férias a partir de ausência, baixa, folga ou jornada não iniciada. Apenas estados explicitamente marcados como férias entram na contagem automática.

## Regras de férias

### Anos normais

No enquadramento geral representado pela ferramenta:

- o direito anual vence, em regra, em 1 de janeiro;
- o mínimo anual é 22 dias úteis;
- não se apresenta uma “acumulação mensal” normal ao longo do ano;
- um valor configurado acima de 22 é aceite para permitir condição contratual/coletiva mais favorável confirmada pelo utilizador.

Fórmulas:

```text
saldoHoje = direitoAno + transitados + ajustes - gozadasRegistadas - gozadasManuais
saldoProjetado = saldoHoje - planeadasFuturas
```

### Ano de admissão

A versão inicial adota uma política conservadora e determinística:

```text
mesesCompletos = meses completos decorridos desde employmentStartDate
direitoAdmissao = min(20, mesesCompletos × 2)
```

O marco de disponibilidade para gozo é a data correspondente a seis meses completos de execução do contrato. A interface separa dias calculados de possibilidade de gozo antes desse marco.

Há divergência interpretativa/jurisprudencial sobre o tratamento de frações de mês no artigo 239.º em contratos que não se enquadram na regra específica de duração inferior a seis meses. A aplicação não esconde essa incerteza: usa meses completos, documenta a opção e recomenda confirmação com RH/ACT quando a diferença for material.

### Transferência de dias

A ferramenta não calcula automaticamente a validade de dias transitados. O utilizador introduz apenas o número confirmado. Isto evita assumir que todos os dias remanescentes podem ser usados indefinidamente, porque a transferência/cumulação depende das condições previstas no artigo 240.º e de eventual instrumento coletivo/acordo.

## Sincronização móvel ↔ computador

```text
AppDatabase
  └─ EncryptedVaultStore
       └─ EncryptedVaultRecord
            └─ CloudSyncManager
                 ├─ fingerprint SHA-256
                 ├─ token derivado da dataKey
                 ├─ GET /v1/vault/:profileId
                 └─ PUT /v1/vault/:profileId + expectedRevision
                      └─ Cloudflare Worker
                           └─ Durable Object por profileId
```

Como `secureStorage` integra o snapshot cifrado, a configuração de férias acompanha o mesmo cofre. A funcionalidade não adiciona API por entidade nem protocolo específico de férias.

### Regras de segurança

- PIN, palavra-passe, código de recuperação e `dataKey` original não são enviados ao Worker;
- o backend recebe apenas cofre cifrado e metadados técnicos;
- token HTTP é derivado no cliente;
- requests usam `cache: no-store`, `credentials: omit` e `referrerPolicy: no-referrer`;
- uma cópia remota é validada/autenticada antes de substituir a réplica local;
- não existe `last-write-wins` silencioso.

### Concorrência

- apenas local mudou → push;
- apenas remoto mudou → pull + validação;
- conteúdo igual → atualizar metadados;
- ambos mudaram → conflito explícito;
- endpoint mudou → limpar base de revisão/fingerprint antes de reconciliar.

### Associação de navegador

Um browser novo pode receber o `SecurityProfile` através de canal temporário cifrado com segredo no fragmento `#pair=...`. O canal expira, não transporta o cofre operacional e não envia o segredo raiz ao Worker. Depois da associação, o mesmo PIN/palavra-passe desbloqueia o perfil e o fluxo normal de sincronização obtém o cofre remoto.

## Rotas remotas

- `GET /health`;
- `GET /v1/vault/:profileId`;
- `PUT /v1/vault/:profileId`;
- `PUT /v1/pair/:pairingId`;
- `GET /v1/pair/:pairingId`;
- `DELETE /v1/pair/:pairingId`.

Não existe API separada por plataforma ou por entidade de negócio, incluindo férias.

## Horário de trabalho e automação temporal

### Configuração

`WorkScheduleSettings` mantém:

- entrada/saída de segunda a sábado;
- entrada/saída de domingo;
- datas de fim de semana marcadas como trabalho;
- exceções manuais de entrada/saída por data;
- `break1` e `break2`, cada uma com `enabled`, `startTime` e `endTime`.

A duração de uma pausa é derivada de `endTime - startTime`. Não existe duração de descanso global implícita. Para 60 minutos, o utilizador configura uma janela explícita de uma hora.

### Reconciliação automática — PR #202

```text
ScheduledWorkdayAutomation
  └─ usa useNow(5 s)
       └─ reconcileScheduledWorkday()
            ├─ resolve WorkSchedule do dia
            ├─ antes da entrada: não faz nada
            ├─ durante o turno sem jornada do dia
            │    └─ cria jornada com startedAt = entrada configurada
            ├─ atravessa uma pausa configurada
            │    ├─ pausa foco em execução, se necessário
            │    ├─ cria pausa com startedAt = início configurado
            │    └─ termina com endedAt = fim configurado
            └─ saída atingida
                 └─ finishJourneyWithProductivityState(
                      now = saída configurada
                    )
```

A reconciliação usa timestamps absolutos. O tick de 5 segundos serve apenas para deteção enquanto a aplicação está ativa; não acumula tempo e não é fonte da verdade.

### Recuperação após suspensão

`useNow` resincroniza em:

- `visibilitychange`;
- `focus`;
- `pageshow`;
- tick temporal.

Se o browser tiver suspendido timers, a automação compara o momento atual com o `WorkSchedule` e usa os marcos configurados como timestamps. Assim, um callback tardio não transforma 08:07 em entrada real automática quando a configuração é 08:00.

### Salvaguardas de integridade

- não iniciar antes da entrada;
- não criar uma segunda jornada após término manual no mesmo dia;
- não fabricar um dia completo se a primeira abertura ocorrer apenas depois da saída;
- não alterar históricos encerrados;
- pausas automáticas usam IDs determinísticos por data/janela;
- fecho da jornada reutiliza o fluxo existente de consistência de atividade, pausa e foco;
- alterações automáticas disparam `foco-jornada:app-data-changed` para refrescar controllers/relatórios.

### Pomodoro

Pomodoro permanece separado da automação laboral:

- só começa por ação explícita do utilizador;
- nenhum horário de entrada inicia Pomodoro;
- nenhuma pausa laboral cria um segmento Pomodoro;
- uma pausa laboral pode pausar uma sessão de foco já em execução;
- a saída da jornada pode cancelar foco ainda aberto através do caso de uso de fecho já existente.

## Limitações de background

A PWA não controla o scheduler do iOS/Android. Com a aplicação encerrada ou totalmente suspensa, JavaScript pode não executar no instante exato do marco. A arquitetura não tenta contornar essa limitação falsificando timers; reconcilia o estado quando o runtime volta a executar.

Consequência importante: automatização temporal significa **timestamp exato configurado quando existe contexto suficiente para reconciliar**, e não garantia de execução física em background.

## Atualização de estado na UI

Depois de uma mutação automática, `notifyAppDataChanged()` emite um evento interno. Os hooks que usam `useAppDataRefresh()` recarregam o respetivo repository:

- jornada;
- pausas;
- foco;
- atividades;
- relatório diário.

Isto evita criar um store paralelo ou duplicar regras de persistência.

A ferramenta de férias lê o store de horas reidratado e as chaves mensais do `secureStorage` durante o render da rota. Como não mantém um segundo histórico de férias, alterações feitas nas fontes voltam a ser refletidas quando a página é reaberta/renderizada com o estado atualizado.

## Datas e timezone

A área geral de jornada usa o timezone local do browser em vários utilitários `Date`/`Intl`. Dispositivos com timezones diferentes podem interpretar o mesmo instante de forma distinta.

O cálculo de férias usa chaves civis `YYYY-MM-DD` e valida/adiciona meses com componentes UTC para não introduzir deriva por DST. A apresentação das datas usa o locale `pt-PT`. Esta escolha não migra timestamps históricos nem resolve o risco global de timezone da jornada.

Não foi feita migração automática para um timezone global porque isso poderia alterar históricos. Validações cross-device devem usar o mesmo timezone do sistema.

## Cache/PWA

- API de sync usa `cache: no-store`;
- Workbox não usa runtime cache para a API de sincronização;
- a PWA verifica atualizações ao arrancar e em eventos relevantes de foreground/rede;
- o fallback de bootstrap usa a marca existente e respeita `prefers-reduced-motion`.

## Segurança de dependências

O quality gate executa `npm audit --audit-level=high` antes de typecheck/testes. Em 2026-09-10 advisories novos bloquearam o PR #202 em dependências de desenvolvimento. A branch atual de `main`:

- usa `vitest` `5.0.0`, versão corrigida para o advisory do mocker;
- força `sharp` `0.35.4`, versão corrigida para o advisory em libheif.

A ferramenta de férias não adiciona dependências de runtime ou desenvolvimento.

## Testes e quality gates

Obrigatórios antes de integrar:

1. `npm audit --audit-level=high`;
2. `npm run typecheck`;
3. `npm run lint`;
4. `npm test`;
5. `npm run build`;
6. `npm run worker:check`;
7. smoke test num Chromium headless;
8. integração apenas com CI verde.

A automação temporal possui testes para entrada, pausa de 60 minutos, saída, não criação depois do turno e não reinício após término manual.

`VacationBalance.test.ts` cobre período anual normal, valor mais favorável, limite mínimo, ano de admissão, limite de 20 dias, marco de seis meses, deduplicação, separação passado/futuro e data de admissão futura.

## Distribuição

GitHub Pages continua a ser a distribuição oficial do frontend. Cloudflare Worker serve apenas sincronização/associação. A arquitetura permanece local-first e offline-first, com réplica remota cifrada opcional para convergência entre dispositivos.
