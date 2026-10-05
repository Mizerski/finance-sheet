import { COR_RISCO } from '@/features/risco/constants/cores'
import type { NivelRisco } from '@/features/risco/utils/risco'
import { cn } from '@/shared/lib/utils'
import { formatarBRL, formatarBRLSemSimbolo } from '@/shared/lib/dinheiro'
import { VALOR_SALDO } from '@/shared/lib/estilos'
import { TableCell } from '@/shared/ui/table'
import { CELULA, COR_COLUNA } from '../constants/cores'

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
 * Célula de saldo. Com `nivel`, o fundo ganha a cor do risco do caixa no dia (no escuro, também uma barra à esquerda);
 * o saldo negativo continua em vermelho.
 */
export function CelulaSaldo({
  centavos,
  className,
  compacta,
  nivel,
  divida = false,
}: CelulaProps & {
  centavos: number | null
  nivel?: NivelRisco | null
  /** Cartão de crédito: o saldo negativo é o que se deve, não um alerta (vermelho só no texto, sem fundo nem faixa). */
  divida?: boolean
}) {
  const cor =
    centavos === null
      ? COR_COLUNA.foraDoCalculo
      : centavos < 0 && divida
        ? cn(COR_COLUNA.saldo, 'text-negativo')
        : centavos < 0
        ? cn(COR_COLUNA.saldoNegativo, COR_RISCO[5].marca)
        : nivel != null
          ? cn('text-saldo', COR_RISCO[nivel].suave, COR_RISCO[nivel].marca)
          : COR_COLUNA.saldo

  return (
    <TableCell className={cn(CELULA, 'relative text-right tabular-nums', cor, className)}>
      {centavos !== null && (
        <span className={VALOR_SALDO}>
          <Dinheiro centavos={centavos} compacta={compacta} />
        </span>
      )}
    </TableCell>
  )
}
