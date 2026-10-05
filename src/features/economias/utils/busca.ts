import { MESES_DE_RESERVA, type MesesDeReserva } from './reserva'

export interface BuscaEconomias {
  /** Meses de gasto essencial da reserva de emergência; sem ele, o padrão (6). */
  reserva?: MesesDeReserva
}

/** `validateSearch` da rota /economias. */
export function validarBuscaEconomias(search: Record<string, unknown>): BuscaEconomias {
  const reserva = MESES_DE_RESERVA.find((m) => m === Number(search.reserva))
  return reserva ? { reserva } : {}
}
