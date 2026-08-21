# Jornada Linear — Especificação Funcional

## Objetivo
Redesenhar o ecrã **Hoje** para apresentar a jornada de trabalho numa linha cronológica simples, previsível e compacta, com foco nas horas importantes do dia.

A aplicação deve deixar de depender de cartões grandes para Entrada, Jornada, Tempo efetivo e Pausas. Em vez disso, deve mostrar uma sequência temporal clara: **Entrada → Pausa → Regresso → Saída prevista**.

## Exemplo de referência
Horário planeado:
- Entrada: 08:00
- Pausa 1: 11:00–11:15
- Pausa 2: desativada
- Saída prevista: 17:00

Resumo esperado:
- Entrada: 08:00
- Próxima pausa: 11:00
- Regresso: 11:15
- Saída prevista: 17:00
- Jornada total planeada: 09:00
- Pausas planeadas: 00:15
- Tempo efetivo planeado: 08:45

## Layout principal

### Cabeçalho
Mostrar:
- Hoje
- data
- estado atual: Em trabalho / Em pausa / Jornada concluída

### Linha de marcos
Desktop/tablet:

```text
Entrada        Próxima pausa       Regresso        Saída prevista
08:00          11:00               11:15           17:00
```

Mobile:
- manter os quatro marcos visíveis sem scroll horizontal;
- permitir grelha 2x2 em ecrãs muito estreitos, sem alterar a ordem cronológica.

### Timeline
Representar visualmente:

```text
08:00 ─────────── 11:00 ── 11:15 ───────────────── 17:00
Entrada           Pausa    Regresso                  Saída
```

A timeline deve indicar o progresso atual do dia.

### Próximo evento
A aplicação deve destacar uma mensagem curta e dinâmica:
- antes da pausa: **Próximo evento: pausa às 11:00**;
- durante a pausa: **Em pausa · regresso às 11:15**;
- depois da pausa: **Próximo evento: saída às 17:00**;
- depois da saída prevista: **Horário planeado concluído**.

## Resumo compacto
Abaixo da timeline, mostrar numa única linha ou grelha compacta:
- Jornada total
- Pausas
- Tempo efetivo

Exemplo:

```text
Jornada total 09:00   Pausas 00:15   Tempo efetivo 08:45
```

## Regras de horário

### Modo horário fixo — padrão
O utilizador configura:
- hora prevista de entrada;
- hora prevista de saída;
- pausas planeadas com início/fim;
- pausas ativas ou desativadas.

Neste modo, **a hora prevista de saída não é recalculada** com base na hora real de entrada. Se estiver configurado 08:00–17:00, a saída prevista continua a ser 17:00.

### Modo variável — futuro/opcional
Pode existir no futuro uma opção em que:

```text
saída prevista = entrada real + tempo efetivo alvo + pausas
```

Não implementar automaticamente nesta alteração, salvo se já existir suporte simples no projeto.

## Pausas
Cada pausa configurada deve conter:
- id;
- nome opcional;
- hora início planeada;
- hora fim planeada;
- ativa: sim/não.

Pausas desativadas:
- não aparecem na timeline;
- não entram no tempo de pausa planeado;
- não alteram o tempo efetivo planeado.

Exemplo:
- Pausa 1: 11:00–11:15, ativa;
- Pausa 2: 15:30–15:45, desativada.

## Dados reais versus planeados
A interface deve distinguir:
- **Planeado**: horários configurados;
- **Real**: timestamps efetivamente registados.

Durante uma jornada ativa, a linha principal deve privilegiar as horas planeadas e mostrar informação real apenas onde for útil.

Ao concluir a jornada, o histórico deve preservar os horários reais.

## Integração com a jornada atual
- Iniciar jornada continua a registar a hora real de entrada.
- A hora planeada de entrada serve como referência visual.
- Iniciar pausa continua a criar um registo real de pausa.
- Terminar pausa continua a guardar hora real de regresso.
- Terminar jornada continua a guardar hora real de saída.

## Ações
Manter as ações principais compactas:
- Iniciar pausa / Terminar pausa;
- Terminar jornada.

Ações secundárias como Atividade, Foco e Café ficam abaixo, em cartões menores.

## Configuração
Adicionar ou reutilizar uma secção em Definições para:
- Entrada prevista;
- Saída prevista;
- Pausa 1 — ativa, início, fim;
- Pausa 2 — ativa, início, fim;
- possibilidade futura de mais pausas.

Defaults de exemplo:
- entrada: 08:00;
- saída: 17:00;
- pausa 1: 11:00–11:15 ativa;
- pausa 2: desativada.

## Cálculos

### Jornada total planeada
```text
saída prevista - entrada prevista
```

### Pausas planeadas
Somatório apenas das pausas ativas:
```text
Σ(fim pausa - início pausa)
```

### Tempo efetivo planeado
```text
jornada total planeada - pausas planeadas
```

### Tempo efetivo real
Manter a regra atual do projeto:
```text
jornada real - pausas reais
```

## Responsividade
- Mobile-first;
- sem zoom automático em inputs;
- sem scroll horizontal global;
- timeline deve caber no ecrã;
- tablet pode usar uma linha completa;
- desktop/monitores largos devem centralizar o conteúdo e evitar esticar excessivamente os cartões.

## Critérios de aceitação
- Utilizador consegue configurar entrada 08:00, pausa 11:00–11:15 e saída 17:00.
- Ecrã Hoje mostra exatamente esses quatro marcos.
- Pausa 2 desativada não aparece.
- Próximo evento muda conforme a hora atual.
- Tempo efetivo planeado mostra 08:45 para o exemplo acima.
- Jornada real continua a funcionar e persistir após refresh.
- Histórico continua baseado nos timestamps reais.
- Layout não apresenta overflow horizontal em iPhone.
- Desktop continua organizado em 1366, 1440, 1920 e monitores ultrawide.
- TypeScript, lint, testes e build devem ficar verdes.
