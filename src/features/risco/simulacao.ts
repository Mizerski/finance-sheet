import type { Caixa } from '@/features/caixas/caixa'
import { periodoDaCapacidade } from '@/features/economias/capacidade'
import type { MetaEconomia } from '@/features/economias/meta'
import type { Lancamento } from '@/features/lancamentos/lancamento'
import { projetarAnos } from '@/features/projecao/projecao'
import { anoDe, type DataISO } from '@/shared/lib/datas'
import { analisarRisco, type AnaliseRisco, type NivelRisco } from './risco'

/** Uma conta (o risco é sempre de uma conta), com os lançamentos e as metas dela. */
export interface ContextoRisco {
  caixa: Caixa
  lancamentos: Lancamento[]
  metas: MetaEconomia[]
  hoje: DataISO
}

/** O risco da conta se os lançamentos dela fossem estes (ex.: os atuais mais uma conta nova). */
export function riscoCom(ctx: ContextoRisco, lancamentos: Lancamento[]): AnaliseRisco | null {
  const { fim } = periodoDaCapacidade(ctx.hoje)
  const dias = projetarAnos(ctx.caixa, lancamentos, ctx.metas, anoDe(ctx.hoje), anoDe(fim)).flatMap((p) => p.dias)
  return analisarRisco(dias, ctx.hoje)
}

/** Conta nova do simulador: paga uma vez na data, ou todo mês nesse dia a partir dela. */
export type FrequenciaConta = 'unica' | 'mensal'

const ID_CONTA_SIMULADA = '__conta-simulada__'

export function contaSimulada(
  valorCentavos: number,
  frequencia: FrequenciaConta,
  data: DataISO,
  caixaId: string,
): Lancamento {
  const base = {
    id: ID_CONTA_SIMULADA,
    caixaId,
    descricao: 'Conta simulada',
    tipo: 'saida' as const,
    valorCentavos,
    categoriaId: '',
  }
  return frequencia === 'unica'
    ? { ...base, natureza: 'variavel', recorrencia: { tipo: 'unica', data } }
    : { ...base, natureza: 'fixa', recorrencia: { tipo: 'mensal', diaDoMes: Number(data.slice(8, 10)) }, inicio: data }
}

/** A conta não piora o caixa: continua no mesmo nível (ou melhor) e o saldo não fica negativo. */
export function naoPiora(risco: AnaliseRisco | null, nivelAtual: NivelRisco): boolean {
  return !risco || (risco.nivel <= nivelAtual && risco.menorSaldo.valorCentavos >= 0)
}

/** A busca anda em múltiplos de R$ 10, como a capacidade. */
const PASSO_CENTAVOS = 1000

/**
 * Maior conta (em múltiplos de R$ 10) que não piora o risco atual, por bisseção: quanto maior a conta,
 * menor o saldo em todos os dias depois dela. Uma conta maior que o maior saldo do período sempre falta.
 */
export function maiorContaSemPiorar(
  ctx: ContextoRisco,
  frequencia: FrequenciaConta,
  data: DataISO,
  atual: AnaliseRisco,
): number {
  if (atual.menorSaldo.valorCentavos < 0) return 0
  let baixo = 0
  let alto = Math.max(Math.floor(atual.maiorSaldoCentavos / PASSO_CENTAVOS), 0)
  while (baixo < alto) {
    const meio = Math.ceil((baixo + alto) / 2)
    const conta = contaSimulada(meio * PASSO_CENTAVOS, frequencia, data, ctx.caixa.id)
    if (naoPiora(riscoCom(ctx, [...ctx.lancamentos, conta]), atual.nivel)) baixo = meio
    else alto = meio - 1
  }
  return baixo * PASSO_CENTAVOS
}
