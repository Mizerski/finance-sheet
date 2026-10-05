import type { DataISO } from '@/shared/lib/datas'

/** Tipo das categorias e dos lançamentos que entram ou saem do dinheiro da pessoa. */
export type TipoMovimento = 'entrada' | 'saida'
/**
 * `transferencia`: dinheiro que muda de conta (sai de `caixaId` e entra em `caixaDestinoId`).
 * Não é entrada nem gasto: não tem categoria nem tag e fica fora dos relatórios.
 */
export type TipoLancamento = TipoMovimento | 'transferencia'
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
  /** Caixa do lançamento (na transferência, a origem). */
  caixaId: string
  /** Só na transferência (e sempre nela): a conta que recebe o valor, diferente de `caixaId`. */
  caixaDestinoId?: string
  descricao: string
  tipo: TipoLancamento
  /** Sempre inteiro, em centavos. */
  valorCentavos: number
  /** '' na transferência, que não tem categoria. */
  categoriaId: string
  /** Só em saídas: necessário, superficial, emergência… (ausente = sem tag). */
  tagId?: string
  /** Pasta em que aparece na tela de lançamentos (ausente = sem pasta). */
  pastaId?: string
  /** Na transferência, diz em que coluna de saída ela aparece na planilha da conta de origem. */
  natureza: Natureza
  recorrencia: Recorrencia
  /** Limites opcionais (inclusivos) da recorrência. */
  inicio?: DataISO
  fim?: DataISO
  /**
   * Só em recorrentes: dias em que o valor foi outro ("mudar só este dia"), em centavos; 0 = pulado nesse dia.
   * Ausente ou vazio = todas as ocorrências com `valorCentavos`.
   */
  excecoes?: Record<DataISO, number>
}

export type Transferencia = Lancamento & { tipo: 'transferencia'; caixaDestinoId: string }

/** Valor do lançamento num dia em que ele acontece: o da exceção, se houver (0 = pulado). */
export function valorNoDia(l: Lancamento, data: DataISO): number {
  return l.excecoes?.[data] ?? l.valorCentavos
}

export function ehTransferencia(l: Lancamento): l is Transferencia {
  return l.tipo === 'transferencia' && !!l.caixaDestinoId
}

/** Entrada ou saída de verdade (não transferência): o que tem categoria e conta nos relatórios. */
export function ehMovimento(l: Lancamento): l is Lancamento & { tipo: TipoMovimento } {
  return l.tipo !== 'transferencia'
}
