import { formatarData, nomeDoDiaDaSemana } from '@/shared/lib/datas'
import type { Lancamento, Natureza, TipoLancamento } from '../model/lancamento'

export const ROTULO_TIPO: Record<TipoLancamento, string> = {
  entrada: 'Entrada',
  saida: 'Saída',
  transferencia: 'Transferência',
}
export const ROTULO_NATUREZA: Record<Natureza, string> = { fixa: 'Fixa', variavel: 'Variável' }

/** Nomes para "toda terça", "todo sábado" (sábado e domingo pedem "todo"). */
const DIA_POR_EXTENSO = ['domingo', 'segunda', 'terça', 'quarta', 'quinta', 'sexta', 'sábado']

/** "Toda terça", "Todo sábado", "Toda semana: seg, qua e sex"… */
function descreverSemanal(dias: number[]): string {
  if (dias.length === 1) {
    const [dia] = dias
    return `${dia === 0 || dia === 6 ? 'Todo' : 'Toda'} ${DIA_POR_EXTENSO[dia]}`
  }
  if (dias.length === 7) return 'Toda semana, todos os dias'
  const nomes = dias.map((d) => nomeDoDiaDaSemana(d))
  return `Toda semana: ${nomes.slice(0, -1).join(', ')} e ${nomes[nomes.length - 1]}`
}

/** "Todo dia 5", "Toda terça", "Dias úteis", "Única em 10/02/2026"… */
export function descreverRecorrencia(l: Lancamento): string {
  const r = l.recorrencia
  switch (r.tipo) {
    case 'unica':
      return `Única em ${formatarData(r.data)}`
    case 'semanal':
      return descreverSemanal(r.diasDaSemana)
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
