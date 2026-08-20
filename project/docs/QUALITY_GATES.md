# Gates de Qualidade

Nenhuma fase avança apenas porque “parece funcionar”.

## Gate obrigatório por fase

1. Requisitos da fase revistos.
2. Código sem erros TypeScript.
3. Lint sem erros.
4. Testes relevantes sem falhas.
5. Build de produção concluído.
6. Fluxo principal testado manualmente.
7. Refresh/reabertura testados quando houver persistência/timers.
8. `project/CHECKPOINT.md` atualizado.
9. Decisões relevantes registadas em `project/docs/DECISIONS.md`.

## Gate adicional para persistência

- Sem duplicados por ações repetidas.
- Dados críticos sobrevivem a refresh.
- Dados inválidos não quebram a aplicação silenciosamente.

## Gate adicional para timers

- Tempo calculado por timestamps.
- Alterar de separador/janela não destrói o cálculo.
- Suspensão da aplicação não causa perda significativa.

## Gate final V1

- Cumprir a checklist do `project/PROJECT_SPEC.md`.
- PWA instalável.
- Offline validado.
- Sem dados mockados nos fluxos reais.
