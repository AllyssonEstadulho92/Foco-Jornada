# Foco & Jornada

Aplicação local-first para controlo de jornada, pausas, atividades, foco/Pomodoro, café e produtividade pessoal.

## Estado atual

- **Fase 0 — Especificação: concluída.**
- **Fase 1 — Fundação: concluída.**
- **Fase 2 — Jornada: concluída.**
- **Fase 3 — Pausas: em desenvolvimento.**

A base técnica inclui React + TypeScript + Vite, Router, Zustand, Dexie/IndexedDB, testes, lint/format, PWA, navegação responsiva e CI. O módulo Jornada já está integrado e a Fase 3 acrescenta pausas persistentes e cálculo de tempo efetivo.

## Organização do repositório

```text
Foco-Jornada/
├── .github/              # CI e automações GitHub
├── project/              # especificação, roadmap, decisões, gates e prompts
│   ├── docs/
│   └── prompts/
├── src/                  # código da aplicação
│   ├── domain/           # entidades e regras puras
│   │   ├── journey/
│   │   └── breaks/
│   ├── application/      # casos de uso
│   │   ├── journey/
│   │   └── breaks/
│   ├── infrastructure/   # IndexedDB/Dexie e repositórios
│   ├── presentation/     # páginas, hooks, componentes e providers
│   ├── shared/
│   ├── styles/
│   └── test/             # doubles e setup de testes
├── index.html
├── package.json
├── vite.config.ts
├── vitest.config.ts
└── tsconfig*.json
```

## Funcionalidades já disponíveis

### Jornada

- iniciar e terminar jornada;
- impedir duas jornadas ativas;
- recuperação após refresh/reabertura;
- duração derivada de timestamps;
- histórico básico diário.

### Pausas — Fase 3

Em implementação na branch `phase/03-pausas`:

- pausa curta de 15 min;
- pausa longa de 60 min;
- pausa personalizada;
- apenas uma pausa ativa por jornada;
- persistência IndexedDB;
- recuperação após refresh;
- tempo efetivo = jornada - pausas;
- encerramento automático da pausa ao terminar a jornada.

## Documentação principal

- `project/PROJECT_SPEC.md` — fonte de verdade funcional e arquitetural.
- `project/ROADMAP.md` — fases e gates de desenvolvimento.
- `project/CHECKPOINT.md` — ponto exato de continuidade.
- `project/docs/ARCHITECTURE.md` — regras de arquitetura.
- `project/docs/QUALITY_GATES.md` — validações obrigatórias.
- `project/docs/DECISIONS.md` — decisões técnicas.
- `project/prompts/` — instruções fase a fase para Codex.

## Comandos

```bash
npm install
npm run typecheck
npm run lint
npm test
npm run build
npm run dev
```

## Regra de desenvolvimento

Trabalhar uma fase de cada vez. Nenhuma fase seguinte deve começar antes de o `project/CHECKPOINT.md` e os quality gates confirmarem a fase anterior.
