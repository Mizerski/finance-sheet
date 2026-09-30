import type { GastoCategoria } from '@/features/projecao/projecao'
import { EstadoVazio } from '@/shared/components/EstadoVazio'
import { CardGrafico } from './CardGrafico'
import { RoscaGastos } from './RoscaGastos'

interface GraficoGastosCategoriaProps {
  gastos: GastoCategoria[]
  /** "no mês", "na semana"… do período escolhido no topo do dashboard. */
  noPeriodo: string
}

export function GraficoGastosCategoria({ gastos, noPeriodo: periodo }: GraficoGastosCategoriaProps) {
  return (
    <CardGrafico titulo="Gastos por categoria" descricao={`Para onde vão as saídas ${periodo}`}>
      {gastos.length === 0 ? (
        <EstadoVazio titulo={`Nenhuma saída ${periodo}`} />
      ) : (
        <RoscaGastos
          itens={gastos.map((g) => ({ id: g.categoriaId, nome: g.nome, cor: g.cor, centavos: g.totalCentavos }))}
          rotuloValor={`Saídas ${periodo}`}
        />
      )}
    </CardGrafico>
  )
}
