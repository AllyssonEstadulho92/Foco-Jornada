# Foco & Jornada — Especificação Mestre do Projeto

**Documento:** `project/PROJECT_SPEC.md`  
**Versão:** 1.0  
**Estado:** Aprovado para início do desenvolvimento  
**Objetivo:** servir como fonte de verdade para o desenvolvimento no Codex.

---

## 1. Visão do produto

**Foco & Jornada** é uma aplicação pessoal de produtividade, local-first e responsiva, destinada a controlar:

- jornada de trabalho;
- tempo efetivamente trabalhado;
- pausas;
- atividades;
- sessões de foco/Pomodoro;
- consumo de café e respetivo custo;
- histórico diário;
- estatísticas de produtividade.

A primeira versão deve funcionar em smartphone, tablet e desktop, com suporte offline e possibilidade de instalação como PWA.

---

## 2. Princípios da versão 1

A V1 deve ser:

- **local-first**;
- utilizável sem conta;
- utilizável sem servidor;
- funcional offline;
- responsiva;
- simples de manter;
- preparada para evolução futura;
- persistente após fechar/reabrir a aplicação.

### Fora da V1

Não implementar nesta fase:

- autenticação;
- contas de utilizador;
- sincronização cloud;
- backend remoto;
- equipas;
- supervisores;
- gestão de funcionários;
- faturação;
- subscrições;
- publicação nativa em App Store ou Google Play.

Estas funcionalidades devem poder ser adicionadas futuramente sem exigir reescrever o núcleo da aplicação.

---

## 3. Stack tecnológica

### Frontend

- React 18+
- TypeScript
- Vite
- React Router

### Estado

- Zustand

### Persistência local

- IndexedDB
- Dexie.js

### Testes

- Vitest
- React Testing Library quando necessário

### Feedback visual

- React Hot Toast

### Distribuição

- PWA

### Qualidade

- ESLint
- Prettier
- TypeScript strict mode

---

## 4. Arquitetura

Adotar separação clara entre domínio, aplicação, infraestrutura e apresentação.

```text
src/
├── domain/
│   ├── common/
│   ├── journey/
│   ├── breaks/
│   ├── activities/
│   ├── focus/
│   └── coffee/
│
├── application/
│   ├── journey/
│   ├── breaks/
│   ├── activities/
│   ├── focus/
│   ├── coffee/
│   └── statistics/
│
├── infrastructure/
│   ├── database/
│   ├── repositories/
│   └── persistence/
│
├── presentation/
│   ├── components/
│   ├── layouts/
│   ├── pages/
│   └── navigation/
│
├── shared/
│   ├── hooks/
│   ├── types/
│   ├── utils/
│   └── constants/
│
├── App.tsx
└── main.tsx
```

### Regra arquitetural

A camada de domínio não deve depender de React, Dexie, Zustand ou componentes de interface.

---

## 5. Navegação

### Mobile

Navegação inferior:

1. Hoje
2. Atividades
3. Foco
4. Histórico
5. Mais

### Tablet

Layout adaptado com maior área útil e possibilidade de duas colunas.

### Desktop

Menu lateral:

1. Hoje
2. Atividades
3. Foco
4. Histórico
5. Mais

Acesso secundário:

- Definições

---

## 6. Ecrã “Hoje”

O dashboard principal deve apresentar:

- estado da jornada;
- hora de entrada;
- duração total da jornada;
- tempo efetivo;
- próxima pausa;
- atividade atual;
- duração da atividade atual;
- sessões de foco;
- cafés;
- gasto em cafés;
- ações rápidas;
- histórico do dia;
- resumo diário.

### Ações rápidas

- Pausa 15 min
- Pausa 60 min
- Iniciar foco
- Adicionar café
- Nova atividade

---

## 7. Jornada de trabalho

A jornada é o módulo central da aplicação.

### 7.1 Iniciar jornada

Ao iniciar uma jornada:

1. criar um registo de jornada;
2. guardar data e hora de entrada;
3. definir estado como `active`;
4. iniciar cálculo de duração em tempo real;
5. persistir imediatamente em IndexedDB.

### 7.2 Estados

```text
idle
active
paused
finished
```

### 7.3 Regra de unicidade

Nunca podem existir duas jornadas ativas simultaneamente.

Se existir uma jornada ativa, a aplicação deve impedir a criação de outra.

### 7.4 Recuperação

