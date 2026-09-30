import type { ReactNode } from 'react'
import { formatarBRL } from '@/shared/lib/dinheiro'
import { cn } from '@/shared/lib/utils'

export interface ItemTooltip {
  rotulo: string
  cor: string
  centavos: number
}

interface TooltipGraficoProps {
  titulo: ReactNode
  itens: ItemTooltip[]
  /** Linha de total/resultado abaixo dos itens. */
  rodape?: { rotulo: string; centavos: number }
}

/** Tooltip dos gráficos com valores em R$ (o do shadcn formata como número puro). */
export function TooltipGrafico({ titulo, itens, rodape }: TooltipGraficoProps) {
  return (
    <div className="grid min-w-44 gap-1.5 border-2 border-foreground bg-popover px-3 py-2 text-xs text-popover-foreground shadow-bloco">
      <p className="font-heading text-sm font-bold uppercase">{titulo}</p>
      {itens.map((item) => (
        <div key={item.rotulo} className="flex items-center gap-2">
          <span aria-hidden className="size-3 shrink-0 border-[1.5px] border-foreground" style={{ backgroundColor: item.cor }} />
          <span className="flex-1 text-muted-foreground">{item.rotulo}</span>
          <span className="font-semibold tabular-nums">{formatarBRL(item.centavos)}</span>
        </div>
      ))}
      {rodape && (
        <div className="flex items-center justify-between gap-2 border-t-2 border-foreground pt-1.5">
          <span className="text-muted-foreground">{rodape.rotulo}</span>
          <span className={cn('font-semibold tabular-nums', rodape.centavos < 0 && 'text-negativo')}>
            {formatarBRL(rodape.centavos)}
          </span>
        </div>
      )}
    </div>
  )
}
