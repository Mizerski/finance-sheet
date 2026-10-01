/**
 * Cores oferecidas para categorias, tags e pastas (design system Bauhaus): as primárias e o preto primeiro,
 * depois famílias quentes, frias e neutras. Toda cor aparece com contorno preto (`PontoCor`, legendas, barras),
 * por isso as claras não somem no papel.
 */
export interface CorCategoria {
  /** Sempre em minúsculas, como é comparado com a cor salva. */
  hex: string
  nome: string
  /** Cor clara: o ✓ do seletor fica preto em vez de papel. */
  clara?: boolean
}

export const GRUPOS_CORES_CATEGORIA: readonly { nome: string; cores: readonly CorCategoria[] }[] = [
  {
    nome: 'Primárias',
    cores: [
      { hex: '#d7322a', nome: 'Vermelho' },
      { hex: '#1f45c4', nome: 'Azul' },
      { hex: '#f5c518', nome: 'Amarelo', clara: true },
      { hex: '#1d1c1a', nome: 'Preto' },
    ],
  },
  {
    nome: 'Quentes',
    cores: [
      { hex: '#9e1f1f', nome: 'Carmim' },
      { hex: '#f0a3b8', nome: 'Rosa', clara: true },
      { hex: '#ee7a1a', nome: 'Laranja', clara: true },
      { hex: '#7a4a26', nome: 'Marrom' },
      { hex: '#c99a1a', nome: 'Ocre', clara: true },
      { hex: '#c2378f', nome: 'Magenta' },
    ],
  },
  {
    nome: 'Frias',
    cores: [
      { hex: '#142b6e', nome: 'Marinho' },
      { hex: '#5b9be0', nome: 'Celeste', clara: true },
      { hex: '#157a86', nome: 'Petróleo' },
      { hex: '#2e8b4e', nome: 'Verde' },
      { hex: '#556b2f', nome: 'Musgo' },
      { hex: '#6c3fb5', nome: 'Violeta' },
      { hex: '#4b2357', nome: 'Ameixa' },
    ],
  },
  {
    nome: 'Neutras',
    cores: [
      { hex: '#6b6e78', nome: 'Grafite' },
      { hex: '#c9c2b6', nome: 'Areia', clara: true },
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
