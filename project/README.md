# Gestão do projeto — Foco & Jornada

Esta pasta concentra a documentação de produto, arquitetura, roadmap, checkpoints e prompts de execução do projeto.

## Estrutura

```text
project/
├── README.md
├── PROJECT_SPEC.md
├── ROADMAP.md
├── CHECKPOINT.md
├── docs/
│   ├── ARCHITECTURE.md
│   ├── DECISIONS.md
│   └── QUALITY_GATES.md
└── prompts/
    ├── PHASE_01_FOUNDATION.md
    ├── PHASE_02_JOURNEY.md
    ├── PHASE_03_BREAKS.md
    ├── PHASE_04_ACTIVITIES.md
    ├── PHASE_05_FOCUS.md
    ├── PHASE_06_COFFEE.md
    ├── PHASE_07_DASHBOARD.md
    ├── PHASE_08_HISTORY_SETTINGS.md
    ├── PHASE_09_FINAL_QUALITY.md
    └── REVIEW_AFTER_EACH_PHASE.md
```

## Ordem de trabalho

1. Ler `PROJECT_SPEC.md`.
2. Confirmar a fase atual em `CHECKPOINT.md`.
3. Ler `docs/ARCHITECTURE.md` e `docs/QUALITY_GATES.md`.
4. Executar apenas o prompt da fase atual em `prompts/`.
5. Executar os gates de qualidade.
6. Atualizar `CHECKPOINT.md`.
7. Registar decisões relevantes em `docs/DECISIONS.md`.
8. Só depois desbloquear a fase seguinte.

## Regra principal

Não desenvolver várias fases em paralelo. O código fica em `src/`; esta pasta `project/` guarda a governação e continuidade do projeto.
