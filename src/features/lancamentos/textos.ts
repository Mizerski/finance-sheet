import { formatarData } from '@/shared/lib/datas'
import type { Lancamento, Natureza, TipoMovimento } from './lancamento'

export const ROTULO_TIPO: Record<TipoMovimento, string> = { entrada: 'Entrada', saida: 'Saída' }
export const ROTULO_NATUREZA: Record<Natureza, string> = { fixa: 'Fixa', variavel: 'Variável' }

/** "Todo dia 5", "Dias úteis", "Única em 10/02/2026"… */
export function descreverRecorrencia(l: Lancamento): string {
  const r = l.recorrencia
  switch (r.tipo) {
    case 'unica':
      return `Única em ${formatarData(r.data)}`
    case 'mensal':
      return r.diaDoMes > 28 ? `Todo dia ${r.diaDoMes} (ou o último)` : `Todo dia ${r.diaDoMes}`
    case 'diaria':
      return r.apenasDiasUteis ? 'Dias úteis' : 'Todos os dias'
  }
}

/** "de 01/03/2026 a 30/06/2026", "a partir de 01/03/2026", "até 30/06/2026" ou null. */
export function descreverPeriodo(l: Lancamento): string | null {
  if (l.inicio && l.fim) return `de ${formatarData(l.inicio)} a ${formatarData(l.fim)}`
  if (l.inicio) return `a partir de ${formatarData(l.inicio)}`
  if (l.fim) return `até ${formatarData(l.fim)}`
  return null
}
