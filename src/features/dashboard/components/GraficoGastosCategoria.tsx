import { Pie, PieChart } from 'recharts'
import { CATEGORIA_DESCONHECIDA } from '@/features/categorias/categoria'
import type { GastoCategoria } from '@/features/projecao/projecao'
import { EstadoVazio } from '@/shared/components/EstadoVazio'
import { PontoCor } from '@/shared/components/PontoCor'
import { formatarBRL } from '@/shared/lib/dinheiro'
import { ChartContainer, ChartTooltip } from '@/shared/ui/chart'
import { CardGrafico } from './CardGrafico'
import { TooltipGrafico } from './TooltipGrafico'

interface GraficoGastosCategoriaProps {
  gastos: GastoCategoria[]
  /** "no mês", "na semana"… do período escolhido no topo do dashboard. */
  noPeriodo: string
}

interface Fatia {
  id: string
  nome: string
  centavos: number
  fill: string
}

/** Rosca só funciona bem com poucas fatias; o resto vira "Outras". */
const MAX_FATIAS = 6

function fatiar(gastos: GastoCategoria[]): Fatia[] {
  const fatias = gastos.map((g) => ({ id: g.categoriaId, nome: g.nome, centavos: g.totalCentavos, fill: g.cor }))
  if (fatias.length <= MAX_FATIAS) return fatias
  const resto = fatias.slice(MAX_FATIAS - 1)
  return [
    ...fatias.slice(0, MAX_FATIAS - 1),
    {
      id: 'outras',
      nome: `Outras (${resto.length})`,
      centavos: resto.reduce((t, f) => t + f.centavos, 0),
      fill: CATEGORIA_DESCONHECIDA.cor,
    },
  ]
}

function percentual(parte: number, total: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'percent', maximumFractionDigits: 1 }).format(parte / total)
}

export function GraficoGastosCategoria({ gastos, noPeriodo: periodo }: GraficoGastosCategoriaProps) {
  const fatias = fatiar(gastos)
  const total = fatias.reduce((t, f) => t + f.centavos, 0)

  return (
    <CardGrafico titulo="Gastos por categoria" descricao={`Para onde vão as saídas ${periodo}`}>
      {fatias.length === 0 ? (
        <EstadoVazio titulo={`Nenhuma saída ${periodo}`} />
      ) : (
        <div className="flex flex-col items-center gap-4 px-2 sm:flex-row sm:gap-6 sm:px-3">
          <div className="relative size-56 shrink-0">
            <ChartContainer config={{}} className="aspect-square size-full">
              <PieChart>
                <ChartTooltip
                  content={({ active, payload }) => {
                    const f = payload?.[0]?.payload as Fatia | undefined
                    if (!active || !f) return null
                    return (
                      <TooltipGrafico
                        titulo={`${f.nome} · ${percentual(f.centavos, total)}`}
                        itens={[{ rotulo: `Saídas ${periodo}`, cor: f.fill, centavos: f.centavos }]}
                      />
                    )
                  }}
                />
                <Pie
                  data={fatias}
                  dataKey="centavos"
                  nameKey="nome"
                  innerRadius="68%"
                  outerRadius="100%"
                  cornerRadius={4}
                  stroke="var(--card)"
                  strokeWidth={2}
                  isAnimationActive={false}
                />
              </PieChart>
            </ChartContainer>
            {/* Total no centro da rosca; não intercepta o hover das fatias. */}
            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
              <span className="text-[0.7rem] tracking-wide text-muted-foreground uppercase">Total</span>
              <span className="text-lg font-medium tracking-tight">{formatarBRL(total)}</span>
            </div>
          </div>

          {/* Legenda com valores: identifica as fatias sem depender só da cor. */}
          <ul className="flex w-full min-w-0 flex-col gap-2.5 text-sm">
            {fatias.map((f) => (
              <li key={f.id} className="flex items-center gap-2">
                <PontoCor cor={f.fill} className="size-2.5 rounded-[3px]" />
                <span className="min-w-0 flex-1 truncate">{f.nome}</span>
                <span className="text-xs text-muted-foreground tabular-nums">{percentual(f.centavos, total)}</span>
                <span className="w-24 text-right tabular-nums">{formatarBRL(f.centavos)}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </CardGrafico>
  )
}
