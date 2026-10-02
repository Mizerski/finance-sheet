import { useVisao } from '@/features/caixas/useVisao'
import type { Projecao } from './projecao'
import { useAno } from './useAno'

/**
 * Projeção de todos os anos navegáveis do que a tela mostra: o caixa escolhido ou a soma de "Todos".
 * Recalculada quando os caixas, os lançamentos ou as metas mudam (ver `useProjecoesDosCaixas`).
 */
export function useProjecoes(): Projecao[] {
  return useVisao().projecoes
}

/** Projeção do ano selecionado na URL. */
export function useProjecao(): Projecao {
  const { ano, intervalo } = useAno()
  return useProjecoes()[ano - intervalo.min]
}
