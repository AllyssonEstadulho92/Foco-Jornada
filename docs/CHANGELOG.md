# Changelog

Atualizado em: 2026-09-17. Alterações anteriores até ao PR #214 (texto completo e provas históricas) permanecem em `docs/history/CHANGELOG-pre-217.md`.

## 2026-09-17 — PR #217: origem dos dias de férias (em validação)

- `#/ferias` ganhou painel opcional, recolhido por defeito, «De onde vêm os teus dias?», com atalho, datas ordenadas, indicação das áreas de origem (horas, turnos e plano), úteis até hoje/futuros e fins de semana ignorados.
- `VacationYearRecords` expõe proveniência única por data e `collectVacationDatesForYear` deriva a mesma coleta para o ano futuro. Mantém datas civis válidas encontradas em folhas de outro mês do mesmo ano; rejeita datas impossíveis, fontes inválidas e indisponíveis sem inventar dias.
- Explicação legível do saldo pessoal, atualização manual e nota explícita sobre dias gozados manualmente sem data, que não aparecem como datas mas continuam a ser descontados no saldo. CSS fluido, foco, contraste forçado e movimento reduzido. Testes unitários/domínio/UI e `docs/VACATION-EVIDENCE.md`.
- Sem mudança de fórmula, direito oficial, meta pessoal 28, registos persistidos, cofre, autenticação, sync, API, segredos, dependências ou telemetria. CI #1192 passou na versão pré-documentação; integração/publicação/validação física ainda pendentes nesta revisão.

## 2026-09-17 — PR #216: confirmação por cenário

- Checklist temporária e responsiva de férias a dois. Vistos da parceira e entidade empregadora são declarações locais, não aprovações externas; mudar cenário repõe os vistos. Corrigido teste após primeira falha de isolamento e obtida CI #1190 verde. PR integrado `faa8c064c13246654152c5eb66e7e7be65bdeaee`, Publicar #255 e Pages #840 concluídos com sucesso.

## 2026-09-17 — PR #215: julho do ano seguinte

- Planeamento autónomo com ano atual/seguinte, propostas de férias a dois com julho predefinido, novembro/dezembro excluídos por restrição indicada sujeita a confirmação; simulação sem transportar saldos anteriores sem confirmação, sem registar datas ou assumir disponibilidade/autorizações. PR integrado.

## 2026-09-16 — PR #214: resumo vivo local no planeador

- Ponto de situação com acumulado, disponível, após planeadas e previsão dezembro usando o mesmo `VacationBalance` e relógio existente. PR integrado; sem prometer sync remoto instantâneo.
