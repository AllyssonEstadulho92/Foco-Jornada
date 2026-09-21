# Correção dos sábados e domingos no Mapa de turnos

Data: 2026-09-21. PR #227.

## Evidência e causa confirmada

A captura do iPhone mostra o Mapa de turnos com segunda-feira, 21 de setembro, selecionada. O seletor «Situação RH» de `ShiftMapPage.tsx` usava diretamente `dayKinds` e não o `PayrollDayKindSelect` introduzido no PR #226 apenas na página Vencimento > Editar dados. Assim, o utilizador não encontrava no Mapa as opções de sábado e domingo. A captura também mostra os últimos dias da semana fora da área visível. `mobile-fit.css` tinha `overflow-x: hidden` no calendário, impedindo deslocação de recuperação se algum estilo ou ampliação ultrapassasse a largura do ecrã. Não se confirmou a causa exata da largura da captura no Safari físico.

## Implementação

`ShiftMapPage` reutiliza o componente de seleção contextual de fim de semana existente, com `kind='work'` já persistido para sábado/domingo; mantém `Folga`, `Feriado`, `Férias`, faltas, horas extra e dados anteriores. O novo campo «Escolher dia do mês», limitado às datas disponíveis, permite selecionar diretamente qualquer dia, incluindo sábado e domingo, independentemente da posição visível no calendário. A legenda e o resumo salarial preservam funções anteriores e o resumo discrimina os dois suplementos, apresentando «Taxa por confirmar» quando ainda não existem percentagens contratuais. `mobile-fit.css` permite deslocação horizontal de contingência e conserva grelha de sete dias compacta.

## Verificação e riscos

Teste de interface: em setembro de 2026, selecionar 19 (sábado), marcar trabalho normal; selecionar 20 (domingo), marcar trabalho normal; no dia 21 (segunda-feira), as opções não são selecionáveis. Verificar TypeScript, lint, testes, build, Worker e smoke Chromium na CI. Confirmar a apresentação visual num iPhone real, com texto ampliado, zoom, teclado e VoiceOver. Percentagens reais e divisão por data civil de turnos que atravessam a meia-noite continuam por confirmar; não inferir direitos do recibo nem inventar valores. A publicação deve ser confirmada separadamente pela execução de build e GitHub Pages. Não apagar dados locais para atualizar a PWA.
