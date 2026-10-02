/** Classes repetidas entre telas (design system Bauhaus: blocos retos, contorno preto, sombra dura). */

/** Card de conteúdo: bloco reto com contorno preto e sombra dura. Use no `className` do `Card`. */
export const CARD = 'gap-0 rounded-none border-2 border-contorno py-0 shadow-bloco ring-0'

/** Cabeçalho de card: título à esquerda, dados ou ações à direita, régua preta embaixo. */
export const CABECALHO_CARD = 'flex items-center justify-between gap-3 border-b-2 border-contorno px-4 py-3 sm:px-5'

/** Input reto com contorno preto. */
export const CAMPO = 'h-10 rounded-none border-2 border-input bg-card px-3 shadow-none'

/** SelectTrigger reto (o tamanho padrão do shadcn vem por atributo). */
export const CAMPO_SELECT = 'w-full rounded-none border-2 border-input bg-card px-3 shadow-none data-[size=default]:h-10'

/** Popover e Dialog: camada flutuante com a sombra dura maior. */
export const CAMADA = 'rounded-none border-2 border-contorno p-4 shadow-bloco-lg ring-0'

/** Rodapé de Dialog sem a faixa cinza padrão do shadcn. */
export const RODAPE_DIALOG = 'mx-0 mb-0 rounded-none border-t-0 bg-transparent p-0 pt-2'

/** Grupo de controles colados (‹ 2026 ›): faixa com contorno preto e divisórias entre as partes. */
export const GRUPO = 'flex h-10 items-stretch border-2 border-contorno bg-card shadow-bloco-sm'

/** Botão de ícone dentro de um `GRUPO`: quadrado, sem contorno próprio. */
export const BOTAO_GRUPO = 'h-full w-9 rounded-none border-0 hover:bg-amarelo hover:text-tinta'

/** Botão com texto: bloco reto, rótulo em caixa alta (formato e sombra vêm do `Button`). */
export const BOTAO = 'h-10 px-4 text-xs font-semibold tracking-[0.08em] uppercase'

/** Rótulo em caixa alta: sobretítulos, cabeçalhos de coluna e rótulos de dado. */
export const ROTULO = 'text-[0.68rem] font-medium tracking-[0.08em] uppercase'

/** Tabelas de cadastro (lançamentos, categorias). */
export const TABELA = {
  tabela: 'text-[0.75rem] sm:text-[0.8125rem]',
  linhaCabecalho: 'border-b-2 border-b-contorno hover:bg-transparent',
  linha: 'border-b-border hover:bg-foreground/5',
  cabecalho: `h-auto px-3 py-2.5 text-foreground ${ROTULO}`,
  celula: 'px-3 py-2.5',
  /** Primeira coluna alinhada ao recuo do cabeçalho do card. */
  primeira: 'pl-4 sm:pl-5',
  ultima: 'pr-2 sm:pr-3',
} as const

/** Marca um saldo para ser borrado quando os saldos estão ocultos (regra em index.css). */
export const VALOR_SALDO = 'valor-saldo'

/** Tipografia: títulos na geométrica (`font-heading`, Outfit), em caixa alta e peso forte, como num cartaz. */
export const TITULO_PAGINA =
  'font-heading text-[2rem] leading-[0.95] font-extrabold tracking-[-0.02em] uppercase sm:text-[2.75rem]'

/** Título de card e de tela avulsa (login). */
export const TITULO_CARD = 'font-heading text-lg leading-none font-bold tracking-[-0.01em] uppercase'

/** Título de Dialog. */
export const TITULO_DIALOG = 'font-heading text-xl leading-tight font-bold tracking-[-0.01em] uppercase'

/** Número grande de card (KPI, percentual de meta): geométrica pesada, com algarismos tabulares da Inter ao lado. */
export const VALOR_DESTAQUE = 'font-heading leading-none font-bold tracking-[-0.02em] tabular-nums'
