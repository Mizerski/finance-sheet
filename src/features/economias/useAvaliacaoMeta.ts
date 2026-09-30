import { useMemo } from 'react'
import type { DataISO } from '@/shared/lib/datas'
import { useFinancas } from '@/store/financas-context'
import { avaliarAporte, limitesDaMeta, type AvaliacaoAporte, type LimitesMeta } from './avaliacao'
import type { MetaEconomia } from './meta'

export interface AvaliacaoMeta extends AvaliacaoAporte, LimitesMeta {}

/**
 * Se a meta do formulário cabe no fluxo projetado, simulando a própria meta sobre as outras.
 * Os limites (bisseção) não dependem do aporte digitado, então só são recalculados quando o resto da meta muda.
 */
export function useAvaliacaoMeta(rascunho: MetaEconomia | null, hoje: DataISO): AvaliacaoMeta | null {
  const { estado } = useFinancas()
  const { config, lancamentos, metas } = estado
  const id = rascunho?.id
  const outrasMetas = useMemo(() => metas.filter((m) => m.id !== id), [metas, id])

  // O rascunho é recriado a cada render; a meta sem o aporte, em texto, é a chave estável dos limites.
  const semAporte = rascunho ? JSON.stringify({ ...rascunho, aporteMensalCentavos: 0 }) : null
  const aporte = rascunho?.aporteMensalCentavos ?? 0

  const limites = useMemo(
    () => semAporte && limitesDaMeta({ config, lancamentos, outrasMetas, hoje }, JSON.parse(semAporte)),
    [config, lancamentos, outrasMetas, hoje, semAporte],
  )

  return useMemo(() => {
    if (!semAporte || !limites) return null
    const meta: MetaEconomia = { ...JSON.parse(semAporte), aporteMensalCentavos: aporte }
    return { ...limites, ...avaliarAporte({ config, lancamentos, outrasMetas, hoje }, meta, limites) }
  }, [config, lancamentos, outrasMetas, hoje, semAporte, limites, aporte])
}
