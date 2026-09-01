# Automação de notificações — Android, iOS e Web

## Objetivo

Dar ao Foco Jornada uma camada única de avisos automáticos para os eventos temporais que já existem na aplicação, sem alterar cálculos nem criar horários por estimativa.

## Eventos automatizados

- entrada planeada da jornada;
- início de pausa planeada;
- regresso planeado;
- saída planeada;
- fim de uma pausa temporizada realmente iniciada;
- fim de Pomodoro/foco;
- horário registado de medicação, incluindo adiamentos já registados;
- fim da sessão técnica glo.

Todos os deadlines continuam baseados em timestamps absolutos e horários já configurados.

## Entrega

### Centro da aplicação

Sempre que um deadline é devido, o aviso é guardado no centro de notificações do Foco Jornada.

### Notificação do sistema

Quando a Notifications API está autorizada e o browser/PWA pode executar, o aviso também é apresentado pelo sistema operativo.

As notificações incluem uma rota para a área relevante da aplicação. O service worker trata o clique e abre/foca o Foco Jornada.

### Web Push em segundo plano

O service worker fica preparado para receber eventos Web Push padrão.

A entrega garantida com a aplicação totalmente fechada exige ainda:

1. subscrição PushManager no dispositivo;
2. chave pública VAPID na aplicação;
3. serviço privado de envio que guarde a subscrição e envie o push no momento do deadline;
4. armazenamento e autenticação adequados para não expor endpoints de push.

Sem esse serviço, a automação atual é local e depende da execução permitida pelo browser/PWA.

## iOS / iPadOS

Web Push em iPhone/iPad requer uma web app adicionada ao Ecrã Principal em versões compatíveis. A permissão deve ser solicitada a partir de uma ação explícita do utilizador.

O manifesto inclui um `id` estável para a identidade da PWA.

## Android

Browsers/PWAs compatíveis com Push API e Service Worker podem usar a mesma arquitetura Web Push. Enquanto não existir subscrição/servidor, mantém-se a automação local.

## Regra de segurança

A notificação de medicação limita-se à hora e quantidade já registadas. Não cria intervalos, não altera prescrição e não infere instruções clínicas.
