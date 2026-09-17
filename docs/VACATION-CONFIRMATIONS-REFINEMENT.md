# Refinamento do planeamento de férias — confirmações por cenário

Data: 2026-09-17. Base: `main` após o PR #215.

## Problema observado no código

`VacationJointPlanner` mantém estado local para assinalar confirmação da parceira e da entidade empregadora. A versão anterior repunha os vistos ao alterar mês, dias ou opção manualmente; porém, a lista de férias cifrada é relida periodicamente e os cenários podem mudar sem um clique. Os vistos da opção antiga podiam continuar visíveis após uma alteração nos registos ou configurações. Não se comprovou ocorrência em dispositivo real.

## Decisão e implementação

- Extrair `VacationConfirmationChecklist` da página principal para uma componente independente, com estado React efémero e sem escrita nem contacto externo.
- Montá-la apenas se houver um período selecionável; identificá-la por uma `key` com ano, mês, dias pretendidos, datas de início/fim, configuração e registos. Quando a identidade do cenário muda, React desmonta o estado antigo e as duas caixas regressam a desmarcadas. Não transportar confirmações entre opções, anos ou mudanças do cofre.
- Exibir explicitamente a que intervalo pertencem os vistos, a contagem `0/2` a `2/2`, o caráter não verificado da confirmação e a inexistência de pedido à empresa.
- Estilos isolados `vacation-confirmations.css`: espaçamento fluido, cartões tocáveis >=54 px, quebra segura, contraste forçado e modo de movimento reduzido. Manter a linguagem de design e a hierarquia existentes; nenhuma imagem remota ou biblioteca adicional.

## Invariantes e limites

Não alterar `VacationBalance`, `VacationPlanner`, `VacationJointPlanning`, meta pessoal de 28 dias, 10 úteis de 24/08–06/09/2026, regra padrão seg.–sex., autenticação, cofre, Worker, endpoints, dependências, segredos, permissões nem sincronização. Os vistos são declarações do utilizador no ecrã, não comprovativos de disponibilidade da parceira ou autorização laboral. Não são persistidos nem transmitidos. Feriados, escalas especiais e CCT continuam fora das sugestões automáticas.

## Testes e publicação

Teste interativo de ambas as caixas, estado inicial, texto de aviso, conclusão e reposição após troca da `key`; teste estrutural da ligação ao cenário e responsividade. Executar auditoria de dependências, tipos, lint, Vitest, build, dry-run do Worker e smoke Chromium na CI do PR antes de integrar. Validar posteriormente em iPhone, Android, tablet e desktop: mudança de filtros, período, ano, atualizações de registos, ampliação de texto e navegação por teclado/leitor de ecrã. A CI não substitui esse teste físico.
