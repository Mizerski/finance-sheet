import type { ReactNode } from 'react'
import { formatarData, type DataISO } from '@/shared/lib/datas'
import { formatarBRL } from '@/shared/lib/dinheiro'
import { VALOR_SALDO } from '@/shared/lib/estilos'
import { cn } from '@/shared/lib/utils'
import { COR_RISCO } from '../cores'
import { NIVEL, type NivelRisco } from '../risco'

/** Pedaços em negrito das frases sobre o caixa, com a mesma cor em todas as telas. */

/** Nome do nível em negrito, na cor dele. */
export function NomeNivel({ nivel }: { nivel: NivelRisco }) {
  return <strong className={cn('font-bold', COR_RISCO[nivel].texto)}>{NIVEL[nivel].nome}</strong>
}

/** Saldo em negrito (vermelho se negativo), borrado quando os saldos estão ocultos. */
export function SaldoForte({ centavos }: { centavos: number }) {
  return (
    <strong className={cn('font-bold tabular-nums', VALOR_SALDO, centavos < 0 && 'text-negativo')}>
      {formatarBRL(centavos)}
    </strong>
  )
}

export function DataForte({ data }: { data: DataISO }) {
  return <strong className="font-bold tabular-nums">{formatarData(data)}</strong>
}

export function Forte({ children, className }: { children: ReactNode; className?: string }) {
  return <strong className={cn('font-bold', className)}>{children}</strong>
}

/** Valor em dinheiro em negrito (não é saldo, então não é borrado). */
export function DinheiroForte({ centavos, className }: { centavos: number; className?: string }) {
  return <strong className={cn('font-bold tabular-nums', className)}>{formatarBRL(centavos)}</strong>
}
