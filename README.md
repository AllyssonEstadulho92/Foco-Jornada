# Foco & Jornada

Reinício técnico do projeto a partir de uma árvore Git limpa.

## Estado atual

**Fase 0 — Fundação.** Ainda não existem regras funcionais de Jornada, Pausas, Foco, Café ou Atividades.

## Arquitetura

- `src/domain`: regras de negócio puras.
- `src/application`: casos de uso e coordenação.
- `src/infrastructure`: persistência e integrações.
- `src/presentation`: interface.
- `src/shared`: abstrações realmente transversais.

## Comandos

```bash
npm install
npm run typecheck
npm run build
npm run dev
```

## Próximo gate

Implementar exclusivamente o módulo Jornada. Pausas ficam bloqueadas até a Jornada ter testes e critérios de aceitação aprovados.
