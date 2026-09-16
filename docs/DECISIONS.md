# Decisões Técnicas

Atualizado em: 2026-09-16

## D-001 — Manter o menu `···` além do gesto de deslize
**Estado:** aceite. **Decisão:** gestos de deslize acrescentam atalhos, sem substituir menu explícito. **Motivo:** descobribilidade e acessibilidade para teclado, rato e tecnologias de apoio.

## D-002 — Eliminação imediata na UI com tombstone lógico
**Estado:** aceite. **Decisão:** apagar horário de medicação remove-o da agenda ativa e preserva `deletedAt`. **Motivo:** integridade referencial e auditoria sem reaparecimento.

## D-003 — Alterações de definição entram em vigor no dia seguinte
**Estado:** aceite. **Decisão:** fechar versão hoje e criar sucessora válida amanhã. **Motivo:** não reescrever retroativamente eventos atuais.

## D-004 — Pointer Events com `touch-action: pan-y`
**Estado:** aceite. **Decisão:** gestos horizontais só assumem controlo após limiar horizontal. **Motivo:** suportar toque/caneta/rato mantendo scroll vertical.

## D-005 — Ações destrutivas exigem confirmação explícita
**Estado:** aceite. **Decisão:** confirmação antes de eliminar. **Motivo:** reduzir perdas acidentais e esclarecer consequências.

## D-006 — Separar histórico funcional de auditoria técnica
**Estado:** aceite. **Decisão:** Histórico abre em Resumo; checkpoints em Detalhes técnicos. **Motivo:** preservar auditoria sem dominar a leitura.

## D-007 — Eliminar toda a cadeia futura da mesma definição
**Estado:** aceite. **Decisão:** eliminar versão ativa encerra versões futuras da mesma cadeia. **Motivo:** impedir reaparecimento de definição eliminada.

## D-008 — Normalizar horas noturnas pela proximidade ao turno planeado
**Estado:** aceite, PR #189 publicado. **Decisão:** horas que atravessam meia-noite associam-se ao dia de início/seguinte pela posição face ao turno. **Motivo:** preservar entradas antecipadas e saídas na madrugada.

## D-009 — GitHub Pages é a distribuição oficial do frontend
**Estado:** aceite. **Decisão:** GitHub Pages é canal oficial; serviço externo exige finalidade/segurança documentadas. **Motivo:** um check não pode alterar arquitetura suportada.

## D-010 — Cloudflare Worker/Durable Object para sincronização cifrada
**Estado:** aceite, PR #191 publicado. **Decisão:** transmitir apenas `EncryptedVaultRecord` e metadados técnicos, DO isolado por perfil. **Motivo:** convergência móvel/desktop sem dados funcionais legíveis no backend.

## D-011 — Bootstrap inicial do Durable Object através de produção
**Estado:** concluído no PR #191. **Decisão:** aplicar ciclo de vida DO no deploy de produção, não tratar `versions upload` como equivalente. **Motivo:** respeitar suporte da Cloudflare.

## D-012 — Endpoint de sincronização pode ser configurado no perfil
**Estado:** aceite, PR #192 publicado. **Decisão:** manter `VITE_SYNC_API_URL` e permitir endpoint runtime HTTPS com identidade `/health`. **Motivo:** ausência de variável de build não inutiliza backend legítimo.

## D-013 — Browser novo associa-se ao perfil por canal temporário cifrado
**Estado:** aceite, PR #193 publicado. **Decisão:** bootstrap cifrado, raiz no fragmento `#pair=...`, com expiração, nunca enviada ao Worker. **Motivo:** associação sem enviar PIN/password/dataKey ao servidor.

## D-014 — Uma aplicação responsiva, um modelo de dados
**Estado:** aceite, PR #194. **Decisão:** mobile/desktop são réplicas da mesma PWA/cofre, sem regras distintas. **Motivo:** convergência/identidade de perfil, não duas aplicações.

## D-015 — O mesmo controlo móvel abre e fecha o drawer
**Estado:** aceite, PR #195 publicado. **Decisão:** botão único alterna hambúrguer ↔ X por `mobileMenuOpen` com CSS. **Motivo:** estado reversível no mesmo controlo.

