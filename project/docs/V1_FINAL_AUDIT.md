# Auditoria final da V1 — Foco & Jornada

**Data:** 22 de agosto de 2026  
**Branch:** `fix/v1-final-audit`  
**Pull request:** #39  
**Objetivo:** fechar a V1 sem reconstrução, corrigindo apenas bloqueadores e registando riscos residuais.

## 1. Âmbito

A auditoria incidiu sobre:

- estado da `main` e histórico recente de alterações;
- jornada, pausas, atividades, foco, histórico e persistência;
- calculadora de horas/ausências e respetivos testes;
- vencimento/planificação e respetivos testes;
- responsividade e viewport mobile;
- PWA e publicação no GitHub Pages;
- typecheck, lint, testes e build.

A regra aplicada foi preservar lógica e dados existentes e alterar apenas o necessário para remover riscos concretos de release.

## 2. Correções realizadas

### PWA

A PWA estava documentada como funcional, mas o runtime atual desregistava service workers e apagava caches no arranque. A auditoria restaurou `vite-plugin-pwa` com base relativa (`./`) e removeu essa limpeza automática.

O build validado gera:

- `manifest.webmanifest`;
- `registerSW.js`;
- `sw.js`;
- ficheiro Workbox;
- precache dos recursos de produção.

A configuração usa `start_url` e `scope` relativos para permanecer compatível com a publicação do projeto no GitHub Pages.

### Acessibilidade e mobile

Foi removida a proibição global de zoom (`user-scalable=no` / `maximum-scale=1`). Mantêm-se `initial-scale=1` e `viewport-fit=cover`, bem como os estilos de safe area e os inputs mobile a 16 px já existentes.

### Lint

Foram documentadas duas exceções intencionais à regra de Fast Refresh:

- provider de serviços, que exporta o provider e o hook do mesmo contexto;
- bridge de `react-hot-toast`, que expõe a API compatível e um `Toaster` nulo para encaminhar notificações para o centro interno.

## 3. Validação automática

Primeira execução da PR #39 após as correções funcionais:

- Typecheck: PASS;
- Lint: PASS com 1 warning não bloqueante em `TodayPage.tsx`;
- Testes: 54/54 PASS em 21 ficheiros;
- Build: PASS;
- PWA: PASS — 7 entradas em precache e geração de service worker/manifest.

O único warning de lint remanescente é `react-hooks/exhaustive-deps` no `useMemo` do rótulo da data do ecrã Hoje. O rótulo é dependente da mudança de dia e o warning não afeta o funcionamento atual; deve ser removido numa intervenção futura nesse ficheiro sem alargar o âmbito da auditoria.

## 4. Calculadora de horas e ausências

A lógica existente foi mantida porque os testes confirmam os cenários críticos já implementados:

- dia normal 08:00–17:00 com pausa 11:00–11:15;
- saída antecipada por doença às 14:00;
- saída por doença antes da pausa prevista;
- consulta/ausência parcial com regresso;
- ausência e hora extra no mesmo dia;
- classificação manual de ausência remunerada para estimativa;
- hora extra sem ausência.

A calculadora trabalha ao minuto e separa presença, tempo trabalhado, tempo não trabalhado, ocorrência, hora extra e saldo.

Risco residual: o formulário não impõe ainda um limite máximo de duração plausível para distinguir automaticamente um turno noturno legítimo de uma hora de saída inserida por engano. Isto não bloqueia a V1, mas deve ser tratado como validação UX futura.

## 5. Vencimento

O módulo mantém o posicionamento de simulador/estimativa parametrizável. Os testes automáticos existentes permanecem verdes. Os campos de override manual continuam essenciais porque regras de IRS, Segurança Social, CCT, regiões autónomas e situações especiais podem exigir tratamento diferente do perfil genérico implementado.

A aplicação não deve apresentar o resultado como cálculo oficial universal.

## 6. Responsividade

O código inclui:

- proteção contra overflow horizontal;
- safe areas para iPhone;
- campos mobile com tamanho que evita zoom automático do Safari;
- navegação inferior com espaço reservado no conteúdo;
- limites de largura para desktop e monitores largos;
- breakpoints para tablet, desktop e ultrawide.

Limitação da auditoria automática: o CI usa Ubuntu/jsdom e não substitui uma validação real em Safari/iPhone, Chrome/Android e diferentes densidades de ecrã. Essa verificação visual permanece uma smoke test manual de release.

## 7. Performance

O build de produção continua a emitir o aviso do Vite para o bundle JavaScript principal, com cerca de 541 kB minificados. Não é erro de build nem bloqueador funcional.

Recomendação para V2/manutenção: aplicar lazy loading/code splitting às páginas secundárias, sobretudo Vencimento, Guia, Estatísticas e Calculadora de horas.

## 8. Decisão

A V1 pode ser integrada em `main` quando o CI da versão final desta PR estiver verde.

Após a integração, a aplicação deve ser considerada **V1 funcional auditada**, com três pontos residuais não bloqueantes:

1. smoke test manual multi-browser/dispositivo;
2. remoção do warning de `useMemo` do ecrã Hoje;
3. otimização do tamanho do bundle.

Autenticação, sincronização cloud, backups online, CSV/PDF e publicação nativa permanecem fora da V1 e pertencem ao backlog V2.
