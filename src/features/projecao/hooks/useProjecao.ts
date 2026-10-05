import { useVisao } from '@/features/caixas/hooks/useVisao'
import type { Projecao } from '../utils/projecao'
import { useAno } from './useAno'

/**
 * Projeção de todos os anos navegáveis do que a tela mostra: o caixa escolhido ou a soma do Total.
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
