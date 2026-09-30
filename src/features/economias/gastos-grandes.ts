import type { Lancamento } from '@/features/lancamentos/lancamento'
import type { DiaProjetado } from '@/features/projecao/projecao'
import type { DataISO } from '@/shared/lib/datas'
import { periodoDaCapacidade } from './capacidade'

/** Um gasto único que pesa no mês: IPVA, seguro anual, matrícula… */
export interface GastoGrande {
  lancamentoId: string
  descricao: string
  data: DataISO
  valorCentavos: number
  /** Saldo projetado no fim do dia do gasto (com tudo o que acontece nele). */
  saldoNoDiaCentavos: number
}

export interface GastosGrandes {
  itens: GastoGrande[]
  totalCentavos: number
  /** A partir de quanto um gasto único entra na lista: 1/4 da média mensal das saídas. */
  minimoCentavos: number
}

/**
 * Saídas únicas grandes entre `hoje` e o fim do período da capacidade, por data.
 * Recorrentes ficam de fora: já pesam igual todo mês na sobra.
 */
export function gastosGrandes(dias: DiaProjetado[], lancamentos: Lancamento[], hoje: DataISO): GastosGrandes {
  const { primeiroAporte, fim } = periodoDaCapacidade(hoje)
  const unicas = new Set(lancamentos.filter((l) => l.recorrencia.tipo === 'unica').map((l) => l.id))
  const periodo = dias.filter((d) => d.data >= hoje && d.data <= fim && d.saldoCentavos !== null)

  // Média mensal das saídas nos 12 meses cheios, para saber o que é "grande" para este usuário.
  const saidas12 = periodo
    .filter((d) => d.data >= primeiroAporte)
    .reduce((t, d) => t + d.saidasFixasCentavos + d.saidasVariaveisCentavos, 0)
  const minimo = Math.round(saidas12 / 12 / 4)

  const itens: GastoGrande[] = []
  for (const d of periodo) {
    for (const o of d.ocorrencias) {
      if (o.tipo !== 'saida' || !unicas.has(o.lancamentoId) || o.valorCentavos < minimo || o.valorCentavos === 0) continue
      itens.push({
        lancamentoId: o.lancamentoId,
        descricao: o.descricao,
        data: d.data,
        valorCentavos: o.valorCentavos,
        saldoNoDiaCentavos: d.saldoCentavos!,
      })
    }
  }

  return { itens, totalCentavos: itens.reduce((t, g) => t + g.valorCentavos, 0), minimoCentavos: minimo }
}
