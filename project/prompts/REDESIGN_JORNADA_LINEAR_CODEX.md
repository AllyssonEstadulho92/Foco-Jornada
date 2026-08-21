# Prompt Codex — Redesenhar Jornada Linear

Leia integralmente antes de alterar qualquer ficheiro:
- `PROJECT_SPEC.md`
- `project/docs/JORNADA_LINEAR_SPEC.md`
- arquitetura e regras já existentes no repositório.

## Tarefa
Redesenhar o ecrã **Hoje** para apresentar a jornada de forma linear, compacta e cronológica, mantendo toda a persistência e regras atuais.

## Exemplo funcional obrigatório
Configuração:
- entrada prevista: 08:00
- pausa 1: 11:00–11:15, ativa
- pausa 2: desativada
- saída prevista: 17:00

O ecrã deve mostrar:

```text
Entrada        Próxima pausa       Regresso        Saída prevista
08:00          11:00               11:15           17:00

08:00 ─────────── 11:00 ── 11:15 ───────────────── 17:00

Jornada total 09:00   Pausas 00:15   Tempo efetivo 08:45
```

## Regras
1. Implementar **modo horário fixo** como comportamento padrão.
2. A saída prevista é a hora configurada; não deve ser recalculada pela hora real de entrada.
3. Pausas desativadas não aparecem na timeline nem entram nos cálculos planeados.
4. Registos reais continuam baseados nos timestamps existentes no domínio.
5. O histórico continua a usar os dados reais.
6. Não quebrar Journey, Breaks, Activities, Focus, Coffee ou History.
7. Não introduzir backend, autenticação ou cloud.

## Próximo evento
Criar função pura e testável que devolva o próximo estado/evento da jornada planeada:
- antes de 11:00: `Próximo evento: pausa às 11:00`
- 11:00–11:15: `Em pausa · regresso às 11:15`
- após 11:15 e antes de 17:00: `Próximo evento: saída às 17:00`
- após 17:00: `Horário planeado concluído`

Não usar apenas timers acumulativos; usar Date/timestamps e horários configurados.

## Configuração
Reutilizar a infraestrutura de Settings quando possível. Adicionar configuração tipada para:
- `plannedStartTime`
- `plannedEndTime`
- lista de pausas planeadas ou equivalente com:
  - id
  - label opcional
  - startTime
  - endTime
  - enabled

Criar defaults seguros:
- 08:00
- 17:00
- pausa 1: 11:00–11:15 ativa
- pausa 2: desativada

Se for necessária migração de dados/settings, garantir compatibilidade com utilizadores que já têm dados locais.

## Ecrã Hoje
Refatorar a zona superior para:

### A. Cabeçalho
- Hoje
- data
- estado atual

### B. Marcos temporais
- Entrada
- Próxima pausa
- Regresso
- Saída prevista

### C. Timeline horizontal
- barra contínua
- marcadores de entrada, pausa, regresso e saída
- progresso baseado na hora atual
- visual compacto

### D. Próximo evento
Mensagem curta e destacada.

### E. Resumo compacto
- Jornada total planeada
- Pausas planeadas
- Tempo efetivo planeado

### F. Estado real
Se existir jornada ativa, continuar a mostrar informação real útil sem duplicar quatro cartões grandes.

### G. Blocos secundários
Atividade, Foco e Café em cartões compactos abaixo da jornada.

## Definições
Adicionar interface organizada para editar:
- entrada prevista
- saída prevista
- pausa 1 ativa/início/fim
- pausa 2 ativa/início/fim

Validar:
- fim > início para cada pausa;
- saída > entrada;
- pausas dentro da janela da jornada;
- evitar pausas sobrepostas.

Erros devem ir para o centro de notificações existente, não usar `alert()` ou popup genérico.

## Responsividade
Obrigatório testar visualmente a estrutura CSS para:
- 320/360/390/430 px
- tablet ~768 px
- laptop 1366 px
- desktop 1440/1920 px
- ultrawide 2200 px+

Regras:
- zero overflow horizontal;
- sem zoom automático em inputs no iPhone;
- quatro marcos numa linha quando houver espaço;
- em mobile estreito pode usar 2x2 preservando a ordem cronológica;
- timeline deve permanecer legível;
- conteúdo centralizado em monitores largos.

## Testes obrigatórios
Adicionar testes para:
1. 08:00–17:00 com pausa 11:00–11:15 => jornada 9h, pausa 15m, efetivo 8h45.
2. pausa 2 desativada não entra no cálculo.
3. próximo evento antes da pausa.
4. estado durante a pausa.
5. próximo evento após a pausa.
6. estado após a saída prevista.
7. configurações antigas carregam com defaults sem crash.
8. jornada real existente continua a recuperar após refresh.

## Qualidade
Antes de finalizar:
- executar typecheck;
- executar lint;
- executar testes;
- executar build;
- corrigir todas as falhas.

## Entrega
Não avance para outras funcionalidades. No final, reporte:
- ficheiros alterados;
- decisões de modelação;
- testes adicionados;
- resultado de typecheck/lint/test/build;
- eventuais limitações.
