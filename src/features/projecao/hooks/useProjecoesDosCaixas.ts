import { useMemo } from 'react'
import { caixasNoTotal, ehCartao, lancamentosDoCaixa, metasDoCaixa, type Caixa } from '@/features/caixas/model/caixa'
import type { MetaEconomia } from '@/features/economias/model/meta'
import type { Lancamento } from '@/features/lancamentos/model/lancamento'
import { useFinancas } from '@/store/context/financas-context'
import type { Periodo } from '@/shared/lib/periodo'
import type { DataISO } from '@/shared/lib/datas'
import {
  diasNoPeriodo,
  faturasPorConta,
  projetarAnos,
  somarProjecoes,
  type DiaProjetado,
  type MovimentoTransferencia,
  type Projecao,
} from '../utils/projecao'
import { useAno } from './useAno'

/** Mesmos itens, na mesma ordem (o reducer mantém a referência de quem não mudou). */
function mesmaLista<T>(a: readonly T[], b: readonly T[]): boolean {
  return a.length === b.length && a.every((x, i) => x === b[i])
}

type Faturas = Map<DataISO, MovimentoTransferencia[]>

interface EntradaCaixa {
  /** O caixa como foi projetado (nome, saldo inicial e ciclo do cartão entram no cálculo). */
  caixa: Caixa
  faturas: Faturas | undefined
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
let cacheFaturas: { cartoes: Projecao[][]; porConta: Map<string, Faturas> } | null = null

/** Mesmo nome, saldo inicial e ciclo: o resto do caixa (cor, ordem) não muda a projeção. */
function mesmoCalculo(a: Caixa, b: Caixa): boolean {
  return (
    a.nome === b.nome &&
    a.saldoInicialCentavos === b.saldoInicialCentavos &&
    a.dataSaldoInicial === b.dataSaldoInicial &&
    JSON.stringify(a.cartao) === JSON.stringify(b.cartao)
  )
}

/** Faturas que cada conta paga, recalculadas só quando a projeção de algum cartão muda. */
function faturasDosCartoes(cartoes: Projecao[][]): Map<string, Faturas> {
  if (!cacheFaturas || !mesmaLista(cacheFaturas.cartoes, cartoes)) {
    cacheFaturas = { cartoes, porConta: faturasPorConta(cartoes) }
  }
  return cacheFaturas.porConta
}

function projetarCaixa(
  caixa: Caixa,
  faturas: Faturas | undefined,
  todosLancamentos: Lancamento[],
  todasMetas: MetaEconomia[],
  min: number,
  max: number,
) {
  const lancamentos = lancamentosDoCaixa(todosLancamentos, caixa.id)
  const metas = metasDoCaixa(todasMetas, caixa.id)
  const ultima = cache.get(caixa.id)
  if (
    ultima &&
    mesmoCalculo(ultima.caixa, caixa) &&
    ultima.faturas === faturas &&
    ultima.min === min &&
    ultima.max === max &&
    mesmaLista(ultima.lancamentos, lancamentos) &&
    mesmaLista(ultima.metas, metas)
  ) {
    return ultima.projecoes
  }
  const projecoes = projetarAnos(faturas ? { ...caixa, faturas } : caixa, lancamentos, metas, min, max)
  cache.set(caixa.id, { caixa, faturas, lancamentos, metas, min, max, projecoes })
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
  /** Faturas de cartão que cada conta paga, por data (para simular a conta com `paraProjetar`). */
  faturas: Map<string, Faturas>
}

/**
 * Projeção de todos os anos navegáveis de cada caixa e do Total.
 * Os cartões são projetados primeiro: a fatura de cada um sai de uma conta, projetada depois com ela.
 */
export function useProjecoesDosCaixas(): ProjecoesDosCaixas {
  const { estado } = useFinancas()
  const { intervalo } = useAno()
  const { min, max } = intervalo
  const { caixas, lancamentos, metas } = estado

  return useMemo(() => {
    const cartoes = caixas.filter(ehCartao)
    const projecoesDosCartoes = new Map(cartoes.map((c) => [c.id, projetarCaixa(c, undefined, lancamentos, metas, min, max)]))
    const faturas = faturasDosCartoes([...projecoesDosCartoes.values()])
    const porCaixa = new Map(
      caixas.map((c) => [
        c.id,
        projecoesDosCartoes.get(c.id) ?? projetarCaixa(c, faturas.get(c.id), lancamentos, metas, min, max),
      ]),
    )
    const todos = somarTodos(
      caixasNoTotal(caixas).map((c) => porCaixa.get(c.id)!),
      min,
      max,
    )
    return { porCaixa, todos, faturas }
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
