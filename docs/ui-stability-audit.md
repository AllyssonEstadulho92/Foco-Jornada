# Auditoria de estabilidade UI — Foco Jornada

## Objetivo

Estabilizar a aplicação antes de novas mudanças visuais. Esta fase não altera lógica de negócio, cálculos, temporizadores, IndexedDB, medicação, stock, backup ou persistência. O foco é reduzir acoplamento visual, duplicação e risco de regressão.

Base auditada: `main` em `4d270b6c816a54f36679b4f035410c42df694e7f` (versão 1.2.1).

## Conclusão executiva

A aplicação tem uma base funcional estável, mas a apresentação está excessivamente dependente da cascata global de CSS. O maior risco atual não é uma função isolada: é a combinação de muitas folhas de estilo históricas, seletores repetidos, `!important`, múltiplas fontes de navegação e um `AppShell` com responsabilidades demais.

A correção deve ser incremental. Não criar novas folhas de override global para resolver regressões. Cada pequeno PR deve substituir ou eliminar uma fonte concreta de conflito e deixar testes verdes antes do merge.

## 1. Dependências CSS

### Estado atual

`src/main.tsx` importa dezenas de folhas CSS globais em sequência. Entre elas existem camadas antigas e novas que tratam os mesmos componentes, por exemplo:

- `focus.css`
- `prototype.css`
- `prototype-v2.css`
- `mobile-shell.css`
- `mobile-fit.css`
- `dark-contrast.css`
- `theme-polish.css`
- `mobile-app-shell-fix.css`
- `design-system-v12.css`
- `ui-primitives.css`
- `page-migration-v121.css`

A pesquisa no repositório mostra `!important` distribuído por várias folhas e seletores de navegação móvel presentes em múltiplos ficheiros. `focusModeTabs`, por exemplo, aparece em `focus.css`, `prototype.css` e `page-migration-v121.css`.

### Riscos

1. A ordem de importação passa a ser parte implícita da lógica visual.
2. Um ajuste numa página pode modificar outra por seletor genérico.
3. O Safari/iOS pode expor conflitos de dimensões e overflow que não aparecem num smoke test simples.
4. `!important` força novos patches a aumentar especificidade.
5. O custo de manutenção cresce porque não existe uma autoridade visual única por feature.

### Regra nova

A partir desta auditoria:

- não adicionar novos ficheiros `*-fix.css`, `*-polish-vN.css` ou overrides globais sem uma justificativa de remoção associada;
- preferir CSS por feature/página;
- `tokens.css`, `design-system-v12.css` e `ui-primitives.css` são a base compartilhada;
- cada feature deve convergir para uma única folha de estilo responsável;
- remover uma regra antiga somente depois de comprovar que o seletor não é necessário noutra rota.

## 2. Arquitetura do AppShell

### Responsabilidades atuais

`AppShell.tsx` concentra:

- sidebar desktop;
- menu/drawer móvel;
- painel rápido “Mais”;
- bottom navigation;
- tema claro/escuro/sistema;
- sincronização com `prefers-color-scheme`;
- alteração de meta `theme-color`;
- pedido de persistência de storage;
- foco após abrir/fechar drawer;
- bloqueio de scroll do body;
- controlo de Escape;
- renderização de navegação e atalhos.

Isto torna o shell difícil de alterar sem risco lateral.

### Estrutura alvo

Separar progressivamente, sem alterar comportamento:

```text
presentation/layouts/
  AppShell.tsx
  DesktopSidebar.tsx
  MobileNavigationDrawer.tsx
  MobileQuickPanel.tsx
  BottomNavigation.tsx

presentation/hooks/
  useResolvedTheme.ts
  usePersistentStorageRequest.ts
  useOverlayInteraction.ts
```

O primeiro PR de extração deve ser mecânico: mover JSX e efeitos sem mudar classes, textos ou comportamento.

## 3. Navegação

### Estado atual

Existe `primaryNavigation`/`secondaryNavigation` em `navigationItems.ts`, mas `AppShell.tsx` mantém ainda listas próprias:

- `mobileQuickNavigation`
- `mobileMainNavigation`
- `mobileDataNavigation`
- `mobileBottomNavigation`

Isto duplica rotas, labels e ícones. A barra inferior e o drawer também repetem áreas como Início, Calendário e Relatórios.

### Estrutura alvo

Criar um registry único de navegação, por exemplo:

```ts
interface AppNavigationItem {
  id: string
  label: string
  path: string
  icon: NavigationIconName
  end?: boolean
  placement: Array<'desktop-primary' | 'desktop-secondary' | 'mobile-bottom' | 'mobile-drawer' | 'quick'>
  group?: 'work' | 'personal' | 'data' | 'support'
  description?: string
}
```

Todos os menus passam a filtrar esta fonte única. Nenhuma rota é removida; muda apenas a composição visual.

## 4. Problemas confirmados por prioridade

### P0 — risco de regressão visual

- múltiplas folhas a controlar os mesmos componentes;
- `!important` em camadas de migração;
- `bottomNav` definido em múltiplas folhas;
- `mobileDrawer` definido em múltiplas folhas;
- Foco com regras simultâneas em três gerações de CSS;
- novas correções visuais abertas em branches paralelas.

### P1 — arquitetura e manutenção

