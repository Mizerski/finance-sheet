/** Classes repetidas entre telas (design system: controles em pílula, cards rounded-3xl). */

/** Card de conteúdo. Use no `className` do `Card`. */
export const CARD = 'gap-0 rounded-3xl py-0 shadow-none ring-border'

/** Input em pílula. */
export const CAMPO = 'h-10 rounded-full bg-card px-4'

/** SelectTrigger em pílula (o tamanho padrão do shadcn vem por atributo). */
export const CAMPO_SELECT = 'w-full rounded-full bg-card px-4 data-[size=default]:h-10'

/** Popover e Dialog. */
export const CAMADA = 'rounded-2xl p-4 shadow-lg ring-border'

/** Rodapé de Dialog sem a faixa cinza padrão do shadcn. */
export const RODAPE_DIALOG = 'mx-0 mb-0 rounded-none border-t-0 bg-transparent p-0 pt-2'

/** Botão de ação principal ou secundária solta. */
export const BOTAO = 'h-10 rounded-full px-4'

/** Tabelas de cadastro (lançamentos, categorias). */
export const TABELA = {
  tabela: 'text-[0.75rem] sm:text-[0.8125rem]',
  linhaCabecalho: 'border-b-border/70 hover:bg-transparent',
  linha: 'border-b-border/50 hover:bg-foreground/4',
  cabecalho: 'h-auto px-3 py-2.5 text-[0.68rem] font-medium tracking-wide text-muted-foreground uppercase',
  celula: 'px-3 py-2.5',
  /** Primeira coluna alinhada ao recuo do cabeçalho do card. */
  primeira: 'pl-4 sm:pl-5',
  ultima: 'pr-2 sm:pr-3',
} as const

/** Marca um saldo para ser borrado quando os saldos estão ocultos (regra em index.css). */
export const VALOR_SALDO = 'valor-saldo'

/** Tipografia: títulos e números de destaque na serifada (`font-heading`), em peso normal. */
export const TITULO_PAGINA = 'font-heading text-[1.75rem] leading-tight font-normal tracking-[-0.015em] sm:text-3xl'

/** Título de card e de tela avulsa (login). */
export const TITULO_CARD = 'font-heading text-xl leading-none font-normal tracking-[-0.01em]'

/** Título de Dialog. */
export const TITULO_DIALOG = 'font-heading text-xl leading-tight font-normal tracking-[-0.01em]'

/** Número grande de card (KPI, percentual de meta): serifada, com algarismos proporcionais e na altura das maiúsculas. */
export const VALOR_DESTAQUE = 'font-heading leading-none font-normal tracking-[-0.01em] proportional-nums lining-nums'