Se a aplicação for:

- fechada;
- atualizada;
- reiniciada;
- encerrada pelo sistema;
- reaberta depois de algum tempo;

a jornada ativa deve ser recuperada a partir dos dados persistidos.

O tempo apresentado não deve depender de um contador acumulado em memória. Deve ser calculado com base nos timestamps persistidos.

### 7.5 Terminar jornada

Ao terminar:

1. pedir confirmação;
2. terminar eventual pausa ativa;
3. terminar ou encerrar de forma consistente eventual atividade ativa;
4. tratar eventual sessão de foco ativa;
5. guardar hora de saída;
6. calcular duração total;
7. calcular pausas;
8. calcular tempo efetivo;
9. guardar resumo;
10. definir estado como `finished`.

---

## 8. Cálculo de tempos

### Duração total da jornada

```text
hora de saída - hora de entrada
```

Quando a jornada ainda está ativa:

```text
agora - hora de entrada
```

### Tempo efetivo

Na V1:

```text
tempo efetivo = duração total da jornada - duração total das pausas
```

Sessões de foco contam como trabalho e não são descontadas.

### Requisito

Os cálculos devem ser derivados de timestamps e não de `setInterval` acumulativo.

---

## 9. Pausas

### Tipos

- pausa curta: 15 minutos;
- pausa longa: 60 minutos;
- pausa personalizada.

### Dados mínimos

Cada pausa deve guardar:

```text
id
journeyId
type
plannedDurationMinutes
startedAt
endedAt
actualDurationSeconds
status
```

### Estados

```text
active
finished
cancelled
```

### Regras

- apenas uma pausa ativa por jornada;
- uma pausa só pode existir dentro de uma jornada ativa;
- durante uma pausa, a jornada permanece aberta;
- o tempo da pausa é descontado do tempo efetivo.

---

## 10. Próxima pausa

O dashboard pode apresentar uma sugestão:

```text
Próxima pausa
12 min
```

Na V1, esta funcionalidade será configurável e não deve ser apresentada como regra legal ou laboral.

Valor inicial sugerido:

```text
90 minutos de trabalho até à próxima pausa sugerida
```

---

## 11. Atividades

### Dados mínimos

```text
id
journeyId
name
description
startedAt
endedAt
status
createdAt
updatedAt
```

### Estados

```text
pending
active
completed
cancelled
```

### Regras

- apenas uma atividade ativa de cada vez;
- iniciar uma nova atividade deve exigir o encerramento ou pausa da atividade atual;
- atividades concluídas mantêm-se no histórico;
- duração deve ser calculada por timestamps;
- uma atividade pode existir sem sessão de foco.

### Operações

- criar;
- editar;
- iniciar;
- concluir;
- cancelar;
- consultar;
- eliminar quando permitido.

---

## 12. Foco / Pomodoro

### Modos

- Pomodoro;
- personalizado.

### Valores iniciais

- foco: 25 min;
- pausa curta: 5 min;
- pausa longa: 15 min;
- ciclos: 4.

### Dados mínimos

```text
id
journeyId
activityId?
mode
plannedDurationSeconds
startedAt
pausedAt?
totalPausedSeconds
endedAt?
status
cycle
```

### Estados

```text
running
paused
completed
cancelled
```

### Funcionalidades

- iniciar;
- pausar;
- retomar;
- terminar;
- cancelar;
- associar a atividade;
- contar ciclos;
- guardar duração realizada.

### Regra

O temporizador deve sobreviver a refresh/reabertura através dos timestamps persistidos.

---

## 13. Café

Cada registo deve guardar:

```text
id
journeyId?
quantity
unitPrice
totalPrice
createdAt
```

### Comportamento

A ação `+ Café` deve:

1. criar um registo;
2. assumir quantidade 1 por defeito;
3. usar o preço configurado;
4. atualizar imediatamente o resumo diário.

---

## 14. Histórico diário

Criar uma timeline cronológica a partir dos eventos persistidos.

Exemplo:

```text
14:02  Entrada na jornada
14:05  Atividade iniciada — Tratamento de ocorrências
16:30  Café adicionado
17:15  Pausa iniciada — 15 min
17:30  Pausa terminada
18:00  Sessão de foco iniciada
18:25  Sessão de foco concluída
22:40  Jornada terminada
```

### Requisito

O histórico deve poder ser reconstruído a partir da base de dados, sem depender apenas do estado atual da interface.