- `AppShell.tsx` demasiado grande e multifuncional;
- quatro listas de navegação móvel além do registry principal;
- CSS global por versão em vez de CSS por feature;
- nomes `prototype`, `v2`, `polish`, `fix` permanecem no runtime final;
- componentes do Design System ainda não são a única fonte para cards, estados, modal e drawer.

### P2 — performance e fluidez

- grande quantidade de CSS carregado em todas as rotas, mesmo quando a página não usa essas regras;
- estilos duplicados aumentam parsing e recálculo de style;
- overlays e navegação possuem múltiplas variantes CSS;
- páginas complexas devem evitar layout thrashing e animações não essenciais.

### P3 — qualidade visual verificável

- smoke test não deteta círculo oval, tab vertical ou drawer superdimensionado;
- falta matriz de viewport para 320, 360, 375, 390, 430, 768 e desktop;
- falta checklist manual iOS/Safari para safe-area, barra inferior, teclado e overlays.

## 5. Plano de remoção e pequenos PRs

### PR A — inventário e guardrails

Escopo:

- adicionar este documento;
- documentar regra “sem novos overrides globais”;
- criar checklist de regressão UI;
- nenhuma alteração runtime.

Critério: documentação apenas, risco zero.

### PR B — registry único de navegação

Escopo:

- consolidar todas as listas num único `appNavigation`;
- manter os mesmos destinos e comportamento;
- adicionar testes de presença/rotas dos itens essenciais.

Não fazer: redesenhar drawer, remover páginas ou mudar URLs.

### PR C — extração mecânica do AppShell

Escopo:

- extrair `DesktopSidebar`, `MobileNavigationDrawer`, `MobileQuickPanel` e `BottomNavigation`;
- manter classes CSS existentes;
- manter efeitos e acessibilidade equivalentes;
- reduzir `AppShell.tsx` a composição e estado de alto nível.

Não fazer: mudar layout.

### PR D — consolidar shell CSS

Escopo:

- mapear todas as regras de `.bottomNav`, `.mobileDrawer`, `.sidebar`, `.appMainArea`, `.appContent`;
- mover a versão definitiva para `app-shell.css`;
- remover regras equivalentes de `global.css`, `prototype.css`, `mobile-shell.css`, `mobile-app-shell-fix.css` apenas quando cobertas por testes;
- preservar barra inferior fixa e safe-area.

Critério: screenshot/inspeção nas larguras críticas.

### PR E — Foco como primeira feature isolada

Escopo:

- mover a aparência definitiva de Foco para um único `focus.css`;
- absorver apenas as regras de Foco existentes em `prototype.css` e `page-migration-v121.css`;
- remover duplicatas de Foco dessas folhas;
- zero alteração em `FocusPage.tsx` exceto classes estritamente necessárias, se houver;
- teste visual/layout: tabs horizontais, dial 1:1, sem overflow a 320–430 px.

### PR F — Calendário e Relatórios

Mesmo padrão do PR E, uma feature por vez se o diff crescer demais.

### PR G — Notificações

Consolidar `notifications.css`, `notification-center-v3.css`, `notification-professional-v4.css` e regras da migração 1.2.1 em uma autoridade clara, preservando quick panel e centro completo.

### PR H — Medicação/Stock

Consolidar por feature, sem tocar em dose, horários, timers, reconciliação ou persistência.

### PR I — Design System final

- substituir cards/botões/estados repetidos pelos primitives;
- eliminar classes globais redundantes;
- limitar `!important` a casos documentados de integração externa/print, se realmente necessários.

### PR J — remoção final de legado

Somente após todas as rotas estarem migradas:

- apagar ficheiros sem consumidores;
- remover imports mortos do `main.tsx`;
- confirmar build CSS menor;
- executar regressão completa.

## 6. Critérios obrigatórios por PR

Cada PR de limpeza deve cumprir todos:

1. uma responsabilidade principal;
2. diff pequeno e reversível;
3. nenhuma mistura de refactor visual com regra de negócio;
4. `typecheck` verde;
5. `lint` verde;
6. testes verdes;
7. build verde;
8. smoke test verde;
9. validação manual das rotas afetadas;
10. em alterações mobile: validar 320, 360, 375, 390 e 430 px;
11. não adicionar novo `!important` sem remover ou documentar a causa;
12. não criar novo ficheiro de override temporário como solução definitiva.

## 7. Métricas de estabilidade

A limpeza será considerada concluída quando:

- a navegação tiver uma única fonte de configuração;
- `AppShell` estiver dividido em componentes com responsabilidades claras;
- cada feature principal tiver uma folha CSS autoritativa;
- `main.tsx` deixar de importar camadas históricas redundantes;
- o número de ficheiros globais carregados cair de forma material;
- os seletores críticos (`bottomNav`, `mobileDrawer`, `focusModeTabs`, `focusDial`) tiverem uma única autoridade;
- não houver regressão nas funções e dados;
- as larguras mobile críticas passarem sem overflow ou deformações.

## 8. Estado das PRs paralelas

Antes da limpeza runtime, resolver as PRs visuais abertas de forma ordenada. Não iniciar nova migração de página em paralelo com outra branch que altere o mesmo shell/CSS. O objetivo é manter uma única linha de estabilização por vez.

## Decisão

A próxima alteração de código deve ser o PR B: registry único de navegação. Depois, PR C: extração mecânica do AppShell. Somente então iniciar a consolidação de CSS do shell e das páginas.
