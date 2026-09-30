import type { ReactNode } from 'react'
import { CARD, VALOR_SALDO } from '@/shared/lib/estilos'
import { cn } from '@/shared/lib/utils'
import { Card } from '@/shared/ui/card'

interface CartaoIndicadorProps {
  rotulo: string
  valor: string
  /** Linha de contexto abaixo do valor. */
  detalhe?: ReactNode
  /** Cor da marca ao lado do rótulo (identifica a série nos gráficos). */
  corMarca?: string
  negativo?: boolean
  /** O valor é um saldo e some quando os saldos estão ocultos. */
  saldo?: boolean
  className?: string
}

export function CartaoIndicador({ rotulo, valor, detalhe, corMarca, negativo, saldo, className }: CartaoIndicadorProps) {
  return (
    <Card className={cn(CARD, 'gap-2 p-4 sm:p-5', className)}>
      <p className="flex items-center gap-2 text-[0.7rem] tracking-wide text-muted-foreground uppercase">
        {corMarca && <span aria-hidden className="size-2.5 rounded-[3px]" style={{ backgroundColor: corMarca }} />}
        {rotulo}
      </p>
      {/* Números grandes com algarismos proporcionais (sem tabular-nums). */}
      <p className={cn('text-2xl leading-none font-medium tracking-tight', saldo && VALOR_SALDO, negativo && 'text-negativo')}>{valor}</p>
      {detalhe && <p className="text-xs text-muted-foreground">{detalhe}</p>}
    </Card>
  )
}
