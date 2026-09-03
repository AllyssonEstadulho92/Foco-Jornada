# Identidade da aplicação — Foco Jornada 1.3

## Princípio

O Foco Jornada deve comportar-se visualmente como uma aplicação instalada: navegação previsível, cinco destinos principais, tipografia legível, ícones consistentes, superfícies discretas e movimento apenas quando comunica estado.

## Navegação principal

A arquitetura principal é idêntica em mobile e desktop:

1. Início
2. Jornada
3. Foco
4. Notificações
5. Mais

No desktop, Medicação, glo, Relatórios e Definições permanecem visíveis como navegação secundária. No mobile, Medicação e glo permanecem acessíveis no drawer e dentro de Mais.

## Mais

A página Mais organiza todas as funções complementares sem remover módulos:

### Dia e trabalho
- Jornada
- Atividades
- Histórico
- Mapa de turnos

### Saúde e uso pessoal
- Medicação
- glo
- Stock pessoal

### Análise e finanças
- Relatórios
- Estatísticas
- Horas e ausências
- Vencimento
- Relatório A4

### Dados e sistema
- Definições e segurança
- Ajuda e guia
- Exportação
- Backup cifrado
- Estado e proteção dos dados

## Tipografia

Stack local-first:

`Inter → SF Pro Text / SF Pro Display → -apple-system → Segoe UI → system-ui`

Não é carregada uma fonte remota: isto mantém a CSP, o funcionamento offline e a privacidade. Em dispositivos Apple, o fallback do sistema utiliza a tipografia nativa da plataforma.

Escala base:

- mobile H1: até 28 px;
- mobile H2: 18–20 px;
- corpo: 14–16 px;
- texto secundário: 12–14 px;
- desktop H1: 32–40 px;
- desktop H2: 22–24 px;
- corpo desktop: 16–17 px.

## Ícones

- grelha 24 × 24;
- SVG local;
- `currentColor`;
- 24 px em navegação;
- 18–20 px em ações secundárias;
- movimento apenas quando representa estado;
- `prefers-reduced-motion` respeitado.

## Acesso seguro

O ecrã de PIN utiliza:

- marca circular;
- teclado numérico circular;
- letras auxiliares no estilo de keypad móvel;
- alvos táteis confortáveis;
- backspace vetorial;
- cofre local encriptado inalterado.

A alteração é visual. A autenticação continua ligada ao cofre criptográfico, não ao ecrã.

## Segurança visual e técnica

A área Mais mostra o estado de:

- HTTPS;
- Web Crypto API;
- leitura do cofre desbloqueado;
- service worker / PWA;
- persistência e capacidade local;
- cópia de segurança cifrada.

A interface nunca apresenta GitHub Pages como um sistema de contas sincronizadas. Os dados continuam locais por perfil até existir um backend especificamente desenhado para sincronização segura.
