# Auditoria de iconografia — Foco Jornada

## Objetivo

Uniformizar os ícones da aplicação sem introduzir dependências externas, problemas de licença, perda de funcionamento offline ou animações excessivas.

## Problemas encontrados

- mistura de SVGs próprios e glifos Unicode (✓, ◷, ›, ⌄, ☕, ⓘ, entre outros);
- ícones equivalentes desenhados de formas diferentes em páginas diferentes;
- pesos de traço e dimensões inconsistentes;
- alguns símbolos dependiam da fonte do dispositivo e mudavam visualmente entre iOS, Android e desktop;
- pseudo-elementos CSS eram usados como ícones;
- a área de notificações possuía animações próprias separadas do restante sistema;
- uma PWA instalada podia continuar a mostrar uma versão visual antiga até o cache de navegação ser renovado.

## Sistema implementado

A autoridade principal passa a ser:

- src/presentation/components/ui/AppIcon.tsx
- src/styles/icons.css

Características:

- grelha base de 24 × 24;
- traço padrão 1.8;
- currentColor, permitindo dark mode e estados sem duplicar assets;
- SVG local, sem chamadas externas;
- nomes semânticos (bell, calendar, medication, shield, focus, trash, etc.);
- animações reutilizáveis e discretas;
- prefers-reduced-motion respeitado.

## Regra de movimento

### Animados

Usar apenas quando o movimento transmite estado:

- sino: animação ring apenas quando o centro está aberto ou existem avisos não lidos;
- confirmação: animação draw quando um estado termina com sucesso;
- atividade/foco em curso: pulse discreto;
- detalhe decorativo de baixa prioridade: float.

### Fixos

Permanecem fixos:

- navegação;
- calendário;
- definições;
- perfil;
- editar;
- eliminar;
- importar/exportar;
- relatório;
- medicação;
- stock;
- chevrons e controlos estruturais.

Os controlos fixos podem ter microinteração no hover/focus, mas não animação contínua.

## Áreas revistas

- navegação desktop e móvel;
- top bar;
- painel rápido de notificações;
- Centro de Notificações;
- Início e acessos rápidos;
- Foco;
- Histórico;
- Definições;
- Mais;
- Stock pessoal;
- Medicação;
- sticks/glo;
- vencimento;
- relatório A4;
- mensagens de feedback;
- guias e drawers.

## Notificações

O painel rápido deixa de depender de cartões de instalação ou links redundantes. O estado vazio utiliza apenas uma confirmação vetorial animada e acessível.

O cache de navegação da PWA foi rodado para foco-jornada-navigation-v3, forçando a remoção da versão visual anterior.

## Flaticon, Lordicon, Icons8 e LottieFiles

As quatro bibliotecas foram avaliadas como referência visual, mas não foram incorporadas diretamente nesta fase.

Razões:

- Flaticon gratuito normalmente exige atribuição;
- Lordicon gratuito exige atribuição;
- Icons8 gratuito normalmente exige link/atribuição;
- LottieFiles tem assets com licenças próprias e cada animação deve ser validada individualmente;
- assets externos acrescentariam dependência de licença, supply chain e/ou runtime;
- a PWA deve continuar completamente funcional offline e compatível com a CSP atual.

Por isso, os ícones desta versão são vetores locais próprios, sem copiar assets proprietários dessas bibliotecas.

## Critérios de aceitação

- nenhuma funcionalidade deve depender de um ícone externo;
- nenhuma animação deve impedir interação;
- dark mode deve usar o mesmo SVG;
- reduced-motion deve desativar animações não essenciais;
- ícones decorativos permanecem aria-hidden;
- botões continuam com aria-label quando o ícone é a única representação visual;
- build, typecheck, lint, testes e smoke test têm de passar antes do merge.