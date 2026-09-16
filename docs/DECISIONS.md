# Decisões Técnicas

Atualizado em: 2026-09-16

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

`progressoDoMes = (diaDoMes - 1 + fracaoDoDiaLocal) / diasNoMes`

`acumuladoVivo = metaAnual × (mesesAnteriores + progressoDoMes) / 12`

O relógio é efémero. A página atualiza a cada minuto e também em `focus`/`visibilitychange`; após suspensão recalcula pelo instante atual.

**Motivo:** mostrar evolução do mês atual sem perder precisão dos marcos mensais nem confundir projeção pessoal com direito laboral.

**Persistência e segurança:** valores vivos não são persistidos/sincronizados e não criam endpoint, schema, token, segredo, permissão ou dependência.

## D-026 — Conteúdo dos cartões mensais deve refluir dentro do próprio cartão

**Estado:** aceite, integrada no PR #207 e publicada.

**Decisão:** a grelha mensal não resolve falta de espaço deixando badges/textos ultrapassarem a borda nem escondendo informação com reticências. Usa contenção explícita (`min-width: 0`, `max-width: 100%`), quebra segura e barra limitada a 100%.

**Motivo:** a captura real mostrou setembro com `Em curso · xx%` fora do cartão.

**Acessibilidade:** `forced-colors` e `prefers-reduced-motion` permanecem ativos.

## D-027 — A grelha mensal deve adaptar a quantidade de colunas ao espaço real

**Estado:** aceite, integrada no PR #208 e publicada.

**Decisão:** depois de corrigido o overflow, a grelha mensal usa `auto-fit/minmax` em vez de depender apenas de breakpoints rígidos. O cartão mensal mantém uma largura mínima confortável no desktop/tablet e cai naturalmente para menos colunas à medida que o espaço diminui.

A regra principal é:

`repeat(auto-fit, minmax(min(100%, 15rem), 1fr))`

O resumo vivo usa a mesma estratégia com base mínima de `13rem`.

**Hierarquia visual:**

- mês + estado formam o cabeçalho;
- valor acumulado é o elemento tipográfico dominante;
- progresso mantém posição e largura previsíveis;
- texto auxiliar permanece secundário;
- mês atual recebe destaque estrutural por borda superior/superfície/valor;
- concluídos e futuros continuam visualmente distinguíveis;
- no mobile, cabeçalho passa para uma coluna e a altura mínima do desktop é removida.

**Motivo:** apenas impedir overflow não garante boa leitura. A secção deve permanecer equilibrada em larguras intermédias, zoom e aumento de texto, sem comprimir excessivamente os cartões.

**Acessibilidade e compatibilidade:** não se remove informação, não se depende de hover e continuam ativos `forced-colors` e `prefers-reduced-motion`.

**Segurança/dados:** alteração exclusivamente visual; não modifica domínio, persistência, sincronização, autenticação, API, dependências ou dados pessoais.

## D-028 — Indicadores avançados de férias são derivados e não criam novo estado persistido

**Estado:** aceite, integrada no PR #209 e publicada.

**Decisão:** acrescentar um painel de leitura rápida com informação derivada da projeção pessoal já existente, sem gravar percentagens, previsões ou marcos futuros no cofre.

Indicadores suportados:

- progresso anual da meta pessoal;
- dias ainda por acumular;
- próximo marco inteiro e data estimada;
- gozadas, planeadas e total comprometido;
- percentagem da meta pessoal já comprometida;
- previsão do saldo pessoal em 31 de dezembro;
- fins de semana ignorados pelo filtro padrão;
- próximo fecho mensal, falta no mês e ritmo diário.

**Fórmulas principais:**

`progressoAnual = acumuladoVivo / metaAnual`

`faltaAnual = max(0, metaAnual - acumuladoVivo)`

`comprometido = gozadas + planeadas`

`previsaoFimAno = metaAnual + transitados + ajustes - comprometido`

O próximo marco é `min(metaAnual, floor(acumuladoVivo) + 1)` enquanto a meta não estiver atingida. A data é obtida pelo mesmo modelo de `meta / 12`, localizando em que mês/fração mensal esse patamar é cruzado.

**Motivo:** o utilizador quer saber não apenas quanto acumulou, mas também quanto falta, o que já consumiu/planeou, qual o próximo patamar e qual a projeção no fim do ano.

**Separação semântica:** estes indicadores continuam a ser uma projeção pessoal. Não substituem a referência laboral, RH, contrato ou CCT e não devem ser apresentados como aquisição legal diária de férias.

**Persistência e segurança:** nenhum novo campo persistido, tabela, endpoint, token, segredo, permissão, dependência ou telemetria. O painel usa apenas valores já disponíveis em `VacationBalance` e dados existentes no cofre cifrado.

**UI/UX:** o painel usa `vacation-insights.css`, grelha `auto-fit/minmax`, barra anual acessível, contenção responsiva, `forced-colors` e `prefers-reduced-motion`.

**Entrega:** Qualidade #1140 no head, Qualidade #1141 em `main`, Publicar Foco & Jornada #248 e pages build and deployment #807 concluíram com sucesso; build publicado no commit `ac121c3f687f86149d90e1bd78c4788b8c86d0a6`.

## D-029 — Simular férias futuras sem criar registos implícitos

**Estado:** aceite, integrada no PR #210 e publicada.

**Decisão:** o planeador recebe a mesma configuração e datas normalizadas da página de férias, mas limita-se a calcular pré-visualizações de períodos futuros do ano atual. Nenhuma simulação grava ou reserva dias; só o utilizador pode efetuar um registo explícito no mapa de turnos.

**Cálculo:** usar a mesma política de semana útil de `VacationBalance` (segunda–sexta); descontar apenas datas úteis do intervalo que ainda não constem dos registos existentes. Obter saldo no início/fim chamando `calculateVacationBalance` nos instantes correspondentes, sem implementar uma segunda fórmula de acumulação. Projeção pessoal de dezembro após simulação = projeção anterior − dias adicionais.

**Motivo:** permitir avaliação de cenários sem duplicação de dias, mutação silenciosa de dados ou apresentação da meta pessoal de 28 dias como direito oficial.

**Limites:** bloquear períodos passados e cruzamento de anos nesta versão; feriados, escalas especiais e regimes semanais não padrão exigem regras previamente confirmadas. A lista de próximos períodos mostra o primeiro e último dia útil marcado de cada grupo, não o período integral aprovado de descanso.

**Segurança e acessibilidade:** sem novo schema, endpoint, dependência ou segredo; CSS isolado, validação de datas civis, `aria-live`, `focus-visible`, `forced-colors` e `prefers-reduced-motion`.

**Entrega:** Qualidade #1148 no head final e #1149 em `main`, Publicar Foco & Jornada #249 e Pages #814 concluídos com sucesso. Merge `73a6c0f43caf40219a98b1224113bdddaaec420b`; build publicado `8a79445d483ff2017e2cb860c94bccc77d2d33d0`. Testes físicos de dispositivo permanecem pendentes.
