# Arquitetura — Foco & Jornada

## Objetivo

Manter as regras de negócio independentes de React, Zustand e IndexedDB, reduzindo acoplamento e facilitando testes e evolução futura para backend/cloud.

## Camadas

### `domain/`

Contém entidades, tipos de domínio, regras e funções puras.

Não pode importar:

- React;
- Zustand;
- Dexie;
- componentes de interface.

### `application/`

Coordena casos de uso, por exemplo:

- iniciar jornada;
- terminar jornada;
- iniciar pausa;
- iniciar atividade;
- iniciar sessão de foco.

Pode depender de contratos/interfaces de repositórios, mas não da implementação Dexie diretamente.

### `infrastructure/`

Implementa persistência e adaptadores:

- Dexie;
- repositórios IndexedDB;
- migrações;
- conversões de dados quando necessárias.

### `presentation/`

Contém React:

- páginas;
- layouts;
- navegação;
- componentes visuais.

Não deve conter regras centrais de negócio.

### `shared/`

Apenas código verdadeiramente transversal:

- formatação de tempo;
- utilitários de datas;
- identificadores;
- constantes neutras.

Evitar transformar `shared/` num depósito genérico.

---

## Fonte de verdade de tempo

Timers não acumulam segundos em memória como fonte de verdade.

Guardar timestamps e derivar o valor atual:

```text
elapsed = now - startedAt - pausedDuration
```

`setInterval` serve apenas para atualizar a interface.

---

## Fonte de verdade de dados

IndexedDB é a fonte de verdade persistente da V1.

Zustand deve representar estado de interface/cache e nunca ser o único local de dados críticos.

---

## IDs

Usar IDs únicos estáveis. Preferência: `crypto.randomUUID()` quando disponível.

---

## Datas

Persistir timestamps em ISO 8601 UTC (`new Date().toISOString()`).

Converter para hora local apenas na apresentação.

---

## Dinheiro

Evitar cálculos monetários com floats sempre que os dados passarem a ser persistidos de forma relevante. Preferir guardar cêntimos como inteiros numa evolução do modelo. Se a Fase 6 iniciar com `number`, documentar a decisão e cobrir arredondamento com testes.

---

## Migrações

Dexie deve ter versões de schema explícitas. Qualquer alteração de estrutura persistida exige migração ou justificação formal.
