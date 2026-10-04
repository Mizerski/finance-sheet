import { useMemo } from 'react'
import { paraProjetar, useProjecoesDosCaixas } from '@/features/projecao/projecoes-por-caixa'
import { lancamentosDoCaixa, metasDoCaixa } from '@/features/caixas/caixa'
import type { DataISO } from '@/shared/lib/datas'
import { useFinancas } from '@/store/financas-context'
import { avaliarAporte, limitesDaMeta, type AvaliacaoAporte, type LimitesMeta } from './avaliacao'
import type { MetaEconomia } from './meta'

export interface AvaliacaoMeta extends AvaliacaoAporte, LimitesMeta {}

/**
 * Se a meta do formulário cabe no fluxo projetado da conta dela, simulando a própria meta sobre as outras da conta.
 * Os limites (bisseção) não dependem do aporte digitado, então só são recalculados quando o resto da meta muda.
 */
export function useAvaliacaoMeta(rascunho: MetaEconomia | null, hoje: DataISO): AvaliacaoMeta | null {
  const { estado } = useFinancas()
  const id = rascunho?.id
  const caixaId = rascunho?.caixaId
  const { faturas } = useProjecoesDosCaixas()
  const caixa = estado.caixas.find((c) => c.id === caixaId)
  // Com as faturas de cartão que saem da conta, para a simulação descontá-las.
  const config = useMemo(() => caixa && paraProjetar(caixa, faturas), [caixa, faturas])
  const lancamentos = useMemo(() => lancamentosDoCaixa(estado.lancamentos, caixaId ?? ''), [estado.lancamentos, caixaId])
  const outrasMetas = useMemo(
    () => metasDoCaixa(estado.metas, caixaId ?? '').filter((m) => m.id !== id),
    [estado.metas, caixaId, id],
  )

  // O rascunho é recriado a cada render; a meta sem o aporte, em texto, é a chave estável dos limites.
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
