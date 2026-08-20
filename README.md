# Foco & Jornada

PWA local-first para controlo pessoal de jornada, pausas, atividades, foco/Pomodoro, café, histórico e produtividade.

## Foco & Jornada V1

A V1 está implementada no repositório. A branch de release só deve ser integrada em `main` quando o GitHub Actions confirmar typecheck, lint, testes e build verdes.

### Funcionalidades

- Jornada: iniciar, recuperar após refresh, impedir duplicados e terminar.
- Pausas: 15 min, 60 min e personalizada; tempo efetivo desconta pausas.
- Atividades: criar, editar, iniciar, concluir e cancelar; apenas uma ativa.
- Foco: Pomodoro 25/5/15, 4 ciclos e sessão personalizada, com pausa/retoma.
- Café: quantidade, preço configurável em EUR, custo e histórico diário.
- Dashboard Hoje: visão integrada dos módulos principais.
- Histórico: seleção de dia, resumo e timeline persistida.
- Estatísticas: hoje, últimos 7 dias e últimos 30 dias.
- Definições: preço de café e intervalo sugerido para pausas.
- Exportação: relatório diário em JSON.
- PWA: instalação e funcionamento offline dos assets da aplicação.

## Organização

```text
Foco-Jornada/
├── .github/                 # CI
├── project/                 # governação do projeto
│   ├── docs/
│   └── prompts/
├── public/                  # assets PWA
└── src/
    ├── domain/
    │   ├── journey/
    │   ├── breaks/
    │   ├── activities/
    │   ├── focus/
    │   ├── coffee/
    │   └── settings/
    ├── application/
    │   ├── journey/
    │   ├── breaks/
    │   ├── activities/
    │   ├── focus/
    │   ├── coffee/
    │   ├── settings/
    │   └── reports/
    ├── infrastructure/
    │   ├── database/
    │   └── repositories/
    ├── presentation/
    │   ├── components/
    │   ├── hooks/
    │   ├── layouts/
    │   ├── pages/
    │   └── providers/
    ├── shared/
    ├── styles/
    └── test/
```

## Persistência

IndexedDB/Dexie é a fonte de verdade local. Timers são reconstruídos por timestamps persistidos, e não por contadores acumulados em memória.

## Desenvolvimento

```bash
npm install
npm run typecheck
npm run lint
npm test
npm run build
npm run dev
```

## Documentação

- `project/PROJECT_SPEC.md` — especificação funcional e arquitetural.
- `project/ROADMAP.md` — estado das fases.
- `project/CHECKPOINT.md` — ponto oficial de continuidade.
- `project/docs/ARCHITECTURE.md` — regras de arquitetura.
- `project/docs/QUALITY_GATES.md` — gates obrigatórios.
- `project/docs/DECISIONS.md` — decisões técnicas.
