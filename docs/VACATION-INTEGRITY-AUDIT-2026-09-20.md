# Auditoria de integridade das férias, 20/09/2026

**Âmbito:** projeto existente Foco Jornada, PR #224 em rascunho. Não é uma certificação do saldo laboral individual nem uma confirmação de sincronização remota. Fontes primárias: repositório `main` no commit `edfd97ad5695d011c3c6c4fc0e0da5e929231804`, `VacationBalance.ts`, `VacationYearRecords.ts`, `VacationBalancePage.tsx`, `VacationEvidencePanel.tsx`, `secureStorage.ts`, `cloudSync.ts`, `SecureAppBootstrap.tsx` e cinco documentos-base.

## Factos confirmados no código

- Uma PWA React/TypeScript tem vistas separadas `#/ferias` e `#/ferias/planeamento`; as datas de férias provêm de horas, mapa de turnos e plano mensal, sendo deduplicadas por data civil. Os campos manuais do saldo não têm necessariamente datas de proveniência.
- A projeção configurável de 28 dias é uma **meta pessoal**, não o mínimo legal, nem representa automaticamente direito contratual. O saldo pode incluir dias transitados e ajustes introduzidos manualmente.
- O armazenamento utiliza um cofre local e a sincronização cifrada opcional reconcilia o estado por perfil. Um evento de gravação local não comprova que a alteração já foi recebida noutro aparelho.
- O painel de proveniência tinha risco de consulta memorizada obsoleta ao regressar à aplicação e omitia falhas detetáveis de leitura/JSON/formato. `VacationBalancePage` mantém outro coletor; sem acesso a dados reais não é possível confirmar equivalência em todas as situações.

## Alteração circunscrita do PR #224

A recolha de proveniência passa a devolver **opcionalmente** diagnósticos de origem, mês e causa quando a leitura lança exceção ou o conteúdo não é um array JSON válido. Continua a usar apenas datas válidas das fontes acessíveis. O painel reconsulta ao regressar à aplicação e quando o cofre emite evento local de gravação, assinalando que os totais podem ser parciais. Não altera esquemas, saldos, horas, datas, direitos, políticas de sincronização, autenticação nem persistência. O saldo principal ainda não tem um diagnóstico equivalente e requer intervenção separada.

## Referências legais oficiais verificadas em 20/09/2026

- Código do Trabalho, artigo 238.º: duração mínima anual de 22 dias úteis; regra geral de segunda a sexta-feira, excluindo feriados; regime de substituição quando os dias de descanso semanal coincidam com dias úteis. Fonte: https://diariodarepublica.pt/dr/legislacao-consolidada/lei/2009-34546475-56360079
- Artigo 239.º: no ano de admissão, dois dias úteis por mês de duração do contrato, até 20, com gozo após seis meses completos, sem prejuízo das restantes disposições e exceções. Fonte: https://diariodarepublica.pt/dr/legislacao-consolidada/lei/2009-34546475-56411491
- Artigo 240.º: regras e exceções para gozo no ano civil seguinte. Fonte: https://diariodarepublica.pt/dr/legislacao-consolidada/lei/2009-34546475-46747475

**Decisão:** não introduzir feriados, descanso alternativo, créditos adicionais, transferência de saldo nem regras de CCT sem confirmar calendário aplicável, data efetiva de admissão, contrato e registos reais. As regras gerais não validam o saldo específico do utilizador; a versão consolidada não substitui o texto legal original. Não transformar a meta pessoal em direito.

## Riscos, verificações e critérios de aceitação

1. **Coletor duplicado:** comparar os dias do saldo principal e os da proveniência para o mesmo ano/mesmas fontes, incluindo datas repetidas e chaves de outros meses. Antes de unificar, identificar semântica de campos manuais, estados de cofre e reatividade. Não alterar um cálculo para ajustar apenas a apresentação.
2. **Cofre indisponível:** distinguir, numa etapa posterior, chaves genuinamente inexistentes de falta de ligação ao cofre. Não apresentar um saldo parcial como definitivo. Não limpar armazenamento local, nem alterar schema sem cópia e estratégia de reversão.
3. **Sincronização:** em dois aparelhos com o mesmo perfil autorizado, testar atualização local, estado offline, reconciliação após reconexão, conflito e reabertura; verificar explicitamente que o mesmo registo chega ao destino. Não prometer sincronização instantânea.
4. **Cálculos:** testar datas de fevereiro, mudança de ano, feriados aplicáveis, descanso alternativo quando confirmado, dias manuais, duplicados, saldo negativo e limites da admissão. Apenas as regras confirmadas podem passar de hipótese para resultado laboral.
5. **UX/segurança:** verificar ecrãs pequenos, zoom, teclado/VoiceOver, estados vazios, foco, avisos de dados incompletos, privacidade do diagnóstico e ausência de escrita ao consultar.
6. **Entrega:** CI no último commit com auditoria de dependências, tipos, lint, Vitest, build, Worker e smoke Chromium; depois inspeção física. Até essa evidência, manter o PR em rascunho e `main` intacta.

**Próximo passo:** concluir a CI do PR #224 e obter comparação com dados reais anonimizada e testes em dispositivos. Não inferir valores pessoais da captura de protótipo.