---

## 15. Resumo diário

Apresentar:

- entrada;
- saída;
- duração da jornada;
- tempo efetivo;
- duração total das pausas;
- tempo de foco;
- número de atividades;
- número de cafés;
- gasto em cafés.

---

## 16. Estatísticas

Não são prioridade para o primeiro incremento, mas a arquitetura deve permitir agregar dados por:

- dia;
- semana;
- mês.

Métricas:

- horas de jornada;
- tempo efetivo;
- pausas;
- foco;
- atividades;
- cafés;
- gastos.

---

## 17. Definições

Preparar suporte para:

- duração padrão de Pomodoro;
- duração da pausa curta;
- duração da pausa longa;
- intervalo de sugestão de pausa;
- preço do café;
- moeda;
- tema;
- notificações;
- comportamento da jornada.

Na primeira implementação, os valores podem ter defaults fixos com estrutura preparada para persistência posterior.

---

## 18. Design e interface

Utilizar o protótipo fornecido como referência visual.

### Direção visual

- modo escuro como tema principal;
- fundo azul/preto muito escuro;
- azul para ações principais e foco;
- verde para estados positivos;
- vermelho para ações destrutivas;
- laranja para pausas;
- cartões com contraste discreto;
- tipografia limpa;
- interface profissional;
- alta legibilidade;
- densidade de informação adequada a desktop;
- simplificação progressiva em mobile.

### Importante

Não é necessário reproduzir pixel a pixel o protótipo na primeira fase.

Primeiro garantir:

1. estrutura;
2. funcionalidade;
3. responsividade;
4. consistência;
5. acabamento visual.

---

## 19. Persistência e consistência

IndexedDB é a fonte de verdade local.

### Requisitos

- todas as alterações relevantes devem ser persistidas imediatamente;
- refresh não pode apagar estado funcional;
- relógios e cronómetros devem ser reconstruídos a partir de timestamps;
- operações críticas devem ser idempotentes quando possível;
- não criar duplicados por duplo clique;
- usar IDs únicos;
- manter esquema preparado para migrações.

---

## 20. Modelo de dados inicial

### Journey

```ts
interface Journey {
  id: string;
  date: string;
  startedAt: string;
  endedAt?: string;
  status: 'active' | 'finished';
  createdAt: string;
  updatedAt: string;
}
```

### Break

```ts
interface BreakRecord {
  id: string;
  journeyId: string;
  type: 'short' | 'long' | 'custom';
  plannedDurationMinutes?: number;
  startedAt: string;
  endedAt?: string;
  status: 'active' | 'finished' | 'cancelled';
}
```

### Activity

```ts
interface Activity {
  id: string;
  journeyId: string;
  name: string;
  description?: string;
  startedAt?: string;
  endedAt?: string;
  status: 'pending' | 'active' | 'completed' | 'cancelled';
  createdAt: string;
  updatedAt: string;
}
```

### FocusSession

```ts
interface FocusSession {
  id: string;
  journeyId: string;
  activityId?: string;
  mode: 'pomodoro' | 'custom';
  plannedDurationSeconds: number;
  startedAt: string;
  endedAt?: string;
  pausedAt?: string;
  totalPausedSeconds: number;
  status: 'running' | 'paused' | 'completed' | 'cancelled';
  cycle: number;
}
```

### CoffeeRecord

```ts
interface CoffeeRecord {
  id: string;
  journeyId?: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  createdAt: string;
}
```

---

## 21. Fases de desenvolvimento

### Fase 1 — Fundação

Implementar:

- Vite;
- React;
- TypeScript;
- React Router;
- Zustand;
- Dexie;
- Vitest;
- ESLint;
- Prettier;
- PWA;
- estrutura de pastas;
- layout responsivo;
- design tokens;
- navegação.

### Fase 2 — Jornada

Implementar e testar:

- iniciar;
- recuperar;
- calcular tempo;
- impedir duplicados;
- terminar;
- persistir;
- histórico básico.

### Fase 3 — Pausas

Implementar e testar:

- pausa 15 min;
- pausa 60 min;
- personalizada;
- iniciar;
- terminar;
- descontar do tempo efetivo.

### Fase 4 — Atividades

Implementar:

- CRUD;
- atividade ativa;
- duração;
- prevenção de atividades simultâneas.

### Fase 5 — Foco

Implementar:

