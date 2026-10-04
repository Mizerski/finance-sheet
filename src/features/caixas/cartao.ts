import { addMonths } from 'date-fns'
import { deDataISO, diasNoMes, paraDataISO, type DataISO, type DiaCalendario } from '@/shared/lib/datas'
import type { DiaProjetado } from '@/features/projecao/projecao'
import type { CicloCartao } from './caixa'

/*
 * Cartão de crédito: as compras são saídas do cartão, e o saldo negativo dele é o que se deve.
 * No dia do fechamento, tudo o que se deve vira a fatura; no vencimento, ela sai da conta pagadora e entra no cartão
 * (uma transferência que a projeção cria sozinha). Fechar não mexe no dinheiro.
 */

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
