/**
 * Cores oferecidas para categorias (design system): tons dessaturados, sem cores vivas.
 * Os grupos só organizam o seletor; a ordem dos terrosos continua a mesma de antes.
 */
export interface CorCategoria {
  /** Sempre em minúsculas, como é comparado com a cor salva. */
  hex: string
  nome: string
}

export const GRUPOS_CORES_CATEGORIA: readonly { nome: string; cores: readonly CorCategoria[] }[] = [
  {
    nome: 'Terrosos',
    cores: [
      { hex: '#6b7f3a', nome: 'Oliva' },
      { hex: '#8c6a4f', nome: 'Marrom' },
      { hex: '#c0763f', nome: 'Terracota clara' },
      { hex: '#b5894f', nome: 'Ocre' },
      { hex: '#7d8a6a', nome: 'Sálvia' },
      { hex: '#9c5b3f', nome: 'Argila' },
      { hex: '#6f5a4a', nome: 'Café' },
      { hex: '#a67c52', nome: 'Caramelo' },
      { hex: '#5f6b4e', nome: 'Musgo' },
    ],
  },
  {
    nome: 'Vermelhos e rosas',
    cores: [
      { hex: '#71232b', nome: 'Vinho' },
      { hex: '#a4435f', nome: 'Framboesa' },
      { hex: '#7a4c6b', nome: 'Malva' },
      { hex: '#ba7d99', nome: 'Rosa antigo' },
    ],
  },
  {
    nome: 'Roxos',
    cores: [
      { hex: '#4a2951', nome: 'Ameixa' },
      { hex: '#57488d', nome: 'Uva' },
      { hex: '#996bad', nome: 'Orquídea' },
      { hex: '#858ac0', nome: 'Lavanda' },
    ],
  },
]

/** Todas as cores, na ordem do seletor. */
export const CORES_CATEGORIA = GRUPOS_CORES_CATEGORIA.flatMap((g) => g.cores)

/** Primeira cor da paleta que ainda não está em uso (ou a primeira, se todas estiverem). */
export function proximaCorLivre(emUso: string[]): string {
  const usadas = new Set(emUso.map((c) => c.toLowerCase()))
  return (CORES_CATEGORIA.find((c) => !usadas.has(c.hex)) ?? CORES_CATEGORIA[0]).hex
}
