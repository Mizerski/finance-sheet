import { MESES_DE_RESERVA, type MesesDeReserva } from './reserva'

/** As seções da tela, na ordem em que aparecem. */
export const SECOES_ECONOMIAS = ['metas', 'guardar', 'frente', 'sobras'] as const
export type SecaoEconomias = (typeof SECOES_ECONOMIAS)[number]

/** Sem escolha da pessoa, só as sobras (tabela do ano, consulta) começam fechadas. */
const FECHADAS_PADRAO: readonly SecaoEconomias[] = ['sobras']

export interface BuscaEconomias {
  /** Meses de gasto essencial da reserva de emergência; sem ele, o padrão (6). */
  reserva?: MesesDeReserva
  /** Seções que a pessoa abriu ou fechou, ao contrário do padrão. */
  alternadas?: SecaoEconomias[]
}

/** `validateSearch` da rota /economias. */
export function validarBuscaEconomias(search: Record<string, unknown>): BuscaEconomias {
  const busca: BuscaEconomias = {}
  const reserva = MESES_DE_RESERVA.find((m) => m === Number(search.reserva))
  if (reserva) busca.reserva = reserva
  const alternadas = Array.isArray(search.alternadas)
    ? SECOES_ECONOMIAS.filter((s) => (search.alternadas as unknown[]).includes(s))
    : []
  if (alternadas.length > 0) busca.alternadas = alternadas
  return busca
}

/** A seção está fechada: fechada por padrão e não alternada, ou aberta por padrão e alternada. */
export function secaoFechada(secao: SecaoEconomias, alternadas: SecaoEconomias[] = []): boolean {
  return FECHADAS_PADRAO.includes(secao) !== alternadas.includes(secao)
}

/** Abre ou fecha uma seção: entra ou sai da lista das alternadas (vazia volta a não aparecer na URL). */
export function alternarSecao(secao: SecaoEconomias, alternadas: SecaoEconomias[] = []): SecaoEconomias[] | undefined {
  const novas = alternadas.includes(secao) ? alternadas.filter((s) => s !== secao) : [...alternadas, secao]
  return novas.length > 0 ? SECOES_ECONOMIAS.filter((s) => novas.includes(s)) : undefined
}
