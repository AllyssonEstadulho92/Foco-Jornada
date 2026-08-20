# Foco & Jornada

PWA local-first para jornada de trabalho, pausas, atividades, planeamento, café, transportes, escala e relatórios.

**Versão estável pública:** 4.2.x  
**Próxima fase:** 4.3.0 — consolidação e estabilidade.

## Módulos atuais
- Jornada: entrada, saída, edição, cancelamento, reabertura e cálculo por timestamps.
- Horário semanal: segunda a sábado 08:00–17:00; domingo 09:00–18:00.
- Pausa principal sugerida, com aviso automático e início manual.
- Atividades: criar, editar, prioridade, categoria, estimativa, iniciar, pausar, concluir e cancelar.
- Planeamento: estado da jornada, atividades abertas, tarefas para hoje, atrasos, prioridades e atalhos operacionais.
- Café: preço configurável, registo, gasto e desfazer.
- Moovit: Casa/Trabalho, localização atual, planeamento de rota e transportes próximos através de deep links oficiais.
- Escala interna: calendário, modelos de turnos, trabalhos, rotações, relatórios, horas/salário configuráveis, ICS e PDF A4.
- Previsão de saída e resumo diário.
- Histórico e estatísticas.
- Backup/importação, diagnóstico e reset.
- Centro de notificações e atualização PWA controlada.
- PWA/offline, tema claro/escuro e interface mobile/desktop.

## Hub “Mais”
O botão **Mais** concentra Planeamento, Moovit, Supershift/Escala, horário, estatísticas, definições, backup/diagnóstico, notificações, atualizações e Sobre sem aumentar a barra inferior.

## Compatibilidade de dados
Estruturas antigas podem continuar a ser reconhecidas durante migrações ou importação de backups, mas deixam de constituir módulos públicos da aplicação.

## Vida pessoal
O antigo módulo **Vida pessoal / Tempo a dois** foi retirado do runtime. Não deve regressar automaticamente em atualizações; qualquer funcionalidade pessoal adicional será implementada apenas quando pedida explicitamente.

## Roadmap
Consultar [`ROADMAP.md`](./ROADMAP.md) para o estado ✅ / 🟡 / ⬜ das funcionalidades e [`docs/CONSOLIDATION-4.3.md`](./docs/CONSOLIDATION-4.3.md) para o plano técnico da 4.3.0.

## Qualidade
Execute:

```bash
npm run check
```

A suite atual cobre domínio, features, hub, controlos, Moovit, Planeamento, escala, relatórios, correções de runtime, auditoria de botões e coerência de versão. Ainda são necessários smoke tests reais no Safari/PWA do iPhone para fluxos que dependem de toque, permissões, ficheiros, impressão ou aplicações externas.

## Privacidade e arquitetura
Os dados permanecem neste dispositivo através de armazenamento local. A versão atual não possui conta, backend ou sincronização entre dispositivos.
