import { Bar, BarChart, CartesianGrid, Cell, XAxis, YAxis } from 'recharts'
import { formatarBRLCompacto } from '@/shared/lib/dinheiro'
import { ChartContainer, ChartTooltip } from '@/shared/ui/chart'
import { AREA_GRAFICO, escalaY, CONTORNO, SERIES, type DadoGastoAno, type SerieCategoria } from '../graficos'
import { CardGrafico } from './CardGrafico'
import { Legenda } from './Legenda'
import { TabelaGastosAno } from './TabelaGastosAno'
import { TooltipGrafico } from './TooltipGrafico'

interface GraficoGastosAnoProps {
  dados: DadoGastoAno[]
  series: SerieCategoria[]
  /** Anos que o período do dashboard cobre, realçados no gráfico e na tabela. */
  destaque: (ano: number) => boolean
  anoAtual: number
  onAno: (ano: number) => void
}

/** Anos fora do período ficam esmaecidos, para os do período se destacarem. */
const OPACIDADE_OUTROS = 0.4

function situacao(ano: number, anoAtual: number) {
  return ano === anoAtual ? 'ano atual' : ano > anoAtual ? 'projeção' : 'realizado'
}

export function GraficoGastosAno({ dados, series, destaque, anoAtual, onAno }: GraficoGastosAnoProps) {
  const escala = escalaY(dados.map((d) => d.saidas))
  const abrir = (_: unknown, indice: number) => onAno(dados[indice].numero)

  return (
    <CardGrafico
      className="lg:col-span-2"
      titulo="Gastos por ano"
      faixa="bg-azul"
      descricao={`Saídas por categoria de ${dados[0].ano} a ${dados[dados.length - 1].ano} · clique em um ano para abri-lo`}
      tabela={<TabelaGastosAno dados={dados} series={series} destaque={(d) => destaque(d.numero)} />}
    >
      <Legenda itens={series.map((s) => ({ rotulo: s.nome, cor: s.cor }))} />
      <ChartContainer config={SERIES} className={AREA_GRAFICO}>
        <BarChart data={dados} margin={{ top: 16, right: 12, left: 4, bottom: 0 }} barCategoryGap="30%">
          <CartesianGrid vertical={false} stroke="var(--border)" />
          <XAxis dataKey="ano" tickLine={false} axisLine={false} tickMargin={8} />
          <YAxis {...escala} tickFormatter={formatarBRLCompacto} tickLine={false} axisLine={false} width={76} />
          <ChartTooltip
            cursor={{ fill: 'var(--amarelo)', fillOpacity: 0.3 }}
            content={({ active, payload }) => {
              const d = payload?.[0]?.payload as DadoGastoAno | undefined
              if (!active || !d) return null
              return (
                <TooltipGrafico
                  titulo={`${d.ano} · ${situacao(d.numero, anoAtual)}`}
                  itens={series
                    .filter((s) => d.valores[s.chave])
                    .map((s) => ({ rotulo: s.nome, cor: s.cor, centavos: d.valores[s.chave] }))}
                  rodape={{ rotulo: 'Total de saídas', centavos: d.saidas }}
                />
              )
            }}
          />
          {series.map((s) => (
            <Bar
              key={s.chave}
              dataKey={(d: DadoGastoAno) => d.valores[s.chave] ?? 0}
              name={s.nome}
              stackId="saidas"
              fill={s.cor}
              maxBarSize={40}
              {...CONTORNO}
              className="cursor-pointer"
              onClick={abrir}
              isAnimationActive={false}
            >
              {dados.map((d) => (
                <Cell key={`${s.chave}-${d.ano}`} fillOpacity={destaque(d.numero) ? 1 : OPACIDADE_OUTROS} />
              ))}
            </Bar>
          ))}
        </BarChart>
      </ChartContainer>
    </CardGrafico>
  )
}
