import { useMemo } from 'react'
import { useProjecoes } from '@/features/projecao/useProjecao'
import type { DataISO } from '@/shared/lib/datas'
import { capacidadeDePoupanca, type CapacidadePoupanca } from './capacidade'

/** Capacidade de poupança a partir de `hoje`, pela projeção de todos os anos navegáveis. */
export function useCapacidade(hoje: DataISO): CapacidadePoupanca | null {
  const projecoes = useProjecoes()
  return useMemo(
    () =>
      capacidadeDePoupanca(
        projecoes.flatMap((p) => p.dias),
        hoje,
      ),
    [projecoes, hoje],
  )
}
