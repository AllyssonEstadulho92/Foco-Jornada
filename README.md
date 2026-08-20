# Foco & Jornada

Aplicação local-first para controlo de jornada, pausas, atividades, foco/Pomodoro, café e produtividade pessoal.

## Estado atual

**Fase 1 — Fundação: concluída.**  
**Próxima fase: Fase 2 — Jornada.**

A fundação técnica já inclui React + TypeScript + Vite, Router, Zustand, Dexie/IndexedDB preparado, testes, lint/format, PWA, navegação responsiva e as páginas-base da aplicação.

## Organização do repositório

```text
Foco-Jornada/
├── .github/              # CI e automações GitHub
├── project/              # especificação, roadmap, decisões e prompts
│   ├── docs/
│   └── prompts/
├── src/                  # código da aplicação
│   ├── domain/
│   ├── application/
│   ├── infrastructure/
│   ├── presentation/
│   ├── shared/
│   ├── styles/
│   └── test/
├── index.html
├── package.json
├── vite.config.ts
├── vitest.config.ts
└── tsconfig*.json
```

## Documentação principal

- `project/PROJECT_SPEC.md` — fonte de verdade funcional e arquitetural.
- `project/ROADMAP.md` — fases e gates de desenvolvimento.
- `project/CHECKPOINT.md` — ponto exato de continuidade.
- `project/docs/ARCHITECTURE.md` — regras de arquitetura.
- `project/docs/QUALITY_GATES.md` — validações obrigatórias.
- `project/docs/DECISIONS.md` — decisões técnicas.
- `project/prompts/` — instruções de execução fase a fase para Codex.

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
