import { useMemo } from 'react'
import { caixasNoTotal, lancamentosDoCaixa, metasDoCaixa, type Caixa } from '@/features/caixas/caixa'
import type { MetaEconomia } from '@/features/economias/meta'
import type { Lancamento } from '@/features/lancamentos/lancamento'
import { useFinancas } from '@/store/financas-context'
import type { Periodo } from '@/shared/lib/periodo'
import { diasNoPeriodo, projetarAnos, somarProjecoes, type DiaProjetado, type Projecao } from './projecao'
import { useAno } from './useAno'

/** Mesmos itens, na mesma ordem (o reducer mantém a referência de quem não mudou). */
function mesmaLista<T>(a: readonly T[], b: readonly T[]): boolean {
  return a.length === b.length && a.every((x, i) => x === b[i])
}

interface EntradaCaixa {
  saldoInicialCentavos: number
  dataSaldoInicial: string
  lancamentos: Lancamento[]
  metas: MetaEconomia[]
  min: number
  max: number
  projecoes: Projecao[]
}

interface EntradaTodos {
  partes: Projecao[][]
  min: number
  max: number
  projecoes: Projecao[]
}

/**
 * Últimas projeções calculadas, uma por caixa e uma do Total, compartilhadas entre o cabeçalho e a página
 * abertas ao mesmo tempo. Lançar no vale não recalcula a conta: cada caixa compara só os próprios lançamentos e metas.
 */
const cache = new Map<string, EntradaCaixa>()
let cacheTodos: EntradaTodos | null = null

function projetarCaixa(caixa: Caixa, todosLancamentos: Lancamento[], todasMetas: MetaEconomia[], min: number, max: number) {
  const lancamentos = lancamentosDoCaixa(todosLancamentos, caixa.id)
  const metas = metasDoCaixa(todasMetas, caixa.id)
  const ultima = cache.get(caixa.id)
  if (
    ultima &&
    ultima.saldoInicialCentavos === caixa.saldoInicialCentavos &&
    ultima.dataSaldoInicial === caixa.dataSaldoInicial &&
    ultima.min === min &&
    ultima.max === max &&
    mesmaLista(ultima.lancamentos, lancamentos) &&
    mesmaLista(ultima.metas, metas)
  ) {
    return ultima.projecoes
  }
  const projecoes = projetarAnos(caixa, lancamentos, metas, min, max)
  const { saldoInicialCentavos, dataSaldoInicial } = caixa
  cache.set(caixa.id, { saldoInicialCentavos, dataSaldoInicial, lancamentos, metas, min, max, projecoes })
  return projecoes
}

function somarTodos(partes: Projecao[][], min: number, max: number): Projecao[] {
  if (!cacheTodos || cacheTodos.min !== min || cacheTodos.max !== max || !mesmaLista(cacheTodos.partes, partes)) {
    cacheTodos = { partes, min, max, projecoes: somarProjecoes(partes, min, max) }
  }
  return cacheTodos.projecoes
}

export interface ProjecoesDosCaixas {
  /** Projeção de cada caixa (inclusive arquivados), pelo id. */
  porCaixa: Map<string, Projecao[]>
  /** Soma dos caixas que entram no total. */
  todos: Projecao[]
}

/** Projeção de todos os anos navegáveis de cada caixa e do Total. */
export function useProjecoesDosCaixas(): ProjecoesDosCaixas {
  const { estado } = useFinancas()
  const { intervalo } = useAno()
  const { min, max } = intervalo
  const { caixas, lancamentos, metas } = estado

  return useMemo(() => {
    const porCaixa = new Map(caixas.map((c) => [c.id, projetarCaixa(c, lancamentos, metas, min, max)]))
    const todos = somarTodos(
      caixasNoTotal(caixas).map((c) => porCaixa.get(c.id)!),
      min,
      max,
    )
    return { porCaixa, todos }
  }, [caixas, lancamentos, metas, min, max])
}

/**
 * Dias do ano de cada caixa (ou só de `caixaId`), um caixa depois do outro, inclusive os que não entram no total.
 * Para os totais do cadastro (por lançamento, categoria, tag e pasta); não serve para saldos.
 */
export function useDiasDosCaixas(ano: number, caixaId?: string): DiaProjetado[] {
  const { porCaixa } = useProjecoesDosCaixas()
  const { intervalo } = useAno()
  const indice = ano - intervalo.min
  return useMemo(() => {
    const listas = caixaId ? [porCaixa.get(caixaId) ?? []] : [...porCaixa.values()]
    // Com um caixa só, os mesmos dias da projeção (nada muda para quem tem um caixa).
    if (listas.length === 1) return listas[0][indice]?.dias ?? []
    return listas.flatMap((p) => p[indice]?.dias ?? [])
  }, [porCaixa, caixaId, indice])
}

/**
 * Dias do período de cada caixa (ou só de `caixaId`), um caixa depois do outro, inclusive os que não entram no total;
 * null sem período. Para o filtro de data da lista de lançamentos; não serve para saldos.
 */
export function useDiasDosCaixasNoPeriodo(periodo: Periodo | null, caixaId?: string): DiaProjetado[] | null {
  const { porCaixa } = useProjecoesDosCaixas()
  const de = periodo?.de
  const ate = periodo?.ate
  return useMemo(() => {
    if (!de || !ate) return null
    const listas = caixaId ? [porCaixa.get(caixaId) ?? []] : [...porCaixa.values()]
    return listas.flatMap((p) => diasNoPeriodo(p, { de, ate }))
  }, [porCaixa, caixaId, de, ate])
}