## D-016 — Um único X e orçamento explícito de largura no top bar
**Estado:** aceite, PR #196 publicado. **Decisão:** sem segundo X, colunas de largura controlada para marca/indicadores. **Motivo:** evitar competição e sobreposição.

## D-017 — Área de toque sem superfície visual do botão
**Estado:** PR #197 integrado. **Decisão:** alvo semântico 44×44px sem cápsula/borda/sombra permanente. **Motivo:** acessibilidade sem botão decorativo concorrente.

## D-018 — Elevar o controlo, não a superfície do top bar
**Estado:** PR #198 integrado; refinado por D-019. **Decisão:** X interativo não exige superfície branca recortada. **Motivo:** artefacto vinha do pai elevado.

## D-019 — Top bar móvel persistente; drawer começa abaixo
**Estado:** aceite, publicado. **Decisão:** marca, relógio e indicadores mantêm-se, drawer/backdrop começam abaixo. **Motivo:** continuidade e hierarquia móvel.

## D-020 — Bootstrap reutiliza a marca existente com animação CSS
**Estado:** PR #200–#201 publicados. **Decisão:** `logo-mark.svg` com CSS e `prefers-reduced-motion`. **Motivo:** identidade sem biblioteca ou segundo logótipo.

## D-021 — Jornada e pausas reconciliadas pelo `WorkSchedule`
**Estado:** aceite, PR #202 publicado. **Decisão:** entrada/saída/pausas derivam só de `WorkSchedule`; Pomodoro manual; no regresso da PWA usar timestamps planeados exatos. **Motivo:** automatização previsível sem fingir background permanente.

## D-022 — Férias usam referência laboral separada da projeção pessoal
**Estado:** aceite, PR #203 publicado. **Decisão:** referência laboral e planeamento pessoal distintos: ano normal parte de direito configurado com mínimo geral 22 úteis; admissão conservadora 2 por mês completo até 20 e marco de seis meses. Configuração em `secureStorage` cifrado. **Motivo:** simulação mensal não é direito adquirido.

## D-023 — Meta de 28 dias é projeção pessoal configurável
**Estado:** aceite, PR #204 publicado. **Decisão:** meta pessoal 28 por defeito; `meta × mês / 12`, sem alterar `annualEntitlementDays`. **Motivo:** planeamento sem afirmar direito legal geral de 28; cálculo direto da meta evita drift e dezembro fecha exatamente na meta.

## D-024 — Férias registadas descontam apenas dias úteis padrão
**Estado:** aceite, PR #205 publicado. **Decisão:** após validação/deduplicação, contam segunda–sexta; sábado/domingo são ignorados em `recordedIgnoredWeekendDays`. 24/08–06/09/2026 = 14 datas, 10 úteis. **Motivo:** fins de semana não consomem dias na regra padrão. **Limite:** feriados/descanso alternativo/CCT exigem confirmação.

## D-025 — O mês atual evolui em tempo real sem substituir os marcos fechados
**Estado:** aceite, PR #206 publicado. **Decisão:** meses fechados mantêm `monthlyAccruedDays`; evolução intramensal derivada: `progressoMes = (dia - 1 + fracaoDiaLocal) / diasMes`; `acumuladoVivo = meta × (mesesAnteriores + progressoMes) / 12`. Atualizar a cada minuto, em focus/visibility; após suspensão recalcular pelo instante atual. **Motivo:** progresso sem comprometer marcos/direito laboral. **Segurança:** não persistir relógio/valores derivados nem criar endpoint/schema/dependência.

## D-026 — Conteúdo dos cartões mensais deve refluir dentro do próprio cartão
**Estado:** aceite, PR #207 publicado. **Decisão:** conter badges/textos com `min-width: 0`, `max-width: 100%` e quebra segura, sem reticências; barra até 100%; `forced-colors` e `prefers-reduced-motion`. **Motivo:** screenshot de setembro revelou overflow.

