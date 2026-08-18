# Foco & Jornada

Aplicação web/PWA de produtividade pessoal e profissional. O produto foi mantido como **site estático sem dependências de runtime**, para reduzir falhas de instalação e facilitar o uso em iPhone, Android e computador.

## Versão

**3.0.0**

## Funcionalidades atuais

- Jornada com entrada, saída e duração baseada em timestamps
- Pausa de ecrã e descanso configuráveis
- Foco/Pomodoro com pausa, retoma e conclusão
- Atividades com segmentos de tempo
- Registo rápido de café e gasto em cêntimos
- Dashboard diário e tempo efetivo
- Timeline e histórico
- Tema claro, escuro e automático
- Diagnóstico de integridade
- Exportação e importação de backup JSON
- Persistência local no browser
- PWA e funcionamento offline após a primeira visita
- Interface responsiva

## Estrutura da `main`

- `index.html` — distribuição autónoma: interface, design e lógica da aplicação
- `manifest.webmanifest` — definição PWA
- `sw.js` — cache offline
- `icon.svg` — identidade visual
- `.nojekyll` — publicação estática direta
- `tests/app.test.cjs` — testes do script efetivamente usado em produção
- `.github/workflows/quality.yml` — controlo automático de qualidade
- `package.json` — apenas comandos de QA; não é necessário para usar a aplicação

## Testes

```bash
npm test
npm run check
```

Os testes cobrem jornada, duplicação de entrada, duração, pausa/tempo efetivo, atividade, foco pausado, café e bloqueio do fim da jornada com foco ativo.

## Publicação

A aplicação está pronta para servir diretamente da raiz da branch `main`.

No GitHub Pages, a fonte deve ser:

`main` → `/(root)`

URL esperada:

`https://allyssonestadulho92.github.io/Foco-Jornada/`

> O repositório pode conter todo o código correto e continuar a devolver 404 enquanto o GitHub Pages estiver administrativamente desativado (`has_pages=false`). Essa ativação é feita nas definições do repositório, não no código.

## Privacidade

Nesta versão, os dados ficam no `localStorage` do browser. Não existe servidor de dados nem sincronização cloud. Exporta um backup antes de limpar o navegador ou trocar de dispositivo.
