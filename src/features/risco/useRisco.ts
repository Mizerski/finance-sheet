import { useMemo, useState } from 'react'
import { useProjecoes } from '@/features/projecao/useProjecao'
import { paraDataISO } from '@/shared/lib/datas'
import { analisarRisco, type AnaliseRisco } from './risco'

/** Risco do caixa de hoje até os próximos 12 meses, independente do ano exibido. */
export function useRisco(): AnaliseRisco | null {
  const projecoes = useProjecoes()
  const [hoje] = useState(() => paraDataISO(new Date()))
  return useMemo(() => analisarRisco(projecoes.flatMap((p) => p.dias), hoje), [projecoes, hoje])
}
