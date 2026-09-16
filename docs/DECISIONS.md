# Decisões Técnicas

Atualizado em: 2026-09-16

## D-001 — Manter o menu `···` além do gesto de deslize
**Estado:** aceite. **Decisão:** gestos acrescentam atalhos, sem substituir menu explícito. **Motivo:** descobribilidade e acessibilidade para teclado, rato e tecnologias de apoio.

## D-002 — Eliminação imediata na UI com tombstone lógico
**Estado:** aceite. **Decisão:** apagar horário de medicação remove-o da agenda ativa, preservando `deletedAt`. **Motivo:** integridade referencial e auditoria sem reaparecimento.

## D-003 — Alterações de definição entram em vigor no dia seguinte
**Estado:** aceite. **Decisão:** fechar versão hoje e criar sucessora válida amanhã. **Motivo:** não reescrever eventos atuais.

## D-004 — Pointer Events com `touch-action: pan-y`
**Estado:** aceite. **Decisão:** gesto horizontal assume controlo só após limiar horizontal. **Motivo:** toque/caneta/rato com scroll vertical.

## D-005 — Ações destrutivas exigem confirmação explícita
**Estado:** aceite. **Decisão:** confirmar antes de eliminar. **Motivo:** reduzir perdas acidentais.

## D-006 — Separar histórico funcional de auditoria técnica
**Estado:** aceite. **Decisão:** Histórico abre em Resumo, checkpoints em Detalhes técnicos. **Motivo:** preservar auditoria sem dominar leitura.

## D-007 — Eliminar toda a cadeia futura da mesma definição
**Estado:** aceite. **Decisão:** eliminar versão ativa encerra versões futuras da cadeia. **Motivo:** impedir reaparecimento.

## D-008 — Normalizar horas noturnas pela proximidade ao turno planeado
**Estado:** aceite, PR #189 publicado. **Decisão:** horas após meia-noite associam-se ao dia de início/seguinte pela posição face ao turno. **Motivo:** preservar entrada antecipada e saída de madrugada.

## D-009 — GitHub Pages é a distribuição oficial do frontend
**Estado:** aceite. **Decisão:** Pages é canal oficial, serviço externo exige finalidade/segurança documentadas. **Motivo:** check externo não altera arquitetura suportada.

## D-010 — Cloudflare Worker/Durable Object para sincronização cifrada
**Estado:** aceite, PR #191 publicado. **Decisão:** transportar apenas `EncryptedVaultRecord` e metadados técnicos, DO isolado por perfil. **Motivo:** convergência móvel/computador sem dados legíveis no backend.

## D-011 — Bootstrap inicial do Durable Object através de produção
**Estado:** concluído PR #191. **Decisão:** aplicar ciclo de vida DO no deploy de produção; `versions upload` não é equivalente. **Motivo:** respeitar suporte Cloudflare.

## D-012 — Endpoint de sincronização pode ser configurado no perfil
**Estado:** aceite, PR #192 publicado. **Decisão:** manter `VITE_SYNC_API_URL` e permitir endpoint runtime HTTPS com identidade `/health`. **Motivo:** variável de build ausente não inutiliza backend legítimo.

## D-013 — Browser novo associa-se por canal temporário cifrado
**Estado:** aceite, PR #193 publicado. **Decisão:** bootstrap cifrado, raiz no fragmento `#pair=...` com expiração, nunca enviado ao Worker. **Motivo:** associação sem transmitir PIN/password/dataKey.

## D-014 — Uma aplicação responsiva, um modelo de dados
**Estado:** aceite, PR #194. **Decisão:** mobile/desktop são réplicas da mesma PWA/cofre, sem regras diferentes. **Motivo:** convergência e identidade de perfil.

## D-015 — O mesmo controlo móvel abre/fecha o drawer
**Estado:** aceite, PR #195 publicado. **Decisão:** botão único hambúrguer ↔ X por `mobileMenuOpen`/CSS. **Motivo:** estado reversível no mesmo controlo.

## D-016 — Um único X e orçamento explícito de largura no top bar
**Estado:** aceite, PR #196 publicado. **Decisão:** sem segundo X; colunas controladas para marca/indicadores. **Motivo:** evitar sobreposição.

