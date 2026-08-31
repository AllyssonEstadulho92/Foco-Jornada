# Hardening 1.2 — Foco & Jornada

## Objetivo

Consolidar a aplicação sem reconstruir o núcleo funcional. Esta fase preserva os cálculos, a persistência de domínio e a política de temporizadores por timestamps, atuando sobretudo na publicação, backup, performance, validação mobile e redução de polling.

## Princípios de preservação

- não alterar regras de jornada, pausas, foco, atividades, stock ou medicação sem requisito funcional específico;
- IndexedDB/Dexie continua a ser a fonte principal dos dados de domínio;
- temporizadores continuam a guardar timestamps absolutos e a reconstruir o valor atual;
- backups antigos continuam restauráveis;
- alterações visuais devem ser incrementais e testadas por ecrã, evitando uma nova camada global de CSS não validada.

## Alterações desta fase

### Publicação

A publicação de GitHub Pages passa a usar apenas o artefacto produzido pelo CI. O workflow deixa de copiar `dist/` para a raiz e para `site/` e deixa de criar commits automáticos de build em `main`.

Os ficheiros compilados históricos da raiz e de `site/` foram removidos e adicionados ao `.gitignore`. As fontes permanecem em `src/` e `public/`.

### Performance

As páginas deixam de ser importadas todas no arranque. O router usa carregamento lazy por rota, permitindo ao Vite dividir o JavaScript em chunks de página.

### Backup integral local

A cópia de segurança mantém todas as tabelas IndexedDB já suportadas e acrescenta o estado operacional persistido fora da base de dados:

- registos da calculadora de horas;
- configuração, perfil e planos mensais de vencimento;
- mapa mensal de turnos;
- preferências visuais da aplicação;
- centro local de notificações;
- estado técnico da sessão glo.

A extensão usa uma lista explícita de chaves autorizadas. Chaves de outras aplicações são rejeitadas no restauro e nunca são exportadas.

O histórico auxiliar de deadlines, fingerprints de integridade e snapshots redundantes de medicação não são incluídos porque são derivados/auxiliares e restaurá-los poderia reintroduzir estado obsoleto.

### Notificações

Foram retirados ciclos de polling dedicados apenas à verificação de permissões. O diagnóstico passa a reagir a eventos de alteração de permissão e a mudanças reais da interface.

O refresh operacional dos providers de deadlines permanece, por agora, para não alterar o comportamento funcional das notificações.

### Relatório A4

O relatório mantém o documento claro para impressão, independentemente do tema da aplicação.

Foram corrigidas duas ambiguidades:

- pausa deixa de reutilizar o símbolo de café;
- o resumo identifica `Jornada planeada` ou `Jornada registada` conforme a origem do valor;
- o indicador `Produtividade` passa a ser apresentado como `Índice de foco` enquanto a fórmula continuar a ser foco/tempo efetivo.

### Qualidade mobile

O smoke test passa a arrancar a aplicação em viewport desktop e 390×844, validando também a presença da navegação móvel e dos seus quatro rótulos.

Isto não substitui teste visual real em Safari/iPhone, Android ou tablet, mas aumenta a proteção automática contra regressões de arranque e estrutura mobile.

## Fases seguintes

1. Migrar gradualmente dados operacionais que ainda vivem em `localStorage` para uma camada persistente única em IndexedDB, mantendo migração retrocompatível.
2. Consolidar CSS por domínio/ecrã e reduzir folhas globais; não reativar `neutral-theme.css` globalmente.
3. Converter enhancements que manipulam o DOM por `MutationObserver` em componentes/hook React quando esses módulos forem novamente intervencionados.
4. Adicionar testes de browser com verificação visual/computed styles para drawer, barra inferior, temas, formulários e A4.
5. Configurar proteção/ruleset da branch `main` para exigir o workflow `Qualidade` antes do merge.
6. Rever dependências e gerar lockfile controlado para builds mais reprodutíveis.

## Gate de integração

A versão 1.2.0 só deve ser integrada depois de:

- typecheck;
- lint;
- testes;
- build;
- smoke desktop;
- smoke mobile.

Todos devem terminar sem falhas.
