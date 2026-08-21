# Redesign do ecrã Mais — Ferramentas

## Objetivo
Reorganizar o ecrã `Mais` com base no protótipo aprovado, reduzindo ruído visual e separando as ferramentas por finalidade.

## Estrutura

### Cabeçalho
- Eyebrow: `MAIS`
- Título: `Ferramentas`
- Subtítulo: `Organização, horas, vencimento e apoio.`

### Acesso rápido
1. Guia de utilização — `Como usar a aplicação`
2. Calculadora de horas & ausências — `Horas trabalhadas, doença e saldo`
3. Vencimento & planificação — `Previsão salarial e calendário`

### Gestão
1. Estatísticas — `Hoje, 7 dias e 30 dias`
2. Definições — `Horário, pausas, café e preferências`
3. Exportar o dia — `Guardar relatório em JSON`

### Informação de privacidade
Cartão compacto:
- `Tudo fica guardado localmente`
- `Os seus dados permanecem neste dispositivo.`

## Regras visuais
- Dark mode consistente com o restante produto.
- Duas secções visuais distintas, cada uma com um único container e linhas compactas.
- Ícones reais à esquerda, chevron à direita.
- Hierarquia clara e redução do texto secundário.
- Espaçamento vertical uniforme.
- Sem cartões enormes ou informação repetida.
- No mobile, tudo deve caber sem scroll horizontal ou zoom.
- Em desktop/monitores largos, manter conteúdo centrado e largura máxima legível.

## Navegação inferior
O ícone `Mais` deve usar uma grelha de 9 pontos, não hambúrguer, para ficar coerente com o protótipo.
