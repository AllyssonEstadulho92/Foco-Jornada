# Foco & Jornada

PWA local-first para controlo pessoal de jornada, pausas, atividades, foco, horários, turnos, stock pessoal e acompanhamento diário.

## Estado da aplicação

A baseline publicada é 1.1.5. A versão 1.2.0 está em hardening técnico e só deve ser integrada em `main` depois de typecheck, lint, testes, build e smoke tests desktop/mobile concluídos com sucesso.

### Funcionalidades

- Jornada: iniciar, recuperar após refresh, impedir duplicados e terminar.
- Pausas: 15 min, 60 min e personalizada; o tempo efetivo desconta pausas.
- Atividades: criar, editar, iniciar, concluir e cancelar; apenas uma ativa.
- Foco: Pomodoro e sessão personalizada, com pausa/retoma e reconstrução por timestamps.
- Café: quantidade, preço configurável, custo e histórico diário.
- Hoje: visão operacional da jornada e do horário configurado.
- Histórico e estatísticas: agregações reconstruídas dos registos persistidos.
- Horas: cálculo diário/mensal de trabalho, ausências e horas extra.
- Vencimento: planificação e simulação parametrizável.
- Mapa de turnos: planeamento mensal ligado ao horário e vencimento.
- Stock pessoal: ledger de movimentos, reconciliação e proteção contra inconsistências.
- Sticks: stock, utilização, planeamento de maços e temporizador técnico de sessão glo.
- Medicação: stock, horários, estados de toma, adiamentos/correções e proteção de dados.
- Notificações: centro local e deadlines para eventos configurados.
- Backup/restauro: IndexedDB e estado operacional suportado do browser.
- Relatório A4: relatório diário imprimível/PDF.
- PWA: instalação, cache offline e atualização automática.

## Organização

```text
Foco-Jornada/
├── .github/                 # CI e publicação
├── project/                 # governação do projeto
│   ├── docs/
│   └── prompts/
├── public/                  # assets públicos fonte
└── src/
    ├── domain/              # entidades e regras
    ├── application/         # casos de uso e serviços
    ├── infrastructure/      # IndexedDB/Dexie e repositórios
    ├── presentation/        # React, rotas, páginas e UI
    ├── shared/              # utilitários transversais
    ├── styles/              # estilos por módulo/ecrã
    └── test/                # repositórios in-memory e setup
```

Os builds compilados não são fonte versionada. O CI gera `dist/` e publica esse artefacto diretamente no GitHub Pages.

## Persistência e tempo

IndexedDB/Dexie é a fonte principal dos dados de domínio. Algumas áreas operacionais históricas ainda usam `localStorage`; a versão 1.2 inclui-as no backup através de uma allowlist explícita enquanto a migração gradual para IndexedDB não estiver concluída.

Timers não acumulam segundos em memória como fonte de verdade. O valor atual é reconstruído a partir de timestamps persistidos.

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
- `project/docs/HARDENING_1_2.md` — hardening técnico da versão 1.2.
- `docs/TIME-AUTOMATION.md` — política de automatização temporal.
