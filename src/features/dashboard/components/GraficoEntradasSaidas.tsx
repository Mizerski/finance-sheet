import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts'
import { formatarBRLCompacto } from '@/shared/lib/dinheiro'
import { ChartContainer, ChartTooltip } from '@/shared/ui/chart'
import { AREA_GRAFICO, escalaY, SERIES, type DadoPeriodo } from '../graficos'
import type { Unidade } from '../periodo'
import { NOME_UNIDADE } from '../relatorio'
import { CardGrafico } from './CardGrafico'
import { Legenda } from './Legenda'
import { TabelaPeriodos } from './TabelaPeriodos'
import { TooltipGrafico } from './TooltipGrafico'

/** Barras finas com topo arredondado e base reta. */
const RAIO_TOPO: [number, number, number, number] = [4, 4, 0, 0]

export function GraficoEntradasSaidas({ dados, unidade }: { dados: DadoPeriodo[]; unidade: Unidade }) {
  const escala = escalaY(dados.flatMap((d) => [d.entradas, d.saidas]))

  return (
    <CardGrafico
      titulo="Entradas vs saídas"
      descricao={`Total que entra e sai em ${NOME_UNIDADE[unidade].cada}`}
      tabela={
        <TabelaPeriodos
          dados={dados}
          periodo={NOME_UNIDADE[unidade].coluna}
          rotulo={(d) => d.rotuloLongo}
          colunas={[
            { chave: 'entradas', rotulo: 'Entradas' },
            { chave: 'saidas', rotulo: 'Saídas' },
          ]}
        />
      }
    >
      <Legenda
        itens={[
          { rotulo: SERIES.entradas.label, cor: SERIES.entradas.color },
          { rotulo: SERIES.saidas.label, cor: SERIES.saidas.color },
        ]}
      />
      <ChartContainer config={SERIES} className={AREA_GRAFICO}>
        <BarChart data={dados} margin={{ top: 16, right: 12, left: 4, bottom: 0 }} barGap={2} barCategoryGap="24%">
          <CartesianGrid vertical={false} stroke="var(--border)" />
          <XAxis dataKey="rotulo" tickLine={false} axisLine={false} tickMargin={8} />
          <YAxis {...escala} tickFormatter={formatarBRLCompacto} tickLine={false} axisLine={false} width={76} />
          <ChartTooltip
            content={({ active, payload }) => {
              const d = payload?.[0]?.payload as DadoPeriodo | undefined
              if (!active || !d) return null
              return (
                <TooltipGrafico
                  titulo={d.rotuloLongo}
                  itens={[
                    { rotulo: SERIES.entradas.label, cor: SERIES.entradas.color, centavos: d.entradas },
                    { rotulo: SERIES.saidas.label, cor: SERIES.saidas.color, centavos: d.saidas },
                  ]}
                  rodape={{ rotulo: 'Resultado', centavos: d.entradas - d.saidas }}
                />
              )
            }}
          />
          <Bar dataKey="entradas" fill="var(--color-entradas)" radius={RAIO_TOPO} maxBarSize={24} isAnimationActive={false} />
          <Bar dataKey="saidas" fill="var(--color-saidas)" radius={RAIO_TOPO} maxBarSize={24} isAnimationActive={false} />
        </BarChart>
      </ChartContainer>
    </CardGrafico>
  )
}
