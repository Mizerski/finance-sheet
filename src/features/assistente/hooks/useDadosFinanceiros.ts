import { useMemo, useState } from 'react'
import { useProjecoesDosCaixas } from '@/features/projecao/hooks/useProjecoesDosCaixas'
import { paraProjetar } from '@/features/projecao/utils/projecao'
import { paraDataISO } from '@/shared/lib/datas'
import { useFinancas } from '@/store/context/financas-context'
import type { DadosFerramentas } from '../utils/ferramentas'
import { montarRetrato } from '../utils/retrato'

/** Estado e projeções de hoje, para o retrato e as ferramentas. Independe do caixa e do ano que a tela mostra. */
export function useDadosFinanceiros(): DadosFerramentas {
  const { estado } = useFinancas()
  const { porCaixa, todos, faturas } = useProjecoesDosCaixas()
  const [hoje] = useState(() => paraDataISO(new Date()))
  const { lancamentos, metas, categorias, tags, pastas } = estado
  const caixas = useMemo(() => estado.caixas.map((c) => paraProjetar(c, faturas)), [estado.caixas, faturas])

  return useMemo(
    () => ({ hoje, caixas, lancamentos, metas, categorias, tags, pastas, porCaixa, todos }),
    [hoje, caixas, lancamentos, metas, categorias, tags, pastas, porCaixa, todos],
  )
}

/** Retrato financeiro de hoje, recalculado quando os dados mudam. */
export function useRetratoFinanceiro(dados: DadosFerramentas): string {
  return useMemo(() => montarRetrato(dados), [dados])
}
