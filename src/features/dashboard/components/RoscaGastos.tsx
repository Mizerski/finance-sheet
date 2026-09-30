import { Pie, PieChart } from 'recharts'
import { CATEGORIA_DESCONHECIDA } from '@/features/categorias/categoria'
import { PontoCor } from '@/shared/components/PontoCor'
import { formatarBRL } from '@/shared/lib/dinheiro'
import { VALOR_DESTAQUE } from '@/shared/lib/estilos'
import { formatarPercentual } from '@/shared/lib/percentual'
import { cn } from '@/shared/lib/utils'
import { ChartContainer, ChartTooltip } from '@/shared/ui/chart'
import { TooltipGrafico } from './TooltipGrafico'

/** Um grupo de saídas (categoria, tag…), já ordenado do maior para o menor. */
export interface ItemRosca {
  id: string
  nome: string
  cor: string
  centavos: number
  /** Complemento discreto na legenda e no tooltip (ex.: "evitável"). */
  detalhe?: string
}

interface Fatia extends ItemRosca {
  fill: string
}

/** Rosca só funciona bem com poucas fatias; o resto vira "Outras". */
const MAX_FATIAS = 6

function fatiar(itens: ItemRosca[]): Fatia[] {
  const fatias = itens.map((i) => ({ ...i, fill: i.cor }))
  if (fatias.length <= MAX_FATIAS) return fatias
  const resto = fatias.slice(MAX_FATIAS - 1)
  return [
    ...fatias.slice(0, MAX_FATIAS - 1),
    {
      id: 'outras',
      nome: `Outras (${resto.length})`,
      cor: CATEGORIA_DESCONHECIDA.cor,
      fill: CATEGORIA_DESCONHECIDA.cor,
      centavos: resto.reduce((t, f) => t + f.centavos, 0),
    },
  ]
}

interface RoscaGastosProps {
  itens: ItemRosca[]
  /** Rótulo do valor no tooltip (ex.: "Saídas no mês"). */
  rotuloValor: string
}

/** Rosca com o total no centro e legenda com percentual e valor de cada fatia. */
export function RoscaGastos({ itens, rotuloValor }: RoscaGastosProps) {
  const fatias = fatiar(itens)
  const total = fatias.reduce((t, f) => t + f.centavos, 0)

  return (
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
                    titulo={`${f.nome}${f.detalhe ? ` (${f.detalhe})` : ''} · ${formatarPercentual(f.centavos, total)}`}
                    itens={[{ rotulo: rotuloValor, cor: f.fill, centavos: f.centavos }]}
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
          <span className={cn('text-xl', VALOR_DESTAQUE)}>{formatarBRL(total)}</span>
        </div>
      </div>

      {/* Legenda com valores: identifica as fatias sem depender só da cor. */}
      <ul className="flex w-full min-w-0 flex-col gap-2.5 text-sm">
        {fatias.map((f) => (
          <li key={f.id} className="flex items-center gap-2">
            <PontoCor cor={f.fill} className="size-2.5 rounded-[3px]" />
            <span className="min-w-0 flex-1 truncate">
              {f.nome}
              {f.detalhe && <span className="text-xs text-muted-foreground"> · {f.detalhe}</span>}
            </span>
            <span className="text-xs text-muted-foreground tabular-nums">{formatarPercentual(f.centavos, total)}</span>
            <span className="w-24 text-right tabular-nums">{formatarBRL(f.centavos)}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}
