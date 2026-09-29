/** Cores terrosas oferecidas para categorias (design system). */
export const CORES_CATEGORIA = [
  { hex: '#6b7f3a', nome: 'Oliva' },
  { hex: '#8c6a4f', nome: 'Marrom' },
  { hex: '#c0763f', nome: 'Terracota clara' },
  { hex: '#b5894f', nome: 'Ocre' },
  { hex: '#7d8a6a', nome: 'Sálvia' },
  { hex: '#9c5b3f', nome: 'Argila' },
  { hex: '#6f5a4a', nome: 'Café' },
  { hex: '#a67c52', nome: 'Caramelo' },
  { hex: '#5f6b4e', nome: 'Musgo' },
] as const

/** Primeira cor da paleta que ainda não está em uso (ou a primeira, se todas estiverem). */
export function proximaCorLivre(emUso: string[]): string {
  const usadas = new Set(emUso.map((c) => c.toLowerCase()))
  return (CORES_CATEGORIA.find((c) => !usadas.has(c.hex)) ?? CORES_CATEGORIA[0]).hex
}
