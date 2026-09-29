import { anoDe } from '@/shared/lib/datas'
import type { Configuracao } from './configuracao'

/** Quantos anos depois do atual dá para projetar. */
const ANOS_A_FRENTE = 10

export interface IntervaloAnos {
  min: number
  max: number
}

/** Do ano do saldo inicial (antes dele não há dados) até ANOS_A_FRENTE depois do ano atual. */
export function intervaloDeAnos(config: Configuracao, anoAtual: number): IntervaloAnos {
  return { min: Math.min(anoDe(config.dataSaldoInicial), anoAtual), max: anoAtual + ANOS_A_FRENTE }
}

export function limitarAno(ano: number, { min, max }: IntervaloAnos): number {
  return Math.min(Math.max(ano, min), max)
}

export interface BuscaAno {
  /** Ano exibido; sem ele, o ano atual. */
  ano?: number
}

/** `validateSearch` da rota raiz: o ano vale para todas as telas. */
export function validarAno(search: Record<string, unknown>): BuscaAno {
  const ano = Number(search.ano)
  return Number.isInteger(ano) && ano >= 1900 && ano <= 2999 ? { ano } : {}
}
