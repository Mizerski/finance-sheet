import { COR_RISCO } from '@/features/risco/cores'
import { nivelDoSaldo } from '@/features/risco/risco'
import { cn } from '@/shared/lib/utils'
import { formatarBRL, formatarBRLSemSimbolo } from '@/shared/lib/dinheiro'
import { VALOR_SALDO } from '@/shared/lib/estilos'
import { TableCell } from '@/shared/ui/table'
import { CELULA, COR_COLUNA } from '../cores'

interface CelulaProps {
  className?: string
  /**
   * No celular, sem o "R$": com a coluna Economia são seis colunas e os valores completos não cabem em 343px.
   * Os centavos continuam; o cabeçalho da coluna já diz que é dinheiro.
   */
  compacta?: boolean
}

function Dinheiro({ centavos, compacta }: { centavos: number; compacta?: boolean }) {
  if (!compacta) return formatarBRL(centavos)
  return (
    <>
      <span className="sm:hidden">{formatarBRLSemSimbolo(centavos)}</span>
      <span className="hidden sm:inline">{formatarBRL(centavos)}</span>
    </>
  )
}

/** Célula monetária da planilha: vazia quando não há valor, como numa planilha. */
export function CelulaValor({ centavos, className, compacta }: CelulaProps & { centavos: number }) {
  return (
    <TableCell className={cn(CELULA, 'text-right tabular-nums', className)}>
      {centavos !== 0 && <Dinheiro centavos={centavos} compacta={compacta} />}
    </TableCell>
  )
}

/**
 * Célula de saldo. Com `referenciaCentavos` (o gasto de um mês), o fundo ganha a cor do risco do caixa no dia;
 * o saldo negativo continua em vermelho.
 */
export function CelulaSaldo({
  centavos,
  className,
  compacta,
  referenciaCentavos,
}: CelulaProps & { centavos: number | null; referenciaCentavos?: number | null }) {
  const cor =
    centavos === null
      ? COR_COLUNA.foraDoCalculo
      : centavos < 0
        ? COR_COLUNA.saldoNegativo
        : referenciaCentavos != null
          ? cn('text-saldo', COR_RISCO[nivelDoSaldo(centavos, referenciaCentavos)].suave)
          : COR_COLUNA.saldo

  return (
    <TableCell className={cn(CELULA, 'text-right tabular-nums', cor, className)}>
      {centavos !== null && (
        <span className={VALOR_SALDO}>
          <Dinheiro centavos={centavos} compacta={compacta} />
        </span>
      )}
    </TableCell>
  )
}
