import type { DataISO } from '@/shared/lib/datas'
import type { Lancamento } from '../model/lancamento'

export const DESCRICAO_AJUSTE = 'Ajuste de saldo'

/**
 * Lançamento único que leva o saldo projetado do caixa no fim de `data` até o saldo real do banco.
 * Diferença positiva vira entrada, negativa vira saída; sem diferença, não há ajuste.
 */
export function lancamentoDeAjuste(
  realCentavos: number,
  projetadoCentavos: number,
  data: DataISO,
  id: string,
  caixaId: string,
): Lancamento | null {
  const diferenca = realCentavos - projetadoCentavos
  if (diferenca === 0) return null
  return {
    id,
    caixaId,
    descricao: DESCRICAO_AJUSTE,
    tipo: diferenca > 0 ? 'entrada' : 'saida',
    valorCentavos: Math.abs(diferenca),
    categoriaId: '',
    natureza: 'variavel',
    recorrencia: { tipo: 'unica', data },
  }
}

/** Lançamento criado ao conferir o saldo: corrige a projeção, não é uma entrada ou um gasto de verdade. */
export function ehAjusteDeSaldo(l: Lancamento): boolean {
  return l.descricao === DESCRICAO_AJUSTE && l.categoriaId === '' && l.tipo !== 'transferencia'
}
