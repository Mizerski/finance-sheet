import { useMemo, useState } from 'react'
import { useProjecoesDosCaixas } from '@/features/projecao/projecoes-por-caixa'
import { paraDataISO } from '@/shared/lib/datas'
import { useFinancas } from '@/store/financas-context'
import type { DadosFerramentas } from './ferramentas'
import { montarRetrato } from './retrato'

/** Estado e projeções de hoje, para o retrato e as ferramentas. Independe do caixa e do ano que a tela mostra. */
export function useDadosFinanceiros(): DadosFerramentas {
  const { estado } = useFinancas()
  const { porCaixa, todos } = useProjecoesDosCaixas()
  const [hoje] = useState(() => paraDataISO(new Date()))
  const { caixas, lancamentos, metas, categorias, tags, pastas } = estado

  return useMemo(
    () => ({ hoje, caixas, lancamentos, metas, categorias, tags, pastas, porCaixa, todos }),
    [hoje, caixas, lancamentos, metas, categorias, tags, pastas, porCaixa, todos],
  )
}

/** Retrato financeiro de hoje, recalculado quando os dados mudam. */
export function useRetratoFinanceiro(dados: DadosFerramentas): string {
  return useMemo(() => montarRetrato(dados), [dados])
}
