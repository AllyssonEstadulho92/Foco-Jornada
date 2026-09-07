# Arquitetura

Atualizado em: 2026-09-07

## Stack confirmada

- React 19 + TypeScript.
- Vite para desenvolvimento e build.
- Cofre local cifrado sobre IndexedDB para persistência operacional.
- Vitest para testes automatizados.
- GitHub Pages como frontend oficial.
- Cloudflare Worker + Durable Objects como backend opcional de sincronização cifrada, em validação na branch `feat/cloudflare-sync`.

## Fluxo relevante — sincronização móvel e computador

```text
AppDatabase / EncryptedVaultStore
  └─ EncryptedVaultRecord (AES-GCM no cliente)
       ├─ evento local de alteração do cofre
       └─ CloudSyncManager
            ├─ impressão digital SHA-256 do cofre cifrado
            ├─ token de sincronização derivado da dataKey
            ├─ GET /v1/vault/:profileId
            └─ PUT /v1/vault/:profileId + expectedRevision
                 └─ Cloudflare Worker
                      └─ Durable Object por profileId
                           ├─ authHash
                           ├─ remoteRevision
                           └─ EncryptedVaultRecord
```

### Modelo de segurança da sincronização

O backend não recebe o snapshot em texto simples. O cliente envia o mesmo `EncryptedVaultRecord` já protegido por AES-GCM. A `dataKey` original permanece no dispositivo e só existe em memória enquanto o perfil está desbloqueado.

O token HTTP é derivado localmente a partir da `dataKey` com contexto específico de sincronização e SHA-256. O Worker volta a aplicar SHA-256 antes de guardar o verificador. Assim, uma cópia do armazenamento remoto contém ciphertext, revisão e um hash de autenticação, mas não contém PIN, palavra-passe, código de recuperação nem a chave AES original.

### Concorrência e conflitos

A revisão local de `EncryptedVaultRecord` e a revisão remota são independentes. O Worker só aceita uma escrita quando `expectedRevision` coincide com a revisão remota atual. Cada perfil é encaminhado para um Durable Object próprio, que serializa as operações desse perfil.

O cliente guarda no `SecurityProfile`:

- se a sincronização está ativa;
- última revisão remota confirmada;
- impressão digital do último cofre sincronizado;
- hora da última sincronização;
- último estado/erro de sincronização.

Com esta base, o cliente distingue:

- alteração apenas local → envia;
- alteração apenas remota → descarrega antes de reabrir o `AppDatabase`;
- conteúdo idêntico → apenas atualiza metadados;
- alteração independente nos dois lados → conflito, sem sobrescrita automática.

A sincronização é tentada no desbloqueio, após gravações locais do cofre, quando a aplicação volta ao primeiro plano, quando a ligação regressa e periodicamente enquanto está aberta. Falhas de rede não invalidam a escrita local.

### Primeiro emparelhamento

Dois dispositivos só podem sincronizar automaticamente se representarem o mesmo perfil criptográfico. O primeiro emparelhamento usa o mecanismo de cópia segura já existente: exporta-se o perfil protegido num dispositivo e importa-se no outro. Isso transfere `profileId`, material de chave cifrado e o cofre sem expor a `dataKey` em texto simples ao servidor.

## Fluxo relevante — horas de trabalho

```text
WorkHoursCalculatorPage / registos derivados da jornada
  └─ calculateWorkHours()
       ├─ normalização de horas e intervalos
       ├─ pausas planeadas/reais
       ├─ ocorrências/ausências
       ├─ interseção com o turno planeado
       └─ horas trabalhadas, não trabalhadas, extra e saldo
```

### Regra temporal para turnos noturnos

`calculateWorkHours` representa internamente um turno que atravessa a meia-noite numa linha temporal contínua. Exemplo: **22:00–06:00** torna-se **1320–1800 minutos**.

Para horas reais, pausas e ocorrências num turno noturno, cada hora civil tem duas representações possíveis: no dia inicial ou no dia seguinte. A normalização escolhe a representação mais próxima do intervalo planeado. Isto evita que uma entrada antecipada, por exemplo **21:00**, seja deslocada incorretamente para o dia seguinte, sem deixar de tratar **02:00** ou **07:00** como horas da manhã seguinte.

A regra de turnos diurnos permanece inalterada. Uma saída realmente anterior à entrada continua a representar passagem pela meia-noite; horas iguais continuam a representar duração zero.

A correção desta regra foi integrada no PR #189 e faz parte de `main` desde o commit `90d19791f7892e51c5baf2c27967d53e7b464b8c`.

## Fluxo relevante — medicação

```text
MedicationsStockPage
  ├─ MedicationDoseSwipeActions
  ├─ MedicationScheduleActionDialog
  └─ useAppServices()
       └─ OperationalPersonalStockService
            ├─ PersonalStockService
            └─ MedicationScheduleService
                 └─ AppDatabase.medicationSchedules

MedicationPrototypeWorkspace
  ├─ histórico funcional (Resumo)
  └─ auditoria técnica (Detalhes técnicos)
```

