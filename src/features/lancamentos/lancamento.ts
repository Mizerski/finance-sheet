import type { DataISO } from '@/shared/lib/datas'

export type TipoMovimento = 'entrada' | 'saida'
export type Natureza = 'fixa' | 'variavel'

export type Recorrencia =
  | { tipo: 'unica'; data: DataISO }
  /** Se o mês não tiver esse dia (ex.: 31 em abril), usa o último dia do mês. */
  /** Dias da semana de 0 (domingo) a 6 (sábado), sem repetição e em ordem. Ex.: toda terça = [2]. */
  | { tipo: 'semanal'; diasDaSemana: number[] }
  | { tipo: 'mensal'; diaDoMes: number }
  | { tipo: 'diaria'; apenasDiasUteis: boolean }

export interface Lancamento {
  id: string
  descricao: string
  tipo: TipoMovimento
  /** Sempre inteiro, em centavos. */
  valorCentavos: number
  categoriaId: string
  /** Só em saídas: necessário, superficial, emergência… (ausente = sem tag). */
  tagId?: string
  /** Pasta em que aparece na tela de lançamentos (ausente = sem pasta). */
  pastaId?: string
  natureza: Natureza
  recorrencia: Recorrencia
  /** Limites opcionais (inclusivos) da recorrência. */
  inicio?: DataISO
  fim?: DataISO
}
