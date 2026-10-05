import { useMemo } from 'react'
import { useProjecoesDosCaixas } from '@/features/projecao/hooks/useProjecoesDosCaixas'
import { paraProjetar } from '@/features/projecao/utils/projecao'
import { lancamentosDoCaixa, metasDoCaixa } from '@/features/caixas/model/caixa'
import type { DataISO } from '@/shared/lib/datas'
import { useFinancas } from '@/store/context/financas-context'
import { avaliarAporte, limitesDaMeta, type AvaliacaoAporte, type LimitesMeta } from '../utils/avaliacao'
import type { MetaEconomia } from '../model/meta'

export interface AvaliacaoMeta extends AvaliacaoAporte, LimitesMeta {}

/**
 * Se a meta do formulário cabe no fluxo da conta dela. Os limites (bisseção) só são recalculados quando muda
 * algo além do aporte.
 */
export function useAvaliacaoMeta(rascunho: MetaEconomia | null, hoje: DataISO): AvaliacaoMeta | null {
  const { estado } = useFinancas()
  const id = rascunho?.id
  const caixaId = rascunho?.caixaId
  const { faturas } = useProjecoesDosCaixas()
  const caixa = estado.caixas.find((c) => c.id === caixaId)
  const config = useMemo(() => caixa && paraProjetar(caixa, faturas), [caixa, faturas])
  const lancamentos = useMemo(() => lancamentosDoCaixa(estado.lancamentos, caixaId ?? ''), [estado.lancamentos, caixaId])
  const outrasMetas = useMemo(
    () => metasDoCaixa(estado.metas, caixaId ?? '').filter((m) => m.id !== id),
    [estado.metas, caixaId, id],
  )

  const semAporte = rascunho ? JSON.stringify({ ...rascunho, aporteMensalCentavos: 0 }) : null
  const aporte = rascunho?.aporteMensalCentavos ?? 0

  const limites = useMemo(
    () => semAporte && config && limitesDaMeta({ config, lancamentos, outrasMetas, hoje }, JSON.parse(semAporte)),
    [config, lancamentos, outrasMetas, hoje, semAporte],
  )

  return useMemo(() => {
    if (!semAporte || !limites || !config) return null
    const meta: MetaEconomia = { ...JSON.parse(semAporte), aporteMensalCentavos: aporte }
    return { ...limites, ...avaliarAporte({ config, lancamentos, outrasMetas, hoje }, meta, limites) }
  }, [config, lancamentos, outrasMetas, hoje, semAporte, limites, aporte])
}
