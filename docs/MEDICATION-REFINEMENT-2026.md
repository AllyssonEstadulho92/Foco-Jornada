# Medicação: auditoria e repaginação da interface (2026-10-15)

## Objetivo e fonte de verdade

Intervenção de apresentação em `#/medicamentos` no repositório Foco-Jornada. O código e o cofre da aplicação continuam a ser a fonte de verdade. Não introduzir medicação, horários, doses, prescrição ou dados fictícios. A experiência deve facilitar a consulta no telemóvel sem degradar o computador.

## Auditoria do estado anterior

- A página `MedicationsStockPage` colocava `MedicationPrototypeWorkspace` e a previsão de stock antes das tomas programadas para o dia. A ação quotidiana ficava afastada do início da página.
- `MedicationPrototypeWorkspace` mostrava seis cartões de dados do medicamento de forma imediata, incluindo metadados que podem ser consultados sob pedido.
- A previsão de autonomia tinha sempre todos os cartões visíveis, mesmo quando o utilizador pretendia apenas registar uma toma.
- O CSS original estava distribuído por `medication-prototype-complete.css`, `page-migration-v121.css` e folhas especializadas. Uma camada final escopada evita mexer em estilos globais.
- A rota usa hash, pelo que links com `href="#secção"` podem interferir com a navegação: usar botões e foco no elemento de destino.

## Especificação funcional executada

1. Cabeçalho conciso, ação para adicionar medicamento e navegação rápida por botões.
2. Primeiro, «Tomas programadas» do medicamento selecionado, com estados e ações originais, exatamente sobre os registos existentes.
3. Depois, «Os meus medicamentos», com resumo real, pesquisa, filtro e detalhes da seleção.
4. No painel de detalhe, mostrar primeiro dose, frequência e horários. Data de início, prescritor e observação ficam em «Ver informação adicional»; histórico, evolução e edição continuam acessíveis.
5. Apresentar previsão de stock em `details` inicialmente fechado, com autonomia resumida visível, e conservar o cálculo completo ao abrir.
6. Manter «Configuração e stock» expansível, stock exato e diálogo de definição/eliminação já existentes.
7. Aplicar estilos isolados à página, mantendo contraste variável por tema, foco visível, controlos tácteis, largura pequena e preferência por movimento reduzido.

## Arquitetura e dados

`MedicationsStockPage` mantém `useAppServices`, `PersonalStockService`, `MedicationDoseStatusService`, `StockReconciliationService` e `MedicationDataProtectionService`. `MedicationPrototypeWorkspace` conserva perfis protegidos, sumário, agenda, timelines, eventos, histórico e edição. A nova folha `src/styles/medication-refinement.css` é importada no fim de `src/main.tsx` para conter a cascata na rota.

Sem alteração de esquema IndexedDB/Dexie, API, Worker, cofre AES-GCM, chaves de armazenamento, dependências, autenticação, notificações, fórmulas, zona temporal ou semântica de eventos. Os estados de toma continuam auditáveis e o stock não é atualizado por gestos visuais.

## Riscos e verificação

- A reposição da secção «Hoje» altera a ordem visual **e a ordem de navegação por teclado** de forma coerente, mas requer confirmação funcional no navegador.
- O temporizador de próxima toma instalado como melhoria DOM continua a procurar `#medication-workspace`; o ID foi preservado.
- Um resumo de autonomia não equivale a conselho de medicação. As informações de previsão só refletem os horários previamente configurados.
- Os testes estáticos novos verificam ordem, alvos, preservação de operações e CSS; os testes de domínio existentes validam regras, mas não substituem inspeção visual real.
- Validação pendente: CI (TypeScript, lint, Vitest, build e smoke), iPhone Safari e Android Chrome 320–430px, tablet, desktop, orientação, zoom 200%, modo escuro, teclado, leitor de ecrã, menu de toma e regresso após suspender a PWA.
- Testar com dados locais de teste, sem publicar nomes de medicamentos reais, prescritores, notas pessoais ou cópias do cofre.

## Critérios de aceitação

Ações Tomada/Adiar/Não tomada/Corrigir e gestão de horários permanecem funcionais; o stock só muda pelas mesmas operações anteriores. Alterar medicamento selecionado mantém detalhe e tomas sincronizados. A previsão completa é acessível sem perder registos. Em todas as larguras, não há recorte horizontal nem botões inacessíveis. As atualizações não pedem limpeza do armazenamento existente.

**Estado em 2026-10-15:** alterações em ramificação para revisão; execução de CI, aprovação, merge, publicação e testes físicos por confirmar até verificação efetiva.

## Resultado de testes e impedimento de publicação (15/10/2026)

O workflow [Validação funcional da Medicação #38657775437](https://github.com/AllyssonEstadulho92/Foco-Jornada/actions/runs/38657775437) terminou com sucesso: TypeScript, ESLint, Vitest, build, `worker:check` e presença dos ficheiros de distribuição. Foi adicionado posteriormente um smoke Chromium, a aguardar verificação no SHA definitivo. O workflow [Qualidade #38657775457](https://github.com/AllyssonEstadulho92/Foco-Jornada/actions/runs/38657775457) bloqueia no `npm audit --audit-level=high` com 13 vulnerabilidades elevadas, antes dos testes funcionais. O problema de dependências está no [Issue #229](https://github.com/AllyssonEstadulho92/Foco-Jornada/issues/229), sem alterar nem desativar a auditoria existente.

Esta evidência não demonstra experiência visual real em Safari iOS, ausência de overflow em todos os tamanhos, notificações de fundo ou integridade de dados de um utilizador específico. O PR permanece em rascunho até concluir segurança e QA físico.
