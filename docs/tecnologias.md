# Tecnologias e arquitetura

## A stack

| Camada | Tecnologia | Por quê |
|---|---|---|
| Base | [React 19](https://react.dev) + [TypeScript](https://www.typescriptlang.org) + [Vite](https://vite.dev) | Front rápido de desenvolver e tipado de ponta a ponta |
| Estilo | [Tailwind CSS 4](https://tailwindcss.com) | Tokens de cor e espaçamento num lugar só (`src/index.css`) |
| Componentes | [shadcn/ui](https://ui.shadcn.com) (Radix), estilo `radix-nova` | Componentes acessíveis que ficam no repositório e seguem o [design system](design-system.md) |
| Gráficos | [Recharts](https://recharts.org), pelo componente Chart do shadcn | Gráficos declarativos, carregados só ao abrir o Dashboard |
| Rotas | [TanStack Router](https://tanstack.com/router) | Rotas tipadas e parâmetros de busca validados (filtros e ano ficam na URL) |
| Datas | [date-fns](https://date-fns.org) com locale pt-BR | Funções puras e nomes de meses e dias em português |
| Ícones | [lucide-react](https://lucide.dev) | Traço uniforme, combina com as formas geométricas |
| Fontes | Outfit e Inter, pelo [Fontsource](https://fontsource.org) | Instaladas pelo npm, funcionam offline no desktop |
| Web | [Supabase](https://supabase.com) (Postgres + Auth) | Login por e-mail e senha, e isolamento por usuário com RLS |
| Desktop | [Tauri 2](https://tauri.app) + `plugin-store`, `plugin-dialog`, `plugin-fs` | Instalador pequeno, dados num arquivo local, sem servidor |
| Qualidade | [oxlint](https://oxc.rs) e `tsc` | Lint rápido e checagem de tipos no build |
| CI/CD | GitHub Actions | Build de teste em cada branch `feature/**` e release por tag |

## Estrutura de pastas

```
src/
├── app/                  # Casca do app
│   ├── router.tsx        # Todas as rotas, declaradas no código
│   ├── raiz/             # RaizWeb (Supabase) e RaizDesktop (arquivo local)
│   ├── layout/           # Cabeçalho, menu e <Outlet />
│   ├── navegacao/        # Memória do que cada aba mostrava ao sair dela
│   └── atalhos/          # Atalhos de teclado globais
├── features/             # Uma pasta por funcionalidade (package by feature)
│   ├── planilha/         # Tabela dia a dia, detalhe do dia, conferir saldo
│   ├── lancamentos/      # Lista, filtros e formulário de lançamentos
│   ├── organizacao/      # Tela com as abas de categorias, tags e pastas
│   ├── categorias/  tags/  pastas/
│   ├── economias/        # Metas de economia, aportes e sobras
│   ├── dashboard/        # Indicadores, gráficos e seletor de período
│   ├── projecao/         # O cálculo do saldo (funções puras) e o ano exibido
│   ├── autenticacao/     # Login e sessão (só web)
│   └── backup/           # Exportar e importar JSON (só desktop)
├── shared/               # O que não pertence a nenhuma feature
│   ├── ui/               # Componentes shadcn
│   ├── components/       # Componentes do app (CabecalhoPagina, Forma, Marca…)
│   ├── lib/              # Datas, dinheiro, estilos, utilitários
│   └── hooks/
├── store/                # Estado global e armazenamento
├── index.css             # Tokens do design system
└── main.tsx              # Escolhe a raiz web ou desktop

supabase/migrations/      # Esquema do banco e regras de RLS
src-tauri/                # Projeto Rust do app desktop
.github/workflows/        # Build de teste e release
```

## Um front, duas plataformas

`EH_DESKTOP` (`src/shared/lib/plataforma.ts`) é verdadeiro quando o Vite roda pelo CLI do Tauri (`npm run desktop`). O `main.tsx` usa essa constante para carregar só a raiz de cada plataforma, com `import()` dinâmico: a web não inclui o Tauri e o desktop não inclui o Supabase.

```
                 ┌─────────────── main.tsx ───────────────┐
                 │                                        │
            RaizWeb                                  RaizDesktop
   PortaoAutenticacao (login)                      (sem login)
   criarArmazenamentoSupabase               criarArmazenamentoLocal
                 │                                        │
                 └──────► FinancasProvider ◄──────────────┘
                                 │
                          RouterProvider → telas
```

As telas não sabem onde os dados ficam: elas só conversam com o `FinancasProvider`.

## Estado e armazenamento

- O estado vive num `useReducer` com Context (`src/store/`). Ele é um **cache em memória** do que está salvo.
- Os componentes chamam `dispatch` com uma ação (`lancamento/salvar`, `meta/excluir`…). O `FinancasProvider` aplica a ação na tela na hora e coloca a gravação numa **fila**, que roda na ordem em que as ações aconteceram.
- Se uma gravação falhar, o provider recarrega os dados salvos e mostra um aviso, para a tela nunca mostrar algo que não foi salvo.
- O `Armazenamento` (`src/store/armazenamento.ts`) é a interface entre o estado e o lugar onde os dados ficam:
  - **Supabase** (`armazenamento-supabase.ts`): cada ação vira um `insert`, `update` ou `delete`. As colunas do banco são snake_case; a tradução para o estado em camelCase fica só nesse arquivo.
  - **Arquivo local** (`armazenamento-local.ts`): grava o estado inteiro num JSON (`financas.json`) com o `plugin-store` do Tauri. O formato tem versão (`VERSAO_DADOS`), e dados e backups antigos são convertidos ao carregar.

### Segurança na web

Toda tabela tem `user_id` e uma regra de RLS `(select auth.uid()) = user_id`. O front usa só a chave pública; é o banco que garante que ninguém lê ou altera os dados de outra pessoa.

## Como a projeção funciona

O coração do app são funções puras em `src/features/projecao/projecao.ts`, sem React:

1. **`projetarAnos`** percorre os anos desde a data do saldo inicial. O saldo do fim de um ano é a abertura do seguinte.
2. Para cada dia, **`ocorreEm`** decide quais lançamentos acontecem (única, semanal, mensal, diária ou só em dias úteis, dentro de início e fim). Dia 31 em mês de 30 dias cai no último dia do mês.
3. O dia soma **entradas**, **saídas fixas**, **saídas variáveis** e os **aportes das metas** (calculados por `aportesDaMeta`, que para ao atingir o alvo e respeita os ajustes de cada mês), e acumula o **saldo**.
4. Funções de agregação (`agregarPorMes`, `resumirAno`, `gastosPorCategoria`, `gastosPorTag`…) alimentam a planilha, o dashboard e as economias.

O hook `useProjecoes` memoriza o resultado para que o cabeçalho e a página aberta reaproveitem o mesmo cálculo.

### Dinheiro e datas

- Todo valor é um **inteiro em centavos** (`valorCentavos`). Não há ponto flutuante nas contas; a formatação em reais acontece só na tela, com `formatarBRL`.
- Datas são texto `yyyy-MM-dd` (`DataISO`) no estado e no banco, sem fuso horário, e aparecem como `dd/MM/yyyy`.

## Rotas

Declaradas em `src/app/router.tsx`:

| Rota | Tela | Busca (`?`) |
|---|---|---|
| `/` | Planilha | `mes` (primeiro mês visível) |
| `/lancamentos` | Lançamentos | `q`, `tipo`, `natureza`, `categoria`, `tag`, `fechadas` |
| `/organizacao` | Organização | `aba` (`tags` ou `pastas`; sem ela, categorias) |
| `/economias` | Economias | — |
| `/dashboard` | Dashboard | `de`, `ate` (período) |

O ano exibido fica em `?ano=` na rota raiz e acompanha a navegação entre telas. `/categorias` redireciona para `/organizacao`.

## Pipelines

- **[`build-teste.yml`](../.github/workflows/build-teste.yml)**: a cada push numa branch `feature/**`, roda lint, checagem de tipos e gera os instaladores do Windows como artefato (14 dias), sem publicar nada.
- **[`release.yml`](../.github/workflows/release.yml)**: uma tag `vX.Y.Z` gera os instaladores e os publica numa Release. macOS e Linux já estão na matriz, comentados.
