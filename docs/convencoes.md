# Convenções

Regras que mantêm o código consistente. Se algo aqui parecer estranho, provavelmente há um motivo; abra uma issue para discutir antes de mudar.

## Organização: package by feature

- Cada funcionalidade tem sua pasta em `src/features/<feature>/`, com página, componentes, tipos e lógica juntos.
- Dentro da feature, só a página (`EconomiasPage.tsx`) ou a seção que outra tela usa (`SecaoTags.tsx`, `PortaoAutenticacao.tsx`) fica na raiz. O resto vai para a subpasta do que o arquivo é (crie só as que a feature usa):

  | Pasta | O que guarda | Exemplo |
  |---|---|---|
  | `components/` | Componentes React | `CardMeta.tsx` |
  | `hooks/` | Hooks (`use…`) | `useAvaliacaoMeta.ts` |
  | `context/` | Context e provider | `AssistenteProvider.tsx` |
  | `model/` | Tipos do domínio e as regras pequenas deles | `meta.ts`, `caixa.ts` |
  | `utils/` | Lógica pura, sem React (cálculos, filtros, validação da busca) | `aportes.ts`, `busca.ts` |
  | `constants/` | Cores, textos e catálogos | `cores.ts`, `textos.ts` |
  | `api/` | Conversa com o lado de fora (comandos e plugins do Tauri) | `motor.ts`, `atualizador.ts` |
  | `doc/` | Texto que não é código | `manual.md` |
- O que é genérico fica em `src/shared/`: `ui/` (shadcn), `components/`, `lib/` (datas, dinheiro, estilos, utilitários) e `hooks/`.
- **Não** crie pastas por tipo técnico na raiz de `src` (`src/components/`, `src/pages/`, `src/lib/`).
- Constantes de estilo de uma feature ficam em `constants/` (ex.: `cores.ts`), não dentro de um componente, por causa do Fast Refresh do Vite.
- Os imports usam o alias `@/` para `src/`.

## Comentários

- Documente com JSDoc simples (`/** … */`) na declaração: o que ela faz e, se não for óbvio, o porquê. Uma ou duas linhas bastam.
- Sem comentários soltos (`//` no meio do código, `{/* */}` no JSX). Se a explicação importa, ela vai para o JSDoc da função, do componente ou da constante; se não importa, sai.

## Nomes em português

Variáveis, funções, componentes, tipos e arquivos de domínio ficam em português: `Lancamento`, `valorCentavos`, `projetarAnos`, `TabelaMes.tsx`. Termos técnicos consagrados continuam em inglês (`dispatch`, `props`, `hooks`), assim como os componentes do shadcn (`button.tsx`, `dialog.tsx`).

Componentes pequenos: se um arquivo cresce demais ou mistura assuntos, separe.

## Rotas

- TanStack Router, com as rotas declaradas no código em `src/app/router.tsx`. As páginas vêm das features.
- Tudo o que o usuário escolhe numa tela e que deve sobreviver a uma troca de aba (filtros, período, mês, aba aberta) fica **na URL**, validado com `validateSearch`.
- O ano exibido fica em `?ano=` na rota raiz e é mantido entre as telas (`retainSearchParams`). Leia com `useAno()` e troque com o componente `SeletorAno`. Sem o parâmetro, vale o ano atual.
- Nas páginas, use `useSearch({ from })` e `useNavigate({ from })`.

## Estado e dados

- O estado é `useReducer` + Context em `src/store/`, e funciona como cache em memória do que está salvo. Os componentes mudam dados só com `dispatch`.
  - `context/`: `FinancasProvider` e `useFinancas`;
  - `reducer/`: `financasReducer`, `EstadoFinancas` e `AcaoFinancas`;
  - `model/`: `DadosFinancas` (o que fica salvo), `VERSAO_DADOS` e a conversão de versões antigas;
  - `repositorio/`: o `Armazenamento` (padrão repository) e as duas implementações, Supabase e arquivo local;
  - `doc/versoes-dos-dados.md`: o que mudou em cada versão dos dados.
