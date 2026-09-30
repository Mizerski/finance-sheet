import { useState, type ReactNode } from 'react'
import { ChartColumn, Table2 } from 'lucide-react'
import { ControleSegmentado } from '@/shared/components/ControleSegmentado'
import { CARD, TITULO_CARD } from '@/shared/lib/estilos'
import { cn } from '@/shared/lib/utils'
import { Card } from '@/shared/ui/card'

type Visao = 'grafico' | 'tabela'

interface CardGraficoProps {
  titulo: string
  descricao?: ReactNode
  /** Controles que afetam só este gráfico (ex.: filtro de mês). */
  acoes?: ReactNode
  /** Mesmos dados em tabela. Quando presente, aparece a alternância gráfico/tabela. */
  tabela?: ReactNode
  className?: string
  children: ReactNode
}

const OPCOES_VISAO = [
  {
    valor: 'grafico' as const,
    rotulo: (
      <>
        <ChartColumn className="size-3.5" />
        <span className="sr-only">Gráfico</span>
      </>
    ),
  },
  {
    valor: 'tabela' as const,
    rotulo: (
      <>
        <Table2 className="size-3.5" />
        <span className="sr-only">Tabela</span>
      </>
    ),
  },
]

export function CardGrafico({ titulo, descricao, acoes, tabela, className, children }: CardGraficoProps) {
  const [visao, setVisao] = useState<Visao>('grafico')

  return (
    <Card className={cn(CARD, 'overflow-hidden', className)}>
      <header className="flex flex-wrap items-start justify-between gap-3 px-4 pt-4 pb-3 sm:px-5">
        <div className="flex min-w-0 flex-col gap-1.5">
          <h2 className={TITULO_CARD}>{titulo}</h2>
          {descricao && <p className="text-sm text-muted-foreground">{descricao}</p>}
        </div>
        <div className="flex items-center gap-2">
          {acoes}
          {tabela && (
            <ControleSegmentado
              rotulo={`Visualização de ${titulo.toLowerCase()}`}
              valor={visao}
              opcoes={OPCOES_VISAO}
              onChange={setVisao}
            />
          )}
        </div>
      </header>

      <div className="pb-4">{tabela && visao === 'tabela' ? tabela : <div className="px-2 sm:px-3">{children}</div>}</div>
    </Card>
  )
}
