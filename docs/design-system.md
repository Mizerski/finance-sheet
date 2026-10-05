# Design system — Projeção Financeira

Guia visual do app, na linguagem da **Bauhaus**: formas geométricas primárias, cores primárias em blocos, preto para a estrutura, contornos grossos e tipografia geométrica em caixa alta. Toda tela nova deve seguir estas regras para parecer parte do mesmo produto que a Planilha.

A direção veio da skill [ui-ux-pro-max](https://github.com/nextlevelbuilder/ui-ux-pro-max-skill) (estilo *Bauhaus*, tipografia *Bauhaus Geometric*), adaptada para um app de dados: a skill desaconselha o estilo puro em telas densas, então as tabelas mantêm fundos suaves e texto legível, e a força visual fica na moldura (cabeçalhos, cards, controles e gráficos).

## Princípios

1. **Cor quer dizer dinheiro.** Azul é entrada, vermelho é saída, amarelo é economia. O preto organiza (réguas, contornos, item ativo) e o papel é o fundo. Nada de cor decorativa que dispute com esses significados, fora as formas geométricas.
2. **Formas primárias.** Quadrado, círculo e triângulo (e as variações meia-lua e quarto de círculo) identificam telas, compõem a marca e decoram estados vazios. Sempre decorativas (`aria-hidden`).
3. **Blocos retos, contorno preto, sombra dura.** Cantos a 0, borda de 2px em preto e sombra deslocada sem desfoque, como papel recortado. Círculo só em forma geométrica, ponto de cor e botão só com ícone.
4. **Cartaz, não planilha cinza.** Títulos grandes em caixa alta na geométrica pesada; rótulos pequenos em caixa alta com espaçamento; réguas pretas separando cabeçalho e conteúdo.
5. **Limpar sem cortar.** Ao reduzir a poluição visual, reorganize, abrevie ou suavize, mas **nunca remova informação** que já aparece na tela.
6. **Pouca carga visual.** A tela mostra de cara só a conclusão e o número principal de cada card; explicações ficam a um clique (veja *Divulgação progressiva*). Pense em quem tem TDAH: um bloco de texto a menos vale mais que uma explicação a mais.
7. **Sempre tokens.** Cores vêm dos tokens de `src/index.css` via classes do Tailwind. Nunca use a paleta padrão do Tailwind (`emerald-*`, `red-*`, `slate-*`…) nem hex solto no JSX. A única exceção é a cor de uma categoria, tag ou pasta, que é dado do usuário.

## Cores

Os tokens ficam em `:root` em `src/index.css` e são expostos ao Tailwind em `@theme inline` (`--color-<nome>`). Para criar um token novo, adicione nos **dois** lugares (e, se ele mudar no escuro, também no bloco `.dark`).

### Tema escuro (Bauhaus escuro)

Há tema claro e escuro (classe `dark` no `<html>`). Sem escolha, segue o sistema; o botão de sol/lua do cabeçalho (`BotaoTema`, `src/features/tema/`) troca e guarda a escolha no aparelho. `public/tema-inicial.js` aplica a classe antes do React, para a tela não piscar.

O escuro é **grafite médio**: o mesmo cartaz, impresso num papel cinza-grafite em vez de preto. Não é a inversão do claro (regra `color-dark-mode` da ui-ux-pro-max: variantes tonais próprias, contraste conferido à parte). Todas as cores têm valor próprio no bloco `.dark` de `src/index.css`. A versão anterior (carvão com linhas e texto creme) parecia terminal antigo: contorno a 9:1, mais forte que o texto secundário, sombra clara virando segunda borda e amarelo a 11:1 mandando na tela. As prévias da escolha ficam em `docs/previas/`.

Contraste WCAG contra o card (o card e a sombra, contra o chão):

| Papel | Token | oklch | Contraste |
|---|---|---|---|
| Chão / card / área neutra | `--background` / `--card` / `--muted` | `0.295` / `0.33` / `0.37`, C 0.004, H 80 | card 1,14:1 no chão |
| Texto / secundário | `--foreground` / `--muted-foreground` | `0.975 0.003 85` / `0.8 0.004 80` | 11,4:1 / 6,5:1 |
| Contorno e réguas | `--contorno` | `0.14 0.004 80` (preto) | 1,6:1 |
| Campo | `--input` | `0.69 0.005 80` | 4,4:1 |
| Divisória fina | `--border` | `0.235 0.004 80` | 1,4:1 |
| Sombra | `--sombra` | `0.235 0.03 262` (azul-tinta) | 1,2:1 no chão |
| Foco | `--ring` | `0.78 0.1 258` | 6,1:1 |
| Primárias | `--vermelho` · `--azul` · `--amarelo` | `0.62 0.145 30` · `0.6 0.115 258` · `0.75 0.12 84` | 3,1 · 3,1 · 5,5:1 |
| Texto sobre azul e vermelho | `--sobre-bloco` (= tinta) | `0.16 0.004 80` | 4,9:1 e 5,0:1 |
| Entrada · saída · negativo · economia | `--entrada` … | L 0.79–0.84, C 0.08–0.11 | 7,0 · 6,1 · 6,1 · 7,5:1 |

- **Chão e superfícies quase neutros** (C ≤ 0.005), em degraus de L: chão, card e área neutra. Escuro não precisa ser preto: com o chão em L 0.3 o preto ainda aparece, então contorno e sombra continuam organizando a tela como no claro.
- **Texto quase branco e sem amarelar.** Texto creme com linha creme sobre carvão quente lembrava monitor âmbar; o texto agora tem menos chroma que o chão. Fica em 11,4:1, um pouco abaixo do alvo de 12, porque já está no limite do branco.
- **Contorno preto, como no claro** (papel recortado). Linhas, réguas, contornos de card, eixos e contorno dos gráficos usam `--contorno` (`border-contorno`, `var(--contorno)`); nunca `border-foreground`. Pelo WCAG o preto sobre o grafite dá só 1,6:1, por isso os **campos** usam `border-input` (`CAMPO`, `CAMPO_SELECT`), um cinza a 4,4:1 que cumpre os 3:1 de controle. No claro, `--input` é o mesmo preto.
- **Sombra azul-tinta, mais macia que o contorno.** Sombra preta pesava como segunda borda e sombra clara virava arame; um azul escuro de tinta de impressão lê como sombra e fica abaixo do contorno (1,2:1 contra 1,6:1). O botão principal mantém a sombra vermelha e o foco, a azul.
- **Primárias de pigmento:** vermelhão, ultramar e amarelo-cromo levemente apagados (chroma ≤ 0,145), com luz próxima (diferença de L de 0,15). O amarelo caiu de 11:1 para 5,5:1 e deixou de mandar na tela, mesmo sendo a cor do hover (contraste de extensão de Itten: o amarelo pede a menor área). Tudo dentro do sRGB.
- **Texto e formas sobre azul e vermelho são escuros** (`text-sobre-bloco`, forma `papel`): com as primárias em L 0.6, o papel cairia abaixo de 4,5:1, e a tinta passa, com cara de cartaz impresso. No claro, `--sobre-bloco` é o papel. O ✓ do `SeletorCor` continua `text-papel`, porque as cores de categoria não mudam com o tema.
- **Vermelho e azul nunca encostam:** barras separadas pelo contorno preto (`CONTORNO`) e a faixa do dialog com divisórias de contorno só no escuro (vermelho encostado no azul vibra no fundo escuro).
- **Tabelas calmas:** os fundos de coluna (`*-suave`) são quase neutros no escuro. Amarelo e laranja escuros viram oliva e marrom, então a cor de entrada, saída e economia fica no texto e no cabeçalho, não no fundo. Na célula de saldo, o nível do risco vira uma barra de 4px à esquerda (`COR_RISCO[n].marca`, só no escuro), porque o fundo suave não carrega mais a cor.
- **Sobre amarelo, sempre `text-tinta`** (nunca `text-foreground`): blocos amarelos, riscos 2 a 4, `hover:bg-amarelo hover:text-tinta`, seleção de texto. A faixa de card leva `text-tinta`, então a forma `tinta` nela fica escura.
- **Blocos pretos:** os decorativos (faixa de Pastas, Caixas, Gastos por pasta, Saldo, `CardBeneficio` e `Composicao`) usam `bg-tinta`, preto nos dois temas (1,6:1 sobre o card no escuro). Item ativo (aba, controle segmentado, checkbox, contagem, número do mês) continua `bg-foreground text-background`, bloco claro no escuro. Um ativo com hover amarelo repete `hover:text-background` (ou `hover:text-sobre-bloco` nos blocos de cor).
- **Véus:** `bg-selecao`/`bg-selecao-forte` (amarelo 30%/40% no claro, 20%/28% no escuro) para linha marcada, período destacado e hover de itens com texto colorido. No escuro o véu fica oliva (amarelo escuro é oliva); se incomodar, a alternativa é superfície neutra com marca amarela à esquerda. O fundo atrás de dialogs é `bg-veu`, que no escuro escurece a página. Os véus de hover das linhas usam `--foreground` e funcionam nos dois temas.
- **Gráficos:** séries nas primárias do escuro (azul, vermelho, amarelo) e saldo em quase branco; barras e fatias com contorno preto (`CONTORNO`).
- **Grade de pontos do fundo** (`papel-pontilhado`): pontos pretos, como no claro.

### Base

| Token | Classe | Uso |
|---|---|---|
| `--background` papel `oklch(0.955 0.007 90)` | `bg-background` | Fundo da página |
| `--card` / `--papel` quase branco | `bg-card`, `text-papel` | Cards, popovers; `text-papel` só sobre cores de categoria (fixas) |
| `--sobre-bloco` papel (tinta no escuro) | `text-sobre-bloco`, forma `papel` | Texto e formas sobre os blocos azul e vermelho |
| `--foreground` preto quente `oklch(0.2 0.006 80)` | `text-foreground`, `bg-foreground` | Texto e item ativo (quase branco no tema escuro) |
| `--contorno` = preto (nos dois temas) | `border-contorno`, `bg-contorno`, `var(--contorno)` | Contornos, réguas, eixos e contorno dos gráficos |
| `--tinta` preto quente, igual nos dois temas | `text-tinta`, `bg-tinta` | Texto sobre amarelo e riscos 2 a 4; blocos pretos decorativos |
| `--sombra` preto (azul-tinta escuro no escuro) | `shadow-bloco*`, `var(--sombra)` | Sombra dura dos blocos |
| `--selecao` / `--selecao-forte` | `bg-selecao`, `bg-selecao-forte` | Véu amarelo de seleção e destaque (mais leve no escuro) |
| `--veu` | `bg-veu` | Fundo atrás de dialogs (escurece nos dois temas) |
| `--primary` = preto | `bg-primary` | Ação principal (botão preto com sombra vermelha) |
| `--muted` / `--muted-foreground` | `bg-muted`, `text-muted-foreground` | Áreas neutras e texto secundário (contraste ≥ 5:1) |
| `--border` cinza claro | `border-border` | Só divisórias finas entre linhas de tabela e itens de lista |
| `--input` = contorno (cinza a 4,4:1 no escuro) | `border-input` | Contorno dos campos |
| `--ring` azul | `outline-ring` | Foco visível |
| `--destructive` vermelho | `bg-destructive`, `text-destructive` | Excluir |

### Primárias (formas e blocos)

| Token | Classe | Uso |
|---|---|---|
| `--vermelho` | `bg-vermelho` | Formas, faixa de card de saídas, número do dia de hoje, sombra do botão principal |
| `--azul` | `bg-azul` | Formas, faixa e cartão de entradas |
| `--amarelo` | `bg-amarelo` | Formas, faixa de economia, **hover** de controles, seleção de texto |

Texto sobre bloco vermelho ou azul é `text-sobre-bloco` (papel no claro, tinta no escuro); sobre amarelo é `text-tinta`. Nunca use amarelo como cor de texto sobre o papel.

### Semânticas financeiras

| Significado | Texto | Fundo suave |
|---|---|---|
| Entrada | `text-entrada` (azul) | `bg-entrada-suave` |
| Saída | `text-saida` (vermelho) | `bg-saida-suave` |
| Saldo positivo | `text-saldo` (preto) | `bg-saldo-suave` (cinza) |
| Saldo negativo | `text-negativo` (vermelho escuro) | `bg-negativo-suave` |
| Economia (metas) | `text-economia` (ocre escuro) | `bg-economia-suave` (amarelo claro) |

- Um valor de entrada é **sempre** azul, um de saída **sempre** vermelho, um aporte de economia **sempre** amarelo/ocre e um saldo negativo **sempre** `text-negativo`, em qualquer tela.
- **Transferência** entre contas não é entrada nem saída: valor em `text-foreground` com as setas (`ArrowLeftRight`), sem sinal na lista; a opção ativa do tipo fica no bloco preto. Na planilha de uma conta ela soma nas colunas de entrada e saída, como num extrato.
- Todos os pares de texto e fundo acima passam de 4,5:1 (conferido ao criar a paleta).
- Na planilha, as combinações ficam em `COR_COLUNA` (`src/features/planilha/cores.ts`). Reaproveite essas constantes.
- Seletores de tipo (Saída/Entrada) pintam a opção ativa com `COR_ATIVA_TIPO` (`src/features/lancamentos/cores.ts`).

### Risco do caixa

Cinco níveis, do mais tranquilo ao mais arriscado, numa escala que sai do azul, passa pelo amarelo e chega ao vermelho. Tokens `--risco-N`, `--risco-N-suave` e `--risco-N-texto` (N de 1 a 5), com as classes em `COR_RISCO` (`src/features/risco/cores.ts`).

| Nível | Bloco forte | Fundo suave | Texto sobre o bloco |
|---|---|---|---|
| 1 Tranquilo | azul | azul claro | papel |
| 2 Estável | azul-claro | ciano claro | preto |
| 3 Atenção | amarelo | amarelo claro | preto |
| 4 Risco alto | laranja | laranja claro | preto |
| 5 Risco muito alto | vermelho | vermelho claro (= `negativo-suave`) | papel |

- É a única escala além de entrada/saída/economia. Use só para risco do caixa, sempre com o nome do nível escrito ao lado (`SeloRisco`, `NomeNivel`), para a cor nunca ser a única pista.
- Na planilha, o fundo da célula de saldo ganha o tom suave do nível do dia; o saldo negativo continua `text-negativo`.
- `-texto` passa de 4,5:1 sobre o fundo suave e o card.

### Gráficos

- Entradas, saídas e economia usam `--grafico-entrada` (azul), `--grafico-saida` (vermelho) e `--grafico-economia` (amarelo). Saldo e sobra usam `--grafico-saldo` (preto).
- **Toda barra e fatia leva o contorno preto** `CONTORNO` (`src/features/dashboard/graficos.ts`): separa os blocos e dá contraste ao amarelo. Barras retas, sem raio.
- Linha de saldo com 3px, cantos vivos e marcadores quadrados; o zero, quando há negativos, é uma linha vermelha tracejada.
- `--chart-1` a `--chart-5`: vermelho, azul, amarelo, preto, cinza.
- Gráficos por categoria usam a cor da própria categoria.

### Cores de categoria

São dados e ficam em hex. A paleta Bauhaus oferecida no seletor fica em `GRUPOS_CORES_CATEGORIA` (`src/features/categorias/cores.ts`): Primárias (vermelho, azul, amarelo, preto), Quentes, Frias e Neutras.

- O `SeletorCor` mostra quadradinhos com contorno preto e sombra dura; a cor escolhida fica afundada com ✓ (`text-tinta` nas cores marcadas `clara`, papel nas outras). Uma cor salva que não está mais na paleta aparece no grupo "Atual" e continua disponível.
- Toda cor de usuário aparece com contorno preto: `PontoCor` é um quadradinho com borda de 1,5px, e as legendas, barras e fatias levam `CONTORNO`. Por isso a paleta pode ter cores claras (amarelo, rosa, areia).
- Uma cor nova precisa de distância de pelo menos ~8 (ΔE OKLab ×100) de todas as outras da lista e da cor "sem categoria".

Sem categoria: `#a39a8e`.

## Formas

- Componente `Forma` (`src/shared/components/Forma.tsx`): `quadrado`, `circulo`, `triangulo`, `semicirculo` e `quarto`, nas cores `vermelho`, `azul`, `amarelo`, `papel` (sobre blocos de cor e item ativo; usa `--sobre-bloco`) ou `tinta` (cor do texto em volta).
- Cada tela tem uma forma em `FORMA_PAGINA` (`src/shared/lib/formas.ts`), usada no menu e ao lado do título:

| Tela | Forma |
|---|---|
| Planilha | quadrado vermelho |
| Lançamentos | círculo azul |
| Organização | triângulo preto |
| Economias | meia-lua amarela |
| Dashboard | quarto de círculo azul |

- **Cards:** o `CabecalhoCard` aceita `forma`; a faixa de cor vira um bloco com a forma no meio, como o card de cada meta. Combine primária sobre primária (círculo amarelo no azul, triângulo papel no vermelho) ou `tinta` sobre o amarelo. O mesmo assunto usa a mesma forma em todas as telas:

| Assunto | Bloco e forma |
|---|---|
| Risco do caixa (Economias e Planilha) | bloco na cor do nível, triângulo |
| Metas, sobras | amarelo, meia-lua |
| Quanto dá para guardar | amarelo, quarto de círculo |
| Reserva de emergência | amarelo, quadrado |
| Sugestões | azul, círculo amarelo |
| Gastos grandes | vermelho, triângulo papel |
| Categorias de entrada / saída, gastos por categoria | azul com círculo papel / vermelho com quadrado papel |
| Tags | amarelo, triângulo |
| Pastas | preto, quadrado amarelo |
| Caixas | preto, círculo amarelo |
| Benefício até a recarga (`CardBeneficio`) | preto com quarto de círculo amarelo; se o saldo acaba antes da recarga, vermelho com triângulo papel |
| Fatura do cartão (`CardCartao`) | preto com quadrado vermelho; se passou do limite, vermelho com triângulo papel |
| Entradas vs saídas · gastos no ano · saldo | azul com quadrado vermelho · azul com quarto amarelo · preto com quarto vermelho |
| Assistente (painel lateral, só desktop) | preto com as três formas da marca (círculo azul, triângulo amarelo, quadrado vermelho) |

- A marca (`Marca`) é quadrado vermelho, círculo azul e triângulo amarelo, com o nome em duas linhas.
- `Composicao` é a grade 4×4 de cartaz das telas avulsas (login, carregamento). `EstadoVazio` mostra três formas soltas.

## Tipografia

- **Famílias:** só estas duas, instaladas pelo Fontsource (funcionam offline no desktop). Não adicione outras fontes.
  - **Outfit Variable** (`font-heading`): títulos de página, card e dialog, a marca, números grandes, mês e ano nos seletores. Geométrica, herdeira da Futura.
  - **Inter Variable** (`font-sans`, já aplicada no `html`): textos, controles, rótulos, tabelas e gráficos, pelos algarismos tabulares.
- **Constantes** em `src/shared/lib/estilos.ts`: `TITULO_PAGINA`, `TITULO_CARD`, `TITULO_DIALOG`, `VALOR_DESTAQUE` e `ROTULO`. Use-as em vez de repetir as classes.
- **Caixa alta:** títulos, rótulos, cabeçalhos de coluna, botões com texto, itens de menu e de controle segmentado. Texto corrido, descrições e células ficam em caixa normal.
- **Pesos:** títulos `font-extrabold`/`font-bold`; a parte secundária do título (ano, contexto) em `font-light`, dentro de um `<span>`. Na Inter, `font-normal`, `font-medium` e `font-semibold` (valores e totais).
- **Textos para o usuário:** linguagem simples, sem termos técnicos ("cabe no seu bolso", "sobram R$ 48 na conta", não "fluxo" ou "capacidade"). A conclusão abre a frase em negrito ("**Vai faltar dinheiro:** …"), e datas, valores e nomes de nível também vão em negrito (`Forte`, `DataForte`, `SaldoForte`, `DinheiroForte`, `NomeNivel` em `src/features/risco/components/Destaques.tsx`).
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
- **Cabeçalho de página:** `CabecalhoPagina` fecha com régua preta (`border-b-2 border-contorno pb-4`).
- **Dentro de cards:** cabeçalho com `px-4 py-3 sm:px-5` e régua preta embaixo; conteúdo com o mesmo recuo horizontal. Tabelas encostam nas bordas do card.
- **Células de tabela:** `CELULA = 'px-1 py-2 sm:px-3'`. Cabeçalho, corpo e rodapé usam **as mesmas** constantes.
- **Popovers e dialogs:** `p-4`. Separador de rodapé com `border-t-2 border-contorno pt-3`.

## Superfícies, contornos e sombras

`--radius` é `0`: toda a escala `rounded-*` do shadcn vira canto reto. Só `rounded-full` continua redondo.

| Elemento | Classes |
|---|---|
| Card de conteúdo | `CARD` — `rounded-none border-2 border-contorno shadow-bloco` |
| Cabeçalho de card | `CabecalhoCard` (faixa de cor opcional à esquerda, que vira bloco com forma quando há `forma`; contagem em bloco preto, destaque à direita) |
| Mensagem principal de um card | `CaixaDestaque`: contorno preto, faixa grossa de cor à esquerda (`border-l-8`) e fundo suave da cor do assunto (economia, risco, saída); texto em preto, não cinza |
| Popover, Dialog | `CAMADA` — `border-2 border-contorno shadow-bloco-lg`; todo dialog tem a faixa vermelho/azul/amarelo no topo. Popover nunca passa da tela: com conteúdo demais, rola por dentro (numa lista, só a lista rola) |
| Painel lateral (assistente) | preso à direita, altura toda, `border-l-2 border-contorno shadow-bloco-lg`, faixa das três primárias no topo; não modal (o app e os atalhos continuam funcionando), Esc fecha. Mensagens da pessoa em bloco preto à direita; as do assistente em bloco de papel com contorno e `shadow-bloco-sm` à esquerda; erro em `CaixaDestaque` vermelha |
| Checkbox (`src/shared/ui/checkbox.tsx`) | quadrado de 18px com contorno preto de 2px, hover amarelo; marcado ou parcial, bloco preto com ✓ ou – |
| Barra de seleção (lote) | presa embaixo (`fixed inset-x-4 bottom-4`), `shadow-bloco-lg`; a contagem em bloco amarelo à esquerda, ações em botões `outline`, aviso do que mudou com "Desfazer" na linha de cima. A página ganha folga embaixo para a barra não cobrir a última linha |
| Botão Assistente (só desktop) | bloco como as abas do menu, em `bg-tinta text-papel` com as três formas da marca e "Assistente" em caixa alta; hover amarelo; aberto, afundado em amarelo (o triângulo amarelo vira preto). Na janela estreita (abaixo de 40rem), só as formas |
| Seletor de caixa | um botão em bloco (`shadow-bloco-sm`) com a bolinha da cor, o nome e ▾, que afunda e fica amarelo quando aberto; a lista numera os atalhos em quadradinhos (preto no escolhido) |
| Escolha com explicação (tipo do caixa) | cartões em grade 2×2 (conta: círculo, investimento: meia-lua, benefício: quarto de círculo, cartão: quadrado) com nome em caixa alta e uma frase; o escolhido fica em bloco preto, afundado |
| Campo (input, select) | `CAMPO`, `CAMPO_SELECT` — `h-10`, borda de 2px em `border-input` (preta no claro, cinza no escuro); foco com sombra azul deslocada |
| Botão com texto | `Button` + `BOTAO`; principal preto com sombra vermelha, secundário (`outline`) papel com sombra preta e hover amarelo |
| Botão só com ícone | `variant="ghost" size="icon" className="rounded-full"` (círculo), com `aria-label` |
| Grupo de controles (‹ 2026 ›) | `GRUPO` no contêiner e `BOTAO_GRUPO` nos botões, com divisórias `border-x-2` |
| Controle segmentado | `ControleSegmentado`: faixa com contorno, divisórias, ativa em bloco preto (ou `corAtiva`) |
| Menu | abas em blocos separados com contorno e sombra dura, que afundam ao clicar; a ativa fica afundada (preta, deslocada 2px, sem sombra); hover amarelo |
| Badge | canto reto, borda de 1,5px, caixa alta |
| Barra de rolagem | global em `src/index.css` (`::-webkit-scrollbar`): 14px, trilho `--muted` com régua `--contorno`, puxador quadrado em `--input` (preto no claro, cinza no escuro) que fica amarelo no hover, botões ▲▼ com setas em pixel (`--seta-*`, uma cor por tema). Não use `scrollbar-color`/`scrollbar-width` (o Chromium passa a ignorar o estilo); `[scrollbar-width:none]` só para esconder a barra, como no menu |
| Cursor | pixel art em grade de 2px, em `public/cursores/` (`.svg` e `@2x.svg`), pelos tokens `--cursor-seta`, `--cursor-mao` (amarela, em tudo que é clicável), `--cursor-texto` (campos) e `--cursor-bloqueado` (desabilitado). As classes `cursor-pointer`, `cursor-default` e `cursor-not-allowed` já usam os tokens. Para desenho novo, mude o arquivo nas duas resoluções e o ponto de clique no token |

- Sombras: `shadow-bloco-sm` (3px, botões e grupos), `shadow-bloco` (4px, cards e popovers), `shadow-bloco-lg` (6px, dialogs e avisos), na cor `--sombra`. Nunca sombra com desfoque.
- Botões com sombra "afundam" ao clicar (`translate` de 2px e sombra zerada), exceto com `prefers-reduced-motion`. Vale para todo controle em bloco com sombra: botões, abas do menu e quadradinhos do seletor de cor. O item escolhido de um grupo (aba ativa, cor escolhida) pode ficar afundado de vez.
- Header fixo: `sticky top-0 bg-background border-b-2 border-contorno`.

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
  - período selecionado (dashboard) e linha marcada para a ação em lote: `--selecao` (30% de amarelo; 20% no escuro)
- **Cabeçalho do mês na planilha:** número do mês em bloco preto, nome em caixa alta.
- **Grupo de pasta:** linha `bg-muted` com régua preta embaixo e nome em caixa alta.

## Divulgação progressiva

Cada card responde uma pergunta de relance (regra `progressive-disclosure` da ui-ux-pro-max: não sobrecarregar logo de início). O resto continua lá, a um clique:

| O que é | Onde fica |
|---|---|
| Conclusão e número principal | Na tela, em `CaixaDestaque` ou número grande |
| Como o cálculo funciona, período, régua, legenda, conselhos gerais ("não crie meta para isso", "quantos meses guardar") | `Ajuda`: botão "?" ao lado do título (prop `ajuda` de `CabecalhoCard` e `CabecalhoPagina`) que abre um popover por clique, toque ou teclado |
| Detalhe secundário do próprio card (valores por nível, limites) | `MaisDetalhes`: "ver …" que abre e fecha no lugar |
| Ferramenta que só serve quando a pessoa quer (simulador) | Recolhida numa linha com o resultado de hoje e um botão para abrir |

- Descrição de cabeçalho de card tem no máximo uma linha curta ("Para imprevistos"); o resto vai para o `Ajuda`.
- Números que se comparam (entrou, saiu, metas) aparecem lado a lado com rótulo, não dentro de uma frase.
- Caixa colorida só para mensagem que pede atenção; um "está tudo certo" curto fica em texto simples.
- A mesma informação não aparece duas vezes no mesmo card (ex.: legenda e faixa dos meses).
- Nunca esconda um alerta (falta dinheiro, caixa aperta, prazo perdido): alerta fica sempre visível.

## Estados e interação

- **Foco:** `focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring` (azul). Campos mostram sombra azul deslocada. Todo elemento clicável precisa ser alcançável por teclado; se a linha inteira for clicável, ponha um `<button>` na primeira célula.
- **Hover:** fundo amarelo com `text-tinta` em controles, abas e itens de lista; véu nas linhas de tabela. Item com texto colorido dentro usa `dark:hover:bg-selecao-forte` no escuro.
- **Desabilitado:** o padrão do shadcn (`disabled:opacity-50`).
- **Transições:** curtas (`duration-100`) em cor, sombra e deslocamento. Animações só as do shadcn/tw-animate.

## Responsividade

- Mobile-first. Na largura de 375px **não pode haver rolagem horizontal da página**, e as tabelas devem caber no card (339px por dentro da borda).
- Em telas pequenas, **abrevie em vez de esconder** (ex.: "Saídas fixas" vira "Fixas"). Rótulos em caixa alta perdem o espaçamento entre letras no celular quando apertam as colunas.
- Breakpoints arbitrários devem usar **rem** (`min-[76rem]:`), não px.
- Na planilha, os meses visíveis são 1 abaixo de 64rem, 2 entre 64rem e 90rem e 3 a partir de 90rem (72rem/106rem com a coluna Economia).
- O menu rola na horizontal no celular (sem barra visível), mas nunca quebra em várias linhas. Abaixo de 76rem (90rem com o seletor de caixa) ele ocupa uma linha própria; no desktop, que tem mais botões no cabeçalho, abaixo de 84rem (98rem com o seletor).
- Colunas de texto livre (descrição) quebram palavras longas (`[overflow-wrap:anywhere]`), para a tabela caber no card mesmo com os botões da linha.

## Ícones

- **Pixel art:** Pixelarticons (MIT), numa grade de 24×24, importados só de `@/shared/ui/icones`. Os nomes seguem o lucide (`Trash2`, `Pencil`, `X`…) e cada um aponta para um desenho da coleção, de preferência a variante `Sharp` (cantos retos). Ícone novo: acrescente o par em `icones.tsx`. Componente do shadcn copiado com `lucide-react`: troque o import por `@/shared/ui/icones`.
- **Tamanho só em múltiplos da grade:** `size-6` (24px, padrão dos botões) ou `size-3` (12px, ao lado de texto pequeno, em selects e no checkbox). Em 16px ou 14px os pixels borram.
- O traço não muda (`strokeWidth` é ignorado); a ênfase vem do tamanho e da cor. No menu, a forma da tela substitui o ícone.
- Todo botão só com ícone precisa de `aria-label`.

## Componentes

- **shadcn em `src/shared/ui`:** já trazem a base Bauhaus (canto reto, contorno preto, sombra dura, títulos em caixa alta). Ajuste por `className` no uso; mude o arquivo só para mudar o padrão de todo o app.
- **Componentes compartilhados** (`src/shared/components`):
  - `CabecalhoPagina`: forma, título, descrição e ações de toda página.
  - `CabecalhoCard`: cabeçalho de card com faixa, contagem, destaque e ações.
  - `Forma`, `Marca`, `Composicao`: a linguagem geométrica.
  - `ControleSegmentado`, `EstadoVazio`, `TelaCentralizada`, `AvisoErro`, `PontoCor`, `CaixaDestaque`.
  - `SeletorPeriodo`: grupo "‹ março de 2026 ›" com calendário e atalhos Dia/Semana/Mês/Ano; com `onLimpar`, opcional ("Qualquer data" e um ×).
  - `Ajuda` (botão "?" com popover) e `MaisDetalhes` (abre e fecha no lugar): divulgação progressiva.
- **Constantes de estilo** de uma feature ficam num arquivo próprio (ex.: `cores.ts`), não dentro de componentes, por causa do Fast Refresh.

## Checklist antes de entregar uma tela

- [ ] Só tokens de cor; azul = entrada, vermelho = saída, amarelo = economia, preto = estrutura.
- [ ] Títulos com as constantes (Outfit, caixa alta); números com `tabular-nums`; dinheiro com `formatarBRL`.
- [ ] Cards com `CARD` e `CabecalhoCard`; controles retos com contorno preto; nada de `rounded-xl`/`2xl`/`3xl` nem pílulas.
- [ ] Sombras só as duras (`shadow-bloco*`).
- [ ] Margem de 16px e `gap-4`, sem `max-w` no container.
- [ ] Tabelas com colunas alinhadas, alturas iguais e réguas pretas no cabeçalho e rodapé.
- [ ] Testado em 375px, ~1100px e 1440px, sem rolagem horizontal da página nem texto cortado.
- [ ] Conferido no tema escuro: estrutura com `border-contorno` e campos com `border-input`, texto sobre azul e vermelho com `text-sobre-bloco`, nada de `text-foreground` sobre amarelo, blocos pretos decorativos com `bg-tinta`, sombras com `--sombra`, sem fundo colorido turvo em tabela, vermelho e azul separados por contorno.
- [ ] Nenhuma informação que já existia foi removida.
- [ ] Cada card mostra de cara só a conclusão e o número; explicações no `Ajuda` ou em `MaisDetalhes`.
