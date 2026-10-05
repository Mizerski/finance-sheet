import type { TipoMovimento } from '@/features/lancamentos/model/lancamento'

export interface Categoria {
  id: string
  nome: string
  /** Cor em hexadecimal, ex.: "#16a34a" */
  cor: string
  tipo: TipoMovimento
}

export const CATEGORIA_DESCONHECIDA = { nome: 'Sem categoria', cor: '#a39a8e' }
