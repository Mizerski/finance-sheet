import { addDays } from 'date-fns'
import { ocorreEm } from '@/features/projecao/utils/projecao'
import { deDataISO, diaDoCalendario, type DataISO } from '@/shared/lib/datas'
import { valorNoDia, type Lancamento } from '../model/lancamento'

/** Mais que isso não é parcela (e evita laço longo num diário de muitos anos). */
export const MAX_VEZES = 360
/** Até onde procurar ocorrências: 30 anos. */
const MAX_DIAS = 366 * 30

/** Datas em que o recorrente acontece a partir do início, até o fim ou até `limite` vezes (sem os dias pulados). */
function* datasDoRecorrente(l: Lancamento, limite = MAX_VEZES): Generator<DataISO> {
  if (l.recorrencia.tipo === 'unica' || !l.inicio) return
  let d = deDataISO(l.inicio)
  let vezes = 0
  for (let i = 0; i < MAX_DIAS && vezes < limite; i++, d = addDays(d, 1)) {
    const dia = diaDoCalendario(d)
    if (l.fim && dia.data > l.fim) return
    if (ocorreEm(l, dia) && valorNoDia(l, dia.data) > 0) {
      vezes++
      yield dia.data
    }
  }
}

/** Data da `vezes`-ésima ocorrência a partir do início (o fim que faz o recorrente acontecer `vezes` vezes). */
export function fimDepoisDe(l: Lancamento, vezes: number): DataISO | undefined {
  let ultima: DataISO | undefined
  for (const data of datasDoRecorrente({ ...l, fim: undefined }, vezes)) ultima = data
  return ultima
}

export interface Parcelas {
  /** Quantas vezes acontece do início ao fim. */
  total: number
  /** Quantas já aconteceram até hoje (inclusive). */
  pagas: number
  restantes: number
  restanteCentavos: number
  totalCentavos: number
  ultima: DataISO
}

/** Parcelas de um recorrente com início e fim; null se não tiver os dois ou passar de `MAX_VEZES`. */
export function parcelasDe(l: Lancamento, hoje: DataISO): Parcelas | null {
  if (l.recorrencia.tipo === 'unica' || !l.inicio || !l.fim) return null
  const datas = [...datasDoRecorrente(l, MAX_VEZES + 1)]
  if (datas.length === 0 || datas.length > MAX_VEZES) return null
  const pagas = datas.filter((d) => d <= hoje).length
  const soma = (lista: DataISO[]) => lista.reduce((total, d) => total + valorNoDia(l, d), 0)
  return {
    total: datas.length,
    pagas,
    restantes: datas.length - pagas,
    restanteCentavos: soma(datas.slice(pagas)),
    totalCentavos: soma(datas),
    ultima: datas[datas.length - 1],
  }
}

/** As próximas `n` vezes a partir de hoje (inclusive), sem os dias pulados; no único, a data dele se ainda não passou. */
export function proximasVezes(l: Lancamento, hoje: DataISO, n = 3): DataISO[] {
  if (l.recorrencia.tipo === 'unica') return l.recorrencia.data >= hoje ? [l.recorrencia.data] : []
  const lista: DataISO[] = []
  let d = deDataISO(l.inicio && l.inicio > hoje ? l.inicio : hoje)
  for (let i = 0; i < 366 * 2 && lista.length < n; i++, d = addDays(d, 1)) {
    const dia = diaDoCalendario(d)
    if (l.fim && dia.data > l.fim) break
    if (ocorreEm(l, dia) && valorNoDia(l, dia.data) > 0) lista.push(dia.data)
  }
  return lista
}
