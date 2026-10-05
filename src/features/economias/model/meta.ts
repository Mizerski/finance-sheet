import type { DataISO } from '@/shared/lib/datas'

/** Dinheiro tirado da meta para usar (volta para o disponível da conta de origem). */
export interface Resgate {
  id: string
  /** Pode ser no futuro (ex.: o dia da viagem). */
  data: DataISO
  valorCentavos: number
}

/**
 * Meta de economia: aportes mensais que saem do saldo, com ou sem valor alvo (sem ele, é um cofrinho).
 * O dinheiro fica separado na própria conta ou vai para outra (`destinoId`).
 */
export interface MetaEconomia {
  id: string
  /** Caixa de onde saem os aportes; sempre do tipo conta. */
  caixaId: string
  /** Conta que recebe os aportes (cada um vira uma transferência); ausente = separado na própria conta. */
  destinoId?: string
  nome: string
  /** Quanto juntar; ausente = sem alvo (guarda todo mês, sem fim, e não tem prazo). */
  valorAlvoCentavos?: number
  /** Quanto guardar por mês. */
  aporteMensalCentavos: number
  /**
   * Dinheiro que a pessoa já tinha guardado fora do app ao criar a meta (ausente = 0). Conta para o progresso,
   * para o alvo e para o que dá para usar, mas não mexe no saldo: ele já existia.
   */
  jaGuardadoCentavos?: number
  /**
   * Saldo da conta de investimento de destino, sem os aportes desta meta. Substitui `jaGuardadoCentavos`.
   * Calculado por `metasComContas` e nunca salvo.
   */
  naContaCentavos?: number
  /** Dia do aporte; se o mês não tiver esse dia, vale o último dia do mês. */
  diaDoMes: number
  /** Nenhum aporte acontece antes desta data. */
  inicio: DataISO
  /** Data até quando o usuário quer atingir o valor alvo; ausente = sem prazo. Só existe com valor alvo. */
  prazo?: DataISO
  /**
   * Valor real guardado em meses que fugiram do plano ("yyyy-MM" → centavos, 0 = não guardou).
   * Meses sem ajuste usam o aporte mensal.
   */
  ajustes: Record<string, number>
  /** Dinheiro usado. Com valor alvo, a meta volta a guardar até completar de novo (a não ser que esteja encerrada). */
  resgates?: Resgate[]
  /** Depois deste dia, não guarda mais (o histórico continua); ausente = em andamento. */
  encerradaEm?: DataISO
}

export type MetaComAlvo = MetaEconomia & { valorAlvoCentavos: number }

/** A meta tem um valor a juntar (e por isso termina); sem ele, é um cofrinho sem fim. */
export function temAlvo(meta: MetaEconomia): meta is MetaComAlvo {
  return meta.valorAlvoCentavos !== undefined && meta.valorAlvoCentavos > 0
}
