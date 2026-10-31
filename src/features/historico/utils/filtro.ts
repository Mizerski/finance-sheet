import type { Atividade, TipoAtividade } from '../model/atividade'

/** Filtro da aba Histórico: tudo ou um assunto (backup só aparece em "tudo"). */
export type FiltroHistorico = 'tudo' | Exclude<TipoAtividade, 'dados'>

export const FILTROS_HISTORICO: FiltroHistorico[] = ['tudo', 'lancamento', 'meta', 'caixa', 'organizacao']

export function ehFiltroHistorico(valor: unknown): valor is FiltroHistorico {
  return FILTROS_HISTORICO.includes(valor as FiltroHistorico)
}

/** As do filtro, da mais nova para a mais antiga. */
export function filtrarAtividades(atividades: Atividade[], filtro: FiltroHistorico): Atividade[] {
  const lista = filtro === 'tudo' ? atividades : atividades.filter((a) => a.tipo === filtro)
  return [...lista].reverse()
}
