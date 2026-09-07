# Auditoria de Consistência Visual — 2026-09-07

## Âmbito

Auditoria e correção exclusivamente visual da aplicação **Foco & Jornada**, limitada a tipografia, iconografia, alinhamentos, espaçamentos, composição, responsividade e acessibilidade visual.

Não fazem parte desta intervenção: arquitetura da aplicação, estrutura de dados, Dexie/IndexedDB, cofre, cálculos, regras de negócio, autenticação, rotas, fluxos, integrações ou funcionalidades.

## Método

Antes de alterar código foram revistos:

- `docs/PROJECT_STATE.md`, `docs/ARCHITECTURE.md`, `docs/DECISIONS.md`, `docs/TODO.md` e `docs/CHANGELOG.md`;
- árvore real do repositório e `package.json`;
- ordem real das folhas CSS importadas por `src/main.tsx`;
- `src/styles/tokens.css`, `global.css`, `ui-primitives.css`, `mobile-shell.css`, `icons.css` e feature styles;
- `docs/iconography-audit.md` e `docs/ui-stability-audit.md`;
- `AppIcon.tsx`, SVGs locais, glifos Unicode, estilos inline e regras responsivas;
- tamanhos/pesos tipográficos, alturas de linha, controlos, paddings, gaps e regras com `!important` que interferiam na cascata.

A alteração foi feita numa branch isolada: `fix/visual-consistency-audit`, PR #188 em draft.

---

## 1. Fontes encontradas inicialmente

**Confirmado no código:**

- `tokens.css`: stack principal iniciada por `Inter`, seguida de `SF Pro Text`, fontes de sistema e `Segoe UI`;
- `export-a4.css`: stack própria com `-apple-system`, `BlinkMacSystemFont`, `Segoe UI`, `Roboto` e `Arial`;
- `more-redesign.css`: `ui-serif, Georgia, serif` aplicado a um elemento que já continha um `AppIcon`;
- `medication-protection.css`: stack `ui-monospace`, `SFMono-Regular`, Menlo, Monaco e Consolas em informação técnica;
- `index.html` e `src/index.html`: stack de sistema para o fallback de arranque.

Também foi confirmado que **Inter não estava empacotada pela aplicação**. Por isso, apesar de aparecer em primeiro lugar no token, a família efetivamente apresentada podia variar consoante o dispositivo.

## 2. Fonte final adotada

**Inter Variable** é a família principal da interface, auto-hospedada através de `@fontsource-variable/inter` e importada antes dos estilos da aplicação.

`--font-display` passa a reutilizar `--font-sans`, evitando uma segunda família visual sem função definida.

A única segunda família mantida é `--font-mono`, exclusivamente para códigos/dados técnicos que justificam apresentação monoespaçada. Não é usada na navegação nem na interface corrente.

## 3. Pesos tipográficos normalizados

Conjunto final centralizado:

- Regular: `400`;
- Medium: `500`;
- SemiBold: `600`;
- Bold: `700`.

Foram eliminados valores arbitrários confirmados de `650`, `750`, `800`, `850` e `900`. `--weight-heavy` foi reduzido para a mesma autoridade de `700`, evitando o excesso visual de peso existente.

A hierarquia de headings foi normalizada para:

- H1: `--text-2xl` (28 px base, 32 px em desktop), Bold;
- H2: 20 px, SemiBold;
- H3/H4: 16 px, SemiBold.

Textos CSS funcionais inferiores a 12 px foram elevados para `--text-xs` (12 px). O corpo mantém 14/16 px conforme a função do componente.

## 4. Bibliotecas/sistemas de ícones encontrados

Não existia uma dependência externa Lucide/Phosphor/Material/Feather.

Foram encontrados:

- sistema local `AppIcon.tsx`, SVG outline 24×24 com `currentColor` e traço coerente;
- SVGs funcionais locais fora dessa autoridade em Histórico e Segurança;
- glifos Unicode usados como ícones em Exportação A4, Centro de Notificações, Sobre a aplicação e Sticks;
- `GloLogo.tsx`, que é uma marca/logótipo e não um ícone de ação;
- uma ilustração SVG principal em Hoje, que é conteúdo visual e não iconografia de controlo.

## 5. Biblioteca/sistema de ícones mantido

