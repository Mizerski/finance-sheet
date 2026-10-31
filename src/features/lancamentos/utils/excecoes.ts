import type { DataISO } from '@/shared/lib/datas'
import type { Lancamento } from '../model/lancamento'
import { comExcecoes, comMovidas } from './vigencia'

/** O lançamento com outro valor só em `data` (0 = pulado); o valor normal tira a exceção. */
export function comValorNoDia(l: Lancamento, data: DataISO, valorCentavos: number): Lancamento {
  if (valorCentavos === l.valorCentavos) return semExcecaoNoDia(l, data)
  return { ...l, excecoes: { ...l.excecoes, [data]: valorCentavos } }
}

/** Volta o dia ao valor normal. */
export function semExcecaoNoDia(l: Lancamento, data: DataISO): Lancamento {
  return comExcecoes(l, (d) => d !== data)
}

/**
 * A vez de `de` (data original) acontece em `para`. O único só troca a data; no recorrente, vira uma mudança de dia,
 * e voltar para a data original tira a mudança.
 */
export function moverParaODia(l: Lancamento, de: DataISO, para: DataISO): Lancamento {
  if (l.recorrencia.tipo === 'unica') return { ...l, recorrencia: { tipo: 'unica', data: para } }
  if (de === para) return semMudancaDeDia(l, de)
  return { ...l, movidas: { ...l.movidas, [de]: para } }
}

/** Uma vez de um lançamento num dia: `de` é a data original (a do próprio dia, se não veio de outro). */
export interface VezNoDia {
  lancamentoId: string
  de: DataISO
}

/**
 * Leva as `vezes` para `para` com `moverParaODia`, juntando as do mesmo lançamento. Devolve os alterados, para gravar,
 * e as versões de antes, para desfazer.
 */
export function moverDoDia(
  lancamentos: Lancamento[],
  vezes: VezNoDia[],
  para: DataISO,
): { alterados: Lancamento[]; anteriores: Lancamento[] } {
  const porId = new Map(lancamentos.map((l) => [l.id, l]))
  const alterados = new Map<string, Lancamento>()
  for (const { lancamentoId, de } of vezes) {
    const atual = alterados.get(lancamentoId) ?? porId.get(lancamentoId)
    if (atual) alterados.set(lancamentoId, moverParaODia(atual, de, para))
  }
  return {
    alterados: [...alterados.values()],
    anteriores: [...alterados.keys()].map((id) => porId.get(id)!),
  }
}

/** A vez de `de` volta para o próprio dia. */
export function semMudancaDeDia(l: Lancamento, de: DataISO): Lancamento {
  return comMovidas(l, (d) => d !== de)
}
