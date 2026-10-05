import { CartesianGrid, LabelList, Line, LineChart, ReferenceLine, XAxis, YAxis } from 'recharts'
import { formatarBRL, formatarBRLCompacto } from '@/shared/lib/dinheiro'
import { VALOR_SALDO } from '@/shared/lib/estilos'
import { cn } from '@/shared/lib/utils'
import { ChartContainer, ChartTooltip } from '@/shared/ui/chart'
import { AREA_GRAFICO, escalaY, SERIES, type DadoPeriodo } from '../utils/graficos'
import type { Unidade } from '@/shared/lib/periodo'
import { NOME_UNIDADE } from '../utils/relatorio'
import { CardGrafico } from './CardGrafico'
import { TabelaPeriodos } from './TabelaPeriodos'
import { TooltipGrafico } from './TooltipGrafico'

interface PontoProps {
  cx?: number
  cy?: number
  index?: number
  value?: number | null
}

/** Marcador quadrado de 8px; abaixo de zero fica vermelho. */
function Ponto({ cx, cy, value, index }: PontoProps) {
  if (cx === undefined || cy === undefined || value == null) return <g key={index} />
  return (
    <rect
      key={index}
      x={cx - 4}
      y={cy - 4}
      width={8}
      height={8}
      fill={value < 0 ? 'var(--negativo)' : 'var(--color-saldo)'}
    />
  )
}

interface GraficoSaldoProps {
  dados: DadoPeriodo[]
  unidade: Unidade
  className?: string
}

export function GraficoSaldo({ dados, unidade, className }: GraficoSaldoProps) {
  const { cada, noFim } = NOME_UNIDADE[unidade]
  const ultimo = dados.findLastIndex((d) => d.saldo !== null)
  const saldos = dados.flatMap((d) => (d.saldo === null ? [] : [d.saldo]))
  const temNegativo = saldos.some((s) => s < 0)
  const escala = escalaY(saldos)

  return (
    <CardGrafico
      titulo={`Saldo no fim de ${cada}`}
      faixa="bg-tinta"
      forma={{ forma: 'quarto', cor: 'vermelho' }}
      descricao={`Quanto sobra na conta ${noFim}`}
      className={className}
      tabela={
        <TabelaPeriodos
          dados={dados}
          periodo={NOME_UNIDADE[unidade].coluna}
          rotulo={(d) => d.rotuloLongo}
          colunas={[{ chave: 'saldo', rotulo: 'Saldo' }]}
        />
      }
    >
      <ChartContainer config={SERIES} className={AREA_GRAFICO}>
        <LineChart data={dados} margin={{ top: 24, right: 12, left: 4, bottom: 0 }}>
          <CartesianGrid vertical={false} stroke="var(--border)" />
          <XAxis dataKey="rotulo" tickLine={false} axisLine={false} tickMargin={8} />
          <YAxis
            {...escala}
            tickFormatter={formatarBRLCompacto}
            tickLine={false}
            axisLine={false}
            width={76}
            className="tabular-nums"
            tick={{ className: VALOR_SALDO }}
          />
          {temNegativo && <ReferenceLine y={0} stroke="var(--vermelho)" strokeWidth={2} strokeDasharray="6 4" />}
          <ChartTooltip
            cursor={{ stroke: 'var(--contorno)', strokeWidth: 1, strokeDasharray: '3 3' }}
            content={({ active, payload }) => {
              const d = payload?.[0]?.payload as DadoPeriodo | undefined
              if (!active || !d || d.saldo === null) return null
              return (
                <TooltipGrafico
                  titulo={d.rotuloLongo}
                  itens={[{ rotulo: `Saldo ${noFim}`, cor: SERIES.saldo.color, centavos: d.saldo }]}
                />
              )
            }}
          />
          <Line
            dataKey="saldo"
            type="linear"
            stroke="var(--color-saldo)"
            strokeWidth={3}
            strokeLinejoin="miter"
            strokeLinecap="square"
            dot={(props: PontoProps) => <Ponto key={props.index} {...props} />}
            activeDot={{ r: 6, fill: 'var(--amarelo)', stroke: 'var(--contorno)', strokeWidth: 2 }}
            isAnimationActive={false}
          >
            <LabelList
              dataKey="saldo"
              content={({ x, y, value, index }) =>
                index === ultimo && typeof value === 'number' ? (
                  <text
                    x={Number(x)}
                    y={Number(y) - 12}
                    textAnchor="end"
                    className={cn('fill-foreground text-xs font-semibold', VALOR_SALDO)}
                  >
                    {formatarBRL(value)}
                  </text>
                ) : null
              }
            />
          </Line>
        </LineChart>
      </ChartContainer>
    </CardGrafico>
  )
}
