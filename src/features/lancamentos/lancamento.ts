import type { DataISO } from '@/shared/lib/datas'

export type TipoMovimento = 'entrada' | 'saida'
export type Natureza = 'fixa' | 'variavel'

export type Recorrencia =
  | { tipo: 'unica'; data: DataISO }
  /** Se o mês não tiver esse dia (ex.: 31 em abril), usa o último dia do mês. */
  | { tipo: 'mensal'; diaDoMes: number }
  | { tipo: 'diaria'; apenasDiasUteis: boolean }

export interface Lancamento {
  id: string
  descricao: string
  tipo: TipoMovimento
  /** Sempre inteiro, em centavos. */
  valorCentavos: number
  categoriaId: string
  natureza: Natureza
  recorrencia: Recorrencia
  /** Limites opcionais (inclusivos) da recorrência. */
  inicio?: DataISO
  fim?: DataISO
}