## D-027 — A grelha mensal deve adaptar a quantidade de colunas ao espaço real
**Estado:** aceite, PR #208 publicado. **Decisão:** `repeat(auto-fit, minmax(min(100%, 15rem), 1fr))`, resumo com 13rem, mês atual diferenciado, tipografia/hierarquia previsíveis, mobile cabeçalho em coluna e sem altura mínima. **Motivo:** legibilidade em zoom/tablet/mobile sem comprimir cartões. **Segurança:** apenas CSS, sem alterar domínio/cofre/API.

## D-028 — Indicadores avançados de férias são derivados e não criam novo estado persistido
**Estado:** aceite, PR #209 publicado. **Decisão:** progresso anual, restante, próximo marco/data, gozadas, planeadas, compromisso, dezembro, fins de semana e fecho mensal derivados de `VacationBalance`. Fórmulas: `progressoAnual = acumuladoVivo / meta`; `falta = max(0, meta - acumuladoVivo)`; `comprometido = gozadas + planeadas`; `previsaoDezembro = meta + transitados + ajustes - comprometido`; próximo marco `min(meta, floor(acumuladoVivo)+1)`. **Motivo:** leitura rápida sem duplicar estado ou confundir direito e meta. CSS `vacation-insights.css` acessível. **Entrega:** Qualidade #1140/#1141, Publicar #248, Pages #807; build `ac121c3f687f86149d90e1bd78c4788b8c86d0a6`.

## D-029 — Simular férias futuras sem criar registos implícitos
**Estado:** aceite, PR #210 publicado. **Decisão:** mesmo input de configuração/datas da página; aceitar apenas futuros no ano corrente; segunda–sexta; descontar só datas não registadas. Usar `calculateVacationBalance` no início/fim e previsão dezembro antiga menos novos dias. A simulação não grava/aprova/reserva; marcação só por ação explícita no mapa de turnos. **Motivo:** cenários sem perda/duplicação nem declaração de direito 28. **Limites:** feriados/escala/transição de ano carecem de regra confirmada; grupos futuros apresentam primeiro/último dia útil, não intervalo aprovado. **Segurança:** sem schema/API/segredo, `aria-live` e CSS isolado. **Entrega:** Qualidade #1148/#1149, Publicar #249, Pages #814; merge `73a6c0f43caf40219a98b1224113bdddaaec420b`, build `8a79445d483ff2017e2cb860c94bccc77d2d33d0`.

## D-030 — Sugestões de férias são cenários orientados por critérios explícitos
**Estado:** proposta no PR #211, integração condicionada aos quality gates finais.

**Decisão:** implementar o protótipo aprovado na própria rota `#/ferias` com filtros efémeros (1–30 dias úteis, mês a evitar, critério juntar fins de semana/mais cedo/maior saldo). Gerar candidatos apenas futuros, até dezembro, sem atravessar mês excluído ou sobrepor qualquer dia útil já registado. Reutilizar `simulateVacationPeriod` para validar cálculo e saldo; só sugerir candidatos com saldos pessoais previstos não negativos no fim e no fim do ano. Escolher um candidato por mês de início, mantendo alternativas diferentes e calendário contextual. O botão de sugestão apenas preenche o simulador existente; não cria férias nem escreve preferências no cofre.

**Motivo:** o utilizador quer comparar datas/meses reais, descanso potencial e impacto no saldo sem ser conduzido a assumir as datas ilustrativas de 2025 como atuais nem confundir meta pessoal 28 com direito legal ou aprovação. Ordenação transparente, não avaliação objetiva de qualidade do destino, preços ou conveniência profissional.

**Limites e riscos:** a regra padrão segunda–sexta não identifica feriados, escala, ausências, disponibilidade de colegas, custos, CCT ou consentimento do empregador. Descanso potencial inclui fins de semana adjacentes apenas se forem de descanso na escala; validação física do design no iPhone ainda pendente. Sem nova tabela, schema, endpoint, permissão, token, telemetria ou dependência. CSS isolado e controlos acessíveis, com modos `forced-colors`/`prefers-reduced-motion`.
