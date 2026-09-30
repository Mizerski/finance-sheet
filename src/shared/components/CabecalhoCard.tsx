import type { ReactNode } from 'react'
import { ROTULO, TITULO_CARD } from '@/shared/lib/estilos'
import { cn } from '@/shared/lib/utils'

interface CabecalhoCardProps {
  titulo: ReactNode
  /** Quantidade de itens, num bloco preto ao lado do título. */
  contagem?: number
  /** Faixa de cor à esquerda (`bg-azul`, `bg-vermelho`…), para dizer do que o card trata. */
  faixa?: string
  descricao?: ReactNode
  /** Número de destaque à direita, com o rótulo em caixa alta em cima. */
  destaque?: { rotulo: ReactNode; valor: ReactNode; className?: string }
  /** Controles à direita (no lugar do destaque ou depois dele). */
  acoes?: ReactNode
}

/** Cabeçalho de card: faixa de cor, título em caixa alta, destaque ou ações à direita e régua preta embaixo. */
export function CabecalhoCard({ titulo, contagem, faixa, descricao, destaque, acoes }: CabecalhoCardProps) {
  return (
    <header className="flex items-stretch border-b-2 border-foreground">
      {faixa && <span aria-hidden className={cn('w-3 shrink-0 border-r-2 border-foreground sm:w-4', faixa)} />}
      <div className="flex min-w-0 flex-1 flex-wrap items-center justify-between gap-x-4 gap-y-2 px-4 py-3 sm:px-5">
        <div className="flex min-w-0 flex-col gap-1.5">
          <h2 className={cn(TITULO_CARD, 'flex flex-wrap items-center gap-2')}>
            {titulo}
            {contagem !== undefined && (
              <span className="bg-foreground px-1.5 py-1 font-sans text-xs leading-none font-semibold text-background tabular-nums">
                {contagem}
              </span>
            )}
          </h2>
          {descricao && <p className="text-sm text-muted-foreground">{descricao}</p>}
        </div>
        {(destaque || acoes) && (
          <div className="flex items-center gap-3">
            {destaque && (
              <div className="flex flex-col items-end gap-1 text-right">
                <span className={cn(ROTULO, 'text-muted-foreground')}>{destaque.rotulo}</span>
                <span className={cn('text-sm leading-none font-semibold tabular-nums', destaque.className)}>
                  {destaque.valor}
                </span>
              </div>
            )}
            {acoes}
          </div>
        )}
      </div>
    </header>
  )
}
