# Linguagem da aplicação e evolução futura com IA

## Objetivo

O Foco Jornada deve comunicar como uma aplicação móvel: pouco texto, instruções claras e ações fáceis de reconhecer. A linguagem técnica fica reservada para situações em que é necessária precisão, especialmente em horas, ausências, RH, fiscalidade e vencimento.

## Padrão de microcopy

Cada ecrã deve seguir, sempre que possível, esta estrutura:

**Título curto → explicação simples → ação direta.**

Exemplos:

- **Horário base** — Define o teu horário habitual de trabalho. → **Editar horário**
- **Pausas** — Configura os teus intervalos de trabalho. → **Guardar alterações**
- **Mapa de turnos** — Organiza os teus turnos do mês e vê o impacto no vencimento. → **Guardar mapa**
- **Horas & ausências** — Compara o horário previsto com o que realmente trabalhaste. → **Guardar registo**
- **Vencimento** — Consulta a estimativa do que vais receber. → **Guardar cálculo**
- **Estado da aplicação** — Verifica se está tudo a funcionar. → **Verificar novamente**

## Vocabulário principal

Usar de forma consistente:

- Hoje
- Mapa de turnos
- Atividades
- Foco
- Histórico
- Horas & ausências
- Vencimento
- Relatórios
- Definições
- Estado da aplicação
- Guardar
- Editar
- Eliminar
- Recalcular
- Rever dados do vencimento

Evitar na interface principal quando existe alternativa mais simples:

- planificação → plano, turnos ou dados guardados
- diagnóstico do sistema → estado da aplicação
- parâmetros → dados ou definições
- tratamento remuneratório → efeito no vencimento
- agregação → resumo
- configuração avançada → editar dados, quando o contexto permitir

Termos de RH, contabilidade e fiscalidade como IRS, Segurança Social, falta justificada, falta injustificada e horas extra devem manter a designação correta.

## Tom

- Português europeu.
- Frases curtas.
- Verbos de ação nos botões.
- Evitar explicações repetidas.
- Não apresentar uma estimativa como valor oficial.
- Mensagens de sucesso devem dizer diretamente o que aconteceu: “Mapa guardado”, “Cálculo guardado”, “Alterações guardadas”.
- Mensagens de erro devem indicar a ação possível: “Não foi possível guardar. Tenta novamente.”

## Arquitetura atual

A aplicação mantém a arquitetura Web/PWA atual em **React + TypeScript + Vite**. Esta base é adequada ao produto atual e permite utilização em telemóvel e computador sem uma migração prematura para outra tecnologia.

Não é necessário converter agora a aplicação para Flutter, React Native, Swift ou Kotlin apenas para preparar funcionalidades de inteligência artificial.

## Evolução futura com inteligência artificial

A futura IA deve ser adicionada como uma camada separada da lógica crítica da aplicação.

### Princípio

Os cálculos determinísticos continuam a ser a fonte de verdade:

- duração da jornada;
- pausas;
- horas efetivas;
- horas extra;
- ausências;
- Segurança Social;
- IRS;
- estimativa do vencimento.

A IA pode **explicar, resumir, detetar inconsistências e sugerir ações**, mas não deve alterar silenciosamente estes cálculos nem inventar valores.

### Arquitetura recomendada

Frontend atual:

`React/TypeScript → serviço de IA por HTTPS`

Camada futura de IA:

`API/backend dedicado → Python/FastAPI é uma opção adequada`

A interface TypeScript deve comunicar com essa camada através de um contrato estável, por exemplo `AiAssistantGateway`, sem acoplar os componentes visuais diretamente ao fornecedor de IA.

Credenciais e segredos de serviços de IA nunca devem ficar expostos no código executado no navegador.

### Primeiras funções de IA recomendadas

1. **Conferir recibo** — explicar diferenças entre o valor calculado pela aplicação e as rubricas introduzidas pelo utilizador.
2. **Rever o mês** — resumir turnos, faltas, horas extra, pausas e possíveis registos em falta.
3. **Assistente de horas** — ajudar a interpretar uma saída antecipada, consulta, doença ou regresso ao trabalho sem alterar automaticamente o registo.
4. **Resumo de produtividade** — explicar padrões de foco e jornada usando os dados locais escolhidos pelo utilizador.
5. **Ajuda contextual** — responder a dúvidas sobre como usar cada área da aplicação.

## Limites para IA em RH e vencimento

- A IA não substitui o motor de cálculo.
- A IA não deve afirmar que uma estimativa é o recibo oficial.
- Qualquer sugestão que altere turnos, faltas, horas extra ou dados fiscais deve exigir confirmação explícita do utilizador.
- A aplicação deve mostrar quais dados foram usados numa explicação ou comparação.
- Dados pessoais só devem ser enviados para uma futura camada de IA quando isso estiver definido na arquitetura de privacidade e for necessário para a função pedida.

## Regra para próximas versões

Antes de adicionar um novo texto à interface, verificar:

1. O utilizador percebe a função sem conhecer termos técnicos?
2. O título é curto?
3. A explicação diz apenas o necessário?
4. O botão descreve a ação?
5. Se envolver RH ou dinheiro, a simplificação mantém a precisão?

Este documento passa a orientar o microcopy das próximas alterações de interface e a preparação da futura camada de inteligência artificial.
