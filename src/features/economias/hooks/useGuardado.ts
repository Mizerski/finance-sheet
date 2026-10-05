import { useMemo } from 'react'
import { useVisao } from '@/features/caixas/hooks/useVisao'
import type { DataISO } from '@/shared/lib/datas'
import { guardadoSeparado } from '../utils/aportes'

/**
 * Dinheiro separado nas metas das contas da visão no fim de `data`: saiu do disponível (o saldo da planilha),
 * mas continua na conta. Metas que mandam o dinheiro para outra conta não entram (ele está no saldo dela).
 */
export function useGuardadoSeparado(data: DataISO): number {
  const { metas } = useVisao()
  return useMemo(() => guardadoSeparado(metas, data), [metas, data])
}
