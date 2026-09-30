import { useMemo } from 'react'
import { projetarAnos } from '@/features/projecao/projecao'
import { useProjecoes } from '@/features/projecao/useProjecao'
import { anoDe, type DataISO } from '@/shared/lib/datas'
import { useFinancas } from '@/store/financas-context'
import { capacidadeDePoupanca, type CapacidadePoupanca } from './capacidade'

/**
 * Capacidade de poupança a partir de `hoje`. Com `semMetaId`, projeta como se essa meta não existisse:
 * é o espaço que ela tem no fluxo ao ser editada (o aporte atual dela volta a contar como sobra).
 */
export function useCapacidade(hoje: DataISO, semMetaId?: string): CapacidadePoupanca | null {
  const { estado } = useFinancas()
  const projecoes = useProjecoes()

  return useMemo(() => {
    const semAMeta = semMetaId !== undefined && estado.metas.some((m) => m.id === semMetaId)
    const lista = semAMeta
      ? projetarAnos(
          estado.config,
          estado.lancamentos,
          estado.metas.filter((m) => m.id !== semMetaId),
          anoDe(hoje),
          anoDe(hoje) + 1,
        )
      : projecoes
    return capacidadeDePoupanca(
      lista.flatMap((p) => p.dias),
      hoje,
    )
  }, [estado.config, estado.lancamentos, estado.metas, projecoes, hoje, semMetaId])
}
