import type { DataISO } from '@/shared/lib/datas'
import { aportesDaMeta, jaGuardado, type ResumoMeta } from './aportes'
import { temAlvo, type MetaComAlvo, type MetaEconomia } from '../model/meta'

/** Frações do alvo que viram marcos: dividir a meta em etapas faz o fim parecer mais perto. */
export const FRACOES_DOS_MARCOS = [0.25, 0.5, 0.75, 1] as const

export interface Marco {
  fracao: number
  valorCentavos: number
  /** Data do aporte que alcança o marco pelo plano; null se o plano não chega lá. */
  data: DataISO | null
  atingido: boolean
}

export interface ProgressoMeta {
  marcos: Marco[]
  /** O primeiro marco ainda não atingido; null com a meta completa. */
  proximo: Marco | null
  /** Aportes do plano depois de hoje até completar; null se o plano não completa. */
  aportesRestantes: number | null
}

/** Marcos de 25, 50, 75 e 100% da meta, pelo plano (aporte mensal + ajustes). */
export function progressoDaMeta(meta: MetaComAlvo, hoje: DataISO): ProgressoMeta {
  const plano = aportesDaMeta(meta, '9999-12-31')
  const inicial = jaGuardado(meta)
  const total = inicial + plano.reduce((t, a) => t + a.valorCentavos, 0)

  const marcos = FRACOES_DOS_MARCOS.map((fracao) => {
    const valor = Math.round(meta.valorAlvoCentavos * fracao)
    let acumulado = inicial
    const aporte = inicial >= valor ? null : plano.find((a) => (acumulado += a.valorCentavos) >= valor)
    const data = inicial >= valor ? meta.inicio : (aporte?.data ?? null)
    return { fracao, valorCentavos: valor, data, atingido: data !== null && data <= hoje }
  })

  return {
    marcos,
    proximo: marcos.find((m) => !m.atingido) ?? null,
    aportesRestantes: total >= meta.valorAlvoCentavos ? plano.filter((a) => a.data > hoje).length : null,
  }
}

/** A próxima meta a terminar (pelo prazo ou pelo plano) entre as em andamento. Cofrinho nunca é a principal. */
export function metaPrincipal(metas: MetaEconomia[], resumos: Map<string, ResumoMeta>): MetaComAlvo | undefined {
  const quando = (m: MetaEconomia) => m.prazo ?? resumos.get(m.id)?.conclusaoNoPlano ?? '9999-12-31'
  return metas
    .filter(temAlvo)
    .filter((m) => !resumos.get(m.id)?.concluida && !resumos.get(m.id)?.encerrada)
    .reduce<MetaComAlvo | undefined>((melhor, m) => (!melhor || quando(m) < quando(melhor) ? m : melhor), undefined)
}