## D-017 — Área de toque sem superfície visual do botão
**Estado:** PR #197 integrado. **Decisão:** alvo 44×44px sem cápsula/borda/sombra permanente. **Motivo:** acessibilidade sem superfície concorrente.

## D-018 — Elevar o controlo, não a superfície do top bar
**Estado:** PR #198 integrado, refinado D-019. **Decisão:** X interativo não exige superfície branca recortada. **Motivo:** artefacto vinha do pai elevado.

## D-019 — Top bar móvel persistente; drawer começa abaixo
**Estado:** aceite, publicado. **Decisão:** marca, relógio e indicadores visíveis; drawer/backdrop abaixo. **Motivo:** continuidade visual.

## D-020 — Bootstrap reutiliza a marca existente com animação CSS
**Estado:** PR #200–#201 publicados. **Decisão:** `logo-mark.svg` com CSS/`prefers-reduced-motion`. **Motivo:** identidade sem biblioteca/segundo logótipo.

## D-021 — Jornada e pausas reconciliadas pelo `WorkSchedule`
**Estado:** aceite, PR #202 publicado. **Decisão:** entrada/saída/pausas derivadas de `WorkSchedule`; Pomodoro manual; regressar de background usa timestamps planeados. **Motivo:** não fingir timers permanentes.

## D-022 — Férias usam referência laboral separada da projeção pessoal
**Estado:** aceite, PR #203 publicado. **Decisão:** referência laboral/planeamento pessoal distintos: ano normal parte de direito confirmado com mínimo geral 22 úteis; admissão conservadora 2/mês completo até 20 e marco 6 meses. Configuração em `secureStorage` cifrado. **Motivo:** simulação não é direito adquirido.

## D-023 — Meta de 28 dias é projeção pessoal configurável
**Estado:** aceite, PR #204 publicado. **Decisão:** meta pessoal 28 por defeito, `meta × mês / 12`, sem alterar `annualEntitlementDays`. **Motivo:** não afirmar direito legal geral de 28; cálculo direto evita drift e dezembro fecha na meta.

## D-024 — Férias registadas descontam apenas úteis padrão
**Estado:** aceite, PR #205 publicado. **Decisão:** datas validadas/deduplicadas, contar seg.–sex.; fim de semana ignorado em `recordedIgnoredWeekendDays`. 24/08–06/09/2026 = 14 datas, dez úteis. **Motivo:** fins de semana não consomem na regra padrão. **Limite:** feriados/descanso alternativo/CCT requerem confirmação.

## D-025 — Mês atual evolui em tempo real sem substituir marcos fechados
**Estado:** aceite, PR #206 publicado. **Decisão:** meses fechados em `monthlyAccruedDays`; progresso do mês `(dia-1 + fracaoDiaLocal)/diasMes`; `acumuladoVivo = meta × (mesesAnteriores + progressoMes)/12`. Atualizar cada minuto, foco/visibilidade; retomar recalcula instantaneamente. **Motivo:** progressão sem confundir direito laboral. **Segurança:** sem persistência do relógio nem endpoint/schema/dependência.

## D-026 — Cartões mensais refluem dentro da borda
**Estado:** aceite, PR #207 publicado. **Decisão:** `min-width:0`, `max-width:100%`, quebra segura, sem reticências e barra até 100%, `forced-colors`/`prefers-reduced-motion`. **Motivo:** imagem real mostrou overflow de setembro.

## D-027 — Grelha mensal adapta colunas ao espaço real
**Estado:** aceite, PR #208 publicado. **Decisão:** `repeat(auto-fit,minmax(min(100%,15rem),1fr))`, resumo mínimo 13rem, mês atual diferenciado, hierarquia/altura mobile. **Motivo:** legibilidade sem compressão. **Segurança:** CSS sem modificar domínio/cofre/API.

