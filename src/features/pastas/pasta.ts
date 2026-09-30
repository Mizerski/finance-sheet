/** Agrupa lançamentos na tela de lançamentos, só para organizar a lista. Não afeta a projeção. */
export interface Pasta {
  id: string
  nome: string
  /** Cor em hexadecimal, da mesma paleta das categorias. */
  cor: string
}

export const SEM_PASTA = { nome: 'Sem pasta', cor: '#a39a8e' }
