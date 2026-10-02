import type { CorForma, TipoForma } from '@/shared/lib/formas'
import { cn } from '@/shared/lib/utils'

const COR: Record<CorForma, string> = {
  vermelho: 'bg-vermelho',
  azul: 'bg-azul',
  amarelo: 'bg-amarelo',
  papel: 'bg-sobre-bloco',
  tinta: 'bg-current',
}

const FORMATO: Record<TipoForma, string> = {
  quadrado: '',
  circulo: 'rounded-full',
  triangulo: '[clip-path:polygon(50%_0,100%_100%,0_100%)]',
  // Meia-lua deitada: ocupa a metade de baixo do quadrado, com a curva para cima.
  semicirculo: 'rounded-t-full [clip-path:inset(0_0_50%_0)] translate-y-1/4',
  quarto: 'rounded-tl-full',
}

interface FormaProps {
  forma: TipoForma
  cor: CorForma
  /** Tamanho (`size-*`) e posição. */
  className?: string
}

/** Forma geométrica da Bauhaus: identifica cada tela no menu e no título, e compõe a marca. Decorativa. */
export function Forma({ forma, cor, className }: FormaProps) {
  return <span aria-hidden className={cn('inline-block size-3 shrink-0', COR[cor], FORMATO[forma], className)} />
}
