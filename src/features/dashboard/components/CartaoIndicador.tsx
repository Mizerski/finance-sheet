import type { ReactNode } from 'react'
import { Forma } from '@/shared/components/Forma'
import { CARD, ROTULO, VALOR_DESTAQUE, VALOR_SALDO } from '@/shared/lib/estilos'
import type { TipoForma } from '@/shared/lib/formas'
import { cn } from '@/shared/lib/utils'
import { Card } from '@/shared/ui/card'

/**
 * Bloco de cor do cartão, como nos cartazes da Bauhaus. Entradas em azul e saídas em vermelho repetem a cor
 * da série nos gráficos; os saldos ficam no papel, onde o vermelho de negativo tem contraste.
 */
const TOM = {
  azul: 'bg-azul text-sobre-bloco',
  vermelho: 'bg-vermelho text-sobre-bloco',
  amarelo: 'bg-amarelo text-tinta',
  papel: 'bg-card text-foreground',
} as const

interface CartaoIndicadorProps {
  rotulo: string
  valor: string
  /** Linha de contexto abaixo do valor. */
  detalhe?: ReactNode
  tom?: keyof typeof TOM
  /** Forma no canto do cartão, na cor do texto. */
  forma?: TipoForma
  negativo?: boolean
  /** O valor é um saldo e some quando os saldos estão ocultos. */
  saldo?: boolean
  className?: string
}

export function CartaoIndicador({
  rotulo,
  valor,
  detalhe,
  tom = 'papel',
  forma,
  negativo,
  saldo,
  className,
}: CartaoIndicadorProps) {
  const colorido = tom !== 'papel'

  return (
    <Card className={cn(CARD, 'relative gap-3 p-4 sm:p-5', TOM[tom], className)}>
      <p className={cn(ROTULO, 'flex items-center justify-between gap-2', !colorido && 'text-muted-foreground')}>
        {rotulo}
        {forma && <Forma forma={forma} cor="tinta" className={cn('size-4', !colorido && 'text-foreground')} />}
      </p>
      <p className={cn('text-[2rem]', VALOR_DESTAQUE, saldo && VALOR_SALDO, negativo && 'text-negativo')}>{valor}</p>
      {detalhe && <p className={cn('text-xs', colorido ? 'opacity-90' : 'text-muted-foreground')}>{detalhe}</p>}
    </Card>
  )
}
