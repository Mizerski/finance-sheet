import { Bar, BarChart, CartesianGrid, Cell, ReferenceLine, Rectangle, XAxis, YAxis, type BarShapeProps } from 'recharts'
import { formatarBRLCompacto } from '@/shared/lib/dinheiro'
import { ChartContainer, ChartTooltip } from '@/shared/ui/chart'
import { AREA_GRAFICO, CONTORNO, escalaY, SERIES, type DadoPeriodo } from '../graficos'
import type { Unidade } from '../periodo'
import { NOME_UNIDADE } from '../relatorio'
import { CardGrafico } from './CardGrafico'
import { TabelaPeriodos } from './TabelaPeriodos'
import { TooltipGrafico } from './TooltipGrafico'

/** Bloco reto com contorno preto, para cima ou para baixo do zero. */
function BarraComSinal(props: BarShapeProps) {
  return <Rectangle {...props} {...CONTORNO} />
}

export function GraficoSobras({ dados, unidade }: { dados: DadoPeriodo[]; unidade: Unidade }) {
  const escala = escalaY(dados.map((d) => d.sobra))
  const temNegativo = dados.some((d) => d.sobra < 0)
  const temEconomia = dados.some((d) => d.economia > 0)

  return (
    <CardGrafico
      titulo="Sobras"
      faixa="bg-amarelo"
      forma={{ forma: 'semicirculo', cor: 'tinta' }}
      descricao={`Quanto sobrou em ${NOME_UNIDADE[unidade].cada}: entradas menos saídas${temEconomia ? ' e economia' : ''}`}
      tabela={
        <TabelaPeriodos
          dados={dados}
          periodo={NOME_UNIDADE[unidade].coluna}
          rotulo={(d) => d.rotuloLongo}
          colunas={[
            { chave: 'entradas', rotulo: 'Entradas' },
            { chave: 'saidas', rotulo: 'Saídas' },
            ...(temEconomia ? [{ chave: 'economia' as const, rotulo: 'Economia' }] : []),
            { chave: 'sobra', rotulo: 'Sobra' },
          ]}
        />
      }
    >
      <ChartContainer config={SERIES} className={AREA_GRAFICO}>
        <BarChart data={dados} margin={{ top: 16, right: 12, left: 4, bottom: 0 }} barCategoryGap="30%">
          <CartesianGrid vertical={false} stroke="var(--border)" />
          <XAxis dataKey="rotulo" tickLine={false} axisLine={false} tickMargin={8} />
          <YAxis {...escala} tickFormatter={formatarBRLCompacto} tickLine={false} axisLine={false} width={76} />
          {temNegativo && <ReferenceLine y={0} stroke="var(--foreground)" strokeWidth={2} />}
          <ChartTooltip
            cursor={{ fill: 'var(--foreground)', fillOpacity: 0.04 }}
            content={({ active, payload }) => {
              const d = payload?.[0]?.payload as DadoPeriodo | undefined
              if (!active || !d) return null
              return (
                <TooltipGrafico
                  titulo={d.rotuloLongo}
                  itens={[
                    { rotulo: SERIES.entradas.label, cor: SERIES.entradas.color, centavos: d.entradas },
                    { rotulo: SERIES.saidas.label, cor: SERIES.saidas.color, centavos: d.saidas },
                    ...(temEconomia
                      ? [{ rotulo: SERIES.economia.label, cor: SERIES.economia.color, centavos: d.economia }]
                      : []),
                  ]}
                  rodape={{ rotulo: 'Sobra', centavos: d.sobra }}
                />
              )
            }}
          />
          <Bar dataKey="sobra" maxBarSize={24} shape={BarraComSinal} isAnimationActive={false}>
            {/* Sobra negativa (gastou mais do que entrou) na cor de negativo; o sinal também aparece pela posição. */}
            {dados.map((d) => (
              <Cell key={d.chave} fill={d.sobra < 0 ? 'var(--negativo)' : 'var(--color-sobra)'} />
            ))}
          </Bar>
        </BarChart>
      </ChartContainer>
    </CardGrafico>
  )
}
