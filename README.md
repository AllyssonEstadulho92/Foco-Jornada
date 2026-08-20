# Foco & Jornada

Aplicação local-first para controlo de jornada, pausas, atividades, foco/Pomodoro, café e produtividade pessoal.

## Estado atual

**Fase 1 — Fundação: em curso.**

O repositório já contém a base React + TypeScript + Vite, separação inicial por camadas e design tokens. A Fundação ainda precisa de Router, Zustand, Dexie, testes, lint/format, PWA e navegação responsiva antes de iniciar o módulo Jornada.

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
│   └── styles/
├── index.html
├── package.json
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

## Comandos atuais

```bash
npm install
npm run typecheck
npm run build
npm run dev
```

Os scripts de lint e testes serão adicionados durante a conclusão da Fase 1.

## Regra de desenvolvimento

Trabalhar uma fase de cada vez. Nenhuma fase seguinte deve começar antes de o `project/CHECKPOINT.md` e os quality gates confirmarem a fase anterior.