- **Ação nova que altera dados** precisa de:
  1. um caso no `financasReducer` (`src/store/reducer/financas-reducer.ts`);
  2. um caso em `persistir` (`src/store/repositorio/armazenamento-supabase.ts`);
  3. se ela **não** deve ser salva, entrar na lista de ignoradas em `armazenamento-local.ts`.
- **Mudou o formato de `DadosFinancas`?** Aumente `VERSAO_DADOS` (`src/store/model/dados.ts`), anote em `src/store/doc/versoes-dos-dados.md` e converta o arquivo antigo e os backups antigos ao carregar (`atualizarDados`). Quem atualiza o app desktop não pode perder dados.
- **Tabela nova no Supabase:** crie uma migração nova em `supabase/migrations/` (nunca edite uma que já foi publicada), com `user_id` e RLS `(select auth.uid()) = user_id`.
- Colunas do banco em snake_case; a tradução para camelCase fica só em `armazenamento-supabase.ts`.
- Não há dados de exemplo nem `localStorage` para dados na versão web.

## Dinheiro e datas

- **Dinheiro é sempre inteiro em centavos** (`valorCentavos`, `saldoCentavos`). Nunca guarde nem some reais com casas decimais. Formate só na exibição, com `formatarBRL`.
- **Datas são `DataISO`** (texto `yyyy-MM-dd`) no estado. Exiba com `formatarData` (`dd/MM/yyyy`), e nomes de mês e dia com `nomeDoMes` e `nomeDoDiaDaSemana`.

## Lógica separada da interface

- O cálculo da projeção são funções puras em `src/features/projecao/utils/projecao.ts`. Regras de negócio de uma feature também ficam em `utils/`, sem React (ex.: `aportes.ts`, `grupos.ts`, `filtros.ts`).
- Componentes só montam a tela a partir do resultado dessas funções.

## Regras de domínio

- **Metas de economia** não são lançamentos nem têm categoria. Os aportes não são salvos: `aportesDaMeta` os calcula a partir do valor alvo, do aporte mensal e dos `ajustes`, e para ao atingir o alvo. A projeção os desconta do saldo na coluna Economia.
- **Sobra** de um período = entradas − saídas − economia.
- **Tags** só existem em saídas, no máximo uma por lançamento. Tag com `evitavel` soma no indicador de gastos evitáveis. Excluir a tag deixa os lançamentos sem tag.
- **Pastas** organizam a lista de lançamentos, sem afetar a projeção; o dashboard soma as saídas de cada pasta e detalha uma delas por categoria. No máximo uma por lançamento. Excluir a pasta deixa os lançamentos sem pasta.
- Categorias, tags e pastas são cadastradas na tela Organização.

## Interface

Toda mudança visual segue o [design system](design-system.md): cores com significado (azul = entrada, vermelho = saída, amarelo = economia, preto = estrutura), só tokens de cor, cantos retos com contorno preto e sombra dura, títulos em Outfit caixa alta, margem de 16px e tabelas alinhadas. Use o checklist do fim daquele documento antes de entregar uma tela.

Ao limpar a interface, **nunca remova informação** que já aparece na tela: reorganize, abrevie ou suavize.

## Testes

O projeto **não tem testes unitários**, por decisão de projeto. Não adicione Vitest ou outro framework de testes sem discutir antes numa issue. A verificação é feita por `npm run lint`, `npm run build` (checagem de tipos) e testando a tela em 375px, ~1100px e 1440px.

## Lint e formatação

- `npm run lint` roda o oxlint com as regras de `.oxlintrc.json` (hooks do React, Fast Refresh, TypeScript).
- Estilo do código existente: aspas simples, sem ponto e vírgula, indentação de 2 espaços, linhas de até ~120 colunas. Siga o que está em volta.
- Comentários em português, explicando o **porquê**, não o que o código já diz.
