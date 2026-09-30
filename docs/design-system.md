# Design system — Projeção Financeira

Guia visual do app, na linguagem da **Bauhaus**: formas geométricas primárias, cores primárias em blocos, preto para a estrutura, contornos grossos e tipografia geométrica em caixa alta. Toda tela nova deve seguir estas regras para parecer parte do mesmo produto que a Planilha.

A direção veio da skill [ui-ux-pro-max](https://github.com/nextlevelbuilder/ui-ux-pro-max-skill) (estilo *Bauhaus*, tipografia *Bauhaus Geometric*), adaptada para um app de dados: a skill desaconselha o estilo puro em telas densas, então as tabelas mantêm fundos suaves e texto legível, e a força visual fica na moldura (cabeçalhos, cards, controles e gráficos).

## Princípios

1. **Cor quer dizer dinheiro.** Azul é entrada, vermelho é saída, amarelo é economia. O preto organiza (réguas, contornos, item ativo) e o papel é o fundo. Nada de cor decorativa que dispute com esses significados, fora as formas geométricas.
2. **Formas primárias.** Quadrado, círculo e triângulo (e as variações meia-lua e quarto de círculo) identificam telas, compõem a marca e decoram estados vazios. Sempre decorativas (`aria-hidden`).
3. **Blocos retos, contorno preto, sombra dura.** Cantos a 0, borda de 2px em preto e sombra deslocada sem desfoque, como papel recortado. Círculo só em forma geométrica, ponto de cor e botão só com ícone.
4. **Cartaz, não planilha cinza.** Títulos grandes em caixa alta na geométrica pesada; rótulos pequenos em caixa alta com espaçamento; réguas pretas separando cabeçalho e conteúdo.
5. **Limpar sem cortar.** Ao reduzir a poluição visual, reorganize, abrevie ou suavize, mas **nunca remova informação** que já aparece na tela.
6. **Sempre tokens.** Cores vêm dos tokens de `src/index.css` via classes do Tailwind. Nunca use a paleta padrão do Tailwind (`emerald-*`, `red-*`, `slate-*`…) nem hex solto no JSX. A única exceção é a cor de uma categoria, tag ou pasta, que é dado do usuário.

## Cores

Os tokens ficam em `:root` em `src/index.css` e são expostos ao Tailwind em `@theme inline` (`--color-<nome>`). Para criar um token novo, adicione nos **dois** lugares. Só há tema claro.

### Base

| Token | Classe | Uso |
|---|---|---|
| `--background` papel `oklch(0.955 0.007 90)` | `bg-background` | Fundo da página |
| `--card` / `--papel` quase branco | `bg-card`, `text-papel` | Cards, popovers; `text-papel` é o texto sobre blocos de cor |
| `--foreground` preto quente `oklch(0.2 0.006 80)` | `text-foreground`, `border-foreground`, `bg-foreground` | Texto, contornos, réguas, item ativo |
| `--primary` = preto | `bg-primary` | Ação principal (botão preto com sombra vermelha) |
| `--muted` / `--muted-foreground` | `bg-muted`, `text-muted-foreground` | Áreas neutras e texto secundário (contraste ≥ 5:1) |
| `--border` cinza claro | `border-border` | Só divisórias finas entre linhas de tabela e itens de lista |
| `--input` = preto | `border-input` | Contorno dos campos |
| `--ring` azul | `outline-ring` | Foco visível |
| `--destructive` vermelho | `bg-destructive`, `text-destructive` | Excluir |

### Primárias (formas e blocos)

| Token | Classe | Uso |
|---|---|---|
| `--vermelho` | `bg-vermelho` | Formas, faixa de card de saídas, número do dia de hoje, sombra do botão principal |
| `--azul` | `bg-azul` | Formas, faixa e cartão de entradas |
| `--amarelo` | `bg-amarelo` | Formas, faixa de economia, **hover** de controles, seleção de texto |

Texto sobre bloco vermelho ou azul é `text-papel`; sobre amarelo é `text-foreground`. Nunca use amarelo como cor de texto sobre o papel.

### Semânticas financeiras

| Significado | Texto | Fundo suave |
|---|---|---|
| Entrada | `text-entrada` (azul) | `bg-entrada-suave` |
| Saída | `text-saida` (vermelho) | `bg-saida-suave` |
| Saldo positivo | `text-saldo` (preto) | `bg-saldo-suave` (cinza) |
| Saldo negativo | `text-negativo` (vermelho escuro) | `bg-negativo-suave` |
| Economia (metas) | `text-economia` (ocre escuro) | `bg-economia-suave` (amarelo claro) |

- Um valor de entrada é **sempre** azul, um de saída **sempre** vermelho, um aporte de economia **sempre** amarelo/ocre e um saldo negativo **sempre** `text-negativo`, em qualquer tela.
- Todos os pares de texto e fundo acima passam de 4,5:1 (conferido ao criar a paleta).
- Na planilha, as combinações ficam em `COR_COLUNA` (`src/features/planilha/cores.ts`). Reaproveite essas constantes.
- Seletores de tipo (Saída/Entrada) pintam a opção ativa com `COR_ATIVA_TIPO` (`src/features/lancamentos/cores.ts`).

### Gráficos

- Entradas, saídas e economia usam `--grafico-entrada` (azul), `--grafico-saida` (vermelho) e `--grafico-economia` (amarelo). Saldo e sobra usam `--grafico-saldo` (preto).
- **Toda barra e fatia leva o contorno preto** `CONTORNO` (`src/features/dashboard/graficos.ts`): separa os blocos e dá contraste ao amarelo. Barras retas, sem raio.
- Linha de saldo com 3px, cantos vivos e marcadores quadrados; o zero, quando há negativos, é uma linha vermelha tracejada.
- `--chart-1` a `--chart-5`: vermelho, azul, amarelo, preto, cinza.
- Gráficos por categoria usam a cor da própria categoria.

### Cores de categoria

São dados e ficam em hex. A lista oferecida no seletor fica em `GRUPOS_CORES_CATEGORIA` (`src/features/categorias/cores.ts`), dividida por família. Uma cor nova precisa de:

- contraste de pelo menos 3:1 com o card, para funcionar como marca em gráficos e mostrar o ✓ do seletor;
- distância de pelo menos ~8 (ΔE OKLab ×100) de todas as outras da lista.

Sem categoria: `#a39a8e`.

## Formas

- Componente `Forma` (`src/shared/components/Forma.tsx`): `quadrado`, `circulo`, `triangulo`, `semicirculo` e `quarto`, nas cores `vermelho`, `azul`, `amarelo` ou `tinta` (cor do texto em volta).
- Cada tela tem uma forma em `FORMA_PAGINA` (`src/shared/lib/formas.ts`), usada no menu e ao lado do título:

| Tela | Forma |
|---|---|
| Planilha | quadrado vermelho |
| Lançamentos | círculo azul |
| Organização | triângulo preto |
| Economias | meia-lua amarela |
| Dashboard | quarto de círculo azul |

- A marca (`Marca`) é quadrado vermelho, círculo azul e triângulo amarelo, com o nome em duas linhas.
- `Composicao` é a grade 4×4 de cartaz das telas avulsas (login, carregamento). `EstadoVazio` mostra três formas soltas.

## Tipografia

- **Famílias:** só estas duas, instaladas pelo Fontsource (funcionam offline no desktop). Não adicione outras fontes.
  - **Outfit Variable** (`font-heading`): títulos de página, card e dialog, a marca, números grandes, mês e ano nos seletores. Geométrica, herdeira da Futura.
  - **Inter Variable** (`font-sans`, já aplicada no `html`): textos, controles, rótulos, tabelas e gráficos, pelos algarismos tabulares.
- **Constantes** em `src/shared/lib/estilos.ts`: `TITULO_PAGINA`, `TITULO_CARD`, `TITULO_DIALOG`, `VALOR_DESTAQUE` e `ROTULO`. Use-as em vez de repetir as classes.
- **Caixa alta:** títulos, rótulos, cabeçalhos de coluna, botões com texto, itens de menu e de controle segmentado. Texto corrido, descrições e células ficam em caixa normal.
- **Pesos:** títulos `font-extrabold`/`font-bold`; a parte secundária do título (ano, contexto) em `font-light`, dentro de um `<span>`. Na Inter, `font-normal`, `font-medium` e `font-semibold` (valores e totais).
- **Números:** todo valor numérico em tabela, card ou lista usa `tabular-nums`. Dinheiro sempre com `formatarBRL`, datas com `formatarData` e nomes de mês e dia com `nomeDoMes` e `nomeDoDiaDaSemana`.

| Papel | Classes |
|---|---|
| Título da página | `TITULO_PAGINA` (Outfit extrabold, caixa alta, `2rem`/`2.75rem`) — use `CabecalhoPagina` |
| Título de card | `TITULO_CARD` (Outfit bold, caixa alta, `text-lg`) — use `CabecalhoCard` |
| Título de dialog | `TITULO_DIALOG` (Outfit bold, caixa alta, `text-xl`) |
| Número grande de card | `text-[2rem]`–`text-[2.75rem]` + `VALOR_DESTAQUE` |
| Rótulo, sobretítulo, cabeçalho de coluna | `ROTULO` (`0.68rem`, `tracking-[0.08em]`, caixa alta) |
| Botão com texto | `BOTAO` (`h-10`, `text-xs`, semibold, caixa alta) |
| Texto corrido e descrições | `text-sm`, secundário com `text-muted-foreground` |
| Célula de tabela | `text-[0.7rem] sm:text-[0.8125rem]` |

## Espaçamento

- **Margem do site: 16px.** O header usa `px-4 py-3` e o `<main>` usa `px-4 pt-5 pb-8`. **Não** use `max-w-*` nem `mx-auto` no container principal.
- **Entre blocos:** `gap-4` (16px).
- **Cabeçalho de página:** `CabecalhoPagina` fecha com régua preta (`border-b-2 border-foreground pb-4`).
- **Dentro de cards:** cabeçalho com `px-4 py-3 sm:px-5` e régua preta embaixo; conteúdo com o mesmo recuo horizontal. Tabelas encostam nas bordas do card.
- **Células de tabela:** `CELULA = 'px-1 py-2 sm:px-3'`. Cabeçalho, corpo e rodapé usam **as mesmas** constantes.
- **Popovers e dialogs:** `p-4`. Separador de rodapé com `border-t-2 border-foreground pt-3`.

## Superfícies, contornos e sombras

`--radius` é `0`: toda a escala `rounded-*` do shadcn vira canto reto. Só `rounded-full` continua redondo.

| Elemento | Classes |
|---|---|
| Card de conteúdo | `CARD` — `rounded-none border-2 border-foreground shadow-bloco` |
| Cabeçalho de card | `CabecalhoCard` (faixa de cor opcional à esquerda, contagem em bloco preto, destaque à direita) |
| Popover, Dialog | `CAMADA` — `border-2 border-foreground shadow-bloco-lg`; todo dialog tem a faixa vermelho/azul/amarelo no topo |
| Campo (input, select) | `CAMPO`, `CAMPO_SELECT` — `h-10`, borda preta de 2px; foco com sombra azul deslocada |
| Botão com texto | `Button` + `BOTAO`; principal preto com sombra vermelha, secundário (`outline`) papel com sombra preta e hover amarelo |
| Botão só com ícone | `variant="ghost" size="icon" className="rounded-full"` (círculo), com `aria-label` |
| Grupo de controles (‹ 2026 ›) | `GRUPO` no contêiner e `BOTAO_GRUPO` nos botões, com divisórias `border-x-2` |
| Controle segmentado | `ControleSegmentado`: faixa com contorno, divisórias, ativa em bloco preto (ou `corAtiva`) |
| Menu | faixa com contorno; aba ativa em bloco preto, hover amarelo |
| Badge | canto reto, borda de 1,5px, caixa alta |

- Sombras: `shadow-bloco-sm` (3px, botões e grupos), `shadow-bloco` (4px, cards e popovers), `shadow-bloco-lg` (6px, dialogs e avisos). Nunca sombra com desfoque.
- Botões com sombra "afundam" ao clicar (`translate` de 2px e sombra zerada), exceto com `prefers-reduced-motion`.
- Header fixo: `sticky top-0 bg-background border-b-2 border-foreground`.

## Tabelas

- **Cor por coluna:** fundo suave (`bg-*-suave`) e texto na cor semântica. O cabeçalho da coluna usa a mesma cor.
- **Valor zero fica em branco,** como numa planilha.
- **Alinhamento:** texto à esquerda, valores à direita.
- **Colunas alinhadas entre tabelas lado a lado:** `lg:table-fixed` com larguras em porcentagem por coluna.
- **Mesma altura:** tabelas repetidas por período completam com linhas vazias (`aria-hidden`) até o maior período. Na planilha, todo mês tem 31 linhas.
- **Réguas:** preta de 2px sob o cabeçalho e sobre o rodapé; divisórias finas `border-border` entre as linhas.
- **Rodapé de totais:** `font-semibold`, rótulo com `ROTULO`.
- **Destaque de linha:** véu por `box-shadow` inset nas células, para não apagar a cor da coluna.
  - hover: 6% do preto
  - linha aberta: 9% do preto
  - hoje: moldura preta de 2px em cima e embaixo + `font-semibold`; o número do dia vira bloco vermelho
  - período selecionado (dashboard): 30% de amarelo
- **Cabeçalho do mês na planilha:** número do mês em bloco preto, nome em caixa alta.
- **Grupo de pasta:** linha `bg-muted` com régua preta embaixo e nome em caixa alta.

## Estados e interação

- **Foco:** `focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring` (azul). Campos mostram sombra azul deslocada. Todo elemento clicável precisa ser alcançável por teclado; se a linha inteira for clicável, ponha um `<button>` na primeira célula.
- **Hover:** fundo amarelo em controles, abas e itens de lista; véu nas linhas de tabela.
- **Desabilitado:** o padrão do shadcn (`disabled:opacity-50`).
- **Transições:** curtas (`duration-100`) em cor, sombra e deslocamento. Animações só as do shadcn/tw-animate.

## Responsividade

- Mobile-first. Na largura de 375px **não pode haver rolagem horizontal da página**, e as tabelas devem caber no card (339px por dentro da borda).
- Em telas pequenas, **abrevie em vez de esconder** (ex.: "Saídas fixas" vira "Fixas"). Rótulos em caixa alta perdem o espaçamento entre letras no celular quando apertam as colunas.
- Breakpoints arbitrários devem usar **rem** (`min-[76rem]:`), não px.
- Na planilha, os meses visíveis são 1 abaixo de 64rem, 2 entre 64rem e 90rem e 3 a partir de 90rem (72rem/106rem com a coluna Economia).
- O menu rola na horizontal no celular (sem barra visível), mas nunca quebra em várias linhas. Abaixo de 76rem ele ocupa uma linha própria.

## Ícones

- `lucide-react`, com traço padrão (traço 2,5–3 em ✓ e chevrons de destaque).
- Tamanho `size-4` em botões. No menu, a forma da tela substitui o ícone.
- Todo botão só com ícone precisa de `aria-label`.

## Componentes

- **shadcn em `src/shared/ui`:** já trazem a base Bauhaus (canto reto, contorno preto, sombra dura, títulos em caixa alta). Ajuste por `className` no uso; mude o arquivo só para mudar o padrão de todo o app.
- **Componentes compartilhados** (`src/shared/components`):
  - `CabecalhoPagina`: forma, título, descrição e ações de toda página.
  - `CabecalhoCard`: cabeçalho de card com faixa, contagem, destaque e ações.
  - `Forma`, `Marca`, `Composicao`: a linguagem geométrica.
  - `ControleSegmentado`, `EstadoVazio`, `TelaCentralizada`, `AvisoErro`, `PontoCor`.
- **Constantes de estilo** de uma feature ficam num arquivo próprio (ex.: `cores.ts`), não dentro de componentes, por causa do Fast Refresh.

## Checklist antes de entregar uma tela

- [ ] Só tokens de cor; azul = entrada, vermelho = saída, amarelo = economia, preto = estrutura.
- [ ] Títulos com as constantes (Outfit, caixa alta); números com `tabular-nums`; dinheiro com `formatarBRL`.
- [ ] Cards com `CARD` e `CabecalhoCard`; controles retos com contorno preto; nada de `rounded-xl`/`2xl`/`3xl` nem pílulas.
- [ ] Sombras só as duras (`shadow-bloco*`).
- [ ] Margem de 16px e `gap-4`, sem `max-w` no container.
- [ ] Tabelas com colunas alinhadas, alturas iguais e réguas pretas no cabeçalho e rodapé.
- [ ] Testado em 375px, ~1100px e 1440px, sem rolagem horizontal da página nem texto cortado.
- [ ] Nenhuma informação que já existia foi removida.
