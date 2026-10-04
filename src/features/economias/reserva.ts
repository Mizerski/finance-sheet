import type { DiaProjetado } from '@/features/projecao/projecao'
import type { Tag } from '@/features/tags/tag'
import type { DataISO } from '@/shared/lib/datas'
import { MESES_DA_CAPACIDADE, periodoDaCapacidade } from './capacidade'
import type { MetaEconomia } from './meta'

/** Quantos meses de gasto essencial a reserva cobre. */
export const MESES_DE_RESERVA = [3, 6, 12] as const
export type MesesDeReserva = (typeof MESES_DE_RESERVA)[number]
export const MESES_DE_RESERVA_PADRAO: MesesDeReserva = 6

export const NOME_RESERVA = 'Reserva de emergência'

/** Gasto mensal médio nos próximos 12 meses, separando o que é evitável. */
export interface GastoEssencial {
  saidasMensaisCentavos: number
  /** Saídas com tag evitável: numa emergência, dá para cortar. */
  evitaveisMensaisCentavos: number
  /** Saídas − evitáveis: o que a reserva precisa cobrir por mês. */
  essencialMensalCentavos: number
}

/** Média mensal das saídas do período da capacidade (o mês seguinte a `hoje` e os 11 depois). */
export function gastoEssencial(dias: DiaProjetado[], tags: Tag[], hoje: DataISO): GastoEssencial {
  const { primeiroAporte, fim } = periodoDaCapacidade(hoje)
  const evitaveis = new Set(tags.filter((t) => t.evitavel).map((t) => t.id))
  let saidas = 0
  let evitavel = 0

  for (const d of dias) {
    if (d.data < primeiroAporte || d.data > fim) continue
    for (const o of d.ocorrencias) {
      if (o.tipo !== 'saida') continue
      saidas += o.valorCentavos
      if (o.tagId && evitaveis.has(o.tagId)) evitavel += o.valorCentavos
    }
    // Fatura de cartão que sai da conta: são os gastos do cartão (as compras ficam no caixa dele). No Total com o
    // cartão somado, o pagamento se anula e as compras já contam acima.
    for (const m of d.transferencias) if (m.fatura && m.sentido === 'saida') saidas += m.valorCentavos
  }

  const saidasMensais = Math.round(saidas / MESES_DA_CAPACIDADE)
  const evitaveisMensais = Math.round(evitavel / MESES_DA_CAPACIDADE)
  return {
    saidasMensaisCentavos: saidasMensais,
    evitaveisMensaisCentavos: evitaveisMensais,
    essencialMensalCentavos: saidasMensais - evitaveisMensais,
  }
}

/** Alvo da reserva: o gasto essencial vezes os meses, arredondado para cima em R$ 100. */
export function alvoDaReserva(essencialMensalCentavos: number, meses: MesesDeReserva): number {
  return Math.ceil((essencialMensalCentavos * meses) / 10000) * 10000
}

function normalizar(texto: string): string {
  return texto.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase()
}

/**
 * A meta que o usuário usa como reserva de emergência: a primeira com "reserva" no nome.
 * A meta não guarda um tipo, então o nome é o que a identifica.
 */
export function metaDeReserva(metas: MetaEconomia[]): MetaEconomia | undefined {
  return metas.find((m) => normalizar(m.nome).includes('reserva'))
}
