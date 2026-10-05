import type { DataISO } from '@/shared/lib/datas'

export interface Configuracao {
  saldoInicialCentavos: number
  /**
   * Saldo inicial vale no começo deste dia; dias anteriores ficam fora do cálculo.
   * Os anos seguintes herdam o saldo final do ano anterior.
   */
  dataSaldoInicial: DataISO
}
