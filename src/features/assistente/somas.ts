import { ehAjusteDeSaldo } from '@/features/lancamentos/ajuste'
import type { Lancamento } from '@/features/lancamentos/lancamento'
import type { DiaProjetado } from '@/features/projecao/projecao'

export interface Somas {
  entradas: number
  fixas: number
  variaveis: number
  economia: number
}

/** Ajustes de saldo corrigem a planilha para bater com o banco: não são dinheiro novo nem gasto. */
export function idsDeAjuste(lancamentos: Lancamento[]): Set<string> {
  return new Set(lancamentos.filter(ehAjusteDeSaldo).map((l) => l.id))
}

/** Entradas, saídas (fixas e variáveis) e metas dos dias calculados, sem os ajustes de saldo. */
export function somar(dias: DiaProjetado[], ajustes: Set<string>): Somas {
  const s: Somas = { entradas: 0, fixas: 0, variaveis: 0, economia: 0 }
  for (const d of dias) {
    if (!d.noCalculo) continue
    s.economia += d.economiaCentavos
    for (const o of d.ocorrencias) {
      if (ajustes.has(o.lancamentoId)) continue
      if (o.tipo === 'entrada') s.entradas += o.valorCentavos
      else if (o.natureza === 'fixa') s.fixas += o.valorCentavos
      else s.variaveis += o.valorCentavos
    }
  }
  return s
}
