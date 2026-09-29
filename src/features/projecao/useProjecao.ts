import { useMemo } from 'react'
import type { Lancamento } from '@/features/lancamentos/lancamento'
import { useFinancas } from '@/store/financas-context'
import type { IntervaloAnos } from './anos'
import type { Configuracao } from './configuracao'
import { projetarAnos, type Projecao } from './projecao'
import { useAno } from './useAno'

/** Última projeção calculada, compartilhada entre o cabeçalho e a página abertas ao mesmo tempo. */
let ultima: { config: Configuracao; lancamentos: Lancamento[]; min: number; max: number; projecoes: Projecao[] } | null =
  null

function projetarIntervalo(config: Configuracao, lancamentos: Lancamento[], { min, max }: IntervaloAnos): Projecao[] {
  if (ultima?.config !== config || ultima.lancamentos !== lancamentos || ultima.min !== min || ultima.max !== max) {
    ultima = { config, lancamentos, min, max, projecoes: projetarAnos(config, lancamentos, min, max) }
  }
  return ultima.projecoes
}

/** Projeção de todos os anos navegáveis, recalculada quando a configuração ou os lançamentos mudam. */
export function useProjecoes(): Projecao[] {
  const { estado } = useFinancas()
  const { intervalo } = useAno()
  const { min, max } = intervalo
  return useMemo(
    () => projetarIntervalo(estado.config, estado.lancamentos, { min, max }),
    [estado.config, estado.lancamentos, min, max],
  )
}

/** Projeção do ano selecionado na URL. */
export function useProjecao(): Projecao {
  const { ano, intervalo } = useAno()
  return useProjecoes()[ano - intervalo.min]
}
