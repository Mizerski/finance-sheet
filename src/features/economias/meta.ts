import type { DataISO } from '@/shared/lib/datas'

/**
 * Meta de economia: um valor a juntar com aportes mensais, descontados do saldo como uma saída.
 * Não é um lançamento nem tem categoria; a própria meta identifica o dinheiro guardado.
 */
export interface MetaEconomia {
  id: string
  nome: string
  valorAlvoCentavos: number
  /** Quanto guardar por mês. */
  aporteMensalCentavos: number
  /** Dia do aporte; se o mês não tiver esse dia, vale o último dia do mês. */
  diaDoMes: number
  /** Nenhum aporte acontece antes desta data. */
  inicio: DataISO
  /**
   * Valor real guardado em meses que fugiram do plano ("yyyy-MM" → centavos, 0 = não guardou).
   * Meses sem ajuste usam o aporte mensal.
   */
  ajustes: Record<string, number>
}
