import type { DataISO } from '@/shared/lib/datas'
import type { Lancamento } from '../model/lancamento'
import { comExcecoes } from './vigencia'

/** O lançamento com outro valor só em `data` (0 = pulado); o valor normal tira a exceção. */
export function comValorNoDia(l: Lancamento, data: DataISO, valorCentavos: number): Lancamento {
  if (valorCentavos === l.valorCentavos) return semExcecaoNoDia(l, data)
  return { ...l, excecoes: { ...l.excecoes, [data]: valorCentavos } }
}

/** Volta o dia ao valor normal. */
export function semExcecaoNoDia(l: Lancamento, data: DataISO): Lancamento {
  return comExcecoes(l, (d) => d !== data)
}