## Responsabilidades

### `cloudSync.ts`

Coordena a sincronização sem aceder aos dados desencriptados. Deriva o token de sincronização, calcula fingerprints do ciphertext, consulta a revisão remota, aplica compare-and-set e decide entre envio, receção ou conflito.

### `cloudflare/sync-worker.js`

Expõe apenas `GET` e `PUT` para cofres cifrados, valida origem, autenticação, tamanho e formato do payload e delega cada `profileId` para um Durable Object. Não contém segredos versionados.

### `WorkHours.ts`

É o motor de regras para cálculo de horas planeadas, presença, trabalho efetivo, períodos não trabalhados, horas extra, saldo e ocorrências. Os cálculos usam intervalos normalizados e fundidos para evitar dupla contagem de pausas sobrepostas. A normalização de turnos noturnos deve preservar a relação temporal com o turno planeado, incluindo entrada antecipada e saída tardia.

### `MedicationsStockPage`

Mantém o estado visual da lista de tomas, abre/fecha a linha deslizada e coordena os diálogos de definição e eliminação. As alterações continuam a usar o fluxo `run(...)` existente para recarregar dados e atualizar os mecanismos de proteção da medicação.

### `MedicationDoseSwipeActions`

Controla o gesto horizontal por Pointer Events, limita o deslocamento à largura das ações e mantém `touch-action: pan-y` para preservar o scroll vertical. O menu `···` permanece como alternativa acessível ao gesto.

### `MedicationScheduleActionDialog`

Apresenta edição e confirmação destrutiva. O diálogo de eliminação informa que o horário desaparece imediatamente da lista, enquanto tomas e correções anteriores permanecem protegidas.

### `MedicationScheduleService`

Aplica o ciclo de vida dos horários sem quebrar referências históricas:

- **Definir:** encerra a versão atual no dia anterior à nova configuração e cria um sucessor com o mesmo `order`.
- **Eliminar:** grava `deletedAt` e torna a versão inválida a partir do próprio dia da eliminação, definindo `effectiveUntil` para o dia anterior.
- Ao eliminar uma versão ativa, versões futuras não eliminadas do mesmo `order` são também tombstonadas para evitar reaparecimento posterior.
- O registo não é removido fisicamente da tabela.
- Repetir a eliminação é idempotente.
- Uma versão com `deletedAt` já não pode ser redefinida.

### `MedicationPrototypeWorkspace`

Carrega os horários ativos e o histórico completo de versões. O histórico é apresentado em duas vistas:

- **Resumo:** eventos funcionais e compreensíveis para o utilizador; exclui `protection`.
- **Detalhes técnicos:** checkpoints automáticos e registos de proteção.

Versões posteriores do mesmo `order` são apresentadas como **Horário alterado**. Um tombstone gera um único evento visual **Horário eliminado**, mesmo quando a eliminação afeta mais de uma versão futura da mesma cadeia.

## Dados e auditoria

A sincronização não altera o schema operacional do cofre. Apenas acrescenta metadados opcionais `cloudSync` ao `SecurityProfile`, fora do payload de negócio.

`MedicationSchedule` inclui o campo opcional `deletedAt`. A combinação `deletedAt` + `effectiveUntil` funciona como tombstone lógico. Os filtros existentes baseados em `effectiveFrom/effectiveUntil` deixam automaticamente de devolver o horário eliminado no dia da operação e nas previsões futuras.

A tabela `medicationSchedules` mantém todas as versões necessárias para que `MedicationDoseEvent.scheduleId` continue a apontar para um registo existente. Não é feito `delete()` físico nesta funcionalidade.

Depois de operações iniciadas pela página, o mecanismo existente continua a criar checkpoints quando a assinatura dos dados muda e tenta sincronizar a cópia redundante local.

## Qualidade e distribuição

O frontend oficial continua a ser publicado em GitHub Pages. A integração Cloudflare passa a ter finalidade arquitetural explícita apenas para o endpoint de sincronização.

A configuração do Worker está versionada em `wrangler.toml`; o build GitHub Pages recebe o endpoint através da variável de repositório `VITE_SYNC_API_URL`. Enquanto o Worker não estiver efetivamente publicado e essa variável não estiver definida, a interface apresenta a sincronização como indisponível e o modo local continua funcional.

## Acessibilidade e responsividade

- Alvos compatíveis com toque.
- Ações destrutivas têm texto e ícone e não dependem apenas da cor.
- O controlo de sincronização usa botão textual e estado legível, sem depender apenas de cor.
- Histórico compacto usa botões reais com `aria-pressed` para alternar resumo/detalhes técnicos.
- Paginação do histórico reduz comprimento vertical sem remover informação.
- `prefers-reduced-motion` mantém-se aplicado ao deslize.
- `forced-colors` mantém os novos controlos distinguíveis.
- O menu `···` continua disponível para teclado, rato e tecnologias de apoio.
