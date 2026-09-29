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

/** O contorno na cor do card cria o respiro de 2px entre os segmentos empilhados. */
const RESPIRO = { stroke: 'var(--card)', strokeWidth: 2 }

export function GraficoFixasVariaveis({ dados, unidade }: { dados: DadoPeriodo[]; unidade: Unidade }) {
  const escala = escalaY(dados.map((d) => d.saidas))

  return (
    <CardGrafico
      titulo="Saídas fixas vs variáveis"
      descricao={`Como as saídas de ${NOME_UNIDADE[unidade].cada} se dividem`}
      tabela={
        <TabelaPeriodos
          dados={dados}
          periodo={NOME_UNIDADE[unidade].coluna}
          rotulo={(d) => d.rotuloLongo}
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
                    { rotulo: SERIES.fixas.label, cor: SERIES.fixas.color, centavos: d.fixas },
                    { rotulo: SERIES.variaveis.label, cor: SERIES.variaveis.color, centavos: d.variaveis },
                  ]}
                  rodape={{ rotulo: 'Total de saídas', centavos: d.saidas }}
                />
              )
            }}
          />
          <Bar dataKey="fixas" stackId="saidas" fill="var(--color-fixas)" maxBarSize={24} {...RESPIRO} isAnimationActive={false} />
          <Bar
            dataKey="variaveis"
            stackId="saidas"
            fill="var(--color-variaveis)"
            radius={[4, 4, 0, 0]}
            maxBarSize={24}
            {...RESPIRO}
            isAnimationActive={false}
          />
        </BarChart>
      </ChartContainer>
    </CardGrafico>
  )
}
