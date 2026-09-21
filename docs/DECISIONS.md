# Decisões técnicas

Atualizado em: 2026-09-21. Decisões D-001 a D-033, com texto integral, preservadas em `docs/history/DECISIONS-pre-217.md`. Este documento indexa decisões recentes.

## D-044 — Taxas de fim de semana explícitas sem inferir direitos contratuais

**Estado:** implementação em revisão no PR #226. **Evidência:** a captura da página Vencimento não mostra suplementos de sábado ou domingo e não identifica a taxa praticada pela entidade empregadora. O Código do Trabalho, artigo 268.º, regula **trabalho suplementar**, que não equivale automaticamente a um turno normal de sábado ou domingo. **Decisão:** configurar taxas separadas de sábado e domingo em `PayrollConfig`, usando `null` enquanto não houver recibo/contrato/CCT que as confirme; zero preenchido representa uma decisão explícita. Calcular o suplemento apenas sobre horas normais com `kind='work'` no dia civil, preferindo horas efetivas do mapa sem pausas, e usar duração contratual apenas como estimativa em planos sem horário medido. `overtimeHours` continua exclusivamente no motor existente de trabalho suplementar. Acrescentar o resultado ao bruto e às bases de descontos sem duplicar a remuneração base. Guardar na chave salarial atual sem migração destrutiva. **Limites:** não reconhecer automaticamente aprovação de horas ou percentagem devida, feriados mantêm regras próprias, turnos a atravessar a meia-noite exigem futura repartição por data. **QA:** testes dedicados, CI e comparação futura com recibo real; ver `docs/WEEKEND-PAY.md`.

## D-043 — Transpor o protótipo para o produto real sem falsear o estado

**Estado:** proposto no PR #223; publicação pendente. **Decisão:** reproduzir a composição geral dos dois protótipos com separadores, faixas panorâmicas, cartões de indicadores, gráfico/tabela da evolução mensal e planeamento em etapas, mas manter ano, dados, saldo, restrições e interações provenientes da aplicação. Usar ilustração SVG costeira original local em vez de incorporar uma captura/fotografia do protótipo ou carregar recursos externos. O gráfico e a tabela consomem `monthlyAccrualSchedule` do cálculo existente; fichas completas e resumo intramensal ficam acessíveis num `<details>`. O modo escolhido não é persistido. **Motivo:** consistência de informação e uso offline, evitando duplicação de cálculo ou valores de demonstração na produção. **Limites:** não copiar nomes fictícios nem criar botão que finja submeter/aprovar férias pela ILUNION; a marcação real continua fora desta simulação. Não prometer fidelidade fotográfica/pixel a pixel, sincronização instantânea nem saldo laboral automático de 28 dias. **Risco:** nova camada de CSS escopada à área de férias e troca de apresentação em `VacationBalancePage`; exigir regressões, QA móvel real e posterior consolidação de estilos. **Segurança:** sem novas dependências, APIs, schema, segredos, permissões, cofre ou alterações ao Worker. Ver `docs/VACATION-PROTOTYPE-2026.md`.

## D-042 — Cabeçalhos móveis usam altura intrínseca, não base flex vertical

**Estado:** aceite, PR #222 integrado/publicado. **Evidência:** PDF Safari de 19/09/2026, uma página alta com hiatos entre títulos e valores de «Evolução por mês» e «O que tens, o que falta e o que vem a seguir». Em `vacation.css`, até 640px `.vacationPanelHeader` muda para coluna. As bases `flex:1 1 240px` em `vacation-accrual.css` e `flex:1 1 260px` em `vacation-insights.css` tornam-se alturas verticais; a base de 100% em `vacation-workspace.css` acrescenta risco. **Decisão:** ajustar apenas `vacation-workspace.css` existente: até 640px usar `flex:0 0 auto` e largura 100% para os cabeçalhos da vista geral; até 560px aplicar a mesma regra ao cabeçalho genérico; reduzir espaçamento dos cartões e permitir estado na linha do mês com quebra segura. Nada é escondido, truncado ou substituído por scroll horizontal. **Motivo:** eliminar espaço sem conteúdo sem alterar informação, dados ou hierarquia de navegação. **Trade-off:** testes estruturais protegem CSS, mas a nova altura ainda precisa de captura e teste físico no iPhone. O PDF também revela data de admissão futura face à captura e referência laboral 0; verificar dados separadamente, sem inferir valores contratuais nem alterar fórmulas. **Entrega:** merge `b5f34b9b8adf8e2ecacd210ecfbeb7f9d6c0614a`, Qualidade #1240/#1241, Publicar #261, build `112d2dbb7a56925d8a42dec2aaf0d9bae967a0fe`, Pages #869; tudo com sucesso. Ver `docs/VACATION-MOBILE-SPACING-AUDIT-2026.md`.

## D-041 — Reduzir competição visual e aproveitar largura real sem alterar dados

