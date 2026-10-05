import type { ResumoMes } from '@/features/projecao/utils/projecao'

/**
 * Sobra do mês: o que entrou menos o que saiu e o que foi guardado nas metas (a variação do saldo).
 * Transferências também mudam o saldo da conta; no Total, as entre contas somadas já se anularam.
 */
export function sobraDoMes(m: ResumoMes): number {
  return (
    m.entradasCentavos -
    m.saidasCentavos -
    m.economiaCentavos +
    m.transferenciaEntradaCentavos -
    m.transferenciaSaidaCentavos
  )
}
