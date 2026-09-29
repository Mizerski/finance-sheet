import { cn } from '@/shared/lib/utils'
import { formatarBRL } from '@/shared/lib/dinheiro'
import { VALOR_SALDO } from '@/shared/lib/estilos'
import { TableCell } from '@/shared/ui/table'
import { CELULA, COR_COLUNA } from '../cores'

/** Célula monetária da planilha: vazia quando não há valor, como numa planilha. */
export function CelulaValor({ centavos, className }: { centavos: number; className?: string }) {
  return (
    <TableCell className={cn(CELULA, 'text-right tabular-nums', className)}>
      {centavos !== 0 && formatarBRL(centavos)}
    </TableCell>
  )
}

export function CelulaSaldo({ centavos, className }: { centavos: number | null; className?: string }) {
  const cor =
    centavos === null
      ? COR_COLUNA.foraDoCalculo
      : centavos < 0
        ? COR_COLUNA.saldoNegativo
        : COR_COLUNA.saldo

  return (
    <TableCell className={cn(CELULA, 'text-right tabular-nums', cor, className)}>
      {centavos !== null && <span className={VALOR_SALDO}>{formatarBRL(centavos)}</span>}
    </TableCell>
  )
}