**Estado:** aceite, PR #222 integrado/publicado. **Decisão:** reutilizar `vacation-insights.css` para cartões de detalhe mais contidos e sem linhas decorativas repetidas, conservando destaque do progresso/«Próximo marco» e contraste de alerta. Em `vacation-planning-structure.css`, mostrar `vacationJointChoice` e `vacationJointCompare` em colunas 4/12 + 8/12 só quando a largura for >=1100px; preservar ordem do DOM em móvel. Resumo opcional do ano atual distribui texto, saldo e expansão em grelha com duas linhas até 440px. **Motivo:** captura e CSS mostram densidade elevada e altura desnecessária no desktop. **Riscos:** mudanças só visuais, não equivalem a teste físico; confirmar no iPhone real. Sem novo tema, alteração de cálculos, registos, regras laborais, confirmações, autenticação, cofre, Worker, backend ou sync. **Entrega:** mesmo merge, CI e publicação da D-042.

## D-040 — Propostas antes de contexto antigo e planeamento progressivo

**Estado:** aceite, PR #221 integrado/publicado. **Decisão:** no próximo ano apresentar propostas antes do saldo atual em `<details>` consultável, com aviso de não transferência; ano corrente conserva resumo vivo aberto. Passos semânticos de preferência, comparação, simulação e confirmação; opções compactas e método detalhado consultável. **Motivo:** PDF mostrou quatro cartões de 2026 e alternativas altas antes da decisão de julho/2027. **Limites:** não alterar funções de domínio/cofre, bloqueio declarado novembro/dezembro, checklist efémera nem inferir aprovação. **Entrega:** merge `9e9d267fd7a9ed7de3a9afdc68cbc8a8d2b708b9`, Qualidade #1227/#1228, Publicar #260, build `4074f203c6788d30a4f542c951a6b94b62f86fad`, Pages #866 com sucesso.

## D-039 — Refinar as duas vistas e corrigir salto global

**Estado:** aceite, PR #220 integrado/publicado. **Decisão:** reutilizar `vacation-visual-audit.css` para cartões contidos, largura de leitura 74rem; substituir `href="#main-content"` por botão `focusSection('main-content')`, preservando a rota hash. **Motivo:** 404 potencial e necessidade de consistência. **Limite:** teste estático não prova ausência de overflow iPhone. **Entrega:** merge `8a45758f68462e8631ed7de3a9afdc68cbc8a8d2b708b9`, Qualidade #1219/#1220, Publicar #259, build `eec8da024db5b3f65624433c66726e7c56e04cb0`, Pages #859.

## D-033 — Ponto de situação local vivo no planeamento

**Estado:** aceite, PR #214 integrado. Reutilizar relógio da página e `calculateVacationBalance` para acumulado, saldo atual, após planeadas e projeção dezembro; não criar timer remoto ou persistência adicional.

## D-034 — Ano seguinte e férias a dois

**Estado:** aceite, PR #215 integrado/publicado. Seletor atual/seguinte, julho predefinido, novembro/dezembro excluídos por restrição comunicada e sujeita a confirmação; recolher registos do ano escolhido sem transportar automaticamente saldo, ajustes ou dias manuais. Feriados, escala, disponibilidade da parceira e aprovação não verificados.

## D-035 — Confirmar só cenário escolhido, sem gravação

**Estado:** aceite, PR #216 integrado/publicado. Checklist temporária local da parceira e empregador; mudar dados, filtros ou datas repõe vistos por identidade do cenário. Não envia API nem marca férias automaticamente.

## D-036 — Proveniência opcional do saldo

**Estado:** aceite, PR #217 integrado/publicado. Painel recolhido em `#/ferias`, datas civis válidas deduplicadas por fonte; `collectVacationDatesForYear` deriva da mesma coleta de proveniência. Mostrar gozados/futuros/fins de semana ignorados e manuais sem data que continuam descontados. `VacationBalancePage` ainda mantém coletor próprio e cofre inacessível pode produzir consulta parcial. Sem alterar fórmula nem assumir direito automático de 28 dias. **Entrega:** merge `61816f7ec3f1c43043d57b094f834bb116d19a27`, Qualidade #1192/#1193, Publicar #256, Pages #842, build `322b8b37f745e17233360af07e473f50e9fc79d5`.

## D-037 — Hash pertence ao Router; saltos não substituem rota

**Estado:** aceite, PR #218 integrado/publicado. Atalho de proveniência deixou `href="#vacation-evidence-title"` por botão com `focusSection`, foco em título `tabIndex={-1}` e rota residual `*` com recuperação PT-PT. Corrige 404 visto no iPhone; skip link global corrigido no PR #220. **Entrega:** merge `89564f3ebbfe5d54e5d09dcf28db9e574b35cc50`, Qualidade #1201/#1202, Publicar #257, Pages #848, build `42397a6c97d60044f5dbc1cf90723ee799b1d0ac`.

## D-038 — Polimento visual escopado sem lógica nova

**Estado:** aceite, PR #219 integrado/publicado. `vacation-visual-audit.css` harmoniza espaçamento/raios, compacta separadores móveis e cartões sem ocultar valores; foco, contraste e movimento reduzido. A vista oculta permanece montada; medir dispositivos antes de consolidar CSS. **Entrega:** merge `f96ced5532178bb0746db0e50ef52874e72710dc`, Qualidade #1209/#1210, Publicar #258, Pages #854, build `96c779f88ab2d0f941b7a54f690dd759fa909ec1`.
