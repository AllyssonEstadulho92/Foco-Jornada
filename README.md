# Foco & Jornada 4.2.0

PWA de produtividade pessoal/profissional, local-first e sem dependências de runtime.

## Módulos
- Jornada: entrada, saída, edição, cancelamento, reabertura e cálculo por timestamps.
- Horário semanal: segunda a sábado 08:00–17:00; domingo 09:00–18:00.
- Pausa principal sugerida após 4 horas: 12:00–13:00 de segunda a sábado e 13:00–14:00 ao domingo, com lembrete automático e início manual.
- Atividades: criar, editar, prioridade, categoria, estimativa, iniciar, pausar, concluir e cancelar.
- Foco/Pomodoro: ciclos, pausa/retoma e associação a atividade.
- Café: preço configurável em cêntimos, registo e desfazer.
- Moovit: Casa/Trabalho, localização atual, viagens recentes e integração oficial por deep link.
- Supershift: atalho de abertura e integração segura por calendário externo/ICS; não é usado qualquer URL scheme iOS privado ou inventado.
- Previsão de saída com base no objetivo de trabalho efetivo e pausa principal.
- Resumo/fecho do dia.
- Centro de notificações com atualizações PWA controladas.
- Histórico, estatísticas, backup/importação e diagnóstico.
- PWA/offline, atalhos e modo claro/escuro.

## Hub “Mais”
O botão **Mais** abre um menu oculto em formato de bottom sheet no mobile e gaveta lateral no desktop. O hub mantém a barra inferior com cinco destinos e concentra:
- Moovit e Supershift como aplicações principais;
- Horário e pausas;
- Estatísticas;
- Definições;
- Backup e diagnóstico;
- Notificações;
- Atualizações;
- Sobre.

O módulo **Vida pessoal / Tempo a dois foi retirado do runtime**. Qualquer gestão pessoal adicional fica manual e só deve voltar como módulo se for explicitamente necessária.

### Abertura das aplicações
- Moovit: usa o deep link oficial `moovit://nearby` e fallback oficial de instalação.
- Supershift no Android: tenta abrir o package oficial `app.supershift`, com fallback para Google Play.
- Supershift no iPhone/iPad: como não existe URL scheme/deep link público documentado pelo Supershift, usa-se a ligação oficial do serviço. Se o iOS tiver uma associação Universal Link ativa, pode abrir a app; caso contrário abre o site oficial. Não é utilizado `supershift://` inventado.

O hub foi desenhado como ponto de extensão para novos módulos, sem aumentar a barra inferior e sem polling visual contínuo.

## Qualidade
`npm run check`