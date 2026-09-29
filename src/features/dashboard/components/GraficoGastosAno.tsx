import { Bar, BarChart, CartesianGrid, Cell, XAxis, YAxis } from 'recharts'
import { formatarBRLCompacto } from '@/shared/lib/dinheiro'
import { ChartContainer, ChartTooltip } from '@/shared/ui/chart'
import { AREA_GRAFICO, escalaY, SERIES, type DadoAnual } from '../graficos'
import { CardGrafico } from './CardGrafico'
import { Legenda } from './Legenda'
import { TabelaPeriodos } from './TabelaPeriodos'
import { TooltipGrafico } from './TooltipGrafico'

interface GraficoGastosAnoProps {
  dados: DadoAnual[]
  /** Anos que o período do dashboard cobre, realçados no gráfico e na tabela. */
  destaque: (ano: number) => boolean
  anoAtual: number
  onAno: (ano: number) => void
}

/** O contorno na cor do card cria o respiro de 2px entre os segmentos empilhados. */
const RESPIRO = { stroke: 'var(--card)', strokeWidth: 2 }

/** Anos fora do período ficam esmaecidos, para os do período se destacarem. */
const OPACIDADE_OUTROS = 0.4

function situacao(ano: number, anoAtual: number) {
  return ano === anoAtual ? 'ano atual' : ano > anoAtual ? 'projeção' : 'realizado'
}

export function GraficoGastosAno({ dados, destaque, anoAtual, onAno }: GraficoGastosAnoProps) {
  const escala = escalaY(dados.map((d) => d.saidas))
  const celulas = (serie: string) =>
    dados.map((d) => <Cell key={`${serie}-${d.ano}`} fillOpacity={destaque(d.numero) ? 1 : OPACIDADE_OUTROS} />)
  const abrir = (_: unknown, indice: number) => onAno(dados[indice].numero)

  return (
    <CardGrafico
      className="lg:col-span-2"
      titulo="Gastos por ano"
      descricao={`Saídas de ${dados[0].ano} a ${dados[dados.length - 1].ano} · clique em um ano para abri-lo`}
      tabela={
        <TabelaPeriodos
          dados={dados}
          periodo="Ano"
          rotulo={(d) => d.ano}
          destaque={(d) => destaque(d.numero)}
          colunas={[
            { chave: 'fixas', rotulo: 'Fixas' },
            { chave: 'variaveis', rotulo: 'Variáveis' },
            { chave: 'saidas', rotulo: 'Total' },
          ]}
        />
      }
    >
      <Legenda
        itens={[
          { rotulo: SERIES.fixas.label, cor: SERIES.fixas.color },
          { rotulo: SERIES.variaveis.label, cor: SERIES.variaveis.color },
        ]}
      />
      <ChartContainer config={SERIES} className={AREA_GRAFICO}>
        <BarChart data={dados} margin={{ top: 16, right: 12, left: 4, bottom: 0 }} barCategoryGap="30%">
          <CartesianGrid vertical={false} stroke="var(--border)" />
          <XAxis dataKey="ano" tickLine={false} axisLine={false} tickMargin={8} />
          <YAxis {...escala} tickFormatter={formatarBRLCompacto} tickLine={false} axisLine={false} width={76} />
          <ChartTooltip
            cursor={{ fill: 'var(--foreground)', fillOpacity: 0.04 }}
            content={({ active, payload }) => {
              const d = payload?.[0]?.payload as DadoAnual | undefined
              if (!active || !d) return null
              return (
                <TooltipGrafico
                  titulo={`${d.ano} · ${situacao(d.numero, anoAtual)}`}
                  itens={[
                    { rotulo: SERIES.fixas.label, cor: SERIES.fixas.color, centavos: d.fixas },
                    { rotulo: SERIES.variaveis.label, cor: SERIES.variaveis.color, centavos: d.variaveis },
                  ]}
                  rodape={{ rotulo: 'Total de saídas', centavos: d.saidas }}
                />
              )
            }}
          />
          <Bar
            dataKey="fixas"
            stackId="saidas"
            fill="var(--color-fixas)"
            maxBarSize={40}
            {...RESPIRO}
            className="cursor-pointer"
            onClick={abrir}
            isAnimationActive={false}
          >
            {celulas('fixas')}
          </Bar>
          <Bar
            dataKey="variaveis"
            stackId="saidas"
            fill="var(--color-variaveis)"
            radius={[4, 4, 0, 0]}
            maxBarSize={40}
            {...RESPIRO}
            className="cursor-pointer"
            onClick={abrir}
            isAnimationActive={false}
          >
            {celulas('variaveis')}
          </Bar>
        </BarChart>
      </ChartContainer>
    </CardGrafico>
  )
}
