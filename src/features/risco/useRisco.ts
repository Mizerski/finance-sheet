import { useMemo, useState } from 'react'
import { caixasAtivos, lancamentosDoCaixa, metasDoCaixa } from '@/features/caixas/caixa'
import { useVisao } from '@/features/caixas/useVisao'
import { paraProjetar, useProjecoesDosCaixas } from '@/features/projecao/projecoes-por-caixa'
import { paraDataISO } from '@/shared/lib/datas'
import { useFinancas } from '@/store/financas-context'
import { analisarRisco, type AnaliseRisco } from './risco'
import { riscoDaVisao, riscosDasContas, type RiscoDaConta, type RiscoDaVisao } from './risco-por-conta'
import type { ContextoRisco } from './simulacao'

/**
 * Risco do caixa de hoje até os próximos 12 meses, independente do ano exibido.
 * Só contas têm risco: num benefício, null. No Total, junta as contas que entram no total (a pior em destaque).
 */
export function useRisco(): RiscoDaVisao | null {
  const { caixasDaVisao } = useVisao()
  const { porCaixa } = useProjecoesDosCaixas()
  const [hoje] = useState(() => paraDataISO(new Date()))

  const contas = useMemo(() => caixasDaVisao.filter((c) => c.tipo === 'conta' && !c.arquivado), [caixasDaVisao])
  const soAConta = caixasDaVisao.length === 1 && contas.length === 1

  return useMemo(() => {
    const comDias = contas.map((caixa) => ({ caixa, dias: porCaixa.get(caixa.id)!.flatMap((p) => p.dias) }))
    return riscoDaVisao(riscosDasContas(comDias, hoje), hoje, soAConta)
  }, [contas, porCaixa, hoje, soAConta])
}

export interface RiscoDeUmaConta {
  atual: AnaliseRisco
  /** A conta, os lançamentos e as metas dela, para simular outros lançamentos. */
  contexto: ContextoRisco
}

/** Risco de hoje de uma conta, independente do que a tela mostra. null em benefício (sem risco) ou sem dias no período. */
export function useRiscoDaConta(caixaId: string | undefined): RiscoDeUmaConta | null {
  const { estado } = useFinancas()
  const { porCaixa, faturas } = useProjecoesDosCaixas()
  const [hoje] = useState(() => paraDataISO(new Date()))
  const caixa = estado.caixas.find((c) => c.id === caixaId)
  const projecoes = caixa && porCaixa.get(caixa.id)
  const { lancamentos, metas } = estado

  return useMemo(() => {
    if (!caixa || caixa.tipo !== 'conta' || !projecoes) return null
    const atual = analisarRisco(projecoes.flatMap((p) => p.dias), hoje)
    if (!atual) return null
    const contexto = {
      caixa: paraProjetar(caixa, faturas),
      lancamentos: lancamentosDoCaixa(lancamentos, caixa.id),
      metas: metasDoCaixa(metas, caixa.id),
      hoje,
    }
    return { atual, contexto }
  }, [caixa, projecoes, faturas, lancamentos, metas, hoje])
}

/** Risco de hoje de cada conta ativa, na ordem do seletor, independente do que a tela mostra (detalhe do cabeçalho). */
export function useRiscosDasContas(): RiscoDaConta[] {
  const { estado } = useFinancas()
  const { porCaixa } = useProjecoesDosCaixas()
  const [hoje] = useState(() => paraDataISO(new Date()))
  return useMemo(() => {
    const contas = caixasAtivos(estado.caixas).filter((c) => c.tipo === 'conta')
    return riscosDasContas(
      contas.map((caixa) => ({ caixa, dias: porCaixa.get(caixa.id)!.flatMap((p) => p.dias) })),
      hoje,
    )
  }, [estado.caixas, porCaixa, hoje])
}
