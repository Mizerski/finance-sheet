import { ehInvestimento, lancamentosDoCaixa, type Caixa } from '@/features/caixas/caixa'
import type { Lancamento } from '@/features/lancamentos/lancamento'
import { projetarAnos } from '@/features/projecao/projecao'
import { anoDe, type DataISO } from '@/shared/lib/datas'
import type { MetaEconomia } from './meta'

/*
 * Meta ligada a uma conta de investimento: a meta manda o dinheiro para a conta (`destinoId`), e o que a conta já
 * tinha (saldo inicial, rendimentos lançados, transferências) conta como guardado nela. Os aportes da própria meta
 * entram por cima, como em qualquer meta com destino.
 */

/** Saldo da conta no fim de `hoje` só com os lançamentos dela (sem metas); antes do começo, o saldo inicial. */
export function saldoProprioDaConta(conta: Caixa, lancamentos: Lancamento[], hoje: DataISO): number {
  const ano = anoDe(hoje)
  const dia = projetarAnos(conta, lancamentosDoCaixa(lancamentos, conta.id), [], ano, ano)
    .flatMap((p) => p.dias)
    .find((d) => d.data === hoje)
  return Math.max(0, dia?.saldoCentavos ?? conta.saldoInicialCentavos)
}

/** A conta de investimento para onde a meta manda o dinheiro, se houver. */
export function contaDeInvestimentoDaMeta(meta: Pick<MetaEconomia, 'destinoId'>, caixas: Caixa[]): Caixa | undefined {
  const destino = meta.destinoId ? caixas.find((c) => c.id === meta.destinoId) : undefined
  return destino && ehInvestimento(destino) ? destino : undefined
}

/** Última meta calculada de cada id: devolve o mesmo objeto se nada mudou (as projeções comparam por referência). */
const calculadas = new Map<string, { base: MetaEconomia; valor: number; meta: MetaEconomia }>()

/** As metas com `naContaCentavos` nas que mandam o dinheiro para uma conta de investimento. */
export function metasComContas(
  metas: MetaEconomia[],
  caixas: Caixa[],
  lancamentos: Lancamento[],
  hoje: DataISO,
): MetaEconomia[] {
  if (!caixas.some(ehInvestimento)) return metas
  let mudou = false
  const resultado = metas.map((m) => {
    const conta = contaDeInvestimentoDaMeta(m, caixas)
    if (!conta) return m
    const valor = saldoProprioDaConta(conta, lancamentos, hoje)
    const ultima = calculadas.get(m.id)
    mudou = true
    if (ultima && ultima.base === m && ultima.valor === valor) return ultima.meta
    const meta = { ...m, naContaCentavos: valor }
    calculadas.set(m.id, { base: m, valor, meta })
    return meta
  })
  return mudou ? resultado : metas
}
