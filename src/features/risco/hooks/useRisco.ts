import { useMemo, useState } from 'react'
import { caixasAtivos, ehContaCorrente, lancamentosDoCaixa, metasDoCaixa } from '@/features/caixas/model/caixa'
import { useVisao } from '@/features/caixas/hooks/useVisao'
import { useProjecoesDosCaixas } from '@/features/projecao/hooks/useProjecoesDosCaixas'
import { paraProjetar } from '@/features/projecao/utils/projecao'
import { paraDataISO } from '@/shared/lib/datas'
import { useFinancas } from '@/store/context/financas-context'
import { analisarRisco, type AnaliseRisco } from '../utils/risco'
import { riscoDaVisao, riscosDasContas, type RiscoDaConta, type RiscoDaVisao } from '../utils/risco-por-conta'
import type { ContextoRisco } from '../utils/simulacao'

/** Risco de hoje até os próximos 12 meses. Só contas do dia a dia têm risco; no Total, a pior em destaque. */
export function useRisco(): RiscoDaVisao | null {
  const { caixasDaVisao } = useVisao()
  const { porCaixa } = useProjecoesDosCaixas()
  const [hoje] = useState(() => paraDataISO(new Date()))

  const contas = useMemo(() => caixasDaVisao.filter((c) => ehContaCorrente(c) && !c.arquivado), [caixasDaVisao])
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
    if (!caixa || !ehContaCorrente(caixa) || !projecoes) return null
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
    const contas = caixasAtivos(estado.caixas).filter(ehContaCorrente)
    return riscosDasContas(
      contas.map((caixa) => ({ caixa, dias: porCaixa.get(caixa.id)!.flatMap((p) => p.dias) })),
      hoje,
    )
  }, [estado.caixas, porCaixa, hoje])
}
