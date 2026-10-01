import { useState, type ReactNode } from 'react'
import { ChartColumn, Table2 } from 'lucide-react'
import { CabecalhoCard } from '@/shared/components/CabecalhoCard'
import { ControleSegmentado } from '@/shared/components/ControleSegmentado'
import { CARD } from '@/shared/lib/estilos'
import type { FormaDaPagina } from '@/shared/lib/formas'
import { cn } from '@/shared/lib/utils'
import { Card } from '@/shared/ui/card'

type Visao = 'grafico' | 'tabela'

interface CardGraficoProps {
  titulo: string
  /** Faixa de cor à esquerda do título (`bg-azul`, `bg-vermelho`…). */
  faixa?: string
  /** Forma geométrica no bloco da faixa. */
  forma?: FormaDaPagina
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

export function CardGrafico({ titulo, faixa, forma, descricao, acoes, tabela, className, children }: CardGraficoProps) {
  const [visao, setVisao] = useState<Visao>('grafico')

  return (
    <Card className={cn(CARD, 'overflow-hidden', className)}>
      <CabecalhoCard
        titulo={titulo}
        faixa={faixa}
        forma={forma}
        descricao={descricao}
        acoes={
          (acoes || tabela) && (
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
          )
        }
      />

      <div className="pb-4">
        {tabela && visao === 'tabela' ? tabela : <div className="px-2 pt-4 sm:px-3">{children}</div>}
      </div>
    </Card>
  )
}
