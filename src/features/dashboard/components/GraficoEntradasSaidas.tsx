import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts'
import { formatarBRLCompacto } from '@/shared/lib/dinheiro'
import { ChartContainer, ChartTooltip } from '@/shared/ui/chart'
import { AREA_GRAFICO, CONTORNO, escalaY, SERIES, type DadoPeriodo } from '../graficos'
import type { Unidade } from '@/shared/lib/periodo'
import { NOME_UNIDADE } from '../relatorio'
import { CardGrafico } from './CardGrafico'
import { Legenda } from './Legenda'
import { TabelaPeriodos } from './TabelaPeriodos'
import { TooltipGrafico } from './TooltipGrafico'

export function GraficoEntradasSaidas({ dados, unidade }: { dados: DadoPeriodo[]; unidade: Unidade }) {
  const escala = escalaY(dados.flatMap((d) => [d.entradas, d.saidas, d.economia]))
  const temEconomia = dados.some((d) => d.economia > 0)

  return (
    <CardGrafico
      titulo="Entradas vs saídas"
      faixa="bg-azul"
      forma={{ forma: 'quadrado', cor: 'vermelho' }}
      descricao={`Total que entra, sai e vai para as metas de economia em ${NOME_UNIDADE[unidade].cada}`}
      tabela={
        <TabelaPeriodos
          dados={dados}
          periodo={NOME_UNIDADE[unidade].coluna}
          rotulo={(d) => d.rotuloLongo}
          colunas={[
            { chave: 'entradas', rotulo: 'Entradas' },
            { chave: 'saidas', rotulo: 'Saídas' },
            ...(temEconomia ? [{ chave: 'economia' as const, rotulo: 'Economia' }] : []),
          ]}
        />
      }
    >
      <Legenda
        itens={[
          { rotulo: SERIES.entradas.label, cor: SERIES.entradas.color },
          { rotulo: SERIES.saidas.label, cor: SERIES.saidas.color },
          ...(temEconomia ? [{ rotulo: SERIES.economia.label, cor: SERIES.economia.color }] : []),
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
                    ...(temEconomia
                      ? [{ rotulo: SERIES.economia.label, cor: SERIES.economia.color, centavos: d.economia }]
                      : []),
                  ]}
                  rodape={{ rotulo: 'Sobra', centavos: d.sobra }}
                />
              )
            }}
          />
          <Bar dataKey="entradas" fill="var(--color-entradas)" {...CONTORNO} maxBarSize={24} isAnimationActive={false} />
          <Bar dataKey="saidas" fill="var(--color-saidas)" {...CONTORNO} maxBarSize={24} isAnimationActive={false} />
          {temEconomia && (
            <Bar dataKey="economia" fill="var(--color-economia)" {...CONTORNO} maxBarSize={24} isAnimationActive={false} />
          )}
        </BarChart>
      </ChartContainer>
    </CardGrafico>
  )
}
