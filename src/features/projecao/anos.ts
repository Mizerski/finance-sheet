import { anoDe, type DataISO } from '@/shared/lib/datas'

/** Quantos anos depois do atual dá para projetar. */
const ANOS_A_FRENTE = 10

export interface IntervaloAnos {
  min: number
  max: number
}

/**
 * Do ano do saldo inicial mais antigo entre os caixas (antes dele não há dados) até ANOS_A_FRENTE depois do ano atual.
 * Vale para todos os caixas, para o intervalo não mudar ao trocar de caixa.
 */
export function intervaloDeAnos(primeiraData: DataISO | null, anoAtual: number): IntervaloAnos {
  return { min: Math.min(primeiraData ? anoDe(primeiraData) : anoAtual, anoAtual), max: anoAtual + ANOS_A_FRENTE }
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
