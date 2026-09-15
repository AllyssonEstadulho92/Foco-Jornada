# Decisões Técnicas

Atualizado em: 2026-09-15

## D-001 — Manter o menu `···` além do gesto de deslize

**Estado:** aceite.

**Decisão:** gestos de deslize acrescentam atalhos, mas não substituem o menu explícito.

**Motivo:** o gesto não é igualmente descobrível/acessível para teclado, rato e tecnologias de apoio.

## D-002 — Eliminação imediata na UI com tombstone lógico

**Estado:** aceite.

**Decisão:** eliminar um horário de medicação remove-o imediatamente da agenda ativa, mas preserva o registo com `deletedAt`.

**Motivo:** mantém integridade referencial e auditoria de eventos históricos sem fazer o horário reaparecer.

## D-003 — Alterações de definição entram em vigor no dia seguinte

**Estado:** aceite.

**Decisão:** editar uma definição encerra a versão atual no dia de hoje e cria a sucessora válida a partir de amanhã.

**Motivo:** evita reescrever retroativamente o contexto que originou eventos do próprio dia.

## D-004 — Pointer Events com `touch-action: pan-y`

**Estado:** aceite.

**Decisão:** gestos horizontais usam Pointer Events e só assumem controlo após limiar horizontal.

**Motivo:** suporta toque/caneta/rato sem bloquear o scroll vertical normal.

## D-005 — Ações destrutivas exigem confirmação explícita

**Estado:** aceite.

**Decisão:** eliminar abre confirmação antes da mutação.

**Motivo:** reduz eliminações acidentais e torna a consequência clara.

## D-006 — Separar histórico funcional de auditoria técnica

**Estado:** aceite.

**Decisão:** Histórico abre em **Resumo** e checkpoints técnicos ficam em **Detalhes técnicos**.

**Motivo:** informação de auditoria é preservada sem dominar a leitura normal.

## D-007 — Eliminar toda a cadeia futura da mesma definição

**Estado:** aceite.

**Decisão:** eliminar uma versão ativa também encerra versões futuras da mesma cadeia lógica.

**Motivo:** impede que uma definição explicitamente eliminada reapareça automaticamente.

## D-008 — Normalizar horas noturnas pela proximidade ao turno planeado

**Estado:** aceite, integrada no PR #189 e publicada.

**Decisão:** em turnos que atravessam a meia-noite, horas reais são associadas ao dia inicial/seguinte pela posição relativa ao turno planeado.

**Motivo:** evita deslocar incorretamente entradas antecipadas e preserva saídas da madrugada no turno certo.

## D-009 — GitHub Pages é a distribuição oficial do frontend

**Estado:** aceite.

**Decisão:** GitHub Pages continua a ser o canal oficial de publicação do frontend; serviços externos só entram na arquitetura quando finalidade e segurança estão documentadas.

**Motivo:** um check externo não deve redefinir silenciosamente a arquitetura suportada.

## D-010 — Cloudflare Worker/Durable Object para sincronização cifrada

**Estado:** aceite, integrada no PR #191 e publicada.

**Decisão:** sincronização remota transporta apenas o `EncryptedVaultRecord` e metadados técnicos; cada perfil é isolado num Durable Object.

**Motivo:** permitir convergência móvel/computador sem expor dados funcionais em texto simples no backend.

## D-011 — Bootstrap inicial do Durable Object através de produção

**Estado:** concluído no PR #191.

**Decisão:** alterações de ciclo de vida do Durable Object são aplicadas no deploy de produção, não simuladas como se `versions upload` tivesse o mesmo efeito.

**Motivo:** o ciclo de vida do Durable Object depende do mecanismo de deploy suportado pela Cloudflare.

## D-012 — Endpoint de sincronização pode ser configurado no perfil

**Estado:** aceite, integrada no PR #192 e publicada.

**Decisão:** manter `VITE_SYNC_API_URL`, mas permitir endpoint runtime validado por HTTPS/identidade `/health` quando a variável de build não estiver disponível.

**Motivo:** a ausência de variável de build não deve inutilizar um backend legítimo já publicado.

## D-013 — Browser novo associa-se ao perfil por canal temporário cifrado

**Estado:** aceite, integrada no PR #193 e publicada.

