/** Diz se um gasto era necessário ou dava para evitar. Cada saída tem no máximo uma. */
export interface Tag {
  id: string
  nome: string
  /** Cor em hexadecimal, da mesma paleta das categorias. */
  cor: string
  /** Os gastos com esta tag somam no indicador de gastos evitáveis. */
  evitavel: boolean
}

export const SEM_TAG = { nome: 'Sem tag', cor: '#a39a8e' }

/** Oferecidas enquanto o usuário não tem nenhuma tag (musgo, ocre e vinho da paleta). */
export const TAGS_SUGERIDAS: readonly Omit<Tag, 'id'>[] = [
  { nome: 'Necessário', cor: '#5f6b4e', evitavel: false },
  { nome: 'Superficial', cor: '#b5894f', evitavel: true },
  { nome: 'Emergência', cor: '#71232b', evitavel: false },
]