- Pomodoro;
- personalizado;
- pausa/retoma;
- ciclos;
- persistência;
- associação a atividade.

### Fase 6 — Café

Implementar:

- registo;
- quantidade;
- preço;
- custo diário.

### Fase 7 — Dashboard

Integrar todos os módulos.

### Fase 8 — Histórico, estatísticas e definições

### Fase 9 — Qualidade final

- testes;
- acessibilidade;
- responsividade;
- PWA;
- tratamento de erros;
- estados vazios;
- revisão visual;
- build de produção.

---

## 22. Critérios mínimos de aceitação da V1

A V1 só deve ser considerada concluída quando:

- [ ] é possível iniciar uma jornada;
- [ ] refresh não perde a jornada;
- [ ] fechar/reabrir não perde a jornada;
- [ ] não é possível criar duas jornadas ativas;
- [ ] é possível iniciar e terminar pausas;
- [ ] pausas são descontadas corretamente;
- [ ] é possível criar e gerir atividades;
- [ ] apenas uma atividade fica ativa de cada vez;
- [ ] Pomodoro funciona após refresh;
- [ ] sessões de foco são persistidas;
- [ ] café pode ser registado;
- [ ] dashboard apresenta valores consistentes;
- [ ] histórico diário funciona;
- [ ] interface funciona em mobile, tablet e desktop;
- [ ] aplicação funciona offline após instalação;
- [ ] `npm run build` termina sem erros;
- [ ] testes críticos passam;
- [ ] não existem erros de TypeScript;
- [ ] não existem dados mockados a substituir funcionalidades reais.

---

## 23. Regras para o Codex

Durante o desenvolvimento:

1. não implementar todas as fases de uma vez;
2. trabalhar em incrementos pequenos;
3. executar testes após alterações relevantes;
4. executar build antes de considerar uma fase concluída;
5. não alterar requisitos silenciosamente;
6. documentar decisões arquiteturais relevantes;
7. preferir código simples e explícito;
8. evitar abstrações prematuras;
9. não usar dados mockados quando já existir persistência real;
10. preservar compatibilidade com mobile;
11. atualizar este documento apenas quando um requisito for formalmente alterado.

---

# 24. Primeira tarefa para o Codex

O prompt abaixo deve ser executado a partir da raiz do repositório, mantendo este ficheiro em `project/PROJECT_SPEC.md`.

## Prompt inicial

```text
Quero iniciar o desenvolvimento do projeto "Foco & Jornada".

O ficheiro `project/PROJECT_SPEC.md` é a fonte de verdade funcional e arquitetural. Leia-o integralmente antes de alterar qualquer ficheiro.

Nesta primeira tarefa, implemente APENAS a Fase 1 — Fundação.

Objetivos:

1. Criar uma aplicação React + TypeScript com Vite.
2. Configurar TypeScript em modo strict.
3. Configurar React Router.
4. Configurar Zustand.
5. Configurar Dexie/IndexedDB.
6. Configurar Vitest.
7. Configurar ESLint e Prettier.
8. Preparar suporte PWA.
9. Criar a estrutura de pastas definida em `project/PROJECT_SPEC.md`.
10. Criar um layout responsivo base:
    - navegação inferior em mobile;
    - menu lateral em desktop;
    - adaptação para tablet.
11. Criar páginas vazias funcionais para:
    - Hoje
    - Atividades
    - Foco
    - Histórico
    - Mais
    - Definições
12. Implementar design tokens básicos para o tema escuro descrito no documento.
13. Não implementar ainda a lógica de jornada, pausas, atividades, Pomodoro ou café.

Antes de terminar:

- execute os testes;
- execute o lint;
- execute o build de produção;
- corrija todos os erros encontrados;
- confirme que a aplicação inicia corretamente.

No final, apresente:
1. resumo do que foi criado;
2. estrutura principal de ficheiros;
3. comandos executados;
4. resultado dos testes;
5. resultado do build;
6. quaisquer decisões técnicas relevantes;
7. o que ficou deliberadamente fora desta fase.

Não avance para a Fase 2 sem nova instrução.
```

---

## 25. Próximo passo após a Fase 1

Depois de a fundação estar estável, a tarefa seguinte será:

**Fase 2 — implementar exclusivamente o módulo Jornada**, incluindo persistência, recuperação após refresh, cálculo por timestamps, prevenção de jornadas duplicadas e testes.

Não avançar automaticamente para essa fase.
