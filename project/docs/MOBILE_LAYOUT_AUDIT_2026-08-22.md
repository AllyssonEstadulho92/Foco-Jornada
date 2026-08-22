# Auditoria móvel — enquadramento do conteúdo

Data: 2026-08-22

## Problema observado

No Mapa de turnos, o calendário mensal usava uma largura mínima fixa no telemóvel. Como a página é um grid, essa largura mínima podia contaminar a largura intrínseca do contentor e fazer também os comandos e cartões de resumo parecerem maiores do que o viewport.

## Correção

- Todos os elementos estruturais dentro de `appContent` podem encolher corretamente no modo móvel (`min-width: 0`).
- O Mapa de turnos deixa de exigir uma grelha de 760 px no telemóvel.
- O calendário mantém as sete colunas Seg–Dom, mas em modo compacto; os detalhes completos continuam no editor do dia selecionado.
- Os botões de comando passam a ocupar a largura disponível sem serem cortados.
- Cartões de resumo, editor, bloco RH e cálculo salarial respeitam a largura do ecrã.
- A deslocação horizontal fica limitada a conteúdos que realmente precisem dela, não à página inteira.

## Critério de aceitação

Em larguras móveis desde 320 px, a página não deve provocar scroll horizontal global nem cortar botões/cartões. O calendário deve mostrar as sete colunas dentro do ecrã e o utilizador deve selecionar um dia para ver e editar horário, pausa, horas extra e observação.