## D-028 — Indicadores avançados são derivados e não criam estado persistido
**Estado:** aceite, PR #209 publicado. **Decisão:** progresso, dias restantes, marco/data, gozadas, planeadas, comprometidas, previsão dezembro e fecho derivados de `VacationBalance`. Fórmulas: `progresso=acumuladoVivo/meta`; `falta=max(0,meta-acumuladoVivo)`; `comprometido=gozadas+planeadas`; `previsaoDezembro=meta+transitados+ajustes-comprometido`; próximo marco `min(meta,floor(acumuladoVivo)+1)`. **Motivo:** leitura sem duplicar estado/direito. CSS `vacation-insights.css` acessível. **Entrega:** Qualidade #1140/#1141, Publicar #248, Pages #807, build `ac121c3f687f86149d90e1bd78c4788b8c86d0a6`.

## D-029 — Simular férias futuras sem criar registos implícitos
**Estado:** aceite, PR #210 publicado. **Decisão:** mesmas datas/configuração, aceitar apenas futuro no ano atual, seg.–sex., descontar só novos; usar `calculateVacationBalance` antes/depois e previsão dezembro menos novos dias. Não gravar/aprovar/reservar; mapa de turnos só por ação explícita. **Motivo:** cenários sem duplicação nem direito de 28 presumido. **Limites:** feriados, escala, transição de ano e intervalos integrais requerem confirmação. **Segurança:** sem schema/API/segredo, `aria-live`, CSS isolado. **Entrega:** Qualidade #1148/#1149, Publicar #249, Pages #814, merge `73a6c0f43caf40219a98b1224113bdddaaec420b`, build `8a79445d483ff2017e2cb860c94bccc77d2d33d0`.

## D-030 — Sugestões de férias são cenários orientados por critérios explícitos
**Estado:** aceite, PR #211 publicado. **Decisão:** protótipo em `#/ferias`, filtros efémeros (1–30 úteis, mês a evitar, juntar fins de semana/mais cedo/maior saldo), apenas futuros até dezembro sem mês excluído/sobreposição; `simulateVacationPeriod` valida e filtra saldo pessoal não negativo no fim/dezembro, uma opção por mês. Botão preenche simulador, não grava. **Motivo:** comparar datas/meses/descanso/impacto sem usar datas ilustrativas de 2025 nem confundir meta 28 com direito oficial. **Limites:** feriados, escala, custos, colegas, CCT e aprovação não inferidos; fins de semana adjacentes só são descanso se o forem na escala. Sem schema/API/permissão/token/telemetria/dependência; acessibilidade/contraste/movimento reduzido. **Entrega:** Qualidade #1150/#1156/head e em `main` run `35127380594`, Publicar #250, Pages #819; merge `b687673a467cf5fc5061160b41a254e4b55118cc`, build `271035a552cb6a1ecdbfe6ee8032bcafed7013ff`.

## D-031 — Separar o planeamento visualmente da leitura mensal numa rota própria

**Estado:** proposta no PR #212; integrar só após gates finais.

**Decisão:** preservar `#/ferias` para leitura de evolução mês a mês (hero → métricas → meses → indicadores → configurações/referência) e criar `#/ferias/planeamento` exclusivamente para sugestões, calendário e simulador. Navegação entre vistas por `NavLink` com estado ativo/foco visível; manter o único `VacationBalancePage`/agregação, sem alterar fórmula/dados. CSS de âmbito limitado decide a região visível em cada rota e controla largura máxima de 80rem, espaçamento `clamp`, grelhas fluidas e contenção nos cartões.

**Motivo:** o planeamento interrompia a leitura do saldo e havia excesso de elementos comprimidos na mesma página. A nova organização distingue consulta, interpretação e ação futura sem exigir migração de dados nem duplicar cálculos.

**Trade-off documentado:** a vista não apresentada fica oculta com `display:none`, mas os componentes ainda são montados em React. Um refactor posterior poderá extrair hook/componentes comuns e desmontar regiões não ativas, mediante testes de regressão. Não afirmar que a nova rota elimina computação oculta.

**Compatibilidade/segurança:** link antigo preservado, novas rotas só de apresentação; configurações e registos continuam no cofre cifrado. Sem novos endpoints, permissões, tokens, segredos, migrações, dependências ou telemetria. Preservar `forced-colors`, `prefers-reduced-motion`, labels e testes no iPhone/Android/desktop. Detalhes em `docs/VACATION-WORKSPACE.md`.
