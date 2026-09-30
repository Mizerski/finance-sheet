# Design system — Projeção Financeira

Guia visual do app. Toda tela nova (Lançamentos, Categorias, Dashboard…) deve seguir estas regras para parecer parte do mesmo produto que a Planilha.

## Princípios

1. **Terroso e calmo.** Tons de linho, areia, terracota, oliva e musgo. Nada de cores saturadas nem preto ou branco puros.
2. **Arredondado e macio**, no estilo do [Mobbin](https://mobbin.com): cards grandes com raio amplo, controles em formato de pílula, bordas finas em vez de sombras pesadas.
3. **Tipografia editorial e calma.** Duas famílias: uma serifada (Newsreader) nos títulos e números de destaque e uma sem serifa (Inter) no resto. Pesos leves, hierarquia por tamanho, cor e família, não por negrito.
4. **Arejado, mas enxuto.** Linhas de tabela confortáveis e margens curtas (16px). O conteúdo usa a largura da tela.
5. **Limpar sem cortar.** Ao reduzir a poluição visual, reorganize, abrevie ou suavize, mas **nunca remova informação** que já aparece na tela.
6. **Sempre tokens.** Cores vêm dos tokens de `src/index.css` via classes do Tailwind. Nunca use a paleta padrão do Tailwind (`emerald-*`, `red-*`, `slate-*`…) nem hex solto no JSX. A única exceção é a cor de uma categoria, que é dado do usuário.

## Cores

Os tokens ficam em `:root` em `src/index.css` e são expostos ao Tailwind em `@theme inline` (`--color-<nome>`). Para criar um token novo, adicione nos **dois** lugares.

### Base

| Token | Classe | Uso |
|---|---|---|
| `--background` linho `oklch(0.965 0.008 80)` | `bg-background` | Fundo da página |
| `--card` quase branco quente | `bg-card` | Cards, popovers, item ativo da navegação |
| `--foreground` marrom escuro `oklch(0.28 0.015 60)` | `text-foreground` | Texto principal |
| `--muted` areia | `bg-muted` | Trilhos de navegação, áreas neutras, células fora do cálculo |
| `--muted-foreground` | `text-muted-foreground` | Texto secundário, rótulos, ano ao lado do título |
| `--border` | `border-border`, `ring-border` | Bordas e contornos de cards |
| `--primary` terracota `oklch(0.58 0.115 45)` | `bg-primary`, `text-primary` | Destaque: marca, dia de hoje, ação principal |
| `--ring` terracota translúcida | `ring-ring` | Foco visível |
| `--destructive` | `text-destructive` | Ações destrutivas (excluir) |

### Semânticas financeiras

| Significado | Texto | Fundo suave |
|---|---|---|
| Entrada | `text-entrada` (oliva) | `bg-entrada-suave` |
| Saída | `text-saida` (argila) | `bg-saida-suave` |
| Saldo positivo | `text-saldo` (musgo) | `bg-saldo-suave` |
| Saldo negativo | `text-negativo` (terracota forte) | `bg-negativo-suave` |
| Economia (metas) | `text-economia` (azul ardósia) | `bg-economia-suave` |

- Um valor de entrada é **sempre** oliva, um de saída **sempre** argila, um aporte de economia **sempre** azul ardósia e um saldo negativo **sempre** `text-negativo`, em qualquer tela: tabela, card, popover ou gráfico.
- O azul ardósia é o único tom frio da paleta, de propósito: a economia não pode ser confundida com entrada nem com saída, inclusive por quem tem daltonismo.
- Na planilha, as combinações ficam em `COR_COLUNA` (`src/features/planilha/cores.ts`). Reaproveite essas constantes em vez de repetir classes.

### Gráficos

Use `--chart-1` a `--chart-5`, nesta ordem (`var(--color-chart-N)` no config do Chart do shadcn):

1. terracota
2. oliva
3. ocre
4. marrom argila
5. sálvia

Em gráficos de entradas vs saídas, use `--grafico-entrada`, `--grafico-saida` e `--grafico-economia` (validadas juntas para daltonismo), não as cores de chart. Gráficos por categoria usam a cor da própria categoria.

### Cores de categoria

São dados e ficam em hex. A lista oferecida no seletor fica em `GRUPOS_CORES_CATEGORIA` (`src/features/categorias/cores.ts`), dividida por família. Todas são dessaturadas, no mesmo espírito da paleta terrosa: nada de vermelho, rosa ou roxo vivos.

| Família | Cores |
|---|---|
| Terrosos | `#6b7f3a` oliva, `#8c6a4f` marrom, `#c0763f` terracota clara, `#b5894f` ocre, `#7d8a6a` sálvia, `#9c5b3f` argila, `#6f5a4a` café, `#a67c52` caramelo, `#5f6b4e` musgo |
| Vermelhos e rosas | `#71232b` vinho, `#a4435f` framboesa, `#7a4c6b` malva, `#ba7d99` rosa antigo |
| Roxos | `#4a2951` ameixa, `#57488d` uva, `#996bad` orquídea, `#858ac0` lavanda |

Sem categoria: `#a39a8e`. Uma cor nova precisa de:

- contraste de pelo menos 3:1 com o card, para funcionar como marca em gráficos e mostrar o ✓ do seletor;
- distância de pelo menos ~8 (ΔE OKLab ×100) de todas as outras da lista, para não parecer repetida.

A faixa vermelha já está cheia (terracota, argila, vinho e framboesa): um coral, por exemplo, só se diferencia saturado demais.

## Tipografia

- **Famílias:** só estas duas, instaladas pelo Fontsource (funcionam offline no desktop). Não adicione outras fontes.
  - **Inter Variable** (`font-sans`, já aplicada no `html`): textos, controles, rótulos, tabelas e gráficos.
  - **Newsreader Variable** (`font-heading`): títulos de página, card e dialog, a marca e números grandes de card. Sempre em `font-normal`, nunca em texto corrido, célula de tabela nem rótulo.
- **Constantes:** use `TITULO_PAGINA`, `TITULO_CARD`, `TITULO_DIALOG` e `VALOR_DESTAQUE` (`src/shared/lib/estilos.ts`) em vez de repetir as classes. A marca é o componente `Marca`.
- **Pesos:** `font-normal` e `font-medium`. Evite `font-semibold` e `font-bold`: a hierarquia vem de tamanho e cor.
- **Números:** todo valor numérico em tabela, card ou lista usa `tabular-nums`. A exceção são os números grandes de card (`VALOR_DESTAQUE`), com algarismos proporcionais.
- **Formatação:** dinheiro sempre com `formatarBRL` (`src/shared/lib/dinheiro.ts`), datas com `formatarData` (`dd/MM/yyyy`) e nomes de mês e dia com `nomeDoMes` e `nomeDoDiaDaSemana` (`src/shared/lib/datas.ts`).

| Papel | Classes |
|---|---|
| Título da página | `TITULO_PAGINA` (serifada, `text-3xl`) — use `CabecalhoPagina` |
| Parte secundária do título (ano, contexto) | `<span className="text-muted-foreground">` dentro do título |
| Título de card | `TITULO_CARD` (serifada, `text-xl`) |
| Título de dialog | `TITULO_DIALOG` (serifada, `text-xl`) |
| Número grande de card (KPI, % da meta) | `text-[1.75rem]` + `VALOR_DESTAQUE` (serifada) |
| Texto corrido e descrições | `text-sm`, secundário com `text-muted-foreground` |
| Rótulo, sobretítulo, cabeçalho de coluna | `text-[0.68rem]`–`text-[0.7rem] tracking-wide uppercase text-muted-foreground` |
| Célula de tabela | `text-[0.7rem] sm:text-[0.8125rem]` |
| Item de navegação | `text-[0.8125rem]` |
| Metadado miúdo (dia da semana, categoria no popover) | `text-[0.7rem]` ou `text-xs text-muted-foreground` |

## Espaçamento

- **Margem do site: 16px.** O header usa `p-4` e o `<main>` usa `px-4 pb-4`. **Não** use `max-w-*` nem `mx-auto` no container principal: o conteúdo ocupa a largura toda.
- **Entre blocos:** `gap-4` (16px) entre cabeçalho da página e conteúdo, entre cards e entre seções.
- **Dentro de cards:** cabeçalho com `px-4 pt-4 pb-3 sm:px-5`. Conteúdo com o mesmo recuo horizontal. Tabelas encostam nas bordas do card.
- **Células de tabela:** `CELULA = 'px-1 py-2 sm:px-3'`, o que dá linhas de ~41px. A primeira coluna usa `CELULA_DIA` (sem recuo à direita). Cabeçalho, corpo e rodapé usam **as mesmas** constantes, senão as colunas desalinham.
- **Popovers e dialogs:** `p-4`. Listas internas com `gap-3`. Separador de rodapé com `border-t pt-3`.

## Raios, superfícies e sombras

`--radius` é `1rem`. A escala do Tailwind deriva dele: `rounded-xl` ≈ 22px, `rounded-2xl` ≈ 29px, `rounded-3xl` ≈ 35px.

| Elemento | Classes |
|---|---|
| Card de conteúdo | `rounded-3xl bg-card ring-1 ring-border shadow-none` (no `Card`: `gap-0 py-0 rounded-3xl shadow-none ring-border`) |
| Popover, Dialog | `rounded-2xl p-4 shadow-lg ring-border` |
| Botões, navegação, filtros, badges | `rounded-full` (pílula) |
| Controle segmentado (menu, abas) | trilho `rounded-full bg-muted p-1`, item `rounded-full px-3 py-1.5`, item ativo `bg-card text-foreground shadow-sm` |
| Grupo de controles (ex.: navegação de meses) | `rounded-full bg-card p-1 ring-1 ring-border`, botões `variant="ghost" size="icon" className="rounded-full"` |
| Botão secundário solto | `variant="outline" className="h-10 rounded-full bg-card px-4"` |

- Contorno com `ring-1 ring-border`, não com sombra.
- Sombra só em camadas flutuantes (popover, dialog, item ativo): `shadow-sm` ou `shadow-lg`.
- Header fixo: `sticky top-0 bg-background/85 backdrop-blur-md`, sem borda inferior.

## Tabelas

- **Cor por coluna:** fundo suave (`bg-*-suave`) e texto na cor semântica. O cabeçalho da coluna usa a mesma cor.
- **Valor zero fica em branco,** como numa planilha. Não mostre `R$ 0,00` em célula de movimento.
- **Alinhamento:** texto à esquerda, valores à direita.
- **Colunas alinhadas entre tabelas lado a lado:** `lg:table-fixed` com larguras em porcentagem por coluna. Abaixo de `lg` use layout automático, para caber no celular.
- **Mesma altura:** tabelas repetidas por período completam com linhas vazias (`aria-hidden`, com as mesmas cores de coluna) até o maior período. Na planilha, todo mês tem 31 linhas.
- **Divisórias:** `border-b-border/50` nas linhas e `border-border/70` no cabeçalho e rodapé. Nada de grades pesadas.
- **Rodapé de totais:** `bg-transparent font-medium`, rótulo em sobretítulo (`uppercase text-[0.68rem] text-muted-foreground`).
- **Destaque de linha:** use um véu por `box-shadow` inset nas células, para não apagar a cor da coluna. Nunca use borda grossa nem fundo sólido.
  - hover: 4% do foreground
  - linha aberta ou selecionada: 6%
  - hoje: 12% de `--primary` + `font-medium`
- **Hoje:** o número do dia vira pílula `bg-primary text-primary-foreground rounded-full`.
- **Fim de semana e fora do cálculo:** texto `text-muted-foreground` (fim de semana com `/60`) e saldo com `bg-muted/60`.

## Estados e interação

- **Foco:** `outline-none focus-visible:ring-2 focus-visible:ring-ring`. Todo elemento clicável precisa ser alcançável por teclado. Se a linha inteira for clicável, ponha um `<button>` na primeira célula.
- **Hover:** mude cor de texto (`hover:text-foreground`) ou aplique o véu. Evite `brightness` e mudanças bruscas.
- **Desabilitado:** o padrão do shadcn (`disabled:opacity-50`).
- **Transições:** `transition-colors` em links e botões. Animações só as do shadcn/tw-animate.

## Responsividade

- Mobile-first. Na largura de 375px **não pode haver rolagem horizontal da página**, e as tabelas devem caber em 343px.
- Em telas pequenas, **abrevie em vez de esconder**. Exemplo: o cabeçalho "Saídas fixas" vira "Fixas" com `<span className="sm:hidden">` / `<span className="hidden sm:inline">`.
- Breakpoints arbitrários devem usar **rem** (`min-[90rem]:`), não px. Misturar px com os breakpoints em rem do Tailwind (`lg:`) quebra a ordem das regras.
- Na planilha, os meses visíveis são 1 abaixo de 64rem, 2 entre 64rem e 90rem e 3 a partir de 90rem. Cada mês precisa de ~430px.
- O menu de navegação pode rolar na horizontal no celular (`overflow-x-auto`), mas nunca quebrar em várias linhas.

## Ícones

- `lucide-react`, com traço padrão.
- Tamanho `size-4` em botões e `size-3.5` na navegação.
- Ícone é acompanhamento: todo botão só com ícone precisa de `aria-label`.

## Componentes

- **shadcn em `src/shared/ui`:** não edite estilos desses arquivos. Personalize via `className` no uso. Se um padrão se repetir em várias telas, crie um componente em `src/shared/components`.
- **Componentes compartilhados:**
  - `CabecalhoPagina`: título, descrição e ações de toda página.
  - `EmConstrucao`: placeholder de tela futura.
- **Constantes de estilo** de uma feature ficam num arquivo próprio (ex.: `cores.ts`), não dentro de componentes, por causa do Fast Refresh.

## Checklist antes de entregar uma tela

- [ ] Só tokens de cor. Nenhum `emerald`, `red`, `slate` ou hex solto (fora a cor de categoria).
- [ ] Pesos `normal` e `medium` apenas. Títulos com as constantes serifadas. Números com `tabular-nums`, dinheiro com `formatarBRL`.
- [ ] Margem de 16px e `gap-4`, sem `max-w` no container.
- [ ] Cards `rounded-3xl`, controles `rounded-full`, popovers e dialogs `rounded-2xl`.
- [ ] Tabelas com colunas alinhadas, alturas iguais e linhas com `py-2`.
- [ ] Testado em 375px, ~1100px e 1440px, sem rolagem horizontal da página nem texto cortado.
- [ ] Nenhuma informação que já existia foi removida.
