import type { ResumoMes } from '@/features/projecao/projecao'

/** Sobra do mês: o que entrou menos o que saiu e o que foi guardado nas metas (a variação do saldo). */
export function sobraDoMes(m: ResumoMes): number {
  return m.entradasCentavos - m.saidasCentavos - m.economiaCentavos
}
