const PERCENTUAL = new Intl.NumberFormat('pt-BR', { style: 'percent', maximumFractionDigits: 1 })

/** "12,5%". Com total zero, "0%". */
export function formatarPercentual(parte: number, total: number): string {
  return PERCENTUAL.format(total === 0 ? 0 : parte / total)
}