**Decisão:** associação transfere apenas o material de bootstrap cifrado; o segredo raiz fica no fragmento `#pair=...`, expira e não é enviado ao Worker.

**Motivo:** um browser vazio precisa de bootstrap sem colocar PIN/palavra-passe/chave de dados no servidor.

## D-014 — Uma aplicação responsiva, um modelo de dados

**Estado:** aceite no PR #194.

**Decisão:** mobile e desktop são réplicas da mesma PWA e do mesmo cofre, sem APIs/regras duplicadas por plataforma.

**Motivo:** o problema cross-device é de convergência e identidade do perfil, não de duas aplicações diferentes.

## D-015 — O mesmo controlo móvel abre e fecha o drawer

**Estado:** aceite no PR #195 e publicada.

**Decisão:** o mesmo botão alterna hambúrguer ↔ X a partir de `mobileMenuOpen`; a animação é CSS.

**Motivo:** o estado aberto/fechado deve ser legível e reversível no mesmo ponto de interação.

## D-016 — Um único X e orçamento explícito de largura no top bar

**Estado:** aceite no PR #196 e publicada.

**Decisão:** não existe segundo botão X no drawer; identidade e indicadores operacionais usam colunas com largura controlada.

**Motivo:** elimina duplicação visual e competição entre marca, relógio, sync, bloqueio e notificações.

## D-017 — Área de toque sem superfície visual do botão

**Estado:** integrada no PR #197.

**Decisão:** o botão mantém alvo semântico de `44 × 44 px`, mas sem cápsula/borda/sombra visual permanente.

**Motivo:** preservar acessibilidade sem transformar o ícone de navegação num cartão concorrente.

## D-018 — Elevar o controlo, não a superfície do top bar

**Estado:** integrada no PR #198; detalhes visuais posteriores foram refinados por D-019.

**Decisão:** a interatividade do X não deve obrigar uma superfície branca recortada sobre o backdrop.

**Motivo:** o artefacto visual vinha do elemento pai elevado, não apenas do botão.

## D-019 — Top bar móvel persistente; drawer começa abaixo

**Estado:** aceite e publicada.

**Decisão:** abrir o drawer mantém `Foco Jornada`, relógio, sync, bloqueio e notificações no top bar; drawer/backdrop começam abaixo dele.

**Motivo:** preserva continuidade visual e hierarquia global durante a navegação móvel.

## D-020 — Bootstrap reutiliza a marca existente com animação CSS

**Estado:** integrada nos PR #200–#201 e publicada.

**Decisão:** o fallback inicial usa `logo-mark.svg` e animação CSS progressiva, respeitando `prefers-reduced-motion`.

**Motivo:** reforçar identidade sem nova biblioteca, segundo logótipo ou JavaScript de animação.

## D-021 — Jornada e pausas reconciliadas pelo `WorkSchedule`

**Estado:** aceite, integrada no PR #202 e publicada.

**Decisão:** entrada, saída e pausas automáticas derivam exclusivamente de `WorkSchedule`; Pomodoro/foco personalizado permanecem manuais.

**Motivo:** automatizar marcos previsíveis sem inventar atividade nem fingir execução garantida em background.

**Consequência:** quando a PWA retoma depois de suspensão, reconcilia usando timestamps planeados exatos.

## D-022 — Férias usam referência laboral separada da projeção pessoal

**Estado:** aceite, integrada no PR #203 e publicada.

**Decisão:** referência laboral e planeamento pessoal são conceitos distintos. Nos anos normais, a referência parte do direito anual configurado com mínimo geral suportado de 22 dias úteis; no ano de admissão usa política conservadora de 2 dias por mês completo, até 20, e marco de seis meses.

**Motivo:** evitar apresentar uma simulação mensal como direito laboral automaticamente adquirido.

**Persistência:** configuração adicional fica em `secureStorage` dentro do cofre cifrado existente.

## D-023 — Meta de 28 dias é projeção pessoal configurável

**Estado:** aceite, integrada no PR #204 e publicada.

**Decisão:** a área de férias pode mostrar meta anual pessoal, 28 dias por defeito, com marcos `meta × mês / 12`, sem alterar `annualEntitlementDays`.

**Motivo:** permitir acompanhamento mensal sem afirmar que 28 dias são direito legal geral.