Foi mantido **AppIcon** como autoridade iconográfica única para navegação, estados e ações.

Não foi introduzida uma segunda biblioteca apenas para substituir um sistema já existente e coerente. Foram adicionados ao próprio `AppIcon` os símbolos em falta: `backspace`, `route` e `circle`.

Escala final centralizada:

- compacto: 16 px;
- auxiliar: 20 px;
- principal: 24 px;
- área de interação: mínimo 44×44 px; controlo normal 48 px.

## 6. Ícones inconsistentes substituídos

**Confirmado:**

- Histórico: relógio SVG local → `AppIcon history`; lixo SVG filled local → `AppIcon trash` outline;
- Segurança/PIN: backspace SVG local → `AppIcon backspace`;
- Centro de Notificações: `✓` → `AppIcon check/warning`, de acordo com o estado real;
- Sobre: `i`, `↻`, `◷`, `↗` e `○` usados como pictogramas → `info`, `refresh`, `clock`, `route` e `circle`;
- Exportação A4: `▣`, `◷`, `☕`, `◎`, `⊙` e `▤` → `calendar`, `journey`, `break/coffee`, `clock`, `focus` e `activities`;
- Sticks: pseudo-ícones Unicode `◷`, `↻` e `⚡` removidos; estado passa a usar `check` ou `clock` do mesmo sistema.

`GloLogo` e a ilustração SVG de Hoje foram preservados por serem marca/conteúdo, não ícones de controlo.

## 7. Problemas de alinhamento encontrados

**Confirmado:**

- margens móveis diferentes entre folhas (incluindo valores abaixo dos 16 px pretendidos);
- topbar móvel com regras concorrentes e `!important` que podiam vencer a regra de safe-area;
- controlos de ícone com 34/38/40/42 px em diferentes features;
- cabeçalhos de página com escalas distintas e H1 que chegavam a 40–64 px;
- H2 de componentes equivalentes com valores diferentes;
- navegação móvel e drawer com iconografia/tamanhos de alvo divergentes;
- Histórico com ícone de apagar de 34 px e SVG de 15 px, diferente do resto do sistema.

**Correção:** paddings de página centralizados, hierarquia H1–H4 uniformizada, alvos interativos mínimos de 44 px e iconografia normalizada.

## 8. Problemas de espaçamento encontrados

A aplicação tinha uma combinação extensa de valores históricos (`3`, `5`, `6`, `7`, `10`, `13`, `14`, `18`, `20` etc.) distribuídos por feature styles.

A intervenção não substituiu mecanicamente todos os valores — isso poderia redesenhar componentes. Foram centralizados os valores estruturais que devem ser comuns:

- escala base: 4 / 8 / 12 / 16 / 24 / 32 / 48 px;
- mobile page padding: 16 px;
- tablet page padding: 24 px;
- desktop page padding: 32 px ou superior;
- section gap: 24 px;
- card padding: 16 px, aumentando para 24 px a partir de tablet;
- controlos: 44/48 px.

Valores locais foram mantidos quando representam composição específica e não foi possível provar que eram uma inconsistência.

## 9. Conflitos de CSS encontrados

**Confirmado:**

- `src/main.tsx` importa um número elevado de folhas CSS globais/feature styles, aumentando a probabilidade de sobreposição;
- auditorias anteriores já registavam `!important`, seletores repetidos e autoridades concorrentes;
- `compact-time-displays.css` continha regras móveis com `!important` para `notificationButton` e topbar, capazes de contrariar os valores posteriores de `mobile-shell.css`;
- fontes, pesos, tamanhos e controlos eram redefinidos localmente em várias features.

A arquitetura/import order **não foi alterada** nesta tarefa. A correção incidiu na origem das regras visuais conflitantes e nos tokens partilhados, sem acrescentar uma nova folha `*-fix.css` para mascarar a cascata.

## 10. Código/estilos redundantes removidos

**Confirmado:**

- SVGs funcionais redundantes de Histórico e Segurança;
- pseudo-elementos que desenhavam ícones Unicode em Sticks;
- família serif antiga aplicada a um contentor de `AppIcon`;
- keyframe redundante introduzida durante a própria normalização e removida antes da revisão final;
- workflow e script temporários usados para a migração em massa foram removidos da branch antes do PR final.

