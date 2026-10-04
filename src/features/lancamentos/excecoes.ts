import type { DataISO } from '@/shared/lib/datas'
import type { Lancamento } from './lancamento'
import { comExcecoes } from './vigencia'

/*
 * "Mudar só este dia": um recorrente pode ter outro valor num dia (o salário que veio diferente) ou ser pulado
 * nele (0). As outras ocorrências continuam com o valor normal.
 */

/** O lançamento com outro valor só em `data` (0 = pulado); o valor normal tira a exceção. */
export function comValorNoDia(l: Lancamento, data: DataISO, valorCentavos: number): Lancamento {
  if (valorCentavos === l.valorCentavos) return semExcecaoNoDia(l, data)
  return { ...l, excecoes: { ...l.excecoes, [data]: valorCentavos } }
}

/** Volta o dia ao valor normal. */
export function semExcecaoNoDia(l: Lancamento, data: DataISO): Lancamento {
  return comExcecoes(l, (d) => d !== data)
}
