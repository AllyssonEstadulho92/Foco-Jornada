# Hotfix — página em branco após tema neutro

## Sintoma
Após a integração do tema visual neutro, a aplicação passou a ser reportada como página em branco no dispositivo móvel.

## Ação de contenção
A importação de `src/styles/neutral-theme.css` foi removida de `src/main.tsx` para restaurar imediatamente a última apresentação funcional conhecida.

O ficheiro de tema permanece no repositório, mas deixa de ser carregado pela aplicação até validação incremental por ecrã.

## Escopo
- Não altera lógica de jornada.
- Não altera cálculos.
- Não altera IndexedDB ou dados persistidos.
- Não altera rotas.
- Não altera componentes funcionais.

## Próximo passo
Retomar o redesign de forma incremental, por ecrã, com validação visual e técnica antes de ativar novos estilos globalmente.
