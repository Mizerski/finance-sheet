import { addDays, addMonths } from 'date-fns'
import { deDataISO, diasNoMes, paraDataISO, type DataISO, type DiaCalendario } from '@/shared/lib/datas'
import type { DiaProjetado } from '@/features/projecao/utils/projecao'
import type { CicloCartao } from '../model/caixa'

/** O dia do mês, ou o último dia se o mês for mais curto (31 em abril vira 30). */
function diaNoMes(ano: number, mes: number, dia: number): DataISO {
  return paraDataISO(new Date(ano, mes, Math.min(dia, diasNoMes(ano, mes))))
}

export function ehDiaDeFechamento(dia: DiaCalendario, ciclo: CicloCartao): boolean {
  return dia.dia === Math.min(ciclo.diaFechamento, dia.diasNoMes)
}

/** Fechamento no mês da data. */
function fechamentoNoMes(data: DataISO, ciclo: CicloCartao): DataISO {
  const d = deDataISO(data)
  return diaNoMes(d.getFullYear(), d.getMonth(), ciclo.diaFechamento)
}

/** Vencimento da fatura que fecha em `fechamento`: no mesmo mês se o dia vem depois, senão no mês seguinte. */
export function vencimentoDaFatura(fechamento: DataISO, ciclo: CicloCartao): DataISO {
  const d = deDataISO(fechamento)
  const mesmoMes = diaNoMes(d.getFullYear(), d.getMonth(), ciclo.diaVencimento)
  if (mesmoMes > fechamento) return mesmoMes
  const seguinte = addMonths(new Date(d.getFullYear(), d.getMonth(), 1), 1)
  return diaNoMes(seguinte.getFullYear(), seguinte.getMonth(), ciclo.diaVencimento)
}

/** Primeiro fechamento em `data` ou depois. */
export function proximoFechamento(data: DataISO, ciclo: CicloCartao): DataISO {
  const noMes = fechamentoNoMes(data, ciclo)
  if (noMes >= data) return noMes
  return fechamentoNoMes(paraDataISO(addMonths(deDataISO(noMes.slice(0, 8) + '01'), 1)), ciclo)
}

/** Último fechamento antes de `data` (estritamente). */
export function fechamentoAnterior(data: DataISO, ciclo: CicloCartao): DataISO {
  const noMes = fechamentoNoMes(data, ciclo)
  if (noMes < data) return noMes
  return fechamentoNoMes(paraDataISO(addMonths(deDataISO(noMes.slice(0, 8) + '01'), -1)), ciclo)
}

export interface FaturaDoCartao {
  valorCentavos: number
  fechamento: DataISO
  vencimento: DataISO
}

export interface ResumoCartao {
  /** O que se deve hoje (0 se o saldo do cartão não está negativo). */
  devendoCentavos: number
  /** Fatura que já fechou e ainda vai vencer (entre o fechamento e o vencimento); null fora desse intervalo. */
  fechada: FaturaDoCartao | null
  /** Fatura em aberto: fecha no próximo fechamento, com as compras já lançadas até lá. */
  aberta: FaturaDoCartao
  /** Limite menos o que se deve hoje; null sem limite. */
  disponivelCentavos: number | null
}

/** Faturas e limite do cartão hoje, pelos dias projetados dele; null se hoje está fora do cálculo. */
export function resumirCartao(
  dias: DiaProjetado[],
  ciclo: CicloCartao,
  hoje: DataISO,
): ResumoCartao | null {
  const deHoje = dias.find((d) => d.data === hoje)
  if (!deHoje || deHoje.saldoCentavos === null) return null
  const pagamentos = dias
    .filter((d) => d.data >= hoje)
    .flatMap((d) => d.transferencias.filter((m) => m.fatura && m.sentido === 'entrada').map((m) => ({ m, data: d.data })))
  const fatura = (fechamento: DataISO): FaturaDoCartao => {
    const pago = pagamentos.find((p) => p.m.fatura!.fechamento === fechamento)
    return { valorCentavos: pago?.m.valorCentavos ?? 0, fechamento, vencimento: pago?.data ?? vencimentoDaFatura(fechamento, ciclo) }
  }
  const devendo = Math.max(0, -deHoje.saldoCentavos)
  const anterior = fechamentoAnterior(hoje, ciclo)
  const fechada = vencimentoDaFatura(anterior, ciclo) >= hoje ? fatura(anterior) : null
  return {
    devendoCentavos: devendo,
    fechada: fechada && fechada.valorCentavos > 0 ? fechada : null,
    aberta: fatura(proximoFechamento(hoje, ciclo)),
    disponivelCentavos: ciclo.limiteCentavos === undefined ? null : ciclo.limiteCentavos - devendo,
  }
}

/**
 * Os últimos `quantos` fechamentos até hoje (inclusive), do mais recente ao mais antigo.
 * Hoje conta se for dia de fechamento.
 */
export function fechamentosRecentes(hoje: DataISO, ciclo: CicloCartao, quantos = 3): DataISO[] {
  const lista: DataISO[] = []
  let fechamento = fechamentoAnterior(paraDataISO(addDays(deDataISO(hoje), 1)), ciclo)
  while (lista.length < quantos) {
    lista.push(fechamento)
    fechamento = fechamentoAnterior(fechamento, ciclo)
  }
  return lista
}

/** Valor da fatura que fechou em `fechamento`, pelos dias projetados do cartão (0 se não se devia nada). */
export function valorDaFatura(dias: DiaProjetado[], fechamento: DataISO): number {
  for (const d of dias) {
    if (d.data <= fechamento) continue
    const pago = d.transferencias.find((m) => m.fatura?.fechamento === fechamento && m.sentido === 'entrada')
    if (pago) return pago.valorCentavos
  }
  return 0
}
