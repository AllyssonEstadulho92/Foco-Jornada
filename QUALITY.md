# Relatório de qualidade

## Verificações executadas em 18-08-2026

- Sintaxe do Service Worker: PASS
- Compilação do script JavaScript embutido no `index.html`: PASS
- `manifest.webmanifest`: JSON válido
- IDs HTML duplicados: nenhum encontrado
- Chave de persistência `foco-jornada-v3`: presente
- Registo de Service Worker: presente
- Testes automatizados: **8 PASS / 0 FAIL**

## Cenários cobertos

1. iniciar jornada;
2. impedir segunda jornada ativa;
3. duração de jornada de 8 horas;
4. pausa de 15 minutos descontada do tempo efetivo;
5. pausa automática da atividade e sugestão de retoma;
6. congelamento do tempo restante durante foco pausado;
7. cálculo de café em cêntimos;
8. bloqueio do fim da jornada quando existe foco ativo.

## Limitação externa

A execução do browser local automatizado foi bloqueada pela política do ambiente de execução, que bloqueia navegação para `127.0.0.1`. Isto não é um erro da aplicação. O teste final de interface deve ser feito no site publicado ou num browser local fora deste ambiente.

## Estado de publicação

O repositório está tecnicamente pronto para alojamento estático. Enquanto a API do GitHub indicar `has_pages=false`, o URL `github.io` continuará a devolver 404 independentemente da validade do código.