Não foram removidas folhas históricas inteiras nem código cuja ausência de dependência não pudesse ser confirmada.

## 11. Componentes modificados

Componentes TypeScript/React diretamente modificados:

- `AppIcon.tsx`;
- `AppAboutSettings.tsx`;
- `HistoryPage.tsx`;
- `NotificationCenterPage.tsx`;
- `ExportDataPage.tsx`;
- `SticksStockPage.tsx`;
- `SecurityGate.tsx`;
- `src/main.tsx` apenas para carregar Inter antes dos estilos.

Também foram ajustados `tokens.css`, `global.css`, `ui-primitives.css`, `icons.css`, `mobile-shell.css` e feature styles existentes. Não foi criada uma camada de runtime adicional para sobrepor problemas antigos.

## 12. Páginas revistas

**Revisão estática de código/CSS:**

- Hoje;
- Jornada;
- Pausas;
- Foco/Pomodoro;
- Atividades;
- Histórico;
- Relatórios/Estatísticas e Exportação A4;
- Horários/Work Hours;
- Mapa de turnos;
- Payroll/Finanças;
- Mais/Definições/Sobre;
- Notificações/Centro de Notificações;
- Segurança/PIN/cofre;
- Stock pessoal, medicação, Sticks e sessão glo;
- Guia e estados/feedback partilhados;
- shell desktop/tablet/mobile e navegação inferior.

Esta lista significa revisão do código e das regras de estilo. Não equivale a uma inspeção pixel-a-pixel de cada página num browser físico.

## 13. Testes de responsividade efetuados

**Confirmado:**

- revisão estática das media queries e do shell a partir de 320 px;
- mobile mantém padding lateral mínimo de 16 px e safe areas;
- tablet usa 24 px como base;
- desktop usa 32 px ou mais;
- conteúdo móvel reserva espaço inferior para a navegação fixa;
- regras que forçavam controlos abaixo de 44 px foram normalizadas quando aplicadas a elementos interativos;
- foram adicionadas guardas automatizadas de consistência visual ao conjunto Vitest.

**Não confirmado neste ambiente:** renderização visual real e screenshots comparativos especificamente em 320, 375, 390, 430 px, tablet e desktop. Não existe aqui uma sessão autenticada da aplicação com navegação visual por todas as páginas. Por isso não é afirmado que uma inspeção pixel-a-pixel nesses viewports tenha sido concluída.

## 14. Problemas que não foi possível validar diretamente

- resultado visual final em iPhone/iPad físicos;
- comportamento com Dynamic Type/zoom do browser em todas as páginas;
- comparação pixel-a-pixel em 320/375/390/430/tablet/desktop;
- wrapping de dados reais extremamente longos em todos os cartões;
- VoiceOver/TalkBack em equipamento físico;
- se alguma combinação rara de dados ativa uma regra CSS não alcançável através da revisão estática.

Esses pontos permanecem **não confirmados**, não são apresentados como testes concluídos.

## 15. Preservação de arquitetura e funcionalidades

**Confirmado pelo diff desta branch:** a intervenção não altera modelos de dados, schemas Dexie, IndexedDB, cofre, cálculos, repositórios, autenticação, rotas, integrações ou regras de negócio.

As alterações de TSX limitam-se a substituir a representação visual de ícones mantendo as mesmas ações/estados. A nova dependência `@fontsource-variable/inter` fornece exclusivamente assets tipográficos auto-hospedados.

---

## Guardas de regressão adicionadas

`src/styles/visual-consistency.test.ts` verifica automaticamente:

- ausência de `font-size` CSS abaixo de 12 px equivalentes;
- pesos numéricos fora de 400/500/600/700;
- famílias tipográficas locais que ignorem os tokens;
- glifos Unicode conhecidos usados como ícones;
- SVG inline fora das exceções explicitamente permitidas (`AppIcon`, `GloLogo` e ilustração de Hoje).

## Estado da validação CI

No momento de criação inicial deste relatório, o workflow `Qualidade` do PR #188 encontra-se em execução. O relatório deve ser atualizado para `aprovado` apenas se auditoria de dependências, typecheck, lint, testes, build e smoke test terminarem com sucesso.
