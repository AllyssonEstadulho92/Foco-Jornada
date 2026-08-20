# Prompt de revisão após cada fase

```text
Faça uma revisão técnica da fase acabada de implementar, sem adicionar novas funcionalidades.

Compare o código com:
- project/PROJECT_SPEC.md
- project/ROADMAP.md
- project/docs/ARCHITECTURE.md
- project/docs/QUALITY_GATES.md

Procure especificamente:
- requisitos em falta;
- regras de domínio na camada de apresentação;
- dependências indevidas;
- problemas de persistência;
- timers baseados em contadores acumulativos;
- duplicação de dados;
- condições de corrida e duplo clique;
- erros TypeScript;
- testes insuficientes;
- regressões responsivas.

Execute lint, testes e build.

Corrija apenas problemas pertencentes à fase atual ou regressões introduzidas por ela.
Não avance para a fase seguinte.

No final devolva:
1. problemas encontrados;
2. correções realizadas;
3. riscos pendentes;
4. resultado de lint/testes/build;
5. recomendação: APROVADA PARA AVANÇAR ou NÃO APROVADA.
```