**Consequência:** marcos são recalculados diretamente da meta, evitando drift; dezembro termina exatamente na meta configurada.

## D-024 — Férias registadas descontam apenas dias úteis padrão

**Estado:** aceite, integrada no PR #205 e publicada.

**Decisão:** depois de validar/deduplicar datas, `VacationBalance` desconta segunda–sexta no regime padrão; sábado/domingo não reduzem saldo e são contados separadamente em `recordedIgnoredWeekendDays`.

**Caso de aceitação:** 24/08/2026–06/09/2026 contém 14 datas civis e 10 dias úteis contabilizados.

**Motivo:** intervalos que atravessam fins de semana não devem consumir dias adicionais na regra padrão pretendida.

**Limite:** feriados, descanso semanal diferente e escalas especiais exigem calendário/regra confirmada.

## D-025 — O mês atual evolui em tempo real sem substituir os marcos fechados

**Estado:** aceite, integrada no PR #206 e publicada.

**Decisão:** preservar `monthlyAccruedDays` como acumulado de meses fechados e acrescentar uma camada derivada de evolução intramensal para a projeção pessoal.

A progressão viva usa:

`progressoDoMes = (diaDoMes - 1 + fracaoDoDiaLocal) / diasNoMes`

`acumuladoVivo = metaAnual × (mesesAnteriores + progressoDoMes) / 12`

O relógio da página é efémero. `VacationBalancePage` atualiza a referência temporal a cada minuto enquanto está ativa e também em `focus`/`visibilitychange`. Se a PWA for suspensa, não tenta reproduzir ticks perdidos; recalcula pelo instante atual quando volta ao primeiro plano.

**Motivo:** o utilizador quer perceber a evolução do mês atual em vez de ver o valor parado até ao último dia, sem perder a precisão dos marcos mensais nem confundir a projeção pessoal com direito laboral.

**Precisão:** marcos fechados mantêm duas casas de apresentação; valores vivos podem mostrar até quatro. O valor vivo é sempre derivado diretamente da meta anual e da fração temporal atual, nunca do último valor arredondado mostrado.

**Persistência e segurança:** nenhum valor vivo, relógio ou progresso temporal é persistido/sincronizado. Não há novo endpoint, schema, token, segredo, permissão, dependência ou mecanismo de autenticação.

**Consequências:**

- mobile e desktop calculam o valor vivo a partir da respetiva hora local;
- a configuração continua a sincronizar pelo cofre existente;
- os saldos vivos reutilizam a mesma deduplicação e filtro de dias úteis das férias registadas;
- a referência laboral definida em D-022 permanece inalterada;
- validação física de timezone/suspensão da PWA continua necessária antes de encerrar a tarefa operacionalmente.

## D-026 — Conteúdo dos cartões mensais deve refluír dentro do próprio cartão

**Estado:** implementada no PR #207; integração depende dos quality gates.

**Decisão:** a grelha de evolução mensal não deve resolver falta de espaço deixando badges/textos ultrapassarem a borda nem escondendo informação com reticências. Todos os cartões usam contenção explícita de flex/grid (`min-width: 0`, `max-width: 100%`) e permitem quebra de linha segura no cabeçalho, estado, valor e descrições.

O badge de estado deixa de usar `white-space: nowrap`. Em ecrãs estreitos, o layout passa progressivamente de 4 para 3, 2 e finalmente 1 coluna; abaixo de 520 px o cabeçalho do cartão organiza mês e estado em coluna.

**Motivo:** a captura real mostrou setembro com `Em curso · xx%` a sair visualmente da secção. Cortar o conteúdo ou esconder a percentagem resolveria apenas o sintoma; o comportamento correto é reflow responsivo mantendo toda a informação legível.

**Acessibilidade:** `forced-colors` e `prefers-reduced-motion` permanecem ativos. A correção não depende de hover, não reduz informação semântica e suporta zoom/aumento de texto melhor do que `nowrap`/ellipsis.

**Consequências:**

- a correção é exclusivamente de apresentação;
- cálculos de férias e tempo real permanecem inalterados;
- não há alteração de persistência, API, autenticação, sincronização ou dependências;
- foi adicionado teste CSS de regressão para impedir o regresso de nowrap/ellipsis e ausência de limites de largura